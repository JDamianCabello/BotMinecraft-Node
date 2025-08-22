/**
 * Procesador de comandos centralizado
 */

const config = require('../config/botConfig')
const botState = require('../utils/botState')
const { proxyManager } = require('../config/proxyConfig')

class CommandProcessor {
  constructor(bot, miningSystem, feedingSystem, collectSystem, navigationSystem, farmingSystem, fishingSystem) {
    this.bot = bot
    this.miningSystem = miningSystem
    this.feedingSystem = feedingSystem
    this.collectSystem = collectSystem
    this.navigationSystem = navigationSystem
    this.farmingSystem = farmingSystem
    this.fishingSystem = fishingSystem
    this.commands = this.initializeCommands()
  }

  initializeCommands() {
    return {
      // Comandos de ayuda
      '/help': (sender) => this.showHelp(sender),
      '/h': (sender) => this.showHelp(sender),

      // Comandos de navegación
      '/goto': (sender) => this.navigationSystem.goToSpawn(),
      '/ir': (sender) => this.navigationSystem.goToSpawn(),
      '/tpme': (sender) => this.teleportToV0xxii(sender),
      '/reset': (sender) => this.resetBot(sender),

      // Comandos de minería
      '/mine': (sender) => this.miningSystem.startMining(),
      '/stopmine': (sender) => this.miningSystem.stopMining(),
      '/mineobsidiana': (sender) => this.miningSystem.startObsidianMining(sender),
      '/stopmineobsidiana': (sender) => this.miningSystem.stopObsidianMining(sender),
      '/ores': (sender) => this.showOptimalOres(sender),

      // Comandos de recolección
      '/drop': (sender) => this.dropItems(sender),
      '/scan': (sender) => this.scanArea(sender),
      '/inv': (sender) => this.showInventory(sender),

      // Comandos de alimentación
      '/eat': (sender) => this.feedingSystem.eatFood(),
      '/autofeed': (sender) => this.feedingSystem.toggleAutoFeeding(),

      // Comandos de sistema
      '/verbose': (sender) => this.toggleVerbose(sender),
      '/v': (sender) => this.toggleVerbose(sender),
      '/chat': (sender) => this.toggleChat(sender),
      '/debug': (sender) => this.toggleDebug(sender),
      '/hunger': (sender) => this.toggleHungerMessages(sender),
      '/vision': (sender) => this.showBotStatus(sender),
      '/ver': (sender) => this.showBotStatus(sender),
      '/status': (sender) => this.showDetailedStatus(sender),
      '/webview': (sender) => this.startWebViewer(sender),
      
      // Comandos de agricultura
      '/farm': (sender) => this.farmingSystem.startFarming(sender),
      '/stopfarm': (sender) => this.farmingSystem.stopFarming(sender),
      '/farmstatus': (sender) => this.farmingSystem.getStatus(sender),

      // Comandos de pesca
      '/fish': (sender) => this.fishingSystem.startFishing(sender),
      '/stopfish': (sender) => this.fishingSystem.stopFishing(sender),
      '/fishstatus': (sender) => this.fishingSystem.getStatus.bind(this.fishingSystem),

      // Comando de salida
      '/logout': (sender) => this.logout(sender),

      // Comando anti-AFK  
      '/noafk': (sender) => this.toggleAntiAFK(sender),
      
      // Comando autoreset
      '/autoreset': (sender, ...args) => this.toggleAutoReset(sender, ...args),

      // Comando para reactivar bot después de muerte
      '/reactivar': (sender) => this.reactivateBot(sender),

      // Comandos de proxy
      '/proxies': (sender) => this.showProxyStatus(sender),
      '/myproxy': (sender) => this.showMyProxy(sender)
    }
  }

