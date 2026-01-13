<template>
  <div class="love-ludo-game">
    <div v-if="!gameStarted" class="game-menu glass-effect">
      <el-button class="menu-back-btn" link @click="$emit('back')">
        <el-icon><ArrowLeft /></el-icon>
        返回大厅
      </el-button>
      <div class="menu-content">
        <div class="game-icon">🎲❤️</div>
        <h2 class="title">爱意飞行棋</h2>
        <p class="desc">
          <span>每一步都是一个甜蜜任务</span><br/>
          <span>谁先到达终点，就可以获得对方的一个“终极诺言”</span>
        </p>
        
        <div class="player-select">
          <div class="player-info p1">
            <div class="token red">👦</div>
            <p>玩家 1</p>
          </div>
          <div class="vs">VS</div>
          <div class="player-info p2">
            <div class="token blue">👧</div>
            <p>玩家 2</p>
          </div>
        </div>

        <el-button class="start-btn" type="primary" size="large" round @click="startGame">
          开始对战
        </el-button>
      </div>
    </div>

    <div v-else class="game-play">
      <div class="game-header">
        <el-button class="back-btn" link @click="$emit('back')">
          <el-icon><ArrowLeft /></el-icon>
          返回游戏主页
        </el-button>
        <div class="turn-indicator" :class="currentPlayer === 1 ? 'p1-turn' : 'p2-turn'">
          {{ currentPlayer === 1 ? '👦 玩家 1 的回合' : '👧 玩家 2 的回合' }}
        </div>
        <div class="score-board">
          <span>P1: {{ p1Pos }}</span>
          <span>P2: {{ p2Pos }}</span>
        </div>
      </div>

      <div class="ludo-container">
        <div class="board-wrapper">
          <div class="ludo-board">
            <div 
              v-for="(cell, index) in boardCells" 
              :key="index"
              class="board-cell"
              :class="[cell.type, { 'has-p1': p1Pos === index, 'has-p2': p2Pos === index }]"
            >
              <div class="cell-icon">{{ cell.icon }}</div>
              <div v-if="p1Pos === index" class="token p1-token">👦</div>
              <div v-if="p2Pos === index" class="token p2-token">👧</div>
              <div class="cell-num">{{ index }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="game-controls">
        <div class="dice-area" @click="rollDice" :class="{ rolling: isRolling }">
          <div class="dice" :class="'face-' + diceValue">
            <div v-for="n in diceValue" :key="n" class="dot"></div>
          </div>
          <p class="roll-hint">{{ isRolling ? '摇晃中...' : '点击投掷' }}</p>
        </div>
      </div>

      <!-- 任务弹窗 -->
      <transition name="fade">
        <div v-if="showTask" class="task-overlay glass-effect">
          <div class="task-card" :class="currentPlayer === 1 ? 'p1-card' : 'p2-card'">
            <div class="task-icon">{{ currentTask?.icon }}</div>
            <h3>甜蜜任务</h3>
            <p class="task-text">{{ currentTask?.text }}</p>
            <el-button type="primary" round @click="completeTask">完成任务</el-button>
          </div>
        </div>
      </transition>

      <!-- 胜利弹窗 -->
      <transition name="scale">
        <div v-if="winner" class="win-overlay glass-effect">
          <div class="win-card">
            <div class="win-icon">👑</div>
            <h3>恭喜 {{ winner === 1 ? '玩家 1' : '玩家 2' }} 获胜！</h3>
            <p>赢家可以向对方索要一个甜蜜奖励哦~</p>
            <el-button type="primary" round @click="startGame">再玩一局</el-button>
            <el-button round @click="gameStarted = false">返回大厅</el-button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['back'])
const gameStarted = ref(false)
const currentPlayer = ref(1)
const p1Pos = ref(0)
const p2Pos = ref(0)
const diceValue = ref(1)
const isRolling = ref(false)
const showTask = ref(false)
const winner = ref<number | null>(null)
const currentTask = ref<{ text: string, icon: string } | null>(null)

