/**
 * Sistema de navegación
 */

const config = require('../config/botConfig')
const botState = require('./botState')
const { pathfinder, Movements, goals } = require('mineflayer-pathfinder')

class NavigationSystem {
  constructor(bot) {
    this.bot = bot
  }

  async goToSpawn() {
    const coords = config.spawn.coordinates
    return this.goToAndClick(coords.x, coords.y, coords.z)
  }

  async goToAndClick(x, y, z) {
    try {
      if (botState.verboseMode) {
        console.log(`🎯 Yendo a coordenadas: ${x}, ${y}, ${z}`)
      }
      
      const mcData = require('minecraft-data')(this.bot.version)
      const defaultMove = new Movements(this.bot, mcData)
      defaultMove.allowParkour = true
      defaultMove.allowSprinting = true
      this.bot.pathfinder.setMovements(defaultMove)
      
      const goalNear = new goals.GoalNear(x, y, z, 2)
      await this.bot.pathfinder.goto(goalNear)
      
      if (botState.verboseMode) {
        console.log(`✅ Llegué cerca de las coordenadas: ${x}, ${y}, ${z}`)
      }
      
      const Vec3 = require('vec3')
      const targetPos = new Vec3(x, y, z)
      
      const nearbyEntities = Object.values(this.bot.entities).filter(entity => {
        if (entity === this.bot.entity) return false
        if (entity.type !== 'player') return false
        const distance = entity.position.distanceTo(targetPos)
        return distance < 3
      })
      
      if (nearbyEntities.length > 0) {
        const closestEntity = nearbyEntities.reduce((closest, entity) => {
          const distToCurrent = entity.position.distanceTo(targetPos)
          const distToClosest = closest.position.distanceTo(targetPos)
          return distToCurrent < distToClosest ? entity : closest
        })
        
        const entityType = closestEntity.type || 'unknown'
        const entityName = closestEntity.username || closestEntity.displayName || entityType
        
        console.log(`🤖 Player encontrado: ${entityName} en las coordenadas`)
        
        await this.bot.lookAt(closestEntity.position.offset(0, closestEntity.height / 2, 0))
        await this.bot.activateEntity(closestEntity)
        console.log(`✅ Click realizado en ${entityName}`)
        
        await new Promise(resolve => setTimeout(resolve, 1000))
        
      } else {
        console.log(`❌ No se encontró player cerca de ${x}, ${y}, ${z}`)
        
        const allEntities = Object.values(this.bot.entities).filter(entity => {
          if (entity === this.bot.entity) return false
          const distance = entity.position.distanceTo(targetPos)
          return distance < 5
        })
        
        if (allEntities.length > 0) {
          console.log(`🔍 Entidades cercanas encontradas:`)
          allEntities.forEach(entity => {
            const distance = Math.round(entity.position.distanceTo(targetPos) * 10) / 10
            const name = entity.username || entity.displayName || 'unnamed'
            console.log(`  - ${name} (${entity.type}) a ${distance}m`)
          })
        }
        
        const block = this.bot.blockAt(targetPos)
        if (block && (block.name === 'beacon' || block.name !== 'air')) {
          console.log(`🔄 Click de respaldo en ${block.name}`)
          await this.bot.lookAt(targetPos.offset(0.5, 0.5, 0.5))
          await this.bot.activateBlock(block)
          console.log(`✅ Click de respaldo realizado`)
        }
      }
      
    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
      
      try {
        console.log(`🔄 Buscando cualquier player cercano...`)
        const nearbyEntities = Object.values(this.bot.entities).filter(entity => {
          if (entity === this.bot.entity) return false
          if (entity.type !== 'player') return false
          const distance = this.bot.entity.position.distanceTo(entity.position)
          return distance < 5
        })
        
        if (nearbyEntities.length > 0) {
          const entity = nearbyEntities[0]
          const entityName = entity.username || entity.displayName || entity.type || 'unknown'
          console.log(`🤖 Intentando click en ${entityName}`)
          await this.bot.lookAt(entity.position.offset(0, entity.height / 2, 0))
          await this.bot.activateEntity(entity)
          console.log(`✅ Click alternativo en ${entityName}`)
        }
      } catch (altError) {
        console.log(`❌ Error alternativo: ${altError.message}`)
      }
    }
  }

  async checkSpawnAndExit() {
    setTimeout(() => {
      // Si el bot está en lobby después de morir, no hacer nada
      if (botState.inLobby) {
        console.log('🚪 El bot está en lobby después de morir, permaneciendo quieto...')
        return
      }
      
      const pos = this.bot.entity.position
      // Comprobar si está en las coordenadas del spawn (aproximadamente)
      if (Math.abs(pos.x - (-1.57)) < 2 && Math.abs(pos.y - 15) < 2 && Math.abs(pos.z - (-2.46)) < 2) {
        console.log('🚪 Detectado spawn, buscando [ZNPC] 450766...')
        this.findAndClickZNPC()
      }
    }, 3000)
  }

  async findAndClickZNPC() {
    try {
      console.log('🔍 Buscando [ZNPC] 450766 en el spawn...')
      
      // Buscar el ZNPC específico
      const znpcEntity = Object.values(this.bot.entities).find(entity => {
        if (entity === this.bot.entity) return false
        const entityName = entity.username || entity.displayName || ''
        return entityName.includes('[ZNPC]') && entityName.includes('450766')
      })
      
      if (znpcEntity) {
        const entityName = znpcEntity.username || znpcEntity.displayName || 'ZNPC'
        console.log(`🤖 Player encontrado: ${entityName} en las coordenadas`)
        
        // Ir hacia el ZNPC
        await this.bot.lookAt(znpcEntity.position.offset(0, znpcEntity.height / 2, 0))
        
        // Hacer click derecho en el ZNPC
        await this.bot.activateEntity(znpcEntity)
        console.log(`✅ Click derecho realizado en ${entityName}`)
        
        return true
      } else {
        console.log('❌ [ZNPC] 450766 no encontrado, buscando cualquier ZNPC...')
        
        // Buscar cualquier ZNPC como respaldo
        const anyZNPC = Object.values(this.bot.entities).find(entity => {
          if (entity === this.bot.entity) return false
          const entityName = entity.username || entity.displayName || ''
          return entityName.includes('[ZNPC]')
        })
        
        if (anyZNPC) {
          const entityName = anyZNPC.username || anyZNPC.displayName || 'ZNPC'
          console.log(`🤖 ZNPC alternativo encontrado: ${entityName}`)
          
          await this.bot.lookAt(anyZNPC.position.offset(0, anyZNPC.height / 2, 0))
          await this.bot.activateEntity(anyZNPC)
          console.log(`✅ Click derecho realizado en ${entityName}`)
          
          return true
        } else {
          console.log('❌ No se encontró ningún ZNPC en el spawn')
          // Como último recurso, usar el comportamiento original
          this.goToSpawn()
          return false
        }
      }
      
    } catch (error) {
      console.log(`❌ Error buscando ZNPC: ${error.message}`)
      // Fallback al comportamiento original
      this.goToSpawn()
      return false
    }
  }
}

module.exports = NavigationSystem