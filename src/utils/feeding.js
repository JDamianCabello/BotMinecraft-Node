/**
 * Sistema de alimentación automática
 */

const config = require('../config/botConfig')
const botState = require('./botState')

class FeedingSystem {
  constructor(bot) {
    this.bot = bot
    this.feedingInterval = null
    this.lastNoFoodMessage = 0
    this.setupAutoFeeding()
  }

  async eatFood() {
    try {
      // Buscar comida en el inventario - incluyendo baked_potato específicamente
      const food = this.bot.inventory.items().find(item => {
        const itemName = item.name.toLowerCase()
        return item.foodPoints > 0 || 
               itemName.includes('potato') || 
               itemName.includes('bread') || 
               itemName.includes('apple') ||
               itemName.includes('carrot') ||
               itemName.includes('beef') ||
               itemName.includes('pork') ||
               itemName.includes('chicken') ||
               itemName.includes('fish') ||
               itemName.includes('cookie')
      })
      
      if (!food) {
        // Solo mostrar mensaje de no hay comida cada 5 minutos
        const now = Date.now()
        if (!this.lastNoFoodMessage || (now - this.lastNoFoodMessage) > 300000) { // 5 minutos = 300000ms
          if (botState.verboseMode || botState.showHungerMessages) {
            console.log('🍎 No hay comida en el inventario')
          }
          this.lastNoFoodMessage = now
        }
        return false
      }
      
      console.log(`🍽️ Comiendo: ${food.displayName || food.name}`)
      await this.bot.equip(food, 'hand')
      await this.bot.consume()
      console.log(`✅ Comida consumida - Hambre: ${this.bot.food}/20`)
      return true
    } catch (err) {
      console.log(`❌ Error comiendo: ${err.message}`)
      return false
    }
  }

  setupAutoFeeding() {
    this.feedingInterval = setInterval(() => {
      if (botState.autoEating && this.bot.food < config.feeding.hungerThreshold) {
        // Solo mostrar mensajes de hambre si está en verbose mode o show_hunger_messages está activo
        if (botState.verboseMode || botState.showHungerMessages) {
          console.log(`🍎 Hambre baja (${this.bot.food}/20) - buscando comida...`)
        }
        this.eatFood()
      }
    }, config.feeding.checkInterval)
  }

  toggleAutoFeeding() {
    botState.autoEating = !botState.autoEating
    console.log(botState.autoEating ? '🍎 Auto-alimentación ACTIVADA' : '🍎 Auto-alimentación DESACTIVADA')
    return botState.autoEating
  }

  stop() {
    if (this.feedingInterval) {
      clearInterval(this.feedingInterval)
      this.feedingInterval = null
    }
  }
}

module.exports = FeedingSystem