const boardCells = [
  { type: 'start', icon: '🏠', text: '起点' },
  { type: 'normal', icon: '❤️', text: '说出一件你最喜欢对方的事' },
  { type: 'task', icon: '🎁', text: '给对方一个惊喜之吻' },
  { type: 'normal', icon: '✨', text: '分享一个你们的甜蜜瞬间' },
  { type: 'fast', icon: '🚀', text: '前进 2 格' },
  { type: 'task', icon: '📸', text: '和对方拍一张鬼脸合照' },
  { type: 'normal', icon: '🌹', text: '深情注视对方 10 秒' },
  { type: 'slow', icon: '🐢', text: '后退 1 格' },
  { type: 'task', icon: '🎶', text: '给对方唱一句情歌' },
  { type: 'normal', icon: '💖', text: '夸奖对方的三个优点' },
  { type: 'task', icon: '💆', text: '给对方捏捏肩膀' },
  { type: 'fast', icon: '⚡', text: '再掷一次' },
  { type: 'normal', icon: '🌈', text: '说出一个你对未来的期待' },
  { type: 'task', icon: '🍦', text: '下次见面请对方吃甜品' },
  { type: 'normal', icon: '💌', text: '大声说出“我爱你”' },
  { type: 'goal', icon: '🏆', text: '终极甜蜜奖励！' }
]

const startGame = () => {
  gameStarted.value = true
  p1Pos.value = 0
  p2Pos.value = 0
  currentPlayer.value = 1
  winner.value = null
  showTask.value = false
}

const rollDice = async () => {
  if (isRolling.value || showTask.value || winner.value) return
  
  isRolling.value = true
  
  // 模拟摇骰子动画
  for (let i = 0; i < 10; i++) {
    diceValue.value = Math.floor(Math.random() * 6) + 1
    await new Promise(r => setTimeout(r, 100))
  }
  
  isRolling.value = false
  movePlayer(diceValue.value)
}

const movePlayer = (steps: number) => {
  const currentPos = currentPlayer.value === 1 ? p1Pos : p2Pos
  let newPos = currentPos.value + steps
  
  if (newPos >= boardCells.length - 1) {
    newPos = boardCells.length - 1
    currentPos.value = newPos
    winner.value = currentPlayer.value
    return
  }
  
  currentPos.value = newPos
  
  // 检查格子效果
  const cell = boardCells[newPos]
  if (cell.type === 'fast' && cell.text === '前进 2 格') {
    setTimeout(() => {
      ElMessage.success('幸运！前进 2 格')
      currentPos.value = Math.min(boardCells.length - 1, currentPos.value + 2)
      triggerTask()
    }, 500)
  } else if (cell.type === 'slow') {
    setTimeout(() => {
      ElMessage.warning('哎呀！后退 1 格')
      currentPos.value = Math.max(0, currentPos.value - 1)
      triggerTask()
    }, 500)
  } else if (cell.type === 'fast' && cell.text === '再掷一次') {
    ElMessage.success('手气不错！额外投掷一次')
    // 保持当前玩家
  } else {
    triggerTask()
  }
}

const triggerTask = () => {
  const pos = currentPlayer.value === 1 ? p1Pos.value : p2Pos.value
  const cell = boardCells[pos]
  if (cell.type !== 'start' && cell.type !== 'goal') {
    currentTask.value = { text: cell.text, icon: cell.icon }
    showTask.value = true
  } else {
    switchPlayer()
  }
}

const completeTask = () => {
  showTask.value = false
  const cell = boardCells[currentPlayer.value === 1 ? p1Pos.value : p2Pos.value]
  if (cell.text !== '再掷一次') {
    switchPlayer()
  }
}

const switchPlayer = () => {
  currentPlayer.value = currentPlayer.value === 1 ? 2 : 1
}
</script>