  async processCommand(command, sender = null) {
    // Limpiar comando
    command = command.trim()

    // Comandos con parámetros
    if (command.startsWith('/say ')) {
      return this.sayMessage(command.substring(5))
    }
    if (command.startsWith('/collect ')) {
      return this.collectSystem.collectBlock(command.substring(9).trim())
    }
    if (command.startsWith('/collectall ')) {
      const parts = command.split(' ')
      return this.collectSystem.collectMultipleBlocks(parts[1], parseInt(parts[2]) || 5)
    }

    // Comandos simples
    if (this.commands[command]) {
      return this.commands[command](sender)
    }

    // Si no es un comando, enviar al chat
    if (!command.startsWith('/')) {
      this.bot.chat(command)
      console.log(`✅ Mensaje enviado: ${command}`)
      return
    }

    console.log(`❌ Comando desconocido: ${command}`)
  }

  showHelp() {
    console.log('\n📋 COMANDOS DISPONIBLES:')
    console.log('========================')
    console.log('🏠 NAVEGACIÓN:')
    console.log('  /goto, /ir     - Ir a coordenadas spawn (-2,12,39)')
    console.log('  /reset         - Ir al lobby y salir del spawn')
    console.log('  /tpme          - Teleportarse a v0xxii')
    console.log('  🤖 Auto-acepta teleportes de v0xxii')
    console.log('')
    console.log('⛏️ MINERÍA (Sistema inteligente con prioridades):')
    console.log('  /mine          - Iniciar minería automática inteligente')
    console.log('  /stopmine      - Detener minería')
    console.log('  /mineobsidiana - Minar obsidiana en pilares del End (siempre mira abajo)')
    console.log('  /stopmineobsidiana - Detener minería de obsidiana')
    console.log('  /ores          - Ver tabla de Y levels óptimos para cada ore')
    console.log('  /collect <tipo> - Recolectar bloque específico (ej: /collect stone)')
    console.log('  /collectall <tipo> [cantidad] - Recolectar múltiples (ej: /collectall stone 10)')
    console.log('  /drop          - Tirar todos los items al suelo')
    console.log('  /scan          - Escanear bloques cercanos')
    console.log('  /inv           - Ver inventario del bot')
    console.log('  🎯 Prioriza: diamante > esmeralda > ancient debris > oro > hierro')
    console.log('  📏 Y levels óptimos actualizados (Minecraft 1.21.4)')
    console.log('  🛡️ Evita lava automáticamente')
    console.log('  🎒 Se cierra automáticamente cuando el inventario está lleno')
    console.log('')
    console.log('🍎 ALIMENTACIÓN:')
    console.log('  /eat           - Comer inmediatamente')
    console.log('  /autofeed      - Activar/desactivar auto-alimentación')
    console.log('')
    console.log('🌾 AGRICULTURA:')
    console.log('  /farm          - Iniciar agricultura automática')
    console.log('  /stopfarm      - Detener agricultura')
    console.log('  /farmstatus    - Ver estado de agricultura')
    console.log('')
    console.log('🎣 PESCA:')
    console.log('  /fish          - Iniciar pesca automática')
    console.log('  /stopfish      - Detener pesca')
    console.log('  /fishstatus    - Ver estado de pesca')
    console.log('  🎯 Detecta automáticamente cuando pica el pez')
    console.log('  🎣 Requiere caña de pescar en inventario')
    console.log('')
    console.log('💬 COMUNICACIÓN:')
    console.log('  /say <mensaje> - Enviar mensaje al chat')
    console.log('  <mensaje>      - Enviar mensaje directo al chat')
    console.log('')
    console.log('🔧 SISTEMA:')
    console.log('  /vision, /ver  - Ver estado completo del bot')
    console.log('  /verbose, /v   - Activar/desactivar modo detallado')
    console.log('  /chat          - Mostrar/ocultar chat del servidor')
    console.log('  /debug         - Activar/desactivar debug de mensajes')
    console.log('  /webview       - Activar visualizador web')
    console.log('  /noafk         - Activar/desactivar sistema anti-AFK')
    console.log('  /autoreset     - Activar/desactivar autoreset automático [15|30]')
    console.log('  /reactivar     - Reactivar bot después de muerte (sale del lobby)')
    console.log('  /proxies       - Ver estado de todos los proxies/VPNs')
    console.log('  /myproxy       - Ver proxy asignado a este bot')
    console.log('  /logout        - Cerrar el bot')
    console.log('  /help, /h      - Mostrar esta ayuda')
    console.log('')
    console.log('🌐 MULTI-VPN SUPPORT:')
    console.log('  Cada bot puede usar una VPN diferente automáticamente')
    console.log('  También se puede especificar proxy: node src/index.js --proxy=host:port')
    console.log('')
  }

