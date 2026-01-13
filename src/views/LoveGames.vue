<template>
  <div class="games-container">
    <div class="header-section">
      <h2 class="title">💞 恋爱游戏大厅</h2>
      <p class="subtitle">属于两个人的默契挑战</p>
    </div>

    <!-- 游戏列表 -->
    <div class="games-grid">
      <div v-for="game in games" :key="game.id" class="game-card" @click="enterGame(game)">
        <div class="game-icon">{{ game.icon }}</div>
        <div class="game-info">
          <h3>{{ game.name }}</h3>
          <p>{{ game.desc }}</p>
          <div class="game-tags">
            <span class="tag" :class="game.type">{{ game.typeName }}</span>
            <span class="tag duo">双人必玩</span>
          </div>
        </div>
        <div class="play-btn">
          <el-icon><CaretRight /></el-icon>
        </div>
      </div>
    </div>

    <!-- 游戏弹窗 (后续具体游戏内容) -->
    <el-dialog
      v-model="gameVisible"
      fullscreen
      destroy-on-close
      :show-close="false"
      class="game-dialog"
    >
      <div class="game-content-wrapper">
        <template v-if="currentGame?.id === 'escape'">
          <SweetEscape @back="gameVisible = false" />
        </template>
        <template v-else-if="currentGame?.id === 'speed'">
          <SpeedKing @back="gameVisible = false" />
        </template>
        <template v-else-if="currentGame?.id === 'telepathy'">
          <Telepathy @back="gameVisible = false" />
        </template>
        <template v-else-if="currentGame?.id === 'cards'">
          <LoveCards @back="gameVisible = false" />
        </template>
        <template v-else-if="currentGame?.id === 'snake'">
          <JointSnake @back="gameVisible = false" />
        </template>
        <template v-else-if="currentGame?.id === 'jigsaw'">
          <LovePuzzle @back="gameVisible = false" />
        </template>
        <template v-else-if="currentGame?.id === 'ludo'">
          <LoveLudo @back="gameVisible = false" />
        </template>
        <template v-else-if="currentGame?.id === 'rhythm'">
          <LoveRhythm @back="gameVisible = false" />
        </template>
        <template v-else-if="currentGame?.id === 'sketch'">
          <LoveSketch @back="gameVisible = false" />
        </template>
      </div>
    </el-dialog>

    <!-- 全局心形过场动画 -->
    <transition name="heart-burst">
      <div v-if="isTransitioning" class="heart-transition-overlay">
        <div class="heart-shape">❤️</div>
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CaretRight } from '@element-plus/icons-vue'
import SweetEscape from '../components/games/SweetEscape.vue'
import SpeedKing from '../components/games/SpeedKing.vue'
import Telepathy from '../components/games/Telepathy.vue'
import LoveCards from '../components/games/LoveCards.vue'
import JointSnake from '../components/games/JointSnake.vue'
import LovePuzzle from '../components/games/LovePuzzle.vue'
import LoveLudo from '../components/games/LoveLudo.vue'
import LoveRhythm from '../components/games/LoveRhythm.vue'
import LoveSketch from '../components/games/LoveSketch.vue'

const gameVisible = ref(false)
const currentGame = ref<any>(null)
const isTransitioning = ref(false)

const games = [
  { id: 'snake', name: '同心蛇', desc: '两个人控制一条蛇，考验极致的默契与配合。', icon: '🐍', type: 'coop', typeName: '双人协作' },
  { id: 'escape', name: '甜蜜大逃亡', desc: '双人协作闯关，避开障碍，寻找属于你们的出口。', icon: '🏃‍♂️', type: 'coop', typeName: '双人协作' },
  { id: 'cards', name: '心动卡牌', desc: '翻开属于你们的记忆，发现那些隐藏的心动瞬间。', icon: '🃏', type: 'emotion', typeName: '情感互动' },
  { id: 'rhythm', name: '爱之律动', desc: '跟随音乐的节拍，共同奏响属于你们的恋爱乐章。', icon: '🎵', type: 'music', typeName: '节奏配合' },
  { id: 'speed', name: '极速心跳', desc: '心跳加速的对战，看谁能更精准地把握时机。', icon: '⚡', type: 'pvp', typeName: '竞技对战' },
  { id: 'telepathy', name: '心灵感应', desc: '不用言语，看看你们的灵魂是否真的契合。', icon: '🔮', type: 'social', typeName: '默契挑战' },
  { id: 'jigsaw', name: '爱之拼图', desc: '一点一滴，拼凑出你们最美好的画面。', icon: '🧩', type: 'puzzle', typeName: '休闲益智' },
  { id: 'ludo', name: '甜蜜飞行棋', desc: '经典的玩法，不一样的甜蜜任务等待挑战。', icon: '🎲', type: 'board', typeName: '桌游互动' },
  { id: 'sketch', name: '心心相印', desc: '我画你猜，看看你是否真的懂我的奇思妙想。', icon: '🎨', type: 'social', typeName: '创意表达' }
]

const enterGame = (game: any) => {
  isTransitioning.value = true
  setTimeout(() => {
    currentGame.value = game
    gameVisible.value = true
    setTimeout(() => {
      isTransitioning.value = false
    }, 600)
  }, 400)
}
</script>

<style scoped>
/* ... (现有样式保持不变) ... */

/* 游戏弹窗样式优化 */
:deep(.game-dialog) {
  background: #fff5f7;
}

