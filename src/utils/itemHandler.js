/**
 * Manejador de items e inventario
 */

class ItemHandler {
  constructor(bot) {
    this.bot = bot
  }

  async equipItem(name) {
    const item = this.bot.inventory.items().find((item) => item.name === name)
    if (!item) {
      return false
    }

    if (this.isItemEquipped(item)) {
      return true
    }

    try {
      await this.bot.equip(item, 'hand')
      return true
    } catch (error) {
      console.log(`❌ Error equipando ${name}: ${error.message}`)
      return false
    }
  }

  async equipHoe() {
    const hoes = this.bot.inventory
      .items()
      .find((item) => item.name.includes('hoe'))
    
    if (!hoes) {
      console.log('❌ No se encontró azada')
      return false
    }
    
    if (this.isItemEquipped(hoes)) {
      return true
    }
    
    try {
      await this.bot.equip(hoes, 'hand')
      return true
    } catch (error) {
      console.log(`❌ Error equipando azada: ${error.message}`)
      return false
    }
  }

  hasItemByName(name) {
    return this.bot.inventory.items().some(item => item.name === name)
  }

  getItemCount(name) {
    const items = this.bot.inventory.items().filter(item => item.name === name)
    return items.reduce((total, item) => total + item.count, 0)
  }

  isItemEquipped(item) {
    const handItem = this.bot.inventory.slots[this.bot.getEquipmentDestSlot('hand')]
    return handItem && handItem.name === item.name
  }

  async unequip() {
    try {
      await this.bot.unequip('hand')
      return true
    } catch (error) {
      console.log(`❌ Error desequipando: ${error.message}`)
      return false
    }
  }
}

module.exports = ItemHandler