  teleportToV0xxii() {
    this.bot.chat('/tpa v0xxii')
    console.log('✅ Solicitud de teleporte enviada a v0xxii')
  }

  resetBot() {
    // Prevenir spam de reset - mínimo 30 segundos entre resets
    const currentTime = Date.now()
    const minCooldown = 30000 // 30 segundos
    
    if (currentTime - botState.lastResetTime < minCooldown) {
      const remainingTime = Math.ceil((minCooldown - (currentTime - botState.lastResetTime)) / 1000)
      if (botState.verboseMode) {
        console.log(`⏱️ Esperando cooldown de reset (${remainingTime}s restantes)`)
      }
      return
    }
    
    botState.lastResetTime = currentTime
    console.log('🔄 Ejecutando reset: yendo al lobby...')
    this.bot.chat('/lobby')
    setTimeout(() => {
      console.log('🚪 Saliendo del spawn...')
      this.navigationSystem.goToSpawn()
    }, 3000)
  }

  showMiningOptions() {
    console.log('⛏️ SELECCIONA QUÉ MINAR:')
    console.log('1. piedra    - Piedra común y rocas')
    console.log('2. hierro    - Mineral de hierro')
    console.log('3. oro       - Mineral de oro')
    console.log('4. diamante  - Mineral de diamante')
    console.log('5. esmeralda - Mineral de esmeralda')
    console.log('6. carbon    - Mineral de carbón')
    console.log('7. cobre     - Mineral de cobre')
    console.log('8. redstone  - Mineral de redstone')
    console.log('9. lapislazuli - Mineral de lapis lazuli')
    console.log('0. todos     - Todos los minerales')
    console.log('\nEscribe el número o nombre del mineral:')
  }

  startAutoMiner() {
    console.log('🤖 Iniciando minero automático...')
    console.log('1. Enviando teleporte a v0xxii...')
    this.bot.chat('/tpa v0xxii')
    
    setTimeout(() => {
      console.log('2. Iniciando minería automática (todos los minerales)...')
      this.miningSystem.startMining('todos')
    }, 5000)
  }

  resetScan() {
    botState.resetScanPosition(this.bot.entity.position)
  }

  async dropItems() {
    console.log('📦 Tirando todos los items hacia v0xxii...')
    try {
      const items = this.bot.inventory.items()
      if (items.length === 0) {
        console.log('📦 No hay items que tirar')
        return
      }

      // Buscar a v0xxii en las entidades cercanas
      const v0xxii = Object.values(this.bot.entities).find(entity => 
        entity.username === 'v0xxii'
      )

      if (v0xxii) {
        // Mirar hacia v0xxii antes de tirar los items
        await this.bot.lookAt(v0xxii.position)
        console.log('👀 Mirando hacia v0xxii para lanzar items')
      }
      
      for (const item of items) {
        await this.bot.toss(item.type, null, item.count)
        console.log(`📦 Tirado: ${item.displayName || item.name} x${item.count}`)
      }
      console.log('✅ Todos los items tirados')
    } catch (error) {
      console.log(`❌ Error tirando items: ${error.message}`)
    }
  }

