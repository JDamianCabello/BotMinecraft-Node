/**
 * Bot modular - Punto de entrada principal
 */

const { createBot } = require('./src/index')
const readline = require('readline')

// Exportar para uso como módulo
module.exports = { createBot }

// Si se ejecuta directamente, mostrar prompt
if (require.main === module) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  console.log('🤖 Configuración del Bot Modular')
  console.log('=================================')

  rl.question('Ingresa el nombre del bot: ', (botName) => {
    if (!botName.trim()) {
      console.log('❌ Nombre vacío, usando "Bot" por defecto')
      botName = 'Bot'
    }
    
    rl.close()
    createBot(botName.trim())
  })
}