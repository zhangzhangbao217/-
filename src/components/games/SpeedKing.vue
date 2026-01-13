<template>
  <div class="speed-king-game">
    <!-- 1. 游戏菜单 -->
    <div v-if="!gameStarted" class="game-menu">
      <el-button class="menu-back-btn" link @click="$emit('back')">
        <el-icon><ArrowLeft /></el-icon>
        返回大厅
      </el-button>
      <div class="menu-overlay"></div>
      <div class="menu-content">
        <div class="game-logo">⚡💖⚡</div>
        <h1 class="glow-text">手速之王：心跳对决</h1>
        <p class="desc">这是一场关于爱与速度的较量！<br/>左侧 👦 使用 [A] 键，右侧 👧 使用 [L] 键。<br/>谁先填满能量槽，谁就能赢得“甜蜜话语权”！</p>
        
        <div class="control-tips">
          <div class="tip"><span class="key">A</span> 👦 玩家</div>
          <div class="tip"><span class="key">L</span> 👧 玩家</div>
        </div>

        <el-button type="primary" class="start-btn" @click="startCountDown">
          开启对决
        </el-button>
      </div>
    </div>

    <!-- 2. 倒计时 -->
    <div v-else-if="countingDown" class="countdown-overlay">
      <div class="count-number" :class="{ 'go': countdownText === 'GO!' }">{{ countdownText }}</div>
      <div class="vs-text">READY?</div>
    </div>

    <!-- 3. 游戏主战场 -->
    <div v-else class="game-play" :class="{ 'shake': isShaking }">
      <div class="game-header">
        <el-button class="back-btn" link @click="$emit('back')">
          <el-icon><ArrowLeft /></el-icon>
          返回游戏主页
        </el-button>
        <div class="timer-box">
          <span class="label">剩余时间</span>
          <span class="value">{{ timeLeft }}s</span>
        </div>
      </div>
      <!-- 冲击波背景 -->
      <div class="impact-flash" :class="{ 'flash-p1': p1Flash, 'flash-p2': p2Flash }"></div>
      
      <div class="battle-ground">
        <!-- 玩家 1 (左侧) -->
        <div class="player-side p1" :class="{ 'hit-anim': p1Hit }" :style="{ '--progress': p1Progress + '%' }" @mousedown="handleTap('p1')" @touchstart.prevent="handleTap('p1')">
          <div class="side-glow"></div>
          <div class="energy-bar-v">
            <div class="fill"></div>
            <div class="glow-head"></div>
          </div>
          <div class="char-info">
            <div class="avatar-container">
              <div class="avatar">👦</div>
              <div class="avatar-ring"></div>
            </div>
            <div class="combo-badge" v-if="p1Combo > 1">
              <span class="combo-num">{{ p1Combo }}</span>
              <span class="combo-text">COMBO</span>
            </div>
          </div>
          <div class="tap-target">
            <div class="heart-ring"></div>
            <div class="main-heart">❤️</div>
          </div>
          <div class="particles-container" ref="p1Particles"></div>
        </div>

        <div class="vs-divider">
          <div class="vs-label">VS</div>
          <div class="timer-circle">
            <svg viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="45" class="bg"></circle>
              <circle cx="50" cy="50" r="45" class="progress" :style="{ strokeDashoffset: (1 - timeLeft/10) * 283 }"></circle>
            </svg>
            <span class="time">{{ timeLeft }}s</span>
          </div>
        </div>

        <!-- 玩家 2 (右侧) -->
        <div class="player-side p2" :class="{ 'hit-anim': p2Hit }" :style="{ '--progress': p2Progress + '%' }" @mousedown="handleTap('p2')" @touchstart.prevent="handleTap('p2')">
          <div class="side-glow"></div>
          <div class="energy-bar-v">
            <div class="fill"></div>
            <div class="glow-head"></div>
          </div>
          <div class="char-info">
            <div class="avatar-container">
              <div class="avatar">👧</div>
              <div class="avatar-ring"></div>
            </div>
            <div class="combo-badge" v-if="p2Combo > 1">
              <span class="combo-num">{{ p2Combo }}</span>
              <span class="combo-text">COMBO</span>
            </div>
          </div>
          <div class="tap-target">
            <div class="heart-ring"></div>
            <div class="main-heart">💖</div>
          </div>
          <div class="particles-container" ref="p2Particles"></div>
        </div>
      </div>

      <!-- 4. 胜利弹窗 (大师级 UI) -->
      <transition name="zoom">
        <div v-if="resultVisible" class="result-overlay">
          <div class="result-card">
            <div class="winner-crown">👑</div>
            <h2 class="winner-title">{{ winner === 'p1' ? '👦 玩家获胜' : '👧 玩家获胜' }}</h2>
            <div class="score-stats">
              <div class="stat-item">
                <span class="label">P1 点击</span>
                <span class="val">{{ p1Score }}</span>
              </div>
              <div class="stat-item">
                <span class="label">P2 点击</span>
                <span class="val">{{ p2Score }}</span>
              </div>
            </div>
            
            <div class="punish-section">
              <div class="punish-label">📜 胜者的甜蜜旨令</div>
              <div class="punish-text">{{ currentPunish }}</div>
            </div>

            <el-button type="primary" round class="rematch-btn" @click="resetGame">再次对决</el-button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['back'])
