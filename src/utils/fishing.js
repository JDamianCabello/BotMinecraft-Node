/**
 * Sistema de pesca automática
 */

const botState = require('./botState')
const { Vec3 } = require('vec3')

class FishingSystem {
  constructor(bot) {
    this.bot = bot
    this.fishingActive = false
    this.currentFishingRod = null
    this.fishingBobber = null
    this.catchTimeout = null
  }

  async startFishing(sender = null) {
    if (this.fishingActive) {
      const message = '⚠️ La pesca ya está activa'
      if (sender) {
        this.bot.chat(`/msg ${sender} ${message}`)
      } else {
        console.log(message)
      }
      return
    }

    const message = '🎣 Iniciando sistema de pesca automática...'
    if (sender) {
      this.bot.chat(`/msg ${sender} ${message}`)
    } else {
      console.log(message)
    }

    // Verificar si tiene caña de pescar
    const fishingRod = this.findFishingRod()
    if (!fishingRod) {
      const message = '❌ No tienes caña de pescar en el inventario'
      if (sender) {
        this.bot.chat(`/msg ${sender} ${message}`)
      } else {
        console.log(message)
      }
      return
    }

    // Equipar caña de pescar
    try {
      await this.bot.equip(fishingRod, 'hand')
      this.currentFishingRod = fishingRod
      if (botState.verboseMode) {
        console.log('🎣 Caña de pescar equipada')
      }
    } catch (error) {
      const message = `❌ Error equipando caña de pescar: ${error.message}`
      if (sender) {
        this.bot.chat(`/msg ${sender} ${message}`)
      } else {
        console.log(message)
      }
      return
    }

    // Verificar que hay agua cerca y adecuada
    const waterBlock = this.findNearbyWater()
    if (!waterBlock) {
      const message = '❌ No hay agua adecuada para pescar (necesita mínimo 2 bloques de profundidad)'
      if (sender) {
        this.bot.chat(`/msg ${sender} ${message}`)
      } else {
        console.log(message)
      }
      return
    }

    if (botState.verboseMode) {
      console.log(`🌊 Agua encontrada: ${waterBlock.distance.toFixed(1)}m de distancia, ${waterBlock.depth} bloques de profundidad`)
    }

    this.fishingActive = true
    botState.fishingActive = true

    // Configurar eventos de pesca
    this.setupFishingEvents()

    // Iniciar pesca
    this.castFishingRod()
  }

  findFishingRod() {
    const fishingRods = this.bot.inventory.items().filter(item => 
      item.name === 'fishing_rod'
    )
    
    return fishingRods.length > 0 ? fishingRods[0] : null
  }

  findNearbyWater() {
    const botPos = this.bot.entity.position
    const searchRadius = 8
    let bestWater = null
    let bestScore = 0

    for (let x = Math.floor(botPos.x) - searchRadius; x <= Math.floor(botPos.x) + searchRadius; x++) {
      for (let y = Math.floor(botPos.y) - 2; y <= Math.floor(botPos.y) + 2; y++) {
        for (let z = Math.floor(botPos.z) - searchRadius; z <= Math.floor(botPos.z) + searchRadius; z++) {
          const pos = new Vec3(x, y, z)
          const block = this.bot.blockAt(pos)
          
          if (block && (block.name === 'water' || block.name === 'flowing_water')) {
            const distance = botPos.distanceTo(pos)
            if (distance >= 3 && distance <= 8) { // Mínimo 3 bloques para lanzar más lejos
              // Verificar que es agua profunda (mínimo 2 bloques)
              const waterDepth = this.checkWaterDepth(pos)
              if (waterDepth >= 2) {
                // Priorizar agua más lejana pero no demasiado
                const score = (waterDepth * distance) / 10 // Favorece distancia + profundidad
                if (score > bestScore) {
                  bestScore = score
                  bestWater = { 
                    block, 
                    position: pos, 
                    distance,
                    depth: waterDepth,
                    centerPos: pos.offset(0.5, 0, 0.5) // Centro del bloque para mejor aim
                  }
                }
              }
            }
          }
        }
      }
    }

    return bestWater
  }

  checkWaterDepth(pos) {
    let depth = 0
    for (let y = pos.y; y >= pos.y - 5; y--) {
      const checkPos = new Vec3(pos.x, y, pos.z)
      const block = this.bot.blockAt(checkPos)
      if (block && (block.name === 'water' || block.name === 'flowing_water')) {
        depth++
      } else {
        break
      }
    }
    return depth
  }

