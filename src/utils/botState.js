/**
 * Estado global del bot
 */

class BotState {
  constructor() {
    this.hasExecutedTask = false
    this.verboseMode = false
    this.webViewerEnabled = false
    this.miningActive = false
    this.miningInterval = null
    this.currentMiningType = 'ninguno'
    this.miningStats = {}
    this.lastStatsReport = Date.now()
    this.lastDangerCheck = 0
    this.showBotChat = false
    this.debugMessages = false 
    this.autoEating = true
    this.showHungerMessages = false
    
    // Variables para sistema anti-AFK
    this.antiAFKActive = false
    this.antiAFKInterval = null
    
    // Variables para sistema de autoreset
    this.autoResetActive = false
    this.autoResetInterval = null
    this.autoResetIntervalMinutes = 15
    
    // Variables para sistema de pesca
    this.fishingActive = false
    
    // Variables para minería de obsidiana
    this.obsidianMiningActive = false
    
    // Variables para control de estado
    this.botDied = false
    this.deathPosition = null
    this.inLobby = false
    
    // Variables para minería lineal sistemática
    this.scanPosition = { x: 0, z: 0 }
    this.scanDirection = 1 // 1 = positivo, -1 = negativo
    this.scanRadius = 16
    this.currentScanX = 0
    
    // Variables para comandos pendientes
    this.pendingCommand = null
    this.pendingCommandUser = null
  }

  reset() {
    this.miningActive = false
    this.miningInterval = null
    this.currentMiningType = 'ninguno'
    this.miningStats = {}
    this.lastStatsReport = Date.now()
    
    // Limpiar anti-AFK al resetear
    if (this.antiAFKInterval) {
      clearInterval(this.antiAFKInterval)
      this.antiAFKInterval = null
    }
    this.antiAFKActive = false
    
    // Limpiar autoreset al resetear
    if (this.autoResetInterval) {
      clearInterval(this.autoResetInterval)
      this.autoResetInterval = null
    }
    this.autoResetActive = false
    
    // Limpiar pesca al resetear
    this.fishingActive = false
    
    // Limpiar minería de obsidiana al resetear
    this.obsidianMiningActive = false
    
    // Limpiar estado de muerte al resetear
    this.botDied = false
    this.deathPosition = null
    this.inLobby = false
  }

  setMiningActive(active, type = 'ninguno') {
    this.miningActive = active
    this.currentMiningType = type
    if (active) {
      this.miningStats = {}
      this.lastStatsReport = Date.now()
    }
  }

  updateMiningStats(blockName) {
    this.miningStats[blockName] = (this.miningStats[blockName] || 0) + 1
  }

  initializeScanPosition(botPosition) {
    this.scanPosition = { 
      x: Math.floor(botPosition.x), 
      z: Math.floor(botPosition.z) 
    }
    this.currentScanX = this.scanPosition.x - this.scanRadius
    this.scanDirection = 1
  }

  resetScanPosition(botPosition) {
    this.initializeScanPosition(botPosition)
    console.log(`📡 Área de escaneo reseteada`)
    console.log(`📍 Nueva posición central: X=${this.scanPosition.x}, Z=${this.scanPosition.z}`)
    console.log(`🔍 Reiniciando desde X=${this.currentScanX}`)
  }
}

module.exports = new BotState()