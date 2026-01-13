<template>
  <div class="telepathy-game">
    <!-- 1. 游戏菜单 -->
    <div v-if="!gameStarted" class="game-menu">
      <el-button class="menu-back-btn" link @click="$emit('back')">
        <el-icon><ArrowLeft /></el-icon>
        返回大厅
      </el-button>
      <div class="menu-content">
        <div class="game-logo">📡✨🧠</div>
        <h1 class="glow-text">心灵感应：时空同步</h1>
        <p class="desc">
          这是一场关于信任与指引的深度考验。<br/>
          一位玩家作为 <b>📢 指挥官</b> 掌控全局地图；<br/>
          另一位作为 <b>🏃 执行者</b> 在迷雾中寻找出口。<br/>
          建议两人背对背或通过语音交流。
        </p>
        
        <div class="role-selection">
          <div class="role-card commander" :class="{ active: selectedRole === 'commander' }" @click="selectedRole = 'commander'">
            <div class="role-icon">📢</div>
            <h3>指挥官</h3>
            <p>洞悉一切迷宫布局</p>
          </div>
          <div class="role-card runner" :class="{ active: selectedRole === 'runner' }" @click="selectedRole = 'runner'">
            <div class="role-icon">🏃</div>
            <h3>执行者</h3>
            <p>在迷雾中交付信任</p>
          </div>
        </div>

        <el-button type="primary" class="start-btn" :disabled="!selectedRole" @click="startGame">
          建立同步连接
        </el-button>
      </div>
    </div>

    <!-- 2. 游戏主界面 -->
    <div v-else class="game-play" :class="{ 'runner-mode': playerRole === 'runner' }">
      <div class="game-header">
        <el-button class="back-btn" link @click="$emit('back')">
          <el-icon><ArrowLeft /></el-icon>
          返回游戏主页
        </el-button>
        <div class="status-bar">
          <div class="sync-rate">
            同步率: <span class="percent">{{ syncRate }}%</span>
            <div class="sync-bar"><div class="fill" :style="{ width: syncRate + '%' }"></div></div>
          </div>
          <div class="level-info">第 {{ currentLevel }} 关</div>
        </div>
      </div>

      <div class="maze-stage" :class="{ 'resonating': isResonating }">
        <!-- 背景背景粒子 -->
        <div class="maze-particles">
          <div v-for="i in 20" :key="i" class="particle" :style="getParticleStyle(i)"></div>
        </div>

        <!-- 背景扫描特效 -->
        <div class="scan-line"></div>
        
        <div class="maze-grid" :style="gridStyle" @click="handleCommanderPing">
          <div v-for="(cell, index) in mazeData" :key="index" 
               class="maze-cell" 
               :class="getCellClass(index)">
            <!-- 轨迹 -->
            <template v-for="t in trail" :key="t.pos">
              <div v-if="t.pos === index" 
                   class="trail-dot" 
                   :style="{ opacity: t.opacity }"></div>
            </template>

            <!-- 角色 -->
            <div v-if="playerPos === index" class="player-avatar">
              <div class="player-glow"></div>
              <div class="player-icon">👫</div>
            </div>
            <!-- 终点 -->
            <div v-if="cell === 2 && (playerRole === 'commander' || gameWon)" class="goal-heart">
              <div class="heart-pulse"></div>
              💖
            </div>
            <!-- 装饰背景 -->
            <div class="cell-bg"></div>
            <!-- 信号波纹 -->
            <div v-if="pingPos === index" class="ping-wave">
              <div class="wave-inner"></div>
              <div class="wave-outer"></div>
            </div>
          </div>
        </div>

        <!-- 共鸣光环 -->
        <div v-if="isResonating" class="resonance-overlay"></div>

        <!-- 执行者专属迷雾层 -->
        <div v-if="playerRole === 'runner' && !gameWon" class="fog-overlay" :style="fogStyle">
          <div class="fog-noise"></div>
        </div>

        <!-- 靠近终点的呼吸效果 -->
        <div v-if="playerRole === 'runner' && proximityToGoal < 3" class="proximity-glow" :style="{ opacity: (3 - proximityToGoal) / 3 }"></div>
      </div>

      <!-- 控制面板 -->
      <div class="controls-section">
        <div v-if="playerRole === 'runner'" class="movement-pad">
          <div class="pad-row">
            <div class="pad-btn up" @mousedown="move('up')">🔼</div>
          </div>
          <div class="pad-row">
            <div class="pad-btn left" @mousedown="move('left')">◀️</div>
            <div class="pad-btn down" @mousedown="move('down')">🔽</div>
            <div class="pad-btn right" @mousedown="move('right')">▶️</div>
          </div>
        </div>
        <div v-else class="commander-panel">
          <div class="instruction">
            <span class="icon">📢</span>
            请实时指引对方！躲避灰色的墙壁，寻找闪烁的终点。
          </div>
        </div>
      </div>

      <!-- 胜利弹窗 -->
      <transition name="zoom">
        <div v-if="gameWon" class="win-overlay">
          <div class="win-card">
            <div class="win-stars">✨✨✨</div>
            <h2>完美的同步！</h2>
            <p>你们用了 {{ steps }} 步找到了彼此，默契度爆表！</p>
            <el-button type="primary" round class="next-btn" @click="nextLevel">挑战下一关</el-button>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['back'])
