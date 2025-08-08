/**
 * Sistema de agricultura automática optimizado
 */

const { Vec3 } = require('vec3')
const config = require('../config/botConfig')
const BlockChecker = require('./blockChecker')
const ItemHandler = require('./itemHandler')
const minecraftData = require('minecraft-data')
const botState = require('./botState')

class FarmingSystem {
  constructor(bot) {
    this.bot = bot
    this.farmingActive = false
    this.farmingInterval = null
    this.blockChecker = new BlockChecker(bot)
    this.itemHandler = new ItemHandler(bot)
    this.mcData = null
    this.farmArea = {
      start: null,
      end: null
    }
  }

  async setupFarming() {
    if (!this.mcData) {
      this.mcData = minecraftData(this.bot.version)
    }
    
    // Configurar área de farming más pequeña alrededor del bot (solo alcance)
    const botPos = this.bot.entity.position
    this.farmArea.start = new Vec3(
      Math.floor(botPos.x) - 4,
      Math.floor(botPos.y),
      Math.floor(botPos.z) - 4
    )
    this.farmArea.end = new Vec3(
      Math.floor(botPos.x) + 4,
      Math.floor(botPos.y),
      Math.floor(botPos.z) + 4
    )
    
    if (botState.verboseMode) {
      console.log(`🌾 Área de farming configurada: ${this.farmArea.start} a ${this.farmArea.end}`)
    }
  }

  async moveToBlock(targetPos) {
    if (!targetPos) return false
    
    const distance = this.bot.entity.position.distanceTo(targetPos)
    
    // Solo trabajar en bloques que estén dentro del alcance (5 bloques)
    if (distance <= 5) {
      return true
    }
    
    // Si está muy lejos, no intentar moverse
    return false
  }