// --- 状态定义 ---
const gameStarted = ref(false)
const countingDown = ref(false)
const countdownText = ref('3')
const timeLeft = ref(10)
const resultVisible = ref(false)
const winner = ref('')
const isShaking = ref(false)
const p1Flash = ref(false)
const p2Flash = ref(false)
const p1Hit = ref(false)
const p2Hit = ref(false)

// 玩家数据
const p1Score = ref(0)
const p2Score = ref(0)
const p1Combo = ref(0)
const p2Combo = ref(0)
const p1Progress = ref(0)
const p2Progress = ref(0)
const p1Particles = ref<HTMLElement | null>(null)
const p2Particles = ref<HTMLElement | null>(null)

const currentPunish = ref('')
const punishments = [
  '给对方一个深情的吻',
  '深情对视 30 秒不许笑',
  '背起对方在房间走一圈',
  '为对方剥一个水果',
  '答应对方一个不过分的小要求',
  '给对方揉揉肩膀 5 分钟',
  '说出 5 个你最喜欢对方的理由'
]

let gameTimer: any = null
let comboTimerP1: any = null
let comboTimerP2: any = null

// --- 游戏逻辑 ---

const startCountDown = () => {
  gameStarted.value = true
  countingDown.value = true
  let count = 3
  const timer = setInterval(() => {
    count--
    if (count > 0) {
      countdownText.value = count.toString()
    } else if (count === 0) {
      countdownText.value = 'GO!'
    } else {
      clearInterval(timer)
      countingDown.value = false
      startGame()
    }
  }, 1000)
}

const startGame = () => {
  p1Score.value = 0
  p2Score.value = 0
  p1Progress.value = 0
  p2Progress.value = 0
  timeLeft.value = 10
  
  gameTimer = setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) endGame()
  }, 1000)

  window.addEventListener('keydown', handleKeyDown)
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (resultVisible.value) return
  if (e.key.toLowerCase() === 'a') handleTap('p1')
  if (e.key.toLowerCase() === 'l') handleTap('p2')
}

const createParticle = (x: number, y: number, color: string, container: HTMLElement) => {
  const particle = document.createElement('div')
  particle.className = 'particle'
  const size = Math.random() * 10 + 5
  particle.style.width = `${size}px`
  particle.style.height = `${size}px`
  particle.style.background = color
  particle.style.left = `${x}px`
  particle.style.top = `${y}px`
  particle.style.position = 'absolute'
  particle.style.borderRadius = '50%'
  particle.style.pointerEvents = 'none'
  
  const angle = Math.random() * Math.PI * 2
  const velocity = Math.random() * 100 + 50
  const tx = Math.cos(angle) * velocity
  const ty = Math.sin(angle) * velocity
  
  container.appendChild(particle)
  
  particle.animate([
    { transform: 'translate(0, 0) scale(1)', opacity: 1 },
    { transform: `translate(${tx}px, ${ty}px) scale(0)`, opacity: 0 }
  ], {
    duration: 800,
    easing: 'cubic-bezier(0, .9, .57, 1)'
  }).onfinish = () => particle.remove()
}