// --- 迷宫关卡配置 ---
const levels = [
  {
    size: 6,
    data: [
      0, 1, 0, 0, 0, 0,
      0, 1, 0, 1, 1, 0,
      0, 0, 0, 1, 0, 0,
      1, 1, 0, 1, 0, 1,
      0, 0, 0, 0, 0, 1,
      0, 1, 1, 1, 0, 2
    ]
  },
  {
    size: 8,
    data: [
      0, 0, 1, 0, 0, 0, 0, 0,
      1, 0, 1, 0, 1, 1, 1, 0,
      0, 0, 0, 0, 1, 0, 0, 0,
      0, 1, 1, 1, 1, 0, 1, 1,
      0, 0, 0, 0, 0, 0, 1, 0,
      1, 1, 1, 0, 1, 1, 1, 0,
      0, 0, 0, 0, 1, 0, 0, 0,
      2, 1, 1, 0, 0, 0, 1, 0
    ]
  }
]

// --- 状态定义 ---
const gameStarted = ref(false)
const selectedRole = ref('')
const playerRole = ref('')
const currentLevel = ref(1)
const playerPos = ref(0)
const gameWon = ref(false)
const steps = ref(0)
const syncRate = ref(100)
const pingPos = ref<number | null>(null)

const mazeData = computed(() => {
  const level = levels[currentLevel.value - 1]
  return level ? level.data : []
})
const mazeSize = computed(() => {
  const level = levels[currentLevel.value - 1]
  return level ? level.size : 0
})

const goalPos = computed(() => mazeData.value.indexOf(2))

const proximityToGoal = computed(() => {
  if (playerPos.value === -1 || goalPos.value === -1) return 10
  const size = mazeSize.value
  const r1 = Math.floor(playerPos.value / size)
  const c1 = playerPos.value % size
  const r2 = Math.floor(goalPos.value / size)
  const c2 = goalPos.value % size
  return Math.abs(r1 - r2) + Math.abs(c1 - c2)
})

const gridStyle = computed(() => ({
  gridTemplateColumns: `repeat(${mazeSize.value}, 1fr)`,
  gridTemplateRows: `repeat(${mazeSize.value}, 1fr)`
}))

const fogStyle = computed(() => {
  const row = Math.floor(playerPos.value / mazeSize.value)
  const col = playerPos.value % mazeSize.value
  const x = (col + 0.5) * (100 / mazeSize.value)
  const y = (row + 0.5) * (100 / mazeSize.value)
  
  // 基础半径，随同步率变化
  const baseRadius = 60 + (syncRate.value / 100) * 20
  const outerRadius = baseRadius * 2
  
  return {
    background: `radial-gradient(circle at ${x}% ${y}%, transparent ${baseRadius}px, rgba(10, 10, 20, 0.98) ${outerRadius}px)`
  }
})

// --- 轨迹系统 ---
const trail = ref<{pos: number, opacity: number}[]>([])
const addTrail = (pos: number) => {
  trail.value.push({ pos, opacity: 1 })
  if (trail.value.length > 5) trail.value.shift()
  
  // 轨迹逐渐淡出
  const interval = setInterval(() => {
    const t = trail.value.find(t => t.pos === pos)
    if (t) {
      t.opacity -= 0.1
      if (t.opacity <= 0) {
        trail.value = trail.value.filter(t => t.pos !== pos)
        clearInterval(interval)
      }
    } else {
      clearInterval(interval)
    }
  }, 200)
}

// --- 默契共鸣 ---
const isResonating = ref(false)
const triggerResonance = () => {
  isResonating.value = true
  setTimeout(() => isResonating.value = false, 1000)
}

const getParticleStyle = (i: number) => {
  return {
    left: Math.random() * 100 + '%',
    top: Math.random() * 100 + '%',
    animationDelay: Math.random() * 5 + 's',
    opacity: Math.random() * 0.5 + 0.2
  }
}

// --- 核心逻辑 ---

const startGame = () => {
  playerRole.value = selectedRole.value
  resetLevel()
  gameStarted.value = true
}

const handleCommanderPing = (e: MouseEvent) => {
  if (playerRole.value !== 'commander' || gameWon.value) return
  
  const target = e.target as HTMLElement
  const cell = target.closest('.maze-cell')
  if (!cell) return
  
  const index = Array.from(cell.parentElement!.children).indexOf(cell)
  pingPos.value = index
  setTimeout(() => {
    if (pingPos.value === index) pingPos.value = null
  }, 2000)
}

