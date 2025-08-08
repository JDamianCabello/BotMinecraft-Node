/**
 * Sistema de minería automática optimizado
 */

const config = require('../config/botConfig')
const botState = require('./botState')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')
const { Vec3 } = require('vec3')

class MiningSystem {
  constructor(bot) {
    this.bot = bot
    this.miningActive = false
    this.miningInterval = null
    this.targetOres = []
    this.mcData = null
    this.obsidianMiningActive = false
    this.obsidianMiningInterval = null
    this.currentObsidianLayer = null
    this.obsidianLayerComplete = false
  }

  async startMining() {
    if (this.miningActive) {
      console.log('⚠️ La minería ya está activa')
      return
    }

    console.log('⛏️ Iniciando sistema de minería inteligente...')
    
    // Inicializar minecraft data
    this.mcData = require('minecraft-data')(this.bot.version)
    
    // Verificar y equipar pico antes de empezar
    if (!await this.equipBestPickaxe()) {
      console.log('❌ No tienes pico para minar, ejecutando /lobby...')
      this.bot.chat('/lobby')
      
      // Marcar que está en lobby y detener minería
      botState.inLobby = true
      this.miningActive = false
      botState.setMiningActive(false)
      return
    }
    
    // Definir ores valiosos con prioridades y Y levels óptimos (Minecraft 1.21.4)
    this.targetOres = [
      { name: 'diamond_ore', priority: 100, yLevel: -59 },
      { name: 'deepslate_diamond_ore', priority: 100, yLevel: -59 },
      { name: 'emerald_ore', priority: 95, yLevel: 85 },
      { name: 'deepslate_emerald_ore', priority: 95, yLevel: 85 },
      { name: 'ancient_debris', priority: 90, yLevel: 16 },
      { name: 'gold_ore', priority: 70, yLevel: -18 },
      { name: 'deepslate_gold_ore', priority: 70, yLevel: -18 },
      { name: 'nether_gold_ore', priority: 65, yLevel: 16 },
      { name: 'iron_ore', priority: 50, yLevel: 14 },
      { name: 'deepslate_iron_ore', priority: 50, yLevel: 14 },
      { name: 'redstone_ore', priority: 45, yLevel: -59 },
      { name: 'deepslate_redstone_ore', priority: 45, yLevel: -59 },
      { name: 'coal_ore', priority: 40, yLevel: 45 },
      { name: 'deepslate_coal_ore', priority: 40, yLevel: 45 },
      { name: 'copper_ore', priority: 35, yLevel: 43 },
      { name: 'deepslate_copper_ore', priority: 35, yLevel: 43 },
      { name: 'lapis_ore', priority: 30, yLevel: -2 },
      { name: 'deepslate_lapis_ore', priority: 30, yLevel: -2 },
      { name: 'nether_quartz_ore', priority: 25, yLevel: 16 }
    ]

    this.miningActive = true
    botState.setMiningActive(true, 'ores_inteligente')
    
    // Ir a la mejor capa para diamantes (la más valiosa)
    await this.goToOptimalLayer()
    
    // Iniciar loop de minería
    this.miningLoop()
  }

