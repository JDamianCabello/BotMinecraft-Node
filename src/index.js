/**
 * Bot principal modular
 */

const mineflayer = require('mineflayer')
const readline = require('readline')

// Importar configuración
const config = require('./config/botConfig')
const { proxyManager } = require('./config/proxyConfig')

// Importar utilidades
const botState = require('./utils/botState')
const FeedingSystem = require('./utils/feeding')
const MiningSystem = require('./utils/mining')
const CollectionSystem = require('./utils/collection')
const NavigationSystem = require('./utils/navigation')
const FarmingSystem = require('./utils/farming')
const FishingSystem = require('./utils/fishing')

// Importar sistemas
const CommandProcessor = require('./commands/commandProcessor')
const EventHandlers = require('./handlers/eventHandlers')

class MinecraftBot {
  constructor(username) {
    this.username = username
    this.bot = null
    this.systems = {}
    this.eventHandlers = null
    this.commandProcessor = null
    this.commandRl = null
    this.isReady = false
    this.externalCommandServer = null
  }

  async initialize() {
    console.log(`🚀 Iniciando bot: ${this.username}`)
    console.log('🔗 Conectando a frogcraft.org...')

    // Crear bot con configuración de proxy si está habilitado
    const botOptions = {
      host: config.server.host,
      username: this.username,
      auth: config.auth.type,
      port: config.server.port,
      version: config.server.version
    }

    // Intentar asignar proxy automáticamente del pool
    let proxyConfig = null
    
    // Verificar si hay un proxy específico en argumentos de línea de comandos
    const proxyArg = process.argv.find(arg => arg.startsWith('--proxy='))
    if (proxyArg) {
      const proxyString = proxyArg.split('=')[1]
      proxyConfig = require('./config/proxyConfig').ProxyManager.createFromArgs(proxyString)
      if (proxyConfig) {
        console.log(`🌐 Usando proxy personalizado: ${proxyConfig.host}:${proxyConfig.port}`)
      }
    }
    // Si no hay proxy personalizado, usar el pool automático
    else if (config.proxy && config.proxy.enabled) {
      proxyConfig = proxyManager.assignProxy(this.username)
    }

    // Configurar proxy si está disponible
    if (proxyConfig) {
      botOptions.connect = (client) => {
        const SocksClient = require('socks').SocksClient
        
        const socksOptions = {
          proxy: {
            host: proxyConfig.host,
            port: proxyConfig.port,
            type: 5 // SOCKS5
          },
          command: 'connect',
          destination: {
            host: config.server.host,
            port: config.server.port
          }
        }

        // Agregar autenticación si está configurada
        if (proxyConfig.username && proxyConfig.password) {
          socksOptions.proxy.userId = proxyConfig.username
          socksOptions.proxy.password = proxyConfig.password
        }

        return SocksClient.createConnection(socksOptions)
          .then(info => {
            console.log(`✅ Conexión SOCKS5 establecida: ${proxyConfig.host}:${proxyConfig.port}`)
            return info.socket
          })
          .catch(error => {
            console.log(`❌ Error conectando proxy: ${error.message}`)
            // Marcar proxy como inactivo si falla
            if (!proxyArg) { // Solo si es del pool, no personalizado
              proxyManager.releaseProxy(this.username)
            }
            throw error
          })
      }
      
      console.log(`🌐 Conectando a través de proxy SOCKS5: ${proxyConfig.host}:${proxyConfig.port}`)
    } else if (config.proxy && config.proxy.enabled) {
      console.log('⚠️ No hay proxies disponibles, conectando directamente')
    }

    this.bot = mineflayer.createBot(botOptions)

    // Inicializar sistemas
    this.initializeSystems()

    // Los eventos se configuran completamente en EventHandlers
    // El callback onBotReady se ejecuta desde EventHandlers

    return this.bot
  }

  initializeSystems() {
    // Sistemas utilitarios
    this.systems.feeding = new FeedingSystem(this.bot)
    this.systems.mining = new MiningSystem(this.bot)
    this.systems.collection = new CollectionSystem(this.bot)
    this.systems.navigation = new NavigationSystem(this.bot)
    this.systems.farming = new FarmingSystem(this.bot)
    this.systems.fishing = new FishingSystem(this.bot)

    // Procesador de comandos
    this.commandProcessor = new CommandProcessor(
      this.bot,
      this.systems.mining,
      this.systems.feeding,
      this.systems.collection,
      this.systems.navigation,
      this.systems.farming,
      this.systems.fishing
    )

    // Manejadores de eventos
    this.eventHandlers = new EventHandlers(
      this.bot,
      this.commandProcessor,
      this.systems.navigation,
      this.onBotReady.bind(this)
    )
  }

  onBotReady() {
    console.log('📝 Bot listo para recibir comandos!')
    console.log('💡 Escribe /help para ver todos los comandos disponibles')
    
    // Marcar como listo para comandos externos
    this.isReady = true
    
    // Esperar un poco antes de configurar la interfaz de comandos
    setTimeout(() => {
      this.setupCommandInterface()
      this.setupExternalCommandInterface()
    }, 1000)
  }

  setupCommandInterface() {
    // Solo crear la interfaz si no existe ya
    if (!this.commandRl) {
      this.commandRl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })
      
      this.commandRl.on('line', (input) => {
        const command = input.trim()
        this.commandProcessor.processCommand(command)
      })
    }
  }

  setupExternalCommandInterface() {
    // Configurar listener para comandos externos via stdin
    process.stdin.on('data', (data) => {
      const input = data.toString().trim()
      
      // Verificar si es un comando externo (formato: EXTERNAL_COMMAND:comando)
      if (input.startsWith('EXTERNAL_COMMAND:')) {
        const command = input.replace('EXTERNAL_COMMAND:', '').trim()
        console.log(`🎯 Comando externo recibido: ${command}`)
        
        if (this.isReady) {
          this.commandProcessor.processCommand(command)
        } else {
          console.log('⚠️ Bot no está listo aún, comando ignorado')
        }
      }
      // Verificar estado del bot
      else if (input.startsWith('CHECK_READY')) {
        console.log(`BOT_READY_STATUS:${this.isReady}`)
      }
    })
    
    console.log('📡 Interfaz de comandos externos configurada')
  }

  stop() {
    this.isReady = false
    
    if (this.systems.feeding) {
      this.systems.feeding.stop()
    }
    if (this.systems.mining) {
      this.systems.mining.stopMining()
    }
    if (this.systems.farming) {
      this.systems.farming.stopFarming()
    }
    if (this.commandRl) {
      this.commandRl.close()
    }
    
    // Liberar proxy asignado
    proxyManager.releaseProxy(this.username)
    
    if (this.bot) {
      this.bot.end()
    }
  }
}

// Función para inicializar el bot
function createBot(username) {
  const botInstance = new MinecraftBot(username)
  return botInstance.initialize()
}

// Si se ejecuta directamente
if (require.main === module) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  console.log('🤖 Configuración del Bot (desde src/index)')
  console.log('==========================================')

  rl.question('Ingresa el nombre del bot: ', (botName) => {
    if (!botName.trim()) {
      console.log('❌ Nombre vacío, usando "Bot" por defecto')
      botName = 'Bot'
    }
    
    rl.close()
    createBot(botName.trim())
  })
}

module.exports = { MinecraftBot, createBot }