  scanArea() {
    console.log('🔍 ESCANEANDO ÁREA...')
    console.log(`📍 Posición actual: ${this.bot.entity.position}`)
    
    const blocksFound = {}
    let totalBlocks = 0
    
    for (let x = -8; x <= 8; x++) {
      for (let y = -4; y <= 4; y++) {
        for (let z = -8; z <= 8; z++) {
          const pos = this.bot.entity.position.offset(x, y, z)
          const block = this.bot.blockAt(pos)
          if (block && block.name !== 'air') {
            blocksFound[block.name] = (blocksFound[block.name] || 0) + 1
            totalBlocks++
          }
        }
      }
    }
    
    console.log(`📊 BLOQUES ENCONTRADOS (${totalBlocks} total):`)
    Object.entries(blocksFound)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .forEach(([name, count]) => {
        console.log(`  - ${name}: ${count}`)
      })
  }

  showInventory(sender = null) {
    const inventoryData = this.getInventoryData()
    
    if (sender) {
      // Enviar por mensaje privado
      inventoryData.forEach(line => {
        this.bot.chat(`/msg ${sender} ${line}`)
      })
    } else {
      // Mostrar en consola
      inventoryData.forEach(line => console.log(line))
    }
  }

  getInventoryData() {
    const lines = []
    lines.push('🎒 INVENTARIO DEL BOT:')
    lines.push('====================')
    
    const items = this.bot.inventory.items()
    if (items.length === 0) {
      lines.push('📦 Inventario vacío')
      return lines
    }
    
    const itemGroups = {}
    items.forEach(item => {
      const key = item.name
      if (!itemGroups[key]) {
        itemGroups[key] = {
          name: item.name,
          displayName: item.displayName,
          count: 0
        }
      }
      itemGroups[key].count += item.count
    })
    
    const sortedItems = Object.values(itemGroups)
      .sort((a, b) => b.count - a.count)
    
    let totalItems = 0
    
    // Mostrar solo los primeros 10 items para evitar spam en mensajes privados
    const itemsToShow = sortedItems.slice(0, 10)
    itemsToShow.forEach(item => {
      totalItems += item.count
      const displayName = item.displayName || item.name
      lines.push(`📦 ${displayName} x${item.count}`)
    })
    
    // Si hay más items, mostrar resumen
    const remainingItems = sortedItems.slice(10)
    if (remainingItems.length > 0) {
      let remainingCount = 0
      remainingItems.forEach(item => remainingCount += item.count)
      totalItems += remainingCount
      lines.push(`📦 ... y ${remainingItems.length} tipos más (${remainingCount} items)`)
    }
    
    lines.push('')
    lines.push(`📊 Total: ${totalItems} items en ${items.length} slots`)
    lines.push(`🎒 Slots usados: ${items.length}/36`)
    lines.push(`🍎 Hambre: ${this.bot.food}/20`)
    
    const equippedHand = this.bot.heldItem
    if (equippedHand) {
      lines.push(`🔧 En mano: ${equippedHand.displayName || equippedHand.name}`)
    }
    
    return lines
  }

  sayMessage(message) {
    if (message.trim()) {
      this.bot.chat(message)
      console.log(`✅ Enviado: ${message}`)
    }
  }

  toggleVerbose() {
    botState.verboseMode = !botState.verboseMode
    console.log(botState.verboseMode ? '🔊 Modo verboso ACTIVADO' : '🔇 Modo verboso DESACTIVADO')
  }

  toggleChat() {
    botState.showBotChat = !botState.showBotChat
    console.log(botState.showBotChat ? '💬 Chat del bot VISIBLE' : '🔇 Chat del bot OCULTO')
  }

  toggleDebug() {
    botState.debugMessages = !botState.debugMessages
    console.log(botState.debugMessages ? '🔍 Debug de mensajes ACTIVADO' : '🔍 Debug de mensajes DESACTIVADO')
  }

  toggleHungerMessages() {
    botState.showHungerMessages = !botState.showHungerMessages
    console.log(botState.showHungerMessages ? '🍎 Mensajes de hambre ACTIVADOS' : '🍎 Mensajes de hambre DESACTIVADOS')
  }