  setupFishingEvents() {
    // Limpiar eventos previos
    this.cleanupEvents()
    
    // Detectar anzuelo del bot
    this.entitySpawnHandler = (entity) => {
      if (entity.name === 'fishing_bobber') {
        if (entity.owner === this.bot.entity.id || entity.owner === undefined) {
          this.fishingBobber = entity
          this.startBobberMonitoring()
          this.catchTimeout = setTimeout(() => {
            if (this.fishingActive && this.fishingBobber) {
              if (botState.verboseMode) {
                console.log('⏰ Tiempo agotado, recogiendo anzuelo...')
              }
              this.reelIn('timeout')
            }
          }, 30000) // Aumentado a 30 segundos
        }
      }
    }

    this.entityGoneHandler = (entity) => {
      if (this.fishingBobber && entity === this.fishingBobber) {
        this.fishingBobber = null
        if (this.catchTimeout) {
          clearTimeout(this.catchTimeout)
          this.catchTimeout = null
        }
        if (this.monitoringInterval) {
          clearInterval(this.monitoringInterval)
          this.monitoringInterval = null
        }
      }
    }

    // Variable para prevenir múltiples activaciones rápidas
    this.lastReelTime = 0

    this.soundHandler = (soundName, position, volume, pitch) => {
      if (this.fishingActive && soundName === 'entity.fishing_bobber.retrieve') {
        const soundDistance = this.bot.entity.position.distanceTo(position)
        const currentTime = Date.now()
        
        // Prevenir activaciones demasiado rápidas (menos de 2 segundos)
        if (currentTime - this.lastReelTime < 2000) {
          return
        }
        
        // Solo recoger si la distancia es cercana y ha pasado tiempo suficiente desde el lanzamiento
        if (soundDistance < 12 && currentTime - this.castTime > 3000) {
          this.lastReelTime = currentTime
          this.reelIn('retrieve_sound')
        }
      }
    }

    // Registrar eventos
    this.bot.on('entitySpawn', this.entitySpawnHandler)
    this.bot.on('entityGone', this.entityGoneHandler)
    this.bot.on('soundEffectHeard', this.soundHandler)
  }

  startBobberMonitoring() {
    if (this.monitoringInterval) return

    let lastPosition = null
    let stationaryTime = 0
    
    this.monitoringInterval = setInterval(() => {
      if (!this.fishingActive || !this.fishingBobber) {
        clearInterval(this.monitoringInterval)
        this.monitoringInterval = null
        return
      }

      const currentPos = this.fishingBobber.position
      const currentVelocity = this.fishingBobber.velocity

      // Detectar movimiento brusco del anzuelo (solo si ha pasado tiempo suficiente)
      const currentTime = Date.now()
      if (currentVelocity && currentTime - this.castTime > 5000 && 
          (Math.abs(currentVelocity.y) > 0.15 || Math.abs(currentVelocity.x) > 0.15 || Math.abs(currentVelocity.z) > 0.15)) {
        if (botState.verboseMode) {
          console.log('🐟 ¡Movimiento del anzuelo detectado! Recogiendo...')
          console.log(`🎯 Velocidad: ${currentVelocity.x.toFixed(2)}, ${currentVelocity.y.toFixed(2)}, ${currentVelocity.z.toFixed(2)}`)
        }
        this.reelIn('movement')
        return
      }

      lastPosition = currentPos.clone()
    }, 1000) // Revisar cada segundo
  }

  cleanupEvents() {
    // Limpiar event handlers
    if (this.entitySpawnHandler) {
      this.bot.removeListener('entitySpawn', this.entitySpawnHandler)
    }
    if (this.entityGoneHandler) {
      this.bot.removeListener('entityGone', this.entityGoneHandler)
    }
    if (this.soundHandler) {
      this.bot.removeListener('soundEffectHeard', this.soundHandler)
    }
  }

  async castFishingRod() {
    if (!this.fishingActive) return

    try {
      // Encontrar el mejor bloque de agua
      const waterBlock = this.findNearbyWater()
      if (!waterBlock) {
        console.log('❌ No se encontró agua adecuada para pescar')
        this.stopFishing()
        return
      }

      // Mirar hacia el centro del bloque de agua
      await this.bot.lookAt(waterBlock.centerPos)
      
      if (botState.verboseMode) {
        console.log(`🎯 Apuntando al agua en ${waterBlock.position} (profundidad: ${waterBlock.depth})`)
      }

      // Pequeña pausa para asegurar que está mirando correctamente
      await new Promise(resolve => setTimeout(resolve, 200))

      // Guardar tiempo de lanzamiento para prevenir reel-in prematuro
      this.castTime = Date.now()
      
      // Usar la caña de pescar - esto debería lanzar al agua
      await this.bot.activateItem()
      
      if (botState.verboseMode) {
        console.log('🎣 Caña lanzada al agua, esperando peces...')
      }

    } catch (error) {
      console.log(`⚠️ Error lanzando caña: ${error.message}`)
      
      // Intentar de nuevo en 3 segundos
      if (this.fishingActive) {
        setTimeout(() => this.castFishingRod(), 3000)
      }
    }
  }

