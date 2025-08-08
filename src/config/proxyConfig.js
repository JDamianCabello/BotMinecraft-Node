/**
 * Configuración de proxies/VPNs para múltiples instancias de bot
 */

class ProxyManager {
  constructor() {
    // Pool de proxies SOCKS5 - Cada bot usará uno diferente
    this.proxyPool = [
      {
        id: 'proxy1',
        host: '192.168.1.100',  // Cambia por tu proxy 1
        port: 1080,
        username: null,         // Opcional
        password: null,         // Opcional
        region: 'US-East',
        active: false
      },
      {
        id: 'proxy2', 
        host: '192.168.1.101',  // Cambia por tu proxy 2
        port: 1080,
        username: null,
        password: null,
        region: 'US-West',
        active: false
      },
      {
        id: 'proxy3',
        host: '192.168.1.102',  // Cambia por tu proxy 3
        port: 1080,
        username: null,
        password: null,
        region: 'US-Central',
        active: false
      },
      {
        id: 'proxy4',
        host: '192.168.1.103',  // Cambia por tu proxy 4
        port: 1080,
        username: null,
        password: null,
        region: 'Canada',
        active: false
      },
      {
        id: 'proxy5',
        host: '192.168.1.104',  // Cambia por tu proxy 5
        port: 1080,
        username: null,
        password: null,
        region: 'Mexico',
        active: false
      }
    ]
    
    this.assignedProxies = new Map() // botName -> proxyConfig
  }

  /**
   * Asigna un proxy disponible a un bot
   */
  assignProxy(botName) {
    // Verificar si ya tiene proxy asignado
    if (this.assignedProxies.has(botName)) {
      const existingProxy = this.assignedProxies.get(botName)
      console.log(`🌐 Bot ${botName} ya tiene proxy asignado: ${existingProxy.id} (${existingProxy.region})`)
      return existingProxy
    }

    // Buscar proxy libre
    const availableProxy = this.proxyPool.find(proxy => !proxy.active)
    
    if (!availableProxy) {
      console.log('⚠️ No hay proxies disponibles, usando conexión directa')
      return null
    }

    // Marcar como activo y asignar
    availableProxy.active = true
    this.assignedProxies.set(botName, availableProxy)
    
    console.log(`🌐 Proxy asignado a ${botName}: ${availableProxy.id} (${availableProxy.region})`)
    console.log(`📍 Conectando a través de: ${availableProxy.host}:${availableProxy.port}`)
    
    return availableProxy
  }

  /**
   * Libera el proxy de un bot
   */
  releaseProxy(botName) {
    if (this.assignedProxies.has(botName)) {
      const proxy = this.assignedProxies.get(botName)
      proxy.active = false
      this.assignedProxies.delete(botName)
      console.log(`🌐 Proxy liberado: ${proxy.id} para bot ${botName}`)
    }
  }

  /**
   * Obtiene el proxy asignado a un bot
   */
  getAssignedProxy(botName) {
    return this.assignedProxies.get(botName) || null
  }

  /**
   * Muestra el estado de todos los proxies
   */
  showProxyStatus() {
    console.log('\n🌐 ESTADO DE PROXIES:')
    console.log('====================')
    
    this.proxyPool.forEach(proxy => {
      const status = proxy.active ? '🔴 OCUPADO' : '🟢 LIBRE'
      const botName = Array.from(this.assignedProxies.entries())
        .find(([_, p]) => p.id === proxy.id)?.[0] || 'Ninguno'
      
      console.log(`${proxy.id}: ${status} | ${proxy.region} | Bot: ${botName}`)
    })
    
    console.log('')
  }

  /**
   * Configura un proxy específico desde argumentos de línea de comandos
   */
  static createFromArgs(proxyString) {
    if (!proxyString) return null
    
    try {
      // Formato esperado: host:port:username:password
      // O simplemente: host:port
      const parts = proxyString.split(':')
      
      if (parts.length < 2) {
        console.log('❌ Formato de proxy inválido. Use: host:port o host:port:username:password')
        return null
      }
      
      return {
        id: `custom-${Date.now()}`,
        host: parts[0],
        port: parseInt(parts[1]),
        username: parts[2] || null,
        password: parts[3] || null,
        region: 'Custom',
        active: true
      }
    } catch (error) {
      console.log(`❌ Error parseando proxy: ${error.message}`)
      return null
    }
  }

  /**
   * Añade un proxy personalizado al pool
   */
  addCustomProxy(proxyConfig) {
    this.proxyPool.push(proxyConfig)
    console.log(`🌐 Proxy personalizado añadido: ${proxyConfig.host}:${proxyConfig.port}`)
  }
}

// Instancia global del manager
const proxyManager = new ProxyManager()

module.exports = { ProxyManager, proxyManager }