  showBotStatus() {
    console.log('👁️ ESTADO COMPLETO DEL BOT:')
    console.log('===========================')
    console.log(`📍 Posición: ${this.bot.entity.position}`)
    console.log(`❤️ Vida: ${this.bot.health}/20`)
    console.log(`🍖 Hambre: ${this.bot.food}/20`)
    console.log(`🎒 Items: ${this.bot.inventory.items().length}/36 slots`)
    console.log(`⛏️ Minería: ${this.miningSystem.miningActive ? 'ACTIVA (inteligente)' : 'INACTIVA'}`)
    console.log(`🌀 Minería obsidiana: ${this.miningSystem.obsidianMiningActive ? 'ACTIVA (End)' : 'INACTIVA'}`)
    console.log(`🌾 Agricultura: ${this.farmingSystem.farmingActive ? 'ACTIVA' : 'INACTIVA'}`)
    console.log(`🎣 Pesca: ${this.fishingSystem.fishingActive ? 'ACTIVA' : 'INACTIVA'}`)
    console.log(`🎮 Anti-AFK: ${botState.antiAFKActive ? 'ACTIVO' : 'INACTIVO'}`)
    console.log(`🔄 Autoreset: ${botState.autoResetActive ? `ACTIVO (${botState.autoResetIntervalMinutes}min)` : 'INACTIVO'}`)
    
    const nearbyEntities = Object.values(this.bot.entities).filter(entity => {
      if (entity === this.bot.entity) return false
      const distance = this.bot.entity.position.distanceTo(entity.position)
      return distance < 16
    })
    
    if (nearbyEntities.length > 0) {
      console.log(`👥 Entidades cercanas (${nearbyEntities.length}):`)
      nearbyEntities.slice(0, 5).forEach(entity => {
        const distance = Math.round(this.bot.entity.position.distanceTo(entity.position))
        const name = entity.username || entity.displayName || entity.name || entity.type
        const type = entity.type || 'unknown'
        console.log(`  - ${name} (${type}) - ${distance}m`)
      })
    }
  }

  showDetailedStatus() {
    console.log('📊 ESTADO DETALLADO DEL BOT:')
    console.log('=============================')
    
    // Información básica
    console.log(`🤖 Nombre: ${this.bot.username}`)
    console.log(`📍 Posición: Vec3 { x: ${this.bot.entity.position.x.toFixed(2)}, y: ${this.bot.entity.position.y.toFixed(2)}, z: ${this.bot.entity.position.z.toFixed(2)} }`)
    console.log(`❤️ Salud: ${this.bot.health}/20`)
    console.log(`🍖 Comida: ${this.bot.food}/20`)
    console.log(`💧 Oxígeno: ${this.bot.oxygenLevel}/20`)
    
    // Información de inventario
    const items = this.bot.inventory.items()
    console.log(`🎒 Inventario: ${items.length}/36 slots ocupados`)
    
    // Información de experiencia
    console.log(`✨ Experiencia: Nivel ${this.bot.experience.level} (${this.bot.experience.points} puntos)`)
    
    // Estado de sistemas
    console.log(`⛏️ Minería: ${this.miningSystem.miningActive ? 'ACTIVA' : 'INACTIVA'}`)
    console.log(`🌾 Agricultura: ${this.farmingSystem.farmingActive ? 'ACTIVA' : 'INACTIVA'}`)
    console.log(`🎣 Pesca: ${this.fishingSystem.fishingActive ? 'ACTIVA' : 'INACTIVA'}`)
    console.log(`🍎 Auto-alimentación: ${this.feedingSystem.autoFeedingEnabled ? 'ACTIVA' : 'INACTIVA'}`)
    
    // Configuración del bot
    console.log(`🔊 Modo verbose: ${botState.verboseMode ? 'ACTIVADO' : 'DESACTIVADO'}`)
    console.log(`💬 Chat visible: ${botState.showBotChat ? 'SÍ' : 'NO'}`)
    console.log(`🔍 Debug: ${botState.debugMessages ? 'ACTIVADO' : 'DESACTIVADO'}`)
    console.log(`🎮 Anti-AFK: ${botState.antiAFKActive ? 'ACTIVO' : 'INACTIVO'}`)
    console.log(`🔄 Autoreset: ${botState.autoResetActive ? `ACTIVO (${botState.autoResetIntervalMinutes}min)` : 'INACTIVO'}`)
    
    // Información del item en mano
    const heldItem = this.bot.heldItem
    if (heldItem) {
      console.log(`🔧 En mano: ${heldItem.displayName || heldItem.name} x${heldItem.count}`)
    } else {
      console.log(`🔧 En mano: Nada`)
    }
    
    // Efectos de pociones activos
    const effects = Object.keys(this.bot.entity.effects || {})
    if (effects.length > 0) {
      console.log(`🧪 Efectos activos: ${effects.join(', ')}`)
    } else {
      console.log(`🧪 Efectos activos: Ninguno`)
    }
  }

