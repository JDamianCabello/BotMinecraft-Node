/**
 * Bot modular - Punto de entrada principal
 */

const { createBot } = require('./src/index')
const readline = require('readline')
const fs = require('fs')
const path = require('path')

// Archivo para guardar nombres de bots
const BOT_NAMES_FILE = path.join(__dirname, 'bot-names.json')

// Funciones para manejo de nombres de bots
function loadBotNames() {
  try {
    if (fs.existsSync(BOT_NAMES_FILE)) {
      const data = fs.readFileSync(BOT_NAMES_FILE, 'utf8')
      return JSON.parse(data)
    }
  } catch (error) {
    console.log('⚠️ Error leyendo nombres guardados, usando lista vacía')
  }
  return []
}

function saveBotName(botName) {
  try {
    const names = loadBotNames()
    if (!names.includes(botName)) {
      names.push(botName)
      fs.writeFileSync(BOT_NAMES_FILE, JSON.stringify(names, null, 2))
      console.log(`💾 Nombre "${botName}" guardado`)
    }
  } catch (error) {
    console.log('⚠️ Error guardando nombre del bot')
  }
}

async function showBotNamesMenu(rl) {
  const names = loadBotNames()
  
  if (names.length === 0) {
    console.log('\n📝 No hay nombres guardados')
    rl.question('Ingresa el nombre del nuevo bot: ', async (botName) => {
      if (!botName.trim()) {
        console.log('❌ Nombre vacío, usando "Bot" por defecto')
        botName = 'Bot'
      }
      
      saveBotName(botName.trim())
      rl.close()
      await createBot(botName.trim())
    })
    return
  }

  console.log('\n📋 Nombres de bots guardados:')
  names.forEach((name, index) => {
    console.log(`  ${index + 1}. ${name}`)
  })
  console.log(`  ${names.length + 1}. Crear nuevo nombre`)
  
  rl.question(`\nSelecciona un número (1-${names.length + 1}): `, async (choice) => {
    const index = parseInt(choice) - 1
    
    if (index >= 0 && index < names.length) {
      // Usar nombre existente
      const selectedName = names[index]
      console.log(`🎯 Usando bot existente: ${selectedName}`)
      rl.close()
      await createBot(selectedName)
    } else if (index === names.length) {
      // Crear nuevo nombre
      rl.question('Ingresa el nombre del nuevo bot: ', async (botName) => {
        if (!botName.trim()) {
          console.log('❌ Nombre vacío, usando "Bot" por defecto')
          botName = 'Bot'
        }
        
        saveBotName(botName.trim())
        rl.close()
        await createBot(botName.trim())
      })
    } else {
      console.log('❌ Selección inválida, usando primer nombre disponible')
      rl.close()
      await createBot(names[0])
    }
  })
}

// Exportar para uso como módulo
module.exports = { createBot }

// Si se ejecuta directamente
if (require.main === module) {
  (async () => {
    // Obtener nombre del bot desde argumentos de línea de comandos
    const botNameArg = process.argv[2]
    
    if (botNameArg && botNameArg.trim()) {
      // Nombre proporcionado como argumento
      console.log('🤖 Bot Modular - Iniciando con nombre desde parámetro')
      console.log('====================================================')
      console.log(`🎯 Nombre del bot: ${botNameArg.trim()}`)
      saveBotName(botNameArg.trim())
      await createBot(botNameArg.trim())
    } else {
      // No se proporcionó nombre, mostrar menú de nombres guardados
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      })

      console.log('🤖 Configuración del Bot Modular')
      console.log('=================================')
      
      await showBotNamesMenu(rl)
    }
  })()
}