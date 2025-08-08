/**
 * Cliente HTTP para comunicación con el backend Laravel
 */

const http = require('http')
const https = require('https')
const { URL } = require('url')

class HttpClient {
  constructor(baseUrl = 'http://onlinebots.test') {
    this.baseUrl = baseUrl
    this.botId = null
    this.lastUpdateTime = Date.now()
    this.updateInterval = null
  }

  setBotId(botId) {
    this.botId = botId
    console.log(`🔗 Bot ID configurado: ${botId}`)
  }

  async makeRequest(path, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl)
      const isHttps = url.protocol === 'https:'
      const httpModule = isHttps ? https : http
      
      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname + url.search,
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      }

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        const jsonData = JSON.stringify(data)
        options.headers['Content-Length'] = Buffer.byteLength(jsonData)
      }

      const req = httpModule.request(options, (res) => {
        let body = ''
        
        res.on('data', (chunk) => {
          body += chunk
        })
        
        res.on('end', () => {
          try {
            const result = body ? JSON.parse(body) : {}
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(result)
            } else {
              reject(new Error(`HTTP ${res.statusCode}: ${body}`))
            }
          } catch (error) {
            reject(new Error(`JSON Parse Error: ${error.message}`))
          }
        })
      })

      req.on('error', (error) => {
        reject(error)
      })

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        req.write(JSON.stringify(data))
      }

      req.setTimeout(5000, () => {
        req.destroy()
        reject(new Error('Request timeout'))
      })

      req.end()
    })
  }

  async updateBotStatus(bot, additionalData = {}) {
    if (!this.botId || !bot) {
      return
    }

    try {
      const statusData = {
        health: bot.health || 20,
        food: bot.food || 20,
        oxygen: bot.oxygenLevel || 20,
        position_x: bot.entity ? bot.entity.position.x : null,
        position_y: bot.entity ? bot.entity.position.y : null,
        position_z: bot.entity ? bot.entity.position.z : null,
        world: bot.game ? (bot.game.dimension || bot.game.levelType || 'overworld') : null,
        inventory: bot.inventory ? bot.inventory.items().map(item => ({
          name: item.name,
          count: item.count,
          displayName: item.displayName
        })).slice(0, 10) : [], // Limitar a 10 items para no sobrecargar
        last_ping: new Date().toISOString(),
        ...additionalData
      }

      await this.makeRequest(`/api/bots/${this.botId}/status`, 'PATCH', statusData)
    } catch (error) {
      // No mostrar errores HTTP constantemente para no spam
      if (Date.now() - this.lastUpdateTime > 60000) {
        console.log(`🔗 Error actualizando estado: ${error.message}`)
        this.lastUpdateTime = Date.now()
      }
    }
  }

  startPeriodicUpdates(bot, intervalMs = 30000) {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
    }

    console.log(`🔄 Iniciando actualizaciones periódicas cada ${intervalMs/1000}s`)
    
    this.updateInterval = setInterval(() => {
      this.updateBotStatus(bot)
    }, intervalMs)

    // Actualización inmediata
    this.updateBotStatus(bot)
  }

  stopPeriodicUpdates() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
      console.log('🔄 Actualizaciones periódicas detenidas')
    }
  }

  async sendError(error) {
    if (!this.botId) return

    try {
      await this.makeRequest(`/api/bots/${this.botId}/status`, 'PATCH', {
        last_error: error,
        status: 'error'
      })
    } catch (err) {
      // Silenciar errores de error reporting
    }
  }
}

module.exports = new HttpClient()