<style scoped>
.love-ludo-game {
  height: 100vh;
  background: #fff5f7;
  color: #2c3e50;
  font-family: "PingFang SC", sans-serif;
  overflow: hidden;
  position: relative;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.game-menu {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 500px;
  padding: 40px;
  border-radius: 40px;
  text-align: center;
  z-index: 10;
  box-shadow: 0 20px 60px rgba(255, 77, 121, 0.15);
}

.title {
  font-size: 32px;
  margin-bottom: 15px;
  background: linear-gradient(45deg, #ff4d79, #ff9a9e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.player-select {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
  margin: 30px 0;
}

.player-info .token {
  font-size: 40px;
  width: 70px;
  height: 70px;
  line-height: 70px;
  border-radius: 50%;
  margin-bottom: 10px;
}

.token.red { background: #ffe3e8; }
.token.blue { background: #e3f2fd; }

.vs {
  font-weight: bold;
  color: #ff4d79;
  font-size: 24px;
}

.start-btn {
  width: 100%;
  height: 54px;
  font-size: 18px;
  background: linear-gradient(45deg, #ff4d79, #ff9a9e) !important;
  border: none !important;
  box-shadow: 0 10px 20px rgba(255, 77, 121, 0.3) !important;
}

/* 游戏界面 */
.game-play {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.game-header {
  padding: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: white;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
}

.back-btn {
  color: white !important;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.back-btn:hover {
  opacity: 0.8;
}

.turn-indicator {
  padding: 8px 20px;
  border-radius: 20px;
  font-weight: 600;
  transition: all 0.3s;
}

.p1-turn { background: #ffe3e8; color: #ff4d79; transform: scale(1.1); }
.p2-turn { background: #e3f2fd; color: #2196f3; transform: scale(1.1); }

.ludo-container {
  flex: 1;
  padding: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff9fa;
}

.board-wrapper {
  width: 100%;
  max-width: 600px;
  aspect-ratio: 1/1;
  background: white;
  border-radius: 20px;
  padding: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
}

.ludo-board {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 10px;
  height: 100%;
}

.board-cell {
  background: #f8f9fa;
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.board-cell.start { background: #fff0f3; border-color: #ff4d79; }
.board-cell.goal { background: #fffde7; border-color: #fbc02d; }
.board-cell.task { background: #f3e5f5; }
.board-cell.fast { background: #e8f5e9; }
.board-cell.slow { background: #fff3e0; }

.cell-icon { font-size: 24px; margin-bottom: 4px; }
.cell-num {
  position: absolute;
  top: 5px;
  right: 5px;
  font-size: 10px;
  color: #999;
}

.token {
  position: absolute;
  font-size: 28px;
  z-index: 5;
  filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.p1-token { transform: translate(-5px, -5px); }
.p2-token { transform: translate(5px, 5px); }

/* 骰子区域 */
.game-controls {
  padding: 30px;
  display: flex;
  justify-content: center;
  background: white;
}

.dice-area {
  text-align: center;
  cursor: pointer;
}

.dice {
  width: 60px;
  height: 60px;
  background: white;
  border: 3px solid #ff4d79;
  border-radius: 12px;
  margin: 0 auto 10px;
  display: grid;
  padding: 5px;
  gap: 5px;
  box-shadow: 0 5px 15px rgba(255, 77, 121, 0.2);
}

.rolling .dice {
  animation: shake 0.1s infinite;
}

@keyframes shake {
  0% { transform: translate(2px, 2px) rotate(0deg); }
  50% { transform: translate(-2px, -2px) rotate(5deg); }
  100% { transform: translate(2px, 2px) rotate(0deg); }
}

.dot {
  background: #ff4d79;
  border-radius: 50%;
  width: 100%;
  height: 100%;
}

/* 骰子点数布局 */
.face-1 { grid-template-areas: ". . ." ". d ." ". . ."; }
.face-2 { grid-template-areas: "d . ." ". . ." ". . d"; }
.face-3 { grid-template-areas: "d . ." ". d ." ". . d"; }
.face-4 { grid-template-areas: "d . d" ". . ." "d . d"; }
.face-5 { grid-template-areas: "d . d" ". d ." "d . d"; }
.face-6 { grid-template-areas: "d . d" "d . d" "d . d"; }

/* 任务弹窗 */
.task-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 20;
}

.task-card {
  width: 80%;
  max-width: 320px;
  padding: 30px;
  border-radius: 30px;
  text-align: center;
  box-shadow: 0 20px 50px rgba(0,0,0,0.1);
  background: white;
}

.p1-card { border-top: 10px solid #ff4d79; }
.p2-card { border-top: 10px solid #2196f3; }

.task-icon { font-size: 50px; margin-bottom: 15px; }
.task-text { font-size: 18px; font-weight: 600; margin-bottom: 25px; line-height: 1.6; }

/* 胜利弹窗 */
.win-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 30;
}

.win-card {
  text-align: center;
  padding: 40px;
  background: white;
  border-radius: 40px;
  border: 2px solid #ff4d79;
}

.win-icon { font-size: 60px; margin-bottom: 10px; }

@media (max-width: 480px) {
  .ludo-board { gap: 5px; }
  .cell-icon { font-size: 18px; }
  .token { font-size: 20px; }
}
</style>
