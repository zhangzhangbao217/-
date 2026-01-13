// @ts-ignore
import AV from 'leancloud-storage'

export interface GameState {
  gameId: string;
  level: number;
  score: number;
  lastUpdated: string;
  extraData: any;
}

/**
 * 游戏存档服务
 */
export const GameSaveService = {
  /**
   * 保存游戏进度
   */
  async saveProgress(gameId: string, level: number, score: number = 0, extraData: any = {}) {
    try {
      const currentUser = AV.User.current()
      if (!currentUser) return

      let progress = null
      try {
        const query = new AV.Query('GameProgress')
        query.equalTo('user', currentUser)
        query.equalTo('gameId', gameId)
        progress = await query.first()
      } catch (e: any) {
        // 如果表不存在 (101)，继续执行创建逻辑
        if (e.code !== 101) throw e
      }

      if (!progress) {
        const GameProgress = AV.Object.extend('GameProgress')
        progress = new GameProgress()
        progress.set('user', currentUser)
        progress.set('gameId', gameId)
      }

      progress.set('level', level)
      progress.set('score', score)
      progress.set('extraData', extraData)
      
      await progress.save()
      console.log(`[GameSaveService] ${gameId} 存档成功: Level ${level}`)
    } catch (error) {
      console.error('[GameSaveService] 存档失败:', error)
      // 存档失败不应中断游戏逻辑，仅记录错误
    }
  },

  /**
   * 获取游戏进度
   */
  async getProgress(gameId: string): Promise<GameState | null> {
    try {
      const currentUser = AV.User.current()
      if (!currentUser) return null

      const query = new AV.Query('GameProgress')
      query.equalTo('user', currentUser)
      query.equalTo('gameId', gameId)
      const progress = await query.first()

      if (!progress) return null

      return {
        gameId: progress.get('gameId'),
        level: progress.get('level'),
        score: progress.get('score'),
        lastUpdated: progress.get('updatedAt'),
        extraData: progress.get('extraData')
      }
    } catch (error: any) {
      // 如果是表不存在 (101)，说明还没人玩过，正常返回 null
      if (error.code === 101) {
        return null
      }
      console.error('[GameSaveService] 读取存档失败:', error)
      return null
    }
  },

  /**
   * 重置进度
   */
  async resetProgress(gameId: string) {
    return this.saveProgress(gameId, 1, 0, {})
  }
}