  startWebViewer() {
    if (botState.webViewerEnabled) {
      console.log('⚠️ Web viewer ya está activado')
      return
    }
    
    console.log('🌐 Activando web viewer...')
    try {
      const net = require('net')
      const server = net.createServer()
      
      server.listen(0, () => {
        const port = server.address().port
        server.close(() => {
          try {
            const { mineflayer: mineflayerViewer } = require('prismarine-viewer')
            mineflayerViewer(this.bot, { port: port, firstPerson: false })
            console.log(`🌐 Web viewer iniciado en: http://localhost:${port}`)
            botState.webViewerEnabled = true
          } catch (err) {
            console.log('❌ Error al iniciar web viewer:', err.message)
          }
        })
      })
      
      server.on('error', () => {
        console.log('❌ No se pudo iniciar web viewer')
      })
      
    } catch (error) {
      console.log('❌ Error al activar web viewer:', error.message)
    }
  }

  isMiningSelection(command) {
    const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9']
    const mineTypes = ['piedra', 'hierro', 'oro', 'diamante', 'esmeralda', 'carbon', 'cobre', 'redstone', 'lapislazuli', 'todos']
    
    return numbers.includes(command) || mineTypes.includes(command.toLowerCase())
  }

  handleMiningSelection(command) {
    const numberMap = {
      '1': 'piedra', '2': 'hierro', '3': 'oro', '4': 'diamante', '5': 'esmeralda',
      '6': 'carbon', '7': 'cobre', '8': 'redstone', '9': 'lapislazuli', '0': 'todos'
    }
    
    const mineType = numberMap[command] || command.toLowerCase()
    
    if (config.mining.blockSets[mineType]) {
      this.miningSystem.startMining(mineType)
    } else {
      console.log('❌ Tipo de mineral no válido')
    }
  }

  logout() {
    console.log('🚪 Cerrando bot...')
    process.exit(0)
  }

  toggleAntiAFK() {
    botState.antiAFKActive = !botState.antiAFKActive
    
    if (botState.antiAFKActive) {
      console.log('🎮 Sistema anti-AFK ACTIVADO')
      this.startAntiAFK()
    } else {
      console.log('😴 Sistema anti-AFK DESACTIVADO')
      this.stopAntiAFK()
    }
  }

  startAntiAFK() {
    if (botState.antiAFKInterval) {
      clearInterval(botState.antiAFKInterval)
    }

    // Acciones anti-AFK cada 30 segundos
    botState.antiAFKInterval = setInterval(() => {
      if (!botState.antiAFKActive) return

      try {
        // Solo ejecutar anti-AFK si no está farmeando, minando o pescando
        if (!this.farmingSystem.farmingActive && !this.miningSystem.miningActive && !this.fishingSystem.fishingActive) {
          // Solo saltar para evitar AFK sin moverse del sitio
          this.bot.setControlState('jump', true)
          setTimeout(() => {
            this.bot.setControlState('jump', false)
          }, 100)
        }

        if (botState.verboseMode) {
          console.log('🎮 Acción anti-AFK ejecutada')
        }
      } catch (error) {
        console.log(`⚠️ Error en anti-AFK: ${error.message}`)
      }
    }, 30000) // 30 segundos

    console.log('🎮 Sistema anti-AFK iniciado (acciones cada 30 segundos)')
  }