const resetLevel = () => {
  playerPos.value = 0
  gameWon.value = false
  steps.value = 0
  syncRate.value = 100
}

const getCellClass = (index: number) => {
  const cell = mazeData.value[index]
  return {
    'wall': cell === 1,
    'path': cell === 0,
    'goal': cell === 2,
    'visible': playerRole.value === 'commander' || gameWon.value
  }
}

const move = (direction: string) => {
  if (gameWon.value) return
  
  const size = mazeSize.value
  let nextPos = playerPos.value
  
  if (direction === 'up' && nextPos >= size) nextPos -= size
  else if (direction === 'down' && nextPos < size * (size - 1)) nextPos += size
  else if (direction === 'left' && nextPos % size !== 0) nextPos -= 1
  else if (direction === 'right' && nextPos % size !== size - 1) nextPos += 1
  
  if (nextPos === playerPos.value) return

  steps.value++
  
  if (mazeData.value[nextPos] === 1) {
    ElMessage.error('哎呀，撞到墙了！')
    syncRate.value = Math.max(0, syncRate.value - 5)
    return
  }
  
  const oldPos = playerPos.value
  playerPos.value = nextPos
  addTrail(oldPos)

  // 检查是否与指挥官的信号重合 (共鸣)
  if (pingPos.value === nextPos) {
    triggerResonance()
    syncRate.value = Math.min(100, syncRate.value + 10)
    ElMessage({
      message: '心灵感应！同步率提升',
      type: 'success',
      plain: true,
      duration: 1000
    })
  }
  
  if (mazeData.value[nextPos] === 2) {
    gameWon.value = true
    ElMessage.success('默契满分！找到终点啦！')
  }
}