  async reelIn(reason) {
    if (!this.fishingActive) return

    try {
      // Limpiar timeout y monitoreo
      if (this.catchTimeout) {
        clearTimeout(this.catchTimeout)
        this.catchTimeout = null
      }
      if (this.monitoringInterval) {
        clearInterval(this.monitoringInterval)
        this.monitoringInterval = null
      }

      // Recoger la caña
      await this.bot.activateItem()
      
      if (reason === 'movement') {
        if (botState.verboseMode) {
          console.log('🐟 ¡Pez capturado por movimiento!')
        }
      } else if (reason === 'timeout') {
        if (botState.verboseMode) {
          console.log('⏰ Tiempo agotado, relanzando caña...')
        }
      }

      // Recoger items que puedan haber caído
      await this.collectNearbyItems()

      // Limpiar referencia del anzuelo
      this.fishingBobber = null

      // Esperar un poco antes de lanzar de nuevo
      setTimeout(() => {
        if (this.fishingActive) {
          this.castFishingRod()
        }
      }, 3000) // 3 segundos de pausa

    } catch (error) {
      console.log(`⚠️ Error recogiendo caña: ${error.message}`)
      
      // Limpiar referencia del anzuelo
      this.fishingBobber = null
      
      // Intentar relanzar si hay error
      if (this.fishingActive) {
        setTimeout(() => this.castFishingRod(), 5000)
      }
    }
  }

  async collectNearbyItems() {
    const items = Object.values(this.bot.entities).filter(entity => 
      entity.name === 'item' && 
      this.bot.entity.position.distanceTo(entity.position) < 8
    )
    
    for (const item of items) {
      try {
        // Pequeña pausa para que los items se estabilicen
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (err) {
        // Ignorar errores de recolección
      }
    }
  }

  stopFishing(sender = null) {
    if (!this.fishingActive) {
      const message = '⚠️ La pesca no está activa'
      if (sender) {
        this.bot.chat(`/msg ${sender} ${message}`)
      } else {
        console.log(message)
      }
      return
    }

    this.fishingActive = false
    botState.fishingActive = false

    // Limpiar timeout
    if (this.catchTimeout) {
      clearTimeout(this.catchTimeout)
      this.catchTimeout = null
    }

    // Limpiar monitoreo
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    // Recoger anzuelo si está en el agua
    if (this.fishingBobber) {
      try {
        this.bot.activateItem()
      } catch (error) {
        // Ignorar errores al recoger
      }
    }

    // Limpiar event listeners
    this.cleanupEvents()

    const message = '🎣 Pesca detenida'
    if (sender) {
      this.bot.chat(`/msg ${sender} ${message}`)
    } else {
      console.log(message)
    }
  }

  getStatus() {
    console.log('🎣 ESTADO DE PESCA:')
    console.log(`Status: ${this.fishingActive ? 'ACTIVA' : 'INACTIVA'}`)
    
    if (this.currentFishingRod) {
      console.log(`🎣 Caña equipada: ${this.currentFishingRod.displayName || this.currentFishingRod.name}`)
    }
    
    if (this.fishingBobber) {
      console.log(`🎯 Anzuelo en agua: SÍ (${this.fishingBobber.position})`)
    } else {
      console.log(`🎯 Anzuelo en agua: NO`)
    }

    const fishCount = this.bot.inventory.items().filter(item => 
      item.name.includes('fish') || item.name === 'cod' || item.name === 'salmon' || 
      item.name === 'tropical_fish' || item.name === 'pufferfish'
    ).reduce((total, item) => total + item.count, 0)

    console.log(`🐟 Peces en inventario: ${fishCount}`)

    // Verificar agua cerca
    const waterBlock = this.findNearbyWater()
    if (waterBlock) {
      console.log(`💧 Agua cerca: SÍ (${waterBlock.distance.toFixed(1)}m, profundidad: ${waterBlock.depth})`)
    } else {
      console.log(`💧 Agua cerca: NO`)
    }
  }
}

module.exports = FishingSystem