const handleTap = (player: 'p1' | 'p2') => {
  if (timeLeft.value <= 0 || resultVisible.value) return

  // 1. 增加分数与进度
  const container = player === 'p1' ? p1Particles.value : p2Particles.value
  const color = player === 'p1' ? '#ff4d79' : '#0096ff'
  
  if (player === 'p1') {
    p1Score.value++
    p1Combo.value++
    p1Progress.value = Math.min(100, p1Progress.value + (1 + p1Combo.value * 0.1))
    p1Hit.value = true
    setTimeout(() => p1Hit.value = false, 100)
    if (p1Combo.value % 10 === 0) {
      p1Flash.value = true
      setTimeout(() => p1Flash.value = false, 200)
    }
    resetCombo('p1')
  } else {
    p2Score.value++
    p2Combo.value++
    p2Progress.value = Math.min(100, p2Progress.value + (1 + p2Combo.value * 0.1))
    p2Hit.value = true
    setTimeout(() => p2Hit.value = false, 100)
    if (p2Combo.value % 10 === 0) {
      p2Flash.value = true
      setTimeout(() => p2Flash.value = false, 200)
    }
    resetCombo('p2')
  }

  // 释放粒子
  if (container) {
    for (let i = 0; i < 6; i++) {
      createParticle(100, 100, color, container)
    }
  }

  // 2. 触发抖动
  isShaking.value = true
  setTimeout(() => isShaking.value = false, 50)

  // 3. 检查即时胜利 (能量槽满)
  if (p1Progress.value >= 100) endGame('p1')
  else if (p2Progress.value >= 100) endGame('p2')
}

const resetCombo = (player: 'p1' | 'p2') => {
  if (player === 'p1') {
    clearTimeout(comboTimerP1)
    comboTimerP1 = setTimeout(() => p1Combo.value = 0, 800)
  } else {
    clearTimeout(comboTimerP2)
    comboTimerP2 = setTimeout(() => p2Combo.value = 0, 800)
  }
}

const endGame = (instantWinner?: string) => {
  clearInterval(gameTimer)
  window.removeEventListener('keydown', handleKeyDown)
  
  if (instantWinner) {
    winner.value = instantWinner
  } else {
    winner.value = p1Score.value > p2Score.value ? 'p1' : 'p2'
  }

  currentPunish.value = punishments[Math.floor(Math.random() * punishments.length)]
  resultVisible.value = true
}

const resetGame = () => {
  resultVisible.value = false
  gameStarted.value = false
}