const nextLevel = () => {
  if (currentLevel.value < levels.length) {
    currentLevel.value++
    resetLevel()
  } else {
    ElMessage.success('恭喜通关所有心灵感应关卡！')
    gameStarted.value = false
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  if (!gameStarted.value || playerRole.value !== 'runner') return
  if (e.key === 'ArrowUp' || e.key === 'w') move('up')
  if (e.key === 'ArrowDown' || e.key === 's') move('down')
  if (e.key === 'ArrowLeft' || e.key === 'a') move('left')
  if (e.key === 'ArrowRight' || e.key === 'd') move('right')
}

onMounted(() => window.addEventListener('keydown', handleKeyDown))
onUnmounted(() => window.removeEventListener('keydown', handleKeyDown))
</script>

<style scoped>
.telepathy-game {
  height: 100vh;
  background: #0a0a12;
  color: #fff;
  overflow: hidden;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
}

/* 菜单 */
.game-menu {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at center, #1a1a3a 0%, #05050a 100%);
}

.menu-content {
  text-align: center;
  padding: 50px;
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(20px);
  border-radius: 40px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  max-width: 600px;
}

.game-logo { font-size: 80px; margin-bottom: 20px; }
.glow-text {
  font-size: 36px;
  background: linear-gradient(to right, #00f2fe, #4facfe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 20px;
}

.desc { color: #a0a0c0; line-height: 1.8; margin-bottom: 40px; }

.role-selection {
  display: flex;
  gap: 20px;
  margin-bottom: 40px;
}

.role-card {
  flex: 1;
  padding: 30px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.role-card:hover { background: rgba(255, 255, 255, 0.1); transform: translateY(-5px); }
.role-card.active { border-color: #4facfe; background: rgba(79, 172, 254, 0.1); }
.role-icon { font-size: 40px; margin-bottom: 15px; }
.role-card h3 { margin-bottom: 10px; }
.role-card p { font-size: 12px; color: #888; }

.start-btn { width: 100%; height: 55px; font-size: 18px; border-radius: 15px; }

/* 游戏战场 */
.game-play {
  height: 100%;
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
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

.sync-rate {
  display: flex;
  align-items: center;
  gap: 15px;
  font-size: 14px;
}

.sync-bar {
  width: 150px;
  height: 8px;
  background: rgba(255,255,255,0.1);
  border-radius: 4px;
  overflow: hidden;
}

.sync-bar .fill {
  height: 100%;
  background: linear-gradient(to right, #ff4d79, #00f2fe);
  transition: width 0.3s;
}

.maze-stage {
  flex: 1;
  background: #05050a;
  border-radius: 24px;
  border: 1px solid rgba(0, 242, 254, 0.2);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  transition: all 0.5s ease;
}

.maze-stage.resonating {
  box-shadow: inset 0 0 50px rgba(0, 242, 254, 0.3);
  border-color: rgba(0, 242, 254, 0.6);
}

.maze-particles {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.particle {
  position: absolute;
  width: 2px;
  height: 2px;
  background: #4facfe;
  border-radius: 50%;
  animation: float-particle 10s infinite linear;
}

.maze-grid {
  width: 100%;
  max-width: 500px;
  aspect-ratio: 1;
  display: grid;
  gap: 4px;
  position: relative;
  z-index: 2;
}

.maze-cell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  transition: all 0.3s;
}

.cell-bg {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.03);
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s;
}

.maze-cell.wall .cell-bg { 
  background: #1a1a2e; 
}

.maze-cell.wall.visible .cell-bg { 
  background: linear-gradient(135deg, #2c3e50 0%, #000000 100%);
  box-shadow: inset 0 0 15px rgba(0, 242, 254, 0.1);
  border-color: rgba(255, 255, 255, 0.1);
}

.maze-cell.goal.visible .cell-bg { 
  background: rgba(255, 77, 121, 0.15); 
  border: 1px solid #ff4d79;
  box-shadow: 0 0 20px rgba(255, 77, 121, 0.3);
}

.trail-dot {
  position: absolute;
  width: 8px;
  height: 8px;
  background: #00f2fe;
  border-radius: 50%;
  filter: blur(2px);
  z-index: 1;
}

.player-avatar { 
  z-index: 10; 
  position: relative;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.player-icon {
  font-size: 32px;
  filter: drop-shadow(0 0 10px #00f2fe);
}

.player-glow {
  position: absolute;
  inset: -15px;
  background: radial-gradient(circle, rgba(0, 242, 254, 0.5) 0%, transparent 70%);
  animation: pulse-glow 1.5s infinite ease-in-out;
}

.goal-heart { 
  position: relative;
  font-size: 32px; 
  animation: bounce-heart 1s infinite alternate; 
  z-index: 5;
}

.heart-pulse {
  position: absolute;
  inset: -10px;
  border: 2px solid #ff4d79;
  border-radius: 50%;
  animation: heart-ping 1.5s infinite;
  opacity: 0;
}

.ping-wave {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 20;
}

.wave-inner, .wave-outer {
  position: absolute;
  border: 2px solid #00f2fe;
  border-radius: 50%;
}

.wave-inner {
  width: 100%;
  height: 100%;
  animation: ping-wave 2s cubic-bezier(0, 0, 0.2, 1) infinite;
}

.wave-outer {
  width: 150%;
  height: 150%;
  animation: ping-wave 2s cubic-bezier(0, 0, 0.2, 1) infinite 0.5s;
  opacity: 0;
}

.resonance-overlay {
  position: absolute;
  inset: 0;
  background: radial-gradient(circle, transparent 30%, rgba(0, 242, 254, 0.15) 100%);
  pointer-events: none;
  z-index: 15;
  animation: resonance-flash 1s ease-out forwards;
}

.proximity-glow {
  position: absolute;
  inset: 0;
  box-shadow: inset 0 0 100px rgba(255, 77, 121, 0.4);
  pointer-events: none;
  z-index: 10;
  animation: breathe 1.5s infinite ease-in-out;
}

.fog-overlay {
  position: absolute;
  inset: 0;
  z-index: 8;
  pointer-events: none;
  transition: background 0.2s ease;
}

.fog-noise {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.05;
  mix-blend-mode: overlay;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 4px;
  background: linear-gradient(to bottom, transparent, rgba(0, 242, 254, 0.4), transparent);
  box-shadow: 0 0 15px rgba(0, 242, 254, 0.5);
  animation: scan 6s linear infinite;
  z-index: 1;
}

/* 关键帧动画 */
@keyframes float-particle {
  0% { transform: translateY(0) translateX(0); }
  33% { transform: translateY(-20px) translateX(10px); }
  66% { transform: translateY(10px) translateX(-15px); }
  100% { transform: translateY(0) translateX(0); }
}

@keyframes pulse-glow {
  0%, 100% { transform: scale(1); opacity: 0.4; }
  50% { transform: scale(1.2); opacity: 0.7; }
}

@keyframes bounce-heart {
  from { transform: translateY(0) scale(1); }
  to { transform: translateY(-8px) scale(1.1); }
}

@keyframes heart-ping {
  0% { transform: scale(0.8); opacity: 0.8; }
  100% { transform: scale(2.5); opacity: 0; }
}

@keyframes ping-wave {
  0% { transform: scale(0.5); opacity: 1; }
  100% { transform: scale(3); opacity: 0; }
}

@keyframes resonance-flash {
  0% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes scan {
  from { transform: translateY(-100%); }
  to { transform: translateY(100vh); }
}

@keyframes breathe {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.8; transform: scale(1.05); }
}

.zoom-enter-active, .zoom-leave-active { transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
.zoom-enter-from, .zoom-leave-to { opacity: 0; transform: scale(0.8); }
</style>
