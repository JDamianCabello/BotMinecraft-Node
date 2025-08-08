/**
 * Configuración del bot
 */

module.exports = {
  // Configuración del servidor
  server: {
    host: 'frogcraft.org',
    port: 25565,
    version: '1.20.1'
  },

  // Configuración de autenticación
  auth: {
    type: 'offline', // Para servidores no premium/cracked
    password: 'myAwesomePass1234'
  },

  // Configuración de proxy/VPN - Usa el pool automáticamente
  proxy: {
    enabled: false,  // Pool de proxies automático desactivado
    host: null,     // No usado - se usa el pool en proxyConfig.js
    port: null,     // No usado - se usa el pool en proxyConfig.js
    username: null, // No usado - se usa el pool en proxyConfig.js
    password: null  // No usado - se usa el pool en proxyConfig.js
  },

  // Configuración de minería
  mining: {
    scanRadius: 16,
    idealYLevels: {
      piedra: 0,        // Cualquier capa
      hierro: 15,       // Y=15 para hierro
      oro: -16,         // Y=-16 para oro  
      diamante: -59,    // Y=-59 para diamante
      esmeralda: 236,   // Y=236 para esmeralda (montañas)
      carbon: 95,       // Y=95 para carbón
      cobre: 48,        // Y=48 para cobre
      redstone: -59,    // Y=-59 para redstone
      lapislazuli: -1,  // Y=-1 para lapis
      todos: -16        // Capa intermedia para todos
    },
    blockSets: {
      piedra: ['deepslate', 'cobbled_deepslate', 'stone', 'cobblestone', 'andesite', 'granite', 'diorite', 'blackstone'],
      hierro: ['iron_ore', 'deepslate_iron_ore'],
      oro: ['gold_ore', 'deepslate_gold_ore', 'nether_gold_ore'],
      diamante: ['diamond_ore', 'deepslate_diamond_ore'],
      esmeralda: ['emerald_ore', 'deepslate_emerald_ore'],
      carbon: ['coal_ore', 'deepslate_coal_ore'],
      cobre: ['copper_ore', 'deepslate_copper_ore'],
      redstone: ['redstone_ore', 'deepslate_redstone_ore'],
      lapislazuli: ['lapis_ore', 'deepslate_lapis_ore'],
      todos: ['iron_ore', 'deepslate_iron_ore', 'gold_ore', 'deepslate_gold_ore', 'diamond_ore', 'deepslate_diamond_ore', 'emerald_ore', 'deepslate_emerald_ore', 'coal_ore', 'deepslate_coal_ore', 'copper_ore', 'deepslate_copper_ore', 'redstone_ore', 'deepslate_redstone_ore', 'lapis_ore', 'deepslate_lapis_ore', 'stone', 'deepslate', 'blackstone']
    },
    orePriorities: {
      // Minerales más valiosos (prioridad alta)
      'diamond_ore': 100,
      'deepslate_diamond_ore': 100,
      'emerald_ore': 95,
      'deepslate_emerald_ore': 95,
      'ancient_debris': 90,
      
      // Minerales valiosos (prioridad media-alta)
      'gold_ore': 70,
      'deepslate_gold_ore': 70,
      'nether_gold_ore': 65,
      
      // Minerales útiles (prioridad media)
      'iron_ore': 50,
      'deepslate_iron_ore': 50,
      'redstone_ore': 45,
      'deepslate_redstone_ore': 45,
      'lapis_ore': 40,
      'deepslate_lapis_ore': 40,
      
      // Minerales comunes (prioridad baja)
      'coal_ore': 30,
      'deepslate_coal_ore': 30,
      'copper_ore': 25,
      'deepslate_copper_ore': 25,
      
      // Piedra común (prioridad muy baja)
      'stone': 10,
      'deepslate': 10,
      'cobblestone': 5,
      'cobbled_deepslate': 5,
      'blackstone': 8,
      'andesite': 3,
      'granite': 3,
      'diorite': 3
    },
    miningInterval: 2500 // milisegundos
  },

  // Configuración de spawn
  spawn: {
    coordinates: { x: -2, y: 12, z: 39 }
  },

  // Configuración de alimentación
  feeding: {
    autoEating: true,
    hungerThreshold: 16,
    checkInterval: 5000 // milisegundos
  },

  // Configuración de seguridad
  security: {
    dangerCheckCooldown: 5000, // milisegundos
    allowedCommanders: ['v0xxii'] // personas que pueden mandarle comandos al bot
  },

  // Configuración de web viewer
  webViewer: {
    defaultPort: 3007,
    enabled: false
  }
}