onUnmounted(() => {
  clearInterval(gameTimer)
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<style scoped>
.speed-king-game {
  height: 100vh;
  background: #0a0a12;
  color: #fff;
  overflow: hidden;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 菜单样式 */
.game-menu {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  background: radial-gradient(circle at center, #2d1b33 0%, #0a0a12 100%);
}

.menu-content {
  z-index: 10;
  text-align: center;
  padding: 50px;
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(20px);
  border-radius: 40px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px rgba(0,0,0,0.5);
}

.game-logo { font-size: 80px; margin-bottom: 20px; animation: pulse 2s infinite; }
.glow-text {
  font-size: 42px;
  background: linear-gradient(to right, #ff4d79, #ff85a2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 20px;
}

.control-tips {
  display: flex;
  justify-content: center;
  gap: 30px;
  margin: 30px 0;
}

.key {
  display: inline-block;
  width: 40px;
  height: 40px;
  background: #fff;
  color: #000;
  border-radius: 8px;
  line-height: 40px;
  font-weight: bold;
  margin-right: 10px;
}

/* 倒计时 */
.countdown-overlay {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: #000;
}

.count-number {
  font-size: 180px;
  font-weight: 900;
  color: #ff4d79;
  text-shadow: 0 0 30px #ff4d79;
  animation: zoomIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.count-number.go { color: #00ff88; text-shadow: 0 0 30px #00ff88; }

/* 战场样式 */
.game-play {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.impact-flash {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 1;
  opacity: 0;
  transition: opacity 0.1s;
}

.flash-p1 { opacity: 1; background: radial-gradient(circle, rgba(255, 77, 121, 0.4) 0%, transparent 70%); }
.flash-p2 { opacity: 1; background: radial-gradient(circle, rgba(0, 150, 255, 0.4) 0%, transparent 70%); }

.game-header {
  position: absolute;
  top: 20px;
  left: 20px;
  right: 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  z-index: 100;
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

.menu-back-btn {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 100;
  color: white !important;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.timer-box {
  background: rgba(0, 0, 0, 0.4);
  padding: 8px 16px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  backdrop-filter: blur(10px);
}

.timer-box .label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.6);
}

.timer-box .value {
  font-size: 20px;
  font-weight: bold;
  color: #ffeb3b;
}

.battle-ground {
  flex: 1;
  display: flex;
  position: relative;
  z-index: 2;
}

.player-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all 0.1s;
  cursor: pointer;
  overflow: hidden;
}

.side-glow {
  position: absolute;
  inset: 0;
  opacity: 0.1;
  transition: opacity 0.3s;
}

.p1 .side-glow { background: radial-gradient(circle at 30% 50%, #ff4d79 0%, transparent 70%); }
.p2 .side-glow { background: radial-gradient(circle at 70% 50%, #0096ff 0%, transparent 70%); }

.hit-anim { transform: scale(0.98); }
.p1.hit-anim { background: rgba(255, 77, 121, 0.1); }
.p2.hit-anim { background: rgba(0, 150, 255, 0.1); }

.p1 { border-right: 1px solid rgba(255, 255, 255, 0.05); }
.p2 { border-left: 1px solid rgba(255, 255, 255, 0.05); }

/* 垂直能量槽 */
.energy-bar-v {
  position: absolute;
  bottom: 0;
  width: 100%;
  height: var(--progress);
  transition: height 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  opacity: 0.4;
}

.glow-head {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 20px;
  background: #fff;
  filter: blur(10px);
  opacity: 0.8;
}

.p1 .energy-bar-v { background: linear-gradient(to top, #ff4d79, #ff85a2); }
.p2 .energy-bar-v { background: linear-gradient(to top, #0096ff, #4facfe); }

.char-info {
  position: absolute;
  top: 60px;
  text-align: center;
  z-index: 10;
}

.avatar-container {
  position: relative;
  width: 100px;
  height: 100px;
  margin-bottom: 15px;
}

.avatar { font-size: 60px; position: relative; z-index: 2; }
.avatar-ring {
  position: absolute;
  inset: 0;
  border: 4px solid rgba(255, 255, 255, 0.1);
  border-radius: 50%;
  animation: rotate 10s linear infinite;
}

.combo-badge {
  background: rgba(0, 0, 0, 0.5);
  padding: 5px 15px;
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
  animation: combo-pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.combo-num { font-size: 28px; font-weight: 900; color: #ffd700; line-height: 1; }
.combo-text { font-size: 10px; font-weight: bold; opacity: 0.8; }

@keyframes combo-pop {
  0% { transform: scale(0.5); opacity: 0; }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes rotate {
  from { transform: rotate(0); }
  to { transform: rotate(360deg); }
}

.vs-divider {
  width: 120px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 20px;
  z-index: 10;
}

.vs-label {
  font-size: 40px;
  font-weight: 900;
  font-style: italic;
  color: #fff;
  text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
}

.timer-circle {
  position: relative;
  width: 80px;
  height: 80px;
}

.timer-circle svg { transform: rotate(-90deg); }
.timer-circle .bg { fill: none; stroke: rgba(255,255,255,0.1); stroke-width: 5; }
.timer-circle .progress {
  fill: none;
  stroke: #ff4d79;
  stroke-width: 5;
  stroke-linecap: round;
  stroke-dasharray: 283;
  transition: stroke-dashoffset 1s linear;
}

.time {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-weight: bold;
}

/* 结果弹窗 */
.result-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.result-card {
  background: #1a1a2e;
  padding: 50px;
  border-radius: 40px;
  text-align: center;
  border: 2px solid #ff4d79;
  box-shadow: 0 0 50px rgba(255, 77, 121, 0.3);
  max-width: 500px;
  width: 90%;
}

.winner-crown { font-size: 60px; margin-bottom: 10px; }
.winner-title { font-size: 32px; color: #ff4d79; margin-bottom: 30px; }

.score-stats {
  display: flex;
  justify-content: space-around;
  margin-bottom: 40px;
}

.stat-item { display: flex; flex-direction: column; }
.stat-item .label { font-size: 14px; color: #888; }
.stat-item .val { font-size: 32px; font-weight: bold; }

.punish-section {
  background: rgba(255, 255, 255, 0.05);
  padding: 25px;
  border-radius: 20px;
  margin-bottom: 40px;
}

.punish-label { font-size: 14px; color: #ff85a2; margin-bottom: 10px; }
.punish-text { font-size: 20px; font-weight: bold; color: #fff; }

.rematch-btn { width: 100%; height: 55px; font-size: 18px; font-weight: bold; }

/* 动画 */
@keyframes zoomIn {
  from { opacity: 0; transform: scale(0.5); }
  to { opacity: 1; transform: scale(1); }
}

@keyframes bounce {
  to { transform: translateY(-10px); }
}

.shake { animation: shake 0.1s infinite; }
@keyframes shake {
  0% { transform: translate(1px, 1px); }
  50% { transform: translate(-1px, -1px); }
  100% { transform: translate(1px, -1px); }
}

.zoom-enter-active, .zoom-leave-active { transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.zoom-enter-from, .zoom-leave-to { opacity: 0; transform: scale(0.8); }
</style>
