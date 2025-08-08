/**
 * Manejadores de eventos del bot
 */

const config = require('../config/botConfig')
const botState = require('../utils/botState')
const httpClient = require('../utils/httpClient')

class EventHandlers {
  constructor(bot, commandProcessor, navigationSystem, onBotReadyCallback) {
    this.bot = bot
    this.commandProcessor = commandProcessor
    this.navigationSystem = navigationSystem
    this.onBotReadyCallback = onBotReadyCallback
    this.setupEventHandlers()
  }

  setupEventHandlers() {
    // Eventos de conexión
    this.bot.on('login', this.onLogin.bind(this))
    this.bot.on('spawn', this.onSpawn.bind(this))
    this.bot.on('end', this.onEnd.bind(this))
    this.bot.on('error', this.onError.bind(this))
    this.bot.on('kicked', this.onKicked.bind(this))

    // Eventos de chat y mensajes
    this.bot.on('chat', this.onChat.bind(this))
    this.bot.on('message', this.onMessage.bind(this))

    // Eventos de items
    this.bot.on('itemDrop', this.onItemDrop.bind(this))
    
    // Eventos de muerte
    this.bot.on('death', this.onDeath.bind(this))
  }

  onLogin() {
    console.log('✅ Bot conectado exitosamente!')
    console.log(`Logueado como: ${this.bot.username}`)
    
    // Cargar plugins
    const { pathfinder } = require('mineflayer-pathfinder')
    const collectBlock = require('mineflayer-collectblock').plugin
    
    this.bot.loadPlugin(pathfinder)
    this.bot.loadPlugin(collectBlock)
    
    // Esperar un poco y verificar si necesita entrar al juego
    setTimeout(() => {
      if (!this.bot.entity || !this.bot.entity.position) {
        console.log('🎮 Intentando entrar al mundo...')
        // Intentar varios métodos comunes para entrar al servidor
        this.bot.chat('/lobby')
        setTimeout(() => this.bot.chat('/hub'), 500)
        setTimeout(() => this.bot.chat('/spawn'), 1000)
        setTimeout(() => this.bot.chat(''), 1500)
      }
    }, 3000)
  }

  onSpawn() {
    console.log('🌍 Bot apareció en el mundo')
    console.log(`Posición: ${this.bot.entity.position}`)
    
    // Detectar si está en spawn y buscar ZNPC automáticamente
    this.navigationSystem.checkSpawnAndExit()
    
    // Configurar bot ID desde argumentos de línea de comandos si está disponible
    const botIdArg = process.argv.find(arg => arg.startsWith('--bot-id='))
    if (botIdArg) {
      const botId = botIdArg.split('=')[1]
      httpClient.setBotId(botId)
      
      // Iniciar actualizaciones periódicas
      httpClient.startPeriodicUpdates(this.bot)
      
      // Actualizar estado inicial
      httpClient.updateBotStatus(this.bot, {
        status: 'running',
        world: this.bot.game ? (this.bot.game.dimension || this.bot.game.levelType || 'overworld') : 'overworld'
      })
    }
    
    // Llamar al callback de bot listo
    if (this.onBotReadyCallback) {
      this.onBotReadyCallback()
    }
  }

  onEnd() {
    console.log('🔌 Conexión terminada')
    if (botState.miningActive) {
      console.log('⛏️ Minería detenida por desconexión')
      botState.reset()
    }
    
    // Detener actualizaciones HTTP
    httpClient.stopPeriodicUpdates()
    httpClient.updateBotStatus(this.bot, { status: 'stopped' })
  }

  onError(err) {
    const errorMessage = err.code || err.message
    
    if (err.code === 'ECONNRESET') {
      console.log('🔌 Conexión perdida (ECONNRESET) - el servidor cerró la conexión')
      console.log('💡 Esto puede ocurrir por:')
      console.log('   - Lag del servidor')
      console.log('   - Demasiados movimientos rápidos')
      console.log('   - Timeout de conexión')
      console.log('   - Reinicia el bot si es necesario')
    } else {
      console.log('🚨 Error:', errorMessage)
    }
    
    // Reportar error al backend
    httpClient.sendError(errorMessage)
  }

  onKicked(reason) {
    console.log('❌ Bot expulsado:', reason)
  }

  onChat(username, message) {
    if (botState.showBotChat || botState.verboseMode) {
      console.log(`💬 <${username}> ${message}`)
    }
    
    // Procesar comandos desde v0xxii
    if (config.security.allowedCommanders.includes(username)) {
      console.log(`🎮 Comando de ${username}: ${message}`)
      this.commandProcessor.processCommand(message.trim())
    }
  }

