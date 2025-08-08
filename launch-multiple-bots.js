/**
 * Script para lanzar múltiples bots con VPNs diferentes automáticamente
 */

const { spawn } = require('child_process')
const path = require('path')
const { proxyManager } = require('./src/config/proxyConfig')

// Configuración de bots a lanzar
const botsConfig = [
  { name: 'Bot1', proxy: 'auto' },       // Asignación automática del pool
  { name: 'Bot2', proxy: 'auto' },       // Asignación automática del pool  
  { name: 'Bot3', proxy: 'auto' },       // Asignación automática del pool
  { name: 'Bot4', proxy: 'auto' },       // Asignación automática del pool
  { name: 'Bot5', proxy: 'auto' },       // Asignación automática del pool
  // { name: 'BotCustom', proxy: '192.168.1.200:1080' }, // Proxy específico
]

function launchBot(botName, proxyConfig) {
  console.log(`🚀 Lanzando ${botName}...`)
  
  const args = ['src/index.js']
  
  // Agregar proxy específico si no es 'auto'
  if (proxyConfig !== 'auto') {
    args.push(`--proxy=${proxyConfig}`)
  }
  
  const botProcess = spawn('node', args, {
    stdio: 'pipe',
    cwd: __dirname
  })
  
  // Configurar entrada automática del nombre del bot
  setTimeout(() => {
    botProcess.stdin.write(`${botName}\n`)
  }, 1000)
  
  // Manejar salida del bot
  botProcess.stdout.on('data', (data) => {
    const lines = data.toString().split('\n')
    lines.forEach(line => {
      if (line.trim()) {
        console.log(`[${botName}] ${line}`)
      }
    })
  })
  
  botProcess.stderr.on('data', (data) => {
    console.error(`[${botName}] ERROR: ${data}`)
  })
  
  botProcess.on('close', (code) => {
    console.log(`[${botName}] ❌ Proceso terminado con código ${code}`)
  })
  
  return botProcess
}

function launchAllBots() {
  console.log('🌐 SISTEMA MULTI-VPN BOT LAUNCHER')
  console.log('=================================')
  console.log(`📊 Configurados para lanzar: ${botsConfig.length} bots`)
  
  // Mostrar estado inicial de proxies
  proxyManager.showProxyStatus()
  
  const processes = []
  
  botsConfig.forEach((config, index) => {
    // Delay escalonado para evitar sobrecarga
    setTimeout(() => {
      const process = launchBot(config.name, config.proxy)
      processes.push(process)
    }, index * 3000) // 3 segundos entre cada bot
  })
  
  // Manejar cierre de todos los procesos
  process.on('SIGINT', () => {
    console.log('\n🛑 Cerrando todos los bots...')
    processes.forEach(proc => {
      proc.kill('SIGTERM')
    })
    process.exit(0)
  })
  
  console.log('\n💡 INSTRUCCIONES:')
  console.log('- Cada bot usará una VPN diferente automáticamente')
  console.log('- Presiona Ctrl+C para cerrar todos los bots')
  console.log('- Los logs aparecerán con prefijo [BotName]')
  console.log('- Edita proxyConfig.js para configurar tus servidores VPN/proxy')
  console.log('')
}

// Verificar si se ejecuta directamente
if (require.main === module) {
  launchAllBots()
}

module.exports = { launchBot, launchAllBots }