  async collectNearbyItems() {
    const items = Object.values(this.bot.entities).filter(entity => 
      entity.name === 'item' && 
      this.bot.entity.position.distanceTo(entity.position) < 6
    )
    
    for (const item of items) {
      try {
        const { pathfinder, goals } = require('mineflayer-pathfinder')
        const goal = new goals.GoalNear(item.position.x, item.position.y, item.position.z, 1)
        await this.bot.pathfinder.goto(goal)
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (err) {
        // Ignorar errores de pathfinding para items
      }
    }
  }

  async findNearestMatureWheat() {
    let closestWheat = null
    let minDistance = Infinity

    // Buscar en un área más amplia
    const botPos = this.bot.entity.position
    const searchRadius = 16

    for (let x = Math.floor(botPos.x) - searchRadius; x <= Math.floor(botPos.x) + searchRadius; x++) {
      for (let z = Math.floor(botPos.z) - searchRadius; z <= Math.floor(botPos.z) + searchRadius; z++) {
        const wheatPos = new Vec3(x, Math.floor(botPos.y) + 1, z)
        
        try {
          if (await this.blockChecker.isWheatMature(wheatPos, this.mcData)) {
            const distance = botPos.distanceTo(wheatPos)
            if (distance < minDistance) {
              minDistance = distance
              closestWheat = {
                wheatPos: wheatPos,
                farmlandPos: wheatPos.offset(0, -1, 0),
                distance: distance
              }
            }
          }
        } catch (error) {
          // Continuar buscando si hay error en un bloque
        }
      }
    }

    return closestWheat
  }

  async moveToPosition(targetPos, tolerance = 2) {
    if (!targetPos) return false
    
    const distance = this.bot.entity.position.distanceTo(targetPos)
    if (distance <= tolerance) {
      return true
    }
    
    try {
      const { pathfinder, goals, Movements } = require('mineflayer-pathfinder')
      const movements = new Movements(this.bot, this.mcData)
      
      // Configuración permisiva para llegar al trigo
      movements.canDig = false
      movements.allowFreeMotion = true
      movements.allowParkour = true
      movements.allowSprinting = true
      
      // Verificar si blocksToBreak existe antes de usar clear()
      if (movements.blocksToBreak && typeof movements.blocksToBreak.clear === 'function') {
        movements.blocksToBreak.clear()
      }
      
      this.bot.pathfinder.setMovements(movements)
      
      const goal = new goals.GoalNear(targetPos.x, targetPos.y, targetPos.z, tolerance)
      await this.bot.pathfinder.goto(goal)
      
      if (botState.verboseMode) {
        console.log(`🚶 Me moví hacia ${targetPos}`)
      }
      return true
    } catch (error) {
      console.log(`⚠️ No pude llegar a ${targetPos}: ${error.message}`)
      return false
    }
  }

  async moveToBlock(block) {
    if (!block || !block.position) return false
    
    // Verificar si ya está cerca (distancia <= 4 bloques)
    const distance = this.bot.entity.position.distanceTo(block.position)
    if (distance <= 4) {
      return true // Ya está lo suficientemente cerca
    }
    
    try {
      const { pathfinder, goals, Movements } = require('mineflayer-pathfinder')
      const mcData = require('minecraft-data')(this.bot.version)
      const movements = new Movements(this.bot, mcData)
      
      // Configuración ultra-conservadora para proteger farmland
      movements.canDig = false
      movements.allowFreeMotion = false
      movements.allowParkour = false
      movements.allowSprinting = false
      movements.blocksToAvoid.add(this.bot.registry.blocksByName.farmland.id)
      movements.blocksToAvoid.add(this.bot.registry.blocksByName.wheat.id)
      
      // Verificar si blocksToBreak existe antes de usar clear()
      if (movements.blocksToBreak && typeof movements.blocksToBreak.clear === 'function') {
        movements.blocksToBreak.clear()
      }
      
      this.bot.pathfinder.setMovements(movements)
      
      const goal = new goals.GoalNear(block.position.x, block.position.y, block.position.z, 3)
      await this.bot.pathfinder.goto(goal)
      return true
    } catch (error) {
      // Si falla el pathfinder, intentar acercarse manualmente
      return distance <= 6 // Aceptar si está relativamente cerca
    }
  }

  async processArea() {
    if (!this.farmArea.start || !this.farmArea.end) {
      await this.setupFarming()
    }

    let harvested = 0
    let planted = 0
    let tilled = 0

    const startX = Math.min(this.farmArea.start.x, this.farmArea.end.x)
    const endX = Math.max(this.farmArea.start.x, this.farmArea.end.x)
    const startY = this.farmArea.start.y
    const startZ = Math.min(this.farmArea.start.z, this.farmArea.end.z)
    const endZ = Math.max(this.farmArea.start.z, this.farmArea.end.z)

    // Procesar cada bloque en el área
    for (let x = startX; x <= endX; x++) {
      for (let z = startZ; z <= endZ; z++) {
        if (!this.farmingActive) break

        const blockPos = new Vec3(x, startY, z)
        const aboveBlockPos = new Vec3(x, startY + 1, z)

        try {
          // 1. Verificar si hay trigo maduro para cosechar
          if (await this.blockChecker.isWheatMature(aboveBlockPos, this.mcData)) {
            await this.harvestWheat(blockPos, aboveBlockPos)
            harvested++
            await new Promise(resolve => setTimeout(resolve, 300))
          }
          // 2. Verificar si se puede plantar
          else if (await this.blockChecker.canPlant(blockPos, this.mcData)) {
            if (this.itemHandler.hasItemByName('wheat_seeds')) {
              await this.plantSeed(blockPos)
              planted++
              await new Promise(resolve => setTimeout(resolve, 300))
            }
          }
          // 3. Verificar si se puede arar la tierra
          else if (await this.blockChecker.isDirt(blockPos, this.mcData)) {
            await this.tillSoil(blockPos)
            tilled++
            await new Promise(resolve => setTimeout(resolve, 300))
          }
        } catch (error) {
          console.log(`⚠️ Error procesando ${blockPos}: ${error.message}`)
        }
      }
      if (!this.farmingActive) break
    }

    return { harvested, planted, tilled }
  }

  async harvestWheat(farmlandPos, wheatPos) {
    const targetPos = farmlandPos.offset(0.5, 1, 0.5)
    const distance = this.bot.entity.position.distanceTo(targetPos)
    
    // Only work on blocks within reach
    if (distance > 5) {
      return false
    }

    try {
      const wheatBlock = this.bot.blockAt(wheatPos)
      if (!wheatBlock) return false

      await this.bot.lookAt(wheatPos)
      await this.bot.dig(wheatBlock)
      
      // Esperar a que caigan los items
      await new Promise(resolve => setTimeout(resolve, 300))
      
      if (botState.verboseMode) {
        console.log(`🌾 Trigo cosechado en ${wheatPos}`)
      }
      return true
    } catch (error) {
      console.log(`❌ Error cosechando trigo: ${error.message}`)
      return false
    }
  }

  async plantSeed(farmlandPos) {
    const targetPos = farmlandPos.offset(0.5, 1, 0.5)
    const distance = this.bot.entity.position.distanceTo(targetPos)
    
    // Only work on blocks within reach
    if (distance > 5) {
      return false
    }

    try {
      const equipped = await this.itemHandler.equipItem('wheat_seeds')
      if (!equipped) return false

      const farmlandBlock = this.bot.blockAt(farmlandPos)
      if (!farmlandBlock) return false

      await this.bot.lookAt(farmlandPos)
      await this.bot.activateBlock(farmlandBlock)
      
      if (botState.verboseMode) {
        console.log(`🌱 Semilla plantada en ${farmlandPos}`)
      }
      return true
    } catch (error) {
      console.log(`❌ Error plantando semilla: ${error.message}`)
      return false
    }
  }

  async tillSoil(dirtPos) {
    const targetPos = dirtPos.offset(0.5, 1, 0.5)
    const distance = this.bot.entity.position.distanceTo(targetPos)
    
    // Only work on blocks within reach
    if (distance > 5) {
      return false
    }

    try {
      const equipped = await this.itemHandler.equipHoe()
      if (!equipped) return false

      const dirtBlock = this.bot.blockAt(dirtPos)
      if (!dirtBlock) return false

      // Limpiar bloque arriba si es necesario
      const aboveBlock = this.bot.blockAt(dirtPos.offset(0, 1, 0))
      if (aboveBlock && aboveBlock.name !== 'air') {
        await this.bot.dig(aboveBlock)
        await this.itemHandler.equipHoe()
      }

      await this.bot.lookAt(dirtPos)
      await this.bot.activateBlock(dirtBlock)
      
      if (botState.verboseMode) {
        console.log(`🔨 Tierra arada en ${dirtPos}`)
      }
      return true
    } catch (error) {
      console.log(`❌ Error arando tierra: ${error.message}`)
      return false
    }
  }

  async farmingLoop() {
    if (!this.farmingActive) return

    try {
      if (botState.verboseMode) {
        console.log('🚜 Iniciando ciclo de agricultura con navegación...')
      }
      
      // Verificar si el bot está en una posición válida
      if (!this.bot.entity || !this.bot.entity.position) {
        console.log('⚠️ Bot sin posición válida, esperando...')
        setTimeout(() => this.farmingLoop(), 3000)
        return
      }
      
      // Verificar si está atascado (Y muy bajo o sin suelo)
      const pos = this.bot.entity.position
      const blockBelow = this.bot.blockAt(pos.offset(0, -1, 0))
      if (pos.y < 35 || !blockBelow || blockBelow.name === 'air') {
        console.log('🚨 Bot parece estar atascado o cayendo, parando agricultura')
        this.stopFarming()
        return
      }
      
      // PRIORIDAD 1: Recoger items primero
      await this.collectNearbyItems()
      
      // PRIORIDAD 2: Buscar y ir al trigo maduro más cercano
      const nearestWheat = await this.findNearestMatureWheat()
      
      if (nearestWheat) {
        if (botState.verboseMode) {
          console.log(`🎯 Trigo maduro encontrado a ${nearestWheat.distance.toFixed(1)} bloques: ${nearestWheat.wheatPos}`)
        }
        
        // Moverse hacia el trigo
        const moved = await this.moveToPosition(nearestWheat.farmlandPos.offset(0.5, 1, 0.5), 3)
        
        if (moved) {
          // Cosechar el trigo
          await this.harvestAndReplant(nearestWheat.farmlandPos, nearestWheat.wheatPos)
        } else {
          if (botState.verboseMode) {
            console.log('⚠️ No pude llegar al trigo, procesando área local')
          }
          // Fallback al área local
          const results = await this.processArea()
          if ((results.harvested > 0 || results.planted > 0 || results.tilled > 0) && botState.verboseMode) {
            console.log(`✅ Área local: ${results.harvested} cosechados, ${results.planted} plantados, ${results.tilled} arados`)
          }
        }
      } else {
        if (botState.verboseMode) {
          console.log('🔍 No hay trigo maduro cercano, procesando área local')
        }
        // Procesar área local si no hay trigo maduro
        const results = await this.processArea()
        if ((results.harvested > 0 || results.planted > 0 || results.tilled > 0) && botState.verboseMode) {
          console.log(`✅ Área local: ${results.harvested} cosechados, ${results.planted} plantados, ${results.tilled} arados`)
        } else if (botState.verboseMode) {
          console.log('💤 No hay trabajo que hacer, esperando...')
        }
      }
      
    } catch (error) {
      console.log(`❌ Error en agricultura: ${error.message}`)
    }

    // Siguiente ciclo en 5 segundos
    if (this.farmingActive) {
      setTimeout(() => this.farmingLoop(), 5000)
    }
  }

  async harvestAndReplant(farmlandPos, wheatPos) {
    try {
      // Cosechar el trigo
      const wheatBlock = this.bot.blockAt(wheatPos)
      if (!wheatBlock) return false

      await this.bot.lookAt(wheatPos)
      await this.bot.dig(wheatBlock)
      
      if (botState.verboseMode) {
        console.log(`🌾 Trigo cosechado en ${wheatPos}`)
      }
      
      // Esperar a que caigan los items
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Recoger items cercanos
      await this.collectNearbyItems()
      
      // Replantear inmediatamente si tiene semillas
      if (this.itemHandler.hasItemByName('wheat_seeds')) {
        await new Promise(resolve => setTimeout(resolve, 300)) // Pequeña pausa
        
        const equipped = await this.itemHandler.equipItem('wheat_seeds')
        if (equipped) {
          const farmlandBlock = this.bot.blockAt(farmlandPos)
          if (farmlandBlock) {
            await this.bot.lookAt(farmlandPos)
            await this.bot.activateBlock(farmlandBlock)
            
            if (botState.verboseMode) {
              console.log(`🌱 Replantado en ${farmlandPos}`)
            }
          }
        }
      }
      
      return true
    } catch (error) {
      console.log(`❌ Error en cosecha y replantado: ${error.message}`)
      return false
    }
  }

  async startFarming(sender = null) {
    if (this.farmingActive) {
      const message = '⚠️ La agricultura ya está activa'
      if (sender) {
        this.bot.chat(`/msg ${sender} ${message}`)
      } else {
        console.log(message)
      }
      return
    }

    // Verificar que el bot esté en una posición válida
    if (!this.bot.entity || !this.bot.entity.position) {
      const message = '❌ Bot sin posición válida'
      if (sender) {
        this.bot.chat(`/msg ${sender} ${message}`)
      } else {
        console.log(message)
      }
      return
    }

    // Configurar minecraft data
    if (!this.mcData) {
      this.mcData = minecraftData(this.bot.version)
    }

    // Verificar herramientas básicas
    const hasHoe = this.itemHandler.hasItemByName('wooden_hoe') || 
                   this.itemHandler.hasItemByName('stone_hoe') ||
                   this.itemHandler.hasItemByName('iron_hoe') ||
                   this.itemHandler.hasItemByName('diamond_hoe') ||
                   this.itemHandler.hasItemByName('netherite_hoe')

    if (!hasHoe && botState.verboseMode) {
      console.log('⚠️ No tienes azada, pero puedes farmear lo que ya esté arado')
    }

    // Configurar área de farming
    await this.setupFarming()
    
    this.farmingActive = true
    
    const message = '🌾 Iniciando sistema de agricultura optimizado...'
    if (sender) {
      this.bot.chat(`/msg ${sender} ${message}`)
    } else {
      console.log(message)
    }
    
    const seedCount = this.itemHandler.getItemCount('wheat_seeds')
    const wheatCount = this.itemHandler.getItemCount('wheat')
    
    if (botState.verboseMode) {
      console.log(`🌱 Semillas: ${seedCount}, 🌾 Trigo: ${wheatCount}`)
    }
    
    this.farmingLoop()
  }

  stopFarming(sender = null) {
    if (!this.farmingActive) {
      const message = '⚠️ La agricultura no está activa'
      if (sender) {
        this.bot.chat(`/msg ${sender} ${message}`)
      } else {
        console.log(message)
      }
      return
    }

    this.farmingActive = false
    
    const message = '🌾 Agricultura detenida'
    if (sender) {
      this.bot.chat(`/msg ${sender} ${message}`)
    } else {
      console.log(message)
    }
  }

  getStatus(sender = null) {
    const seedCount = this.itemHandler.getItemCount('wheat_seeds')
    const wheatCount = this.itemHandler.getItemCount('wheat')

    const statusData = [
      '🌾 ESTADO DE AGRICULTURA OPTIMIZADA:',
      `Status: ${this.farmingActive ? 'ACTIVA' : 'INACTIVA'}`,
      `🌱 Semillas: ${seedCount}`,
      `🌾 Trigo: ${wheatCount}`
    ]
    
    if (this.farmArea.start && this.farmArea.end) {
      statusData.push(`📍 Área: ${this.farmArea.start} a ${this.farmArea.end}`)
    }
    
    // Mostrar herramientas disponibles
    const hasHoe = this.itemHandler.hasItemByName('wooden_hoe') || 
                   this.itemHandler.hasItemByName('stone_hoe') ||
                   this.itemHandler.hasItemByName('iron_hoe') ||
                   this.itemHandler.hasItemByName('diamond_hoe') ||
                   this.itemHandler.hasItemByName('netherite_hoe')
    statusData.push(`🔨 Azada: ${hasHoe ? 'SÍ' : 'NO'}`)

    if (sender) {
      // Enviar por mensaje privado
      statusData.forEach(line => {
        this.bot.chat(`/msg ${sender} ${line}`)
      })
    } else {
      // Mostrar en consola
      statusData.forEach(line => console.log(line))
    }
  }
}

module.exports = FarmingSystem