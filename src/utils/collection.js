/**
 * Sistema de recolección de bloques
 */

class CollectionSystem {
  constructor(bot) {
    this.bot = bot
  }

  async collectBlock(blockName) {
    if (!blockName) {
      console.log('❌ Especifica qué bloque recolectar')
      console.log('💡 Ejemplo: /collect stone')
      return
    }
    
    console.log(`🔍 Buscando ${blockName} para recolectar...`)
    
    const blockType = this.bot.registry.blocksByName[blockName]
    if (!blockType) {
      console.log(`❌ No conozco ningún bloque llamado "${blockName}"`)
      console.log('💡 Intenta con nombres como: stone, iron_ore, diamond_ore, etc.')
      return
    }
    
    const block = this.bot.findBlock({
      matching: blockType.id,
      maxDistance: 32
    })
    
    if (!block) {
      console.log(`❌ No veo ningún ${blockName} cercano`)
      return
    }
    
    console.log(`✅ Encontrado ${blockName} - recolectando...`)
    
    this.bot.collectBlock.collect(block, (err) => {
      if (err) {
        console.log(`❌ Error recolectando: ${err.message}`)
      } else {
        console.log(`✅ ${blockName} recolectado exitosamente`)
      }
    })
  }

  async collectMultipleBlocks(blockName, maxCount) {
    if (!blockName) {
      console.log('❌ Especifica qué bloque recolectar')
      console.log('💡 Ejemplo: /collectall stone 10')
      return
    }
    
    console.log(`🔍 Recolectando hasta ${maxCount} bloques de ${blockName}...`)
    
    const blockType = this.bot.registry.blocksByName[blockName]
    if (!blockType) {
      console.log(`❌ No conozco ningún bloque llamado "${blockName}"`)
      return
    }
    
    let collected = 0
    const collectNext = () => {
      if (collected >= maxCount) {
        console.log(`✅ Recolección completada: ${collected}/${maxCount} ${blockName}`)
        return
      }
      
      const block = this.bot.findBlock({
        matching: blockType.id,
        maxDistance: 32
      })
      
      if (!block) {
        console.log(`✅ No hay más ${blockName} cercanos - recolectados: ${collected}`)
        return
      }
      
      this.bot.collectBlock.collect(block, (err) => {
        if (err) {
          console.log(`❌ Error: ${err.message}`)
        } else {
          collected++
          console.log(`✅ ${blockName} ${collected}/${maxCount} recolectado`)
          setTimeout(collectNext, 1000)
        }
      })
    }
    
    collectNext()
  }
}

module.exports = CollectionSystem