  async goToOptimalLayer() {
    // Determinar la mejor capa basada en dimensión
    const currentY = Math.floor(this.bot.entity.position.y)
    let targetY = -59 // Default: diamantes y redstone
    
    // Detectar dimensión basada en Y level
    if (currentY >= 0 && currentY <= 320) {
      // Overworld - priorizar diamantes
      targetY = -59
    } else if (currentY >= 1 && currentY <= 127) {
      // Nether - priorizar ancient debris
      targetY = 16
    }
    
    if (Math.abs(currentY - targetY) > 3) {
      console.log(`📍 Navegando a capa óptima Y=${targetY} (actual: Y=${currentY})`)
      
      try {
        const movements = new Movements(this.bot, this.mcData)
        movements.allowParkour = true
        movements.allowSprinting = true
        movements.canDig = true
        movements.allow1by1towers = false
        movements.allowFreeMotion = false
        
        // Configuraciones de pathfinder para mayor estabilidad
        movements.scafoldingBlocks = []
        movements.maxDropDown = 256
        
        // Evitar lava siempre (con verificación de existencia)
        const lavaBlock = this.mcData.blocksByName.lava
        const flowingLavaBlock = this.mcData.blocksByName.flowing_lava
        
        if (lavaBlock) {
          movements.blocksToAvoid.add(lavaBlock.id)
        }
        if (flowingLavaBlock) {
          movements.blocksToAvoid.add(flowingLavaBlock.id)
        }
        
        this.bot.pathfinder.setMovements(movements)
        
        const goal = new goals.GoalY(targetY)
        
        // Usar timeout manual para evitar que se cuelgue
        const pathfindingPromise = this.bot.pathfinder.goto(goal)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Pathfinding timeout')), 30000)
        )
        
        await Promise.race([pathfindingPromise, timeoutPromise])
        
        console.log(`✅ Llegué a capa Y=${Math.floor(this.bot.entity.position.y)}`)
      } catch (error) {
        console.log(`⚠️ Error navegando a capa óptima: ${error.message}`)
      }
    }
  }

  async miningLoop() {
    if (!this.miningActive) return

    try {
      // Verificar inventario lleno
      if (this.isInventoryFull()) {
        console.log('🎒 Inventario lleno, ejecutando /lobby...')
        this.bot.chat('/lobby')
        this.stopMining()
        return
      }
      
      // Verificar que tiene pico equipado
      if (!this.hasPickaxeEquipped()) {
        if (!await this.equipBestPickaxe()) {
          console.log('❌ No tienes pico para continuar minando, ejecutando /lobby...')
          this.bot.chat('/lobby')
          
          // Marcar que está en lobby y detener minería completamente
          botState.inLobby = true
          this.miningActive = false
          botState.setMiningActive(false)
          return
        }
      }

      // Buscar ore más valioso cerca
      const targetOre = this.findNearestValuableOre()
      
      if (targetOre) {
        await this.mineOre(targetOre)
      } else {
        // Si no hay ores cerca, explorar un poco
        await this.exploreArea()
      }

      // Recoger items caídos
      await this.collectNearbyItems()

    } catch (error) {
      console.log(`❌ Error en minería: ${error.message}`)
    }

    // Continuar loop
    if (this.miningActive) {
      setTimeout(() => this.miningLoop(), 2000)
    }
  }

  findNearestValuableOre() {
    let bestOre = null
    let bestScore = 0
    const botPos = this.bot.entity.position
    const searchRadius = 16

    for (let x = Math.floor(botPos.x) - searchRadius; x <= Math.floor(botPos.x) + searchRadius; x++) {
      for (let y = Math.floor(botPos.y) - 5; y <= Math.floor(botPos.y) + 5; y++) {
        for (let z = Math.floor(botPos.z) - searchRadius; z <= Math.floor(botPos.z) + searchRadius; z++) {
          const pos = new Vec3(x, y, z)
          const block = this.bot.blockAt(pos)
          
          if (!block) continue

          // Buscar si es un ore valioso
          const oreInfo = this.targetOres.find(ore => 
            this.mcData.blocksByName[ore.name]?.id === block.type
          )

          if (oreInfo) {
            const distance = botPos.distanceTo(pos)
            // Calcular score: prioridad dividida por distancia
            const score = oreInfo.priority / (distance + 1)
            
            if (score > bestScore && this.isSafeToMine(pos)) {
              bestScore = score
              bestOre = {
                block: block,
                position: pos,
                ore: oreInfo,
                distance: distance
              }
            }
          }
        }
      }
    }

    return bestOre
  }

  isSafeToMine(pos) {
    // Verificar que no hay lava alrededor
    const surroundingPositions = [
      pos.offset(1, 0, 0), pos.offset(-1, 0, 0),
      pos.offset(0, 1, 0), pos.offset(0, -1, 0),
      pos.offset(0, 0, 1), pos.offset(0, 0, -1)
    ]

    for (const checkPos of surroundingPositions) {
      const block = this.bot.blockAt(checkPos)
      if (block && (block.name === 'lava' || block.name === 'flowing_lava')) {
        return false
      }
    }

    return true
  }

  async mineOre(targetOre) {
    try {
      if (botState.verboseMode) {
        console.log(`⛏️ Minando ${targetOre.ore.name} a ${targetOre.distance.toFixed(1)} bloques`)
      }

      // Moverse cerca del ore
      const movements = new Movements(this.bot, this.mcData)
      movements.allowParkour = true
      movements.canDig = true
      
      // Evitar lava con verificación de existencia
      const lavaBlock = this.mcData.blocksByName.lava
      const flowingLavaBlock = this.mcData.blocksByName.flowing_lava
      
      if (lavaBlock) {
        movements.blocksToAvoid.add(lavaBlock.id)
      }
      if (flowingLavaBlock) {
        movements.blocksToAvoid.add(flowingLavaBlock.id)
      }
      
      this.bot.pathfinder.setMovements(movements)

      const goal = new goals.GoalNear(
        targetOre.position.x, 
        targetOre.position.y, 
        targetOre.position.z, 
        3
      )
      
      // Usar timeout para pathfinding
      const pathfindingPromise = this.bot.pathfinder.goto(goal)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Mining pathfinding timeout')), 15000)
      )
      
      await Promise.race([pathfindingPromise, timeoutPromise])

      // Verificar que el bloque aún existe y es seguro
      const currentBlock = this.bot.blockAt(targetOre.position)
      if (currentBlock && currentBlock.type === targetOre.block.type && this.isSafeToMine(targetOre.position)) {
        await this.bot.dig(currentBlock)
        
        botState.updateMiningStats(targetOre.ore.name)
        
        if (botState.verboseMode) {
          console.log(`✅ ${targetOre.ore.name} minado exitosamente`)
        }
      }

    } catch (error) {
      if (botState.verboseMode) {
        console.log(`⚠️ Error minando ore: ${error.message}`)
      }
    }
  }

  async exploreArea() {
    try {
      // Movimiento aleatorio para explorar
      const botPos = this.bot.entity.position
      const randomX = botPos.x + (Math.random() - 0.5) * 10
      const randomZ = botPos.z + (Math.random() - 0.5) * 10
      const targetY = Math.floor(botPos.y)

      const movements = new Movements(this.bot, this.mcData)
      movements.allowParkour = true
      movements.canDig = true
      
      // Evitar lava con verificación de existencia
      const lavaBlock = this.mcData.blocksByName.lava
      const flowingLavaBlock = this.mcData.blocksByName.flowing_lava
      
      if (lavaBlock) {
        movements.blocksToAvoid.add(lavaBlock.id)
      }
      if (flowingLavaBlock) {
        movements.blocksToAvoid.add(flowingLavaBlock.id)
      }
      
      this.bot.pathfinder.setMovements(movements)

      const goal = new goals.GoalNear(Math.floor(randomX), targetY, Math.floor(randomZ), 2)
      
      // Timeout para exploración
      const pathfindingPromise = this.bot.pathfinder.goto(goal)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Exploration pathfinding timeout')), 10000)
      )
      
      await Promise.race([pathfindingPromise, timeoutPromise])

      if (botState.verboseMode) {
        console.log('🔍 Explorando nueva área...')
      }

    } catch (error) {
      // Ignorar errores de exploración
    }
  }

  async collectNearbyItems() {
    const items = Object.values(this.bot.entities).filter(entity => 
      entity.name === 'item' && 
      this.bot.entity.position.distanceTo(entity.position) < 8
    )
    
    for (const item of items) {
      try {
        const goal = new goals.GoalNear(item.position.x, item.position.y, item.position.z, 1)
        
        // Timeout corto para recolección de items
        const pathfindingPromise = this.bot.pathfinder.goto(goal)
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Item collection timeout')), 5000)
        )
        
        await Promise.race([pathfindingPromise, timeoutPromise])
        await new Promise(resolve => setTimeout(resolve, 200))
      } catch (err) {
        // Ignorar errores de pathfinding para items
      }
    }
  }

  hasPickaxeEquipped() {
    const heldItem = this.bot.heldItem
    return heldItem && heldItem.name.includes('pickaxe')
  }

  async equipBestPickaxe() {
    // Orden de preferencia: netherite > diamond > iron > stone > wooden
    const pickaxeTypes = [
      'netherite_pickaxe',
      'diamond_pickaxe', 
      'iron_pickaxe',
      'stone_pickaxe',
      'wooden_pickaxe'
    ]
    
    for (const pickaxeType of pickaxeTypes) {
      const pickaxe = this.bot.inventory.items().find(item => item.name === pickaxeType)
      if (pickaxe) {
        try {
          await this.bot.equip(pickaxe, 'hand')
          if (botState.verboseMode) {
            console.log(`⛏️ Pico equipado: ${pickaxe.displayName || pickaxe.name}`)
          }
          return true
        } catch (error) {
          console.log(`⚠️ Error equipando pico: ${error.message}`)
        }
      }
    }
    
    return false // No tiene ningún pico
  }

  isInventoryFull() {
    const totalSlots = 36
    const usedSlots = this.bot.inventory.items().length
    return usedSlots >= totalSlots - 2 // Dejar 2 slots libres como margen
  }

  async startObsidianMining(sender = null) {
    if (this.obsidianMiningActive) {
      const message = '⚠️ La minería de obsidiana ya está activa'
      if (sender) {
        this.bot.chat(`/msg ${sender} ${message}`)
      } else {
        console.log(message)
      }
      return
    }

    const message = '🌀 Iniciando minería de obsidiana del End...'
    if (sender) {
      this.bot.chat(`/msg ${sender} ${message}`)
    } else {
      console.log(message)
    }

    // Inicializar minecraft data
    this.mcData = require('minecraft-data')(this.bot.version)
    
    // Verificar que tenemos pico de diamante
    if (!this.hasDiamondPickaxe()) {
      const errorMsg = '❌ Necesitas un pico de diamante para minar obsidiana'
      if (sender) {
        this.bot.chat(`/msg ${sender} ${errorMsg}`)
      } else {
        console.log(errorMsg)
      }
      return
    }

    this.obsidianMiningActive = true
    botState.setMiningActive(true, 'obsidiana_end')
    
    // Inicializar la capa actual del bot
    this.currentObsidianLayer = Math.floor(this.bot.entity.position.y)
    this.obsidianLayerComplete = false
    
    if (botState.verboseMode) {
      console.log(`🌀 Iniciando en capa Y=${this.currentObsidianLayer}`)
    }
    
    // Mirar hacia abajo inmediatamente para evitar endermans
    await this.bot.look(this.bot.entity.yaw, Math.PI / 2, false) // Pitch = 90 grados hacia abajo
    
    // Iniciar loop de minería de obsidiana
    this.obsidianMiningLoop()
  }

  hasDiamondPickaxe() {
    const diamondPickaxes = this.bot.inventory.items().filter(item => 
      item.name === 'diamond_pickaxe' || item.name === 'netherite_pickaxe'
    )
    return diamondPickaxes.length > 0
  }

  hasDiamondPickaxeEquipped() {
    const heldItem = this.bot.heldItem
    return heldItem && (heldItem.name === 'diamond_pickaxe' || heldItem.name === 'netherite_pickaxe')
  }

  async equipDiamondPickaxe() {
    // Preferir netherite sobre diamond
    const pickaxeTypes = ['netherite_pickaxe', 'diamond_pickaxe']
    
    for (const pickaxeType of pickaxeTypes) {
      const pickaxe = this.bot.inventory.items().find(item => item.name === pickaxeType)
      if (pickaxe) {
        try {
          await this.bot.equip(pickaxe, 'hand')
          if (botState.verboseMode) {
            console.log(`⛏️ Pico equipado para obsidiana: ${pickaxe.displayName || pickaxe.name}`)
          }
          return true
        } catch (error) {
          console.log(`⚠️ Error equipando pico de diamante: ${error.message}`)
        }
      }
    }
    
    return false
  }

  async obsidianMiningLoop() {
    if (!this.obsidianMiningActive) return

    try {
      // Mantener la mirada hacia abajo
      await this.bot.look(this.bot.entity.yaw, Math.PI / 2, false)
      
      // Verificar inventario lleno
      if (this.isInventoryFull()) {
        console.log('🎒 Inventario lleno, ejecutando /lobby...')
        this.bot.chat('/lobby')
        this.stopObsidianMining()
        return
      }
      
      // Verificar que tiene pico de diamante equipado
      if (!this.hasDiamondPickaxeEquipped()) {
        if (!await this.equipDiamondPickaxe()) {
          console.log('❌ No tienes pico de diamante para continuar, ejecutando /lobby...')
          this.bot.chat('/lobby')
          
          // Marcar que está en lobby y detener minería de obsidiana completamente
          botState.inLobby = true
          this.obsidianMiningActive = false
          botState.setMiningActive(false)
          return
        }
      }

      // Buscar obsidiana en la capa actual
      const obsidianBlock = this.findObsidianInCurrentLayer()
      
      if (obsidianBlock) {
        await this.mineObsidianSafely(obsidianBlock)
        this.obsidianLayerComplete = false // Resetear si encontramos obsidiana
      } else {
        // Si no hay obsidiana en la capa actual, bajar a la siguiente
        if (!this.obsidianLayerComplete) {
          this.obsidianLayerComplete = true
          this.currentObsidianLayer -= 1
          
          if (botState.verboseMode) {
            console.log(`📉 Capa completada, bajando a Y=${this.currentObsidianLayer}`)
          }
          
          // Mover el bot a la nueva capa si es necesario
          await this.moveToLayer(this.currentObsidianLayer)
        } else {
          if (botState.verboseMode) {
            console.log('🔍 No hay más obsidiana en esta área...')
          }
        }
      }

      // Recoger items caídos
      await this.collectNearbyItems()

    } catch (error) {
      console.log(`❌ Error en minería de obsidiana: ${error.message}`)
    }

    // Continuar loop
    if (this.obsidianMiningActive) {
      setTimeout(() => this.obsidianMiningLoop(), 3000) // 3 segundos entre ciclos
    }
  }

  findObsidianInCurrentLayer() {
    const botPos = this.bot.entity.position
    const searchRadius = 6 // Radio para buscar en la capa
    let closestObsidian = null
    let closestDistance = Infinity

    // Buscar obsidiana SOLO en la capa actual
    const targetY = this.currentObsidianLayer
    
    for (let x = Math.floor(botPos.x) - searchRadius; x <= Math.floor(botPos.x) + searchRadius; x++) {
      for (let z = Math.floor(botPos.z) - searchRadius; z <= Math.floor(botPos.z) + searchRadius; z++) {
        const pos = new Vec3(x, targetY, z)
        const block = this.bot.blockAt(pos)
        
        if (block && block.name === 'obsidian') {
          const distance = botPos.distanceTo(pos)
          
          // Priorizar obsidiana que esté al alcance y sea segura de minar
          if (distance < closestDistance && distance <= 6 && this.isSafeObsidianToMine(pos)) {
            closestDistance = distance
            closestObsidian = {
              block: block,
              position: pos,
              distance: distance
            }
          }
        }
      }
    }

    return closestObsidian
  }

  async moveToLayer(targetY) {
    try {
      const botPos = this.bot.entity.position
      const currentY = Math.floor(botPos.y)
      
      // Solo mover si estamos en una capa diferente
      if (Math.abs(currentY - targetY) > 0) {
        // Buscar un bloque de obsidiana en la nueva capa para posicionarse
        const searchRadius = 6
        let targetPosition = null
        
        for (let x = Math.floor(botPos.x) - searchRadius; x <= Math.floor(botPos.x) + searchRadius; x++) {
          for (let z = Math.floor(botPos.z) - searchRadius; z <= Math.floor(botPos.z) + searchRadius; z++) {
            const pos = new Vec3(x, targetY + 1, z) // Posicionarse encima de la obsidiana
            const blockBelow = this.bot.blockAt(pos.offset(0, -1, 0))
            const blockAt = this.bot.blockAt(pos)
            
            // Verificar que hay obsidiana debajo y espacio para pararse
            if (blockBelow && blockBelow.name === 'obsidian' && 
                blockAt && blockAt.name === 'air') {
              const distance = botPos.distanceTo(pos)
              if (distance <= 8) { // Dentro del rango de movimiento
                targetPosition = pos
                break
              }
            }
          }
          if (targetPosition) break
        }
        
        // Mover a la nueva posición
        if (targetPosition) {
          const movements = new Movements(this.bot, this.mcData)
          movements.allowParkour = false
          movements.canDig = false
          movements.allowFreeMotion = true
          
          this.bot.pathfinder.setMovements(movements)
          const goal = new goals.GoalBlock(targetPosition.x, targetPosition.y, targetPosition.z)
          
          // Timeout para movimiento de obsidiana
          const pathfindingPromise = this.bot.pathfinder.goto(goal)
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Obsidian movement timeout')), 15000)
          )
          
          await Promise.race([pathfindingPromise, timeoutPromise])
          
          if (botState.verboseMode) {
            console.log(`🔄 Movido a nueva capa Y=${targetY}`)
          }
        }
      }
      
      // Mantener mirada hacia abajo después del movimiento
      await this.bot.look(this.bot.entity.yaw, Math.PI / 2, false)
      
    } catch (error) {
      if (botState.verboseMode) {
        console.log(`⚠️ Error moviendo a capa: ${error.message}`)
      }
    }
  }

  isSafeObsidianToMine(pos) {
    const botPos = this.bot.entity.position
    
    // No minar obsidiana que esté directamente debajo del bot (para no caerse)
    if (pos.x === Math.floor(botPos.x) && pos.z === Math.floor(botPos.z) && pos.y < Math.floor(botPos.y)) {
      return false
    }
    
    // Verificar que no hay vacío debajo del bot si minamos este bloque
    const blockBelow = this.bot.blockAt(botPos.offset(0, -1, 0))
    if (!blockBelow || blockBelow.name === 'air') {
      return false
    }
    
    // Para el sistema de capas, solo permitir minar en la capa actual
    if (pos.y !== this.currentObsidianLayer) {
      return false
    }
    
    // Verificar que el bloque está al alcance horizontal
    const horizontalDistance = Math.sqrt(
      Math.pow(pos.x - botPos.x, 2) + Math.pow(pos.z - botPos.z, 2)
    )
    if (horizontalDistance > 6) {
      return false
    }
    
    return true
  }

  async mineObsidianSafely(obsidianTarget) {
    try {
      // Mantener mirada hacia abajo mientras minamos
      await this.bot.look(this.bot.entity.yaw, Math.PI / 2, false)
      
      if (botState.verboseMode) {
        console.log(`🌀 Minando obsidiana a ${obsidianTarget.distance.toFixed(1)} bloques`)
      }

      // Minar la obsidiana
      const currentBlock = this.bot.blockAt(obsidianTarget.position)
      if (currentBlock && currentBlock.name === 'obsidian') {
        await this.bot.dig(currentBlock)
        
        botState.updateMiningStats('obsidian')
        
        if (botState.verboseMode) {
          console.log('✅ Obsidiana minada exitosamente')
        }
      }

    } catch (error) {
      if (botState.verboseMode) {
        console.log(`⚠️ Error minando obsidiana: ${error.message}`)
      }
    }
  }

  stopObsidianMining(sender = null) {
    if (!this.obsidianMiningActive) {
      const message = '⚠️ La minería de obsidiana no está activa'
      if (sender) {
        this.bot.chat(`/msg ${sender} ${message}`)
      } else {
        console.log(message)
      }
      return
    }

    this.obsidianMiningActive = false
    botState.setMiningActive(false)
    
    // Limpiar variables de capa
    this.currentObsidianLayer = null
    this.obsidianLayerComplete = false
    
    if (this.obsidianMiningInterval) {
      clearInterval(this.obsidianMiningInterval)
      this.obsidianMiningInterval = null
    }

    const message = '🌀 Minería de obsidiana detenida'
    if (sender) {
      this.bot.chat(`/msg ${sender} ${message}`)
    } else {
      console.log(message)
    }
    
    // Mostrar estadísticas
    if (Object.keys(botState.miningStats).length > 0) {
      console.log('📊 ESTADÍSTICAS DE OBSIDIANA:')
      Object.entries(botState.miningStats).forEach(([ore, count]) => {
        if (ore === 'obsidian') {
          console.log(`  Obsidiana: ${count}`)
        }
      })
    }
  }

  stopMining() {
    if (!this.miningActive) {
      console.log('⚠️ La minería no está activa')
      return
    }

    this.miningActive = false
    botState.setMiningActive(false)
    
    if (this.miningInterval) {
      clearInterval(this.miningInterval)
      this.miningInterval = null
    }

    console.log('⛏️ Minería detenida')
    
    // Mostrar estadísticas
    if (Object.keys(botState.miningStats).length > 0) {
      console.log('📊 ESTADÍSTICAS DE MINERÍA:')
      Object.entries(botState.miningStats)
        .sort((a, b) => config.mining.orePriorities[b[0]] - config.mining.orePriorities[a[0]])
        .forEach(([ore, count]) => {
          console.log(`  ${ore}: ${count}`)
        })
    }
  }

  getStatus() {
    console.log('⛏️ ESTADO DE MINERÍA INTELIGENTE:')
    console.log(`Status: ${this.miningActive ? 'ACTIVA' : 'INACTIVA'}`)
    console.log(`🌀 Obsidiana: ${this.obsidianMiningActive ? 'ACTIVA' : 'INACTIVA'}`)
    
    if (this.obsidianMiningActive && this.currentObsidianLayer !== null) {
      console.log(`📏 Capa actual: Y=${this.currentObsidianLayer}`)
      console.log(`✅ Capa completa: ${this.obsidianLayerComplete ? 'SÍ' : 'NO'}`)
    }
    
    console.log(`📍 Posición: ${this.bot.entity.position}`)
    console.log(`🎒 Inventario: ${this.bot.inventory.items().length}/36 slots`)
    
    if (Object.keys(botState.miningStats).length > 0) {
      console.log('📊 Estadísticas actuales:')
      Object.entries(botState.miningStats).forEach(([ore, count]) => {
        console.log(`  ${ore}: ${count}`)
      })
    }
  }
}

module.exports = MiningSystem