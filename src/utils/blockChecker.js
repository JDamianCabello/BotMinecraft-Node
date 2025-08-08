/**
 * Verificador de tipos de bloques
 */

class BlockChecker {
  constructor(bot) {
    this.bot = bot
  }

  async isDirt(pos, mcData) {
    const block = this.bot.blockAt(pos)

    if (!block) {
      return false
    }

    // Check if the block is dirt or grass block
    const blockType = block.type
    const dirtBlockId = mcData.blocksByName.dirt.id
    const grassBlockId = mcData.blocksByName.grass_block.id

    return blockType === dirtBlockId || blockType === grassBlockId
  }

  async isFarmland(pos, mcData) {
    const block = this.bot.blockAt(pos)

    if (!block) {
      return false
    }

    // Check if the block is farmland
    const farmlandBlockId = mcData.blocksByName.farmland.id
    return block.type === farmlandBlockId
  }

  async isWheat(pos, mcData) {
    const block = this.bot.blockAt(pos)

    if (!block) {
      return false
    }

    // Check if the block is wheat
    const wheatBlockId = mcData.blocksByName.wheat.id
    return block.type === wheatBlockId
  }

  async isWheatMature(pos, mcData) {
    const block = this.bot.blockAt(pos)

    if (!block) {
      return false
    }

    // Check if the block is mature wheat (metadata 7)
    const wheatBlockId = mcData.blocksByName.wheat.id
    return block.type === wheatBlockId && block.metadata === 7
  }

  async canPlant(pos, mcData) {
    const farmlandBlock = this.bot.blockAt(pos)
    const aboveBlock = this.bot.blockAt(pos.offset(0, 1, 0))

    if (!farmlandBlock || !aboveBlock) {
      return false
    }

    const farmlandBlockId = mcData.blocksByName.farmland.id
    const airBlockId = mcData.blocksByName.air.id

    return farmlandBlock.type === farmlandBlockId && aboveBlock.type === airBlockId
  }
}

module.exports = BlockChecker