  stopAntiAFK() {
    if (botState.antiAFKInterval) {
      clearInterval(botState.antiAFKInterval)
      botState.antiAFKInterval = null
    }
    console.log('😴 Sistema anti-AFK detenido')
  }

  showOptimalOres(sender = null) {
    const oreInfo = [
      '📏 Y LEVELS ÓPTIMOS (Minecraft 1.21.4):',
      '========================================',
      '',
      '💎 OVERWORLD:',
      '  Diamante:    Y = -59  (Rango: -64 a 16)',
      '  Redstone:    Y = -59  (Rango: -64 a 16)', 
      '  Oro:         Y = -18  (Rango: -64 a 32)',
      '  Hierro:      Y = 14   (Rango: -64 a 72)',
      '  Lapis:       Y = -2   (Rango: -64 a 64)',
      '  Cobre:       Y = 43   (Rango: -16 a 112)',
      '  Carbón:      Y = 45   (Rango: 0 a 320)',
      '  Esmeralda:   Y = 85   (Rango: -16 a 320)',
      '',
      '🔥 NETHER:',
      '  Ancient Debris: Y = 16  (Rango: 1 a 119)',
      '  Oro Nether:     Y = 16  (Rango: 1 a 116)',
      '  Cuarzo:         Y = 16  (Rango: 1 a 127)',
      '',
      '💡 El bot usa estos Y levels automáticamente'
    ]

    if (sender) {
      // Enviar por mensaje privado
      oreInfo.forEach(line => {
        if (line.trim()) {
          this.bot.chat(`/msg ${sender} ${line}`)
        }
      })
    } else {
      // Mostrar en consola
      oreInfo.forEach(line => console.log(line))
    }
  }

  reactivateBot(sender = null) {
    if (botState.inLobby || botState.botDied) {
      botState.inLobby = false
      botState.botDied = false
      
      const message = '🔄 Bot reactivado, puede recibir comandos normalmente'
      if (sender) {
        this.bot.chat(`/msg ${sender} ${message}`)
      } else {
        console.log(message)
      }
      
      if (botState.deathPosition) {
        const coords = botState.deathPosition
        const coordsMessage = `📍 Última muerte en: X=${coords.x}, Y=${coords.y}, Z=${coords.z}`
        if (sender) {
          this.bot.chat(`/msg ${sender} ${coordsMessage}`)
        } else {
          console.log(coordsMessage)
        }
      }
    } else {
      const message = '⚠️ El bot no necesita ser reactivado'
      if (sender) {
        this.bot.chat(`/msg ${sender} ${message}`)
      } else {
        console.log(message)
      }
    }
  }

  showProxyStatus(sender = null) {
    console.log('\n🌐 ESTADO DE PROXIES:')
    console.log('====================')
    
    const proxyPool = proxyManager.proxyPool
    const statusLines = []
    
    proxyPool.forEach(proxy => {
      const status = proxy.active ? '🔴 OCUPADO' : '🟢 LIBRE'
      const botName = Array.from(proxyManager.assignedProxies.entries())
        .find(([_, p]) => p.id === proxy.id)?.[0] || 'Ninguno'
      
      const line = `${proxy.id}: ${status} | ${proxy.region} | Bot: ${botName}`
      statusLines.push(line)
      console.log(line)
    })
    
    const totalProxies = proxyPool.length
    const activeProxies = proxyPool.filter(p => p.active).length
    const summary = `📊 Total: ${totalProxies} | Activos: ${activeProxies} | Libres: ${totalProxies - activeProxies}`
    statusLines.push(summary)
    console.log(summary)
    
    if (sender) {
      statusLines.forEach(line => {
        this.bot.chat(`/msg ${sender} ${line}`)
      })
    }
  }