:deep(.game-dialog .el-dialog__header) {
  display: none;
}

:deep(.game-dialog .el-dialog__body) {
  padding: 0;
  height: 100vh;
  overflow: hidden;
}

/* 心形过场动画样式 */
.heart-transition-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
}

.heart-shape {
  font-size: 10px;
  transform: scale(0);
  color: #ff4d79;
}

.heart-burst-enter-active, .heart-burst-leave-active {
  transition: all 0.8s cubic-bezier(0.1, 0.7, 1.0, 0.1);
}

.heart-burst-enter-from {
  opacity: 0;
}

.heart-burst-enter-to .heart-shape {
  animation: heart-expand 0.8s forwards;
}

.heart-burst-leave-from {
  opacity: 1;
}

.heart-burst-leave-to {
  opacity: 0;
}

@keyframes heart-expand {
  0% { transform: scale(0); opacity: 1; }
  50% { transform: scale(200); opacity: 1; }
  100% { transform: scale(400); opacity: 0; }
}

/* 现有样式继续 */
.games-container {
  padding: 20px;
  /* ... */
}

/* 增加背景动态装饰 */
.games-container::before {
  content: '❤️';
  position: absolute;
  top: 5%;
  left: 5%;
  font-size: 40px;
  opacity: 0.1;
  animation: float 6s infinite ease-in-out;
}

.games-container::after {
  content: '💖';
  position: absolute;
  bottom: 10%;
  right: 5%;
  font-size: 50px;
  opacity: 0.1;
  animation: float 8s infinite ease-in-out reverse;
}

@keyframes float {
  0%, 100% { transform: translateY(0) rotate(0); }
  50% { transform: translateY(-20px) rotate(10deg); }
}

.header-section {
  text-align: center;
  margin-bottom: 40px;
  position: relative;
  z-index: 1;
}

.title {
  color: #ff4d79;
  font-size: 36px;
  margin-bottom: 10px;
  text-shadow: 0 2px 4px rgba(255, 77, 121, 0.1);
  letter-spacing: 2px;
}

.subtitle {
  color: #ff85a2;
  font-size: 18px;
  font-weight: 300;
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 25px;
  position: relative;
  z-index: 1;
}

.game-card {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 24px;
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 15px;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  box-shadow: 0 10px 30px rgba(255, 77, 121, 0.05);
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.game-card:hover {
  transform: translateY(-12px) scale(1.02);
  box-shadow: 0 20px 40px rgba(255, 77, 121, 0.15);
  border-color: rgba(255, 77, 121, 0.3);
  background: rgba(255, 255, 255, 0.95);
}

.game-card::after {
  content: '';
  position: absolute;
  top: -20px;
  right: -20px;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, transparent 50%, rgba(255, 77, 121, 0.08) 50%);
  border-radius: 50%;
}

.game-icon {
  font-size: 44px;
  background: linear-gradient(135deg, #fff0f3 0%, #ffe3e8 100%);
  width: 90px;
  height: 90px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  box-shadow: inset 0 2px 4px rgba(255, 77, 121, 0.1);
  transition: transform 0.3s ease;
}

.game-card:hover .game-icon {
  transform: scale(1.1) rotate(5deg);
}

.game-info h3 {
  margin: 0;
  color: #333;
  font-size: 18px;
  font-weight: 600;
}

.game-info p {
  margin: 10px 0;
  color: #888;
  font-size: 13px;
  line-height: 1.6;
  height: 40px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.game-tags {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.tag {
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
}

.tag.coop { background: #e6f7ff; color: #1890ff; }
.tag.pvp { background: #fff2e8; color: #fa541c; }
.tag.puzzle { background: #f6ffed; color: #52c41a; }
.tag.board { background: #f9f0ff; color: #722ed1; }
.tag.music { background: #feffe6; color: #ad8b00; }
.tag.social { background: #e6fffb; color: #13c2c2; }
.tag.emotion { background: #fff0f6; color: #eb2f96; }
.tag.duo { background: #fff1f0; color: #f5222d; }

.play-btn {
  display: none; /* 在九宫格布局中隐藏按钮，靠卡片点击 */
}

/* 游戏弹窗样式修复 */
:deep(.game-dialog) {
  display: flex;
  flex-direction: column;
}

:deep(.game-dialog .el-dialog__body) {
  flex: 1;
  padding: 0 !important;
  overflow: hidden;
  background: #000;
}

.game-content-wrapper {
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
}

.game-placeholder {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #ff4d79;
  background: #fff5f7;
  border-radius: 20px;
  padding: 40px;
  text-align: center;
}

.placeholder-icon {
  font-size: 80px;
  margin-bottom: 20px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

.game-placeholder h3 {
  font-size: 28px;
  margin-bottom: 20px;
  font-weight: bold;
}

.game-placeholder p {
  font-size: 18px;
  line-height: 1.8;
  color: #ff85a2;
}

/* 响应式适配 */
@media (max-width: 1024px) {
  .games-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .games-grid {
    grid-template-columns: 1fr;
  }
  
  .game-card {
    padding: 20px;
    flex-direction: row;
    text-align: left;
  }

  .game-icon {
    width: 60px;
    height: 60px;
    font-size: 32px;
    flex-shrink: 0;
  }

  .game-info p {
    height: auto;
    -webkit-line-clamp: 3;
  }

  .game-tags {
    justify-content: flex-start;
  }

  .title {
    font-size: 24px;
  }
}
</style>