  onMessage(jsonMsg) {
    const message = jsonMsg.toString()
    
    // Mostrar TODOS los mensajes si el chat está activado
    if (botState.showBotChat || botState.verboseMode) {
      console.log(`📨 ${message}`)
    }
    
    // Debug de mensajes si está activado
    if (botState.debugMessages) {
      console.log(`🔍 DEBUG MESSAGE: "${message}"`)
    }
    
    // Detectar mensajes privados y procesarlos como comandos
    if (this.isPrivateMessage(message)) {
      const privateMessageData = this.parsePrivateMessage(message)
      if (privateMessageData) {
        const { sender, content } = privateMessageData
        
        // Procesar comandos desde usuarios autorizados por mensaje privado
        if (config.security.allowedCommanders.includes(sender)) {
          console.log(`🔒 Comando privado de ${sender}: ${content}`)
          
          // Si hay un comando pendiente del mismo usuario, completarlo con este parámetro
          if (botState.pendingCommand && botState.pendingCommandUser === sender) {
            const fullCommand = `${botState.pendingCommand} ${content.trim()}`
            console.log(`🔗 Completando comando pendiente: ${fullCommand}`)
            botState.pendingCommand = null
            botState.pendingCommandUser = null
            this.commandProcessor.processCommand(fullCommand)
          } else {
            // Procesar comando normalmente
            this.commandProcessor.processCommand(content.trim(), sender)
          }
        }
      }
    }
    
    // Auto-registro cuando el servidor pide registrarse
    if (message.includes('Registrate en el servidor escribiendo: /register')) {
      console.log('🔐 Registrando automáticamente...')
      this.bot.chat(`/register ${config.auth.password} ${config.auth.password}`)
    }
    
    // Auto-login cuando el servidor pide hacer login
    if (message.includes('Inicia sesión escribiendo: /login')) {
      console.log('🔑 Iniciando sesión automáticamente...')
      this.bot.chat(`/login ${config.auth.password}`)
    }
    
    // Auto-aceptar teleporte de v0xxii
    if (this.isV0xxiiTeleportRequest(message)) {
      console.log('📞 v0xxii solicita teleporte - aceptando automáticamente...')
      console.log(`🔍 Mensaje detectado: "${message}"`)
      this.bot.chat('/tpaccept')
      setTimeout(() => {
        this.bot.chat('/tpaccept v0xxii')
      }, 500)
      console.log('✅ Teleporte de v0xxii aceptado')
    }
    
    // Después del registro exitoso, ir al bloque específico
    if (this.isSuccessfulRegistration(message)) {
      if (!botState.hasExecutedTask) {
        botState.hasExecutedTask = true
        console.log('✅ Registro exitoso, ejecutando tarea...')
        setTimeout(() => {
          this.navigationSystem.goToSpawn()
        }, 2000)
      }
    }
  }

  onItemDrop(entity) {
    if (botState.miningActive && entity.position.distanceTo(this.bot.entity.position) < 4) {
      if (botState.verboseMode) {
        console.log(`📦 Recogiendo item: ${entity.metadata[7]?.itemId || 'desconocido'}`)
      }
    }
  }

  onDeath() {
    const deathPos = this.bot.entity.position
    botState.botDied = true
    botState.deathPosition = {
      x: Math.floor(deathPos.x),
      y: Math.floor(deathPos.y), 
      z: Math.floor(deathPos.z)
    }
    
    console.log('💀 EL BOT HA MUERTO!')
    console.log(`📍 Coordenadas de muerte: X=${botState.deathPosition.x}, Y=${botState.deathPosition.y}, Z=${botState.deathPosition.z}`)
    console.log('🚪 El bot se quedará quieto en el lobby hasta recibir órdenes')
    
    // Detener todas las actividades
    botState.reset()
    botState.inLobby = true // Marcar que está en lobby después de morir
  }

  isV0xxiiTeleportRequest(message) {
    // Verificar si el mensaje es de teleporte de algún usuario autorizado
    const allowedUsers = config.security.allowedCommanders
    
    for (const user of allowedUsers) {
      if (message.includes(`El jugador ${user} quiere aparecer contigo`)) {
        return true
      }
    }
    
    return false
  }

  isSuccessfulRegistration(message) {
    return message.includes('Te has registrado exitosamente') || 
           message.includes('Successfully registered') || 
           message.includes('registrado')
  }

  isPrivateMessage(message) {
    // Verificar si el mensaje es de algún usuario autorizado en el formato [usuario ► Yo]
    const allowedUsers = config.security.allowedCommanders
    for (const user of allowedUsers) {
      if (new RegExp(`\\[${user} ► .+?\\]`).test(message)) {
        return true
      }
    }
    return false
  }

  parsePrivateMessage(message) {
    // Extraer el comando del formato [usuario ► Yo] comando
    const allowedUsers = config.security.allowedCommanders
    for (const user of allowedUsers) {
      const match = message.match(new RegExp(`\\[${user} ► .+?\\] (.+)`))
      if (match) {
        return {
          sender: user,
          content: match[1].trim()
        }
      }
    }
    
    return null
  }
}

module.exports = EventHandlers