  showMyProxy(sender = null) {
    const username = this.bot.username
    const assignedProxy = proxyManager.getAssignedProxy(username)
    
    if (assignedProxy) {
      const proxyInfo = [
        `🌐 PROXY ASIGNADO A ${username}:`,
        `ID: ${assignedProxy.id}`,
        `🌍 Región: ${assignedProxy.region}`,
        `📍 Host: ${assignedProxy.host}:${assignedProxy.port}`,
        `🔒 Auth: ${assignedProxy.username ? 'Sí' : 'No'}`
      ]
      
      if (sender) {
        proxyInfo.forEach(line => {
          this.bot.chat(`/msg ${sender} ${line}`)
        })
      } else {
        proxyInfo.forEach(line => console.log(line))
      }
    } else {
      const message = `⚠️ ${username} no tiene proxy asignado (conexión directa)`
      if (sender) {
        this.bot.chat(`/msg ${sender} ${message}`)
      } else {
        console.log(message)
      }
    }
  }

  toggleAutoReset(sender = null, intervalArg = null) {
    // Cambiar intervalo si se proporciona
    if (intervalArg) {
      const interval = parseInt(intervalArg)
      if (interval === 15 || interval === 30) {
        botState.autoResetIntervalMinutes = interval
        console.log(`⏰ Intervalo de autoreset configurado a ${interval} minutos`)
      } else {
        console.log('⚠️ Intervalo inválido. Use 15 o 30 minutos')
        return
      }
    }

    botState.autoResetActive = !botState.autoResetActive

    if (botState.autoResetActive) {
      console.log(`🔄 Sistema autoreset ACTIVADO (cada ${botState.autoResetIntervalMinutes} minutos)`)
      this.startAutoReset()
    } else {
      console.log('⏹️ Sistema autoreset DESACTIVADO')
      this.stopAutoReset()
    }
  }

  startAutoReset() {
    if (botState.autoResetInterval) {
      clearInterval(botState.autoResetInterval)
    }

    const intervalMs = botState.autoResetIntervalMinutes * 60 * 1000

    // Usar setTimeout para el primer reset (esperar el tiempo completo)
    // y luego setInterval para los subsiguientes
    botState.autoResetInterval = setTimeout(() => {
      if (!botState.autoResetActive) return

      try {
        console.log('🔄 Ejecutando autoreset automático...')
        this.resetBot()
        
        if (botState.verboseMode) {
          console.log(`🔄 Próximo autoreset en ${botState.autoResetIntervalMinutes} minutos`)
        }
        
        // Después del primer reset, usar setInterval para los subsiguientes
        if (botState.autoResetActive) {
          botState.autoResetInterval = setInterval(() => {
            if (!botState.autoResetActive) return

            try {
              console.log('🔄 Ejecutando autoreset automático...')
              this.resetBot()
              
              if (botState.verboseMode) {
                console.log(`🔄 Próximo autoreset en ${botState.autoResetIntervalMinutes} minutos`)
              }
            } catch (error) {
              console.log(`⚠️ Error en autoreset: ${error.message}`)
            }
          }, intervalMs)
        }
        
      } catch (error) {
        console.log(`⚠️ Error en autoreset: ${error.message}`)
      }
    }, intervalMs)

    console.log(`🔄 Sistema autoreset iniciado - primer reset en ${botState.autoResetIntervalMinutes} minutos`)
  }

  stopAutoReset() {
    if (botState.autoResetInterval) {
      // clearTimeout y clearInterval son intercambiables en Node.js
      clearTimeout(botState.autoResetInterval)
      clearInterval(botState.autoResetInterval)
      botState.autoResetInterval = null
    }
    console.log('⏹️ Sistema autoreset detenido')
  }
}

module.exports = CommandProcessor