<template>
  <div class="joint-snake-game">
    <div v-if="!gameStarted" class="game-menu glass-effect">
      <el-button class="menu-back-btn" link @click="$emit('back')">
        <el-icon><ArrowLeft /></el-icon>
        返回大厅
      </el-button>
      <div class="menu-content">
        <div class="game-icon">🐍❤️🐍</div>
        <h2 class="title">同心连体蛇</h2>
        <p class="desc">
          <span>这是真正的灵魂契合挑战！</span><br/>
          <span>你们分别控制蛇的两端</span><br/>
          <span><strong>不能拉得太远，也不能撞墙</strong></span>
        </p>
        
        <div class="role-preview">
          <div class="role-box p1">
            <span class="key-badge">W A S D</span>
            <p>蓝色方控制</p>
          </div>
          <div class="role-box p2">
            <span class="key-badge">↑ ↓ ← →</span>
            <p>粉色方控制</p>
          </div>
        </div>

        <el-button class="start-btn" type="primary" size="large" round @click="startGame">
          开始挑战
        </el-button>
      </div>
    </div>

    <div v-else class="game-play">
      <div class="game-header">
        <el-button class="back-btn" link @click="$emit('back')">
          <el-icon><ArrowLeft /></el-icon>
          返回游戏主页
        </el-button>
        <div class="stats">
          <div class="stat-item">
            <span class="label">分数</span>
            <span class="value">{{ score }}</span>
          </div>
          <div class="stat-item">
            <span class="label">纽带长度</span>
            <span class="value">{{ Math.round(currentBondDist) }} / {{ maxBondDist }}</span>
          </div>
        </div>
      </div>

      <div class="canvas-container" ref="containerRef">
        <canvas ref="canvasRef"></canvas>
        
        <!-- 倒计时 -->
        <div v-if="countdown > 0" class="countdown-overlay">
          <div class="count-number" :key="countdown">{{ countdown }}</div>
          <div class="count-text">准备好了吗？</div>
        </div>
        
        <!-- 边缘危险警告 -->
        <div class="danger-indicator" :class="{ 'active': isNearEdge }"></div>
        
        <!-- 移动端控制区 -->
        <div class="mobile-controls" v-if="isMobile">
          <div class="p1-controls">
            <button class="ctrl-btn" @touchstart="handleControl('p1', 'left')" @touchend="handleControl('p1', 'stop')">◀</button>
            <button class="ctrl-btn" @touchstart="handleControl('p1', 'right')" @touchend="handleControl('p1', 'stop')">▶</button>
            <span class="label">P1 转向</span>
          </div>
          <div class="p2-controls">
            <button class="ctrl-btn" @touchstart="handleControl('p2', 'boost')" @touchend="handleControl('p2', 'stop')">▲</button>
            <button class="ctrl-btn" @touchstart="handleControl('p2', 'slow')" @touchend="handleControl('p2', 'stop')">▼</button>
            <span class="label">P2 速度</span>
          </div>
        </div>
      </div>

      <!-- 游戏结束弹窗 -->
      <transition name="fade">
        <div v-if="showResult" class="result-overlay glass-effect">
          <div class="result-card">
            <div class="result-icon">{{ score > 50 ? '🏆' : '💔' }}</div>
            <h3>{{ score > 50 ? '默契十足！' : '还需要磨合哦' }}</h3>
            <p class="result-msg">{{ resultMessage }}</p>
            <p>最终得分: {{ score }}</p>
            <div class="result-btns">
              <el-button type="primary" round @click="startGame">再来一次</el-button>
              <el-button round @click="gameStarted = false">返回大厅</el-button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['back'])
const gameStarted = ref(false)
const showResult = ref(false)
const score = ref(0)
const isMobile = ref('ontouchstart' in window)
const isNearEdge = ref(false)
const countdown = ref(0)

const canvasRef = ref<HTMLCanvasElement | null>(null)
const containerRef = ref<HTMLDivElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let animationFrameId: number | null = null
let countdownTimer: any = null

// 蛇的状态
interface Point { x: number; y: number; alpha?: number; size?: number }
let head1: Point = { x: 0, y: 0 }
let head2: Point = { x: 0, y: 0 }
let body: Point[] = []
let particles: any[] = []
let velocity = 4
let maxBondDist = 200 // 初始最大纽带长度
let currentBondDist = 0
let food: Point = { x: 0, y: 0 }
let lastTime = 0

// 输入状态
const keys = {
  p1Up: false, p1Down: false, p1Left: false, p1Right: false,
  p2Up: false, p2Down: false, p2Left: false, p2Right: false
}

const startGame = () => {
  gameStarted.value = true
  showResult.value = false
  score.value = 0
  countdown.value = 3
  maxBondDist = 200 // 重置长度
  
  nextTick(() => {
    initCanvas()
    initGame()
    
    // 倒计时逻辑
    if (countdownTimer) clearInterval(countdownTimer)
    countdownTimer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(countdownTimer)
        countdownTimer = null
        lastTime = performance.now()
        gameLoop(lastTime)
      }
    }, 800)
  })
}

const initCanvas = () => {
  if (!canvasRef.value || !containerRef.value) return
  const container = containerRef.value
  canvasRef.value.width = container.clientWidth
  canvasRef.value.height = container.clientHeight
  ctx = canvasRef.value.getContext('2d')
}

const initGame = () => {
  const w = canvasRef.value!.width
  const h = canvasRef.value!.height
  
  // 初始两个头的位置
  head1 = { x: w / 2 - 50, y: h / 2 }
  head2 = { x: w / 2 + 50, y: h / 2 }
  
  // 初始身体（纽带）
  body = []
  for (let i = 0; i < 10; i++) {
    body.push({ x: w / 2, y: h / 2 })
  }
  spawnFood()
}

const spawnFood = () => {
  const w = canvasRef.value!.width
  const h = canvasRef.value!.height
  food = {
    x: Math.random() * (w - 40) + 20,
    y: Math.random() * (h - 40) + 20
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  // P1: WASD
  if (e.key.toLowerCase() === 'w') keys.p1Up = true
  if (e.key.toLowerCase() === 's') keys.p1Down = true
  if (e.key.toLowerCase() === 'a') keys.p1Left = true
  if (e.key.toLowerCase() === 'd') keys.p1Right = true
  
  // P2: Arrows
  if (e.key === 'ArrowUp') keys.p2Up = true
  if (e.key === 'ArrowDown') keys.p2Down = true
  if (e.key === 'ArrowLeft') keys.p2Left = true
  if (e.key === 'ArrowRight') keys.p2Right = true
}

const handleKeyUp = (e: KeyboardEvent) => {
  if (e.key.toLowerCase() === 'w') keys.p1Up = false
  if (e.key.toLowerCase() === 's') keys.p1Down = false
  if (e.key.toLowerCase() === 'a') keys.p1Left = false
  if (e.key.toLowerCase() === 'd') keys.p1Right = false
  
  if (e.key === 'ArrowUp') keys.p2Up = false
  if (e.key === 'ArrowDown') keys.p2Down = false
  if (e.key === 'ArrowLeft') keys.p2Left = false
  if (e.key === 'ArrowRight') keys.p2Right = false
}

const handleControl = (player: 'p1' | 'p2', action: string) => {
  if (player === 'p1') {
    keys.p1Up = action === 'up'
    keys.p1Down = action === 'down'
    keys.p1Left = action === 'left'
    keys.p1Right = action === 'right'
    if (action === 'stop') {
      keys.p1Up = keys.p1Down = keys.p1Left = keys.p1Right = false
    }
  } else {
    keys.p2Up = action === 'up'
    keys.p2Down = action === 'down'
    keys.p2Left = action === 'left'
    keys.p2Right = action === 'right'
    if (action === 'stop') {
      keys.p2Up = keys.p2Down = keys.p2Left = keys.p2Right = false
    }
  }
}

const update = () => {
  if (!gameStarted.value || showResult.value || countdown.value > 0) return

  // 更新头1位置 (P1: WASD)
  if (keys.p1Up) head1.y -= velocity
  if (keys.p1Down) head1.y += velocity
  if (keys.p1Left) head1.x -= velocity
  if (keys.p1Right) head1.x += velocity

  // 更新头2位置 (P2: Arrows)
  if (keys.p2Up) head2.y -= velocity
  if (keys.p2Down) head2.y += velocity
  if (keys.p2Left) head2.x -= velocity
  if (keys.p2Right) head2.x += velocity

  // 计算当前纽带长度
  currentBondDist = Math.hypot(head1.x - head2.x, head1.y - head2.y)

  // 纽带断裂判定
  if (currentBondDist > maxBondDist) {
    gameOver('纽带断裂了...不要离得太远哦')
    return
  }

  // 边界检查
  const w = canvasRef.value!.width
  const h = canvasRef.value!.height
  if (head1.x < 0 || head1.x > w || head1.y < 0 || head1.y > h ||
      head2.x < 0 || head2.x > w || head2.y < 0 || head2.y > h) {
    gameOver('撞到边界了')
    return
  }

  // 危险警告
  const margin = 50
  isNearEdge.value = currentBondDist > maxBondDist * 0.8 || 
                     head1.x < margin || head1.x > w - margin || 
                     head1.y < margin || head1.y > h - margin ||
                     head2.x < margin || head2.x > w - margin || 
                     head2.y < margin || head2.y > h - margin

  // 更新身体（纽带物理效果：平滑插值）
  const bodyCount = body.length
  for (let i = 0; i < bodyCount; i++) {
    const ratio = (i + 1) / (bodyCount + 1)
    const targetX = head1.x + (head2.x - head1.x) * ratio
    const targetY = head1.y + (head2.y - head1.y) * ratio
    
    // 增加一点弹性效果
    body[i].x += (targetX - body[i].x) * 0.2
    body[i].y += (targetY - body[i].y) * 0.2
  }

  // 吃到食物
  const dist1 = Math.hypot(head1.x - food.x, head1.y - food.y)
  const dist2 = Math.hypot(head2.x - food.x, head2.y - food.y)
  
  if (dist1 < 20 || dist2 < 20) {
    score.value += 10
    maxBondDist += 20 // 吃到食物，允许离得更远
    spawnFood()
    
    // 增加纽带节点
    const midX = (head1.x + head2.x) / 2
    const midY = (head1.y + head2.y) / 2
    body.push({ x: midX, y: midY })

    ElMessage({
      message: '默契 +10! 纽带变长了',
      type: 'success',
      duration: 1000,
      offset: 100
    })
  }

  // 粒子效果
  if (Math.random() > 0.8) {
    particles.push({
      x: (head1.x + head2.x) / 2 + (Math.random() - 0.5) * 20,
      y: (head1.y + head2.y) / 2 + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 1,
      vy: (Math.random() - 0.5) * 1,
      life: 1.0,
      color: '#ff4fac'
    })
  }
  
  particles = particles.filter(p => {
    p.x += p.vx
    p.y += p.vy
    p.life -= 0.02
    return p.life > 0
  })
}

const draw = () => {
  if (!ctx || !canvasRef.value) return
  const w = canvasRef.value.width
  const h = canvasRef.value.height

  ctx.clearRect(0, 0, w, h)

  // 绘制背景网格
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)'
  ctx.lineWidth = 1
  for (let i = 0; i < w; i += 50) {
    ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke()
  }
  for (let i = 0; i < h; i += 50) {
    ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke()
  }

  // 绘制粒子
  particles.forEach(p => {
    ctx!.fillStyle = p.color
    ctx!.globalAlpha = p.life
    ctx!.beginPath(); ctx!.arc(p.x, p.y, 2, 0, Math.PI * 2); ctx!.fill()
  })
  ctx!.globalAlpha = 1.0

  // 绘制纽带（身体）
  ctx.setLineDash([5, 5])
  ctx.strokeStyle = currentBondDist > maxBondDist * 0.8 ? '#ff4d4d' : 'rgba(255, 79, 172, 0.3)'
  ctx.beginPath()
  ctx.moveTo(head1.x, head1.y)
  body.forEach(p => ctx!.lineTo(p.x, p.y))
  ctx.lineTo(head2.x, head2.y)
  ctx.stroke()
  ctx.setLineDash([])

  body.forEach((p, i) => {
    const colorRatio = currentBondDist > maxBondDist * 0.8 ? '255, 77, 77' : '255, 79, 172'
    ctx!.fillStyle = `rgba(${colorRatio}, ${0.4 + (i / body.length) * 0.4})`
    ctx!.beginPath(); ctx!.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx!.fill()
  })

  // 绘制食物
  const foodPulse = Math.sin(Date.now() / 200) * 3
  ctx.fillStyle = '#ff4d79'
  ctx.shadowBlur = 15 + foodPulse
  ctx.shadowColor = '#ff4d79'
  ctx.beginPath(); ctx.arc(food.x, food.y, 10 + foodPulse, 0, Math.PI * 2); ctx.fill()
  ctx.shadowBlur = 0

  // 绘制两个头
  drawHead(head1, '#00f2fe', '👦')
  drawHead(head2, '#ff4fac', '👧')
}

const drawHead = (p: Point, color: string, emoji: string) => {
  if (!ctx) return
  ctx.fillStyle = color
  ctx.shadowBlur = 20
  ctx.shadowColor = color
  ctx.beginPath(); ctx.arc(p.x, p.y, 15, 0, Math.PI * 2); ctx.fill()
  ctx.shadowBlur = 0
  
  ctx.font = '20px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(emoji, p.x, p.y)
}

const gameLoop = (timestamp: number) => {
  if (!gameStarted.value) return
  
  const deltaTime = timestamp - lastTime
  if (deltaTime > 16) {
    update()
    draw()
    lastTime = timestamp
  }
  
  animationFrameId = requestAnimationFrame(gameLoop)
}

const resultMessage = ref('')
const gameOver = (msg: string) => {
  resultMessage.value = msg || '游戏结束'
  showResult.value = true
}

const endGame = () => {
  gameStarted.value = false
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})
</script>

<style scoped>
.joint-snake-game {
  height: 100vh;
  background: #0f172a;
  color: white;
  font-family: "PingFang SC", sans-serif;
  overflow: hidden;
  position: relative;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.game-menu {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 500px;
  padding: 40px;
  border-radius: 30px;
  text-align: center;
  z-index: 10;
}

.game-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.title {
  font-size: 32px;
  margin-bottom: 15px;
  background: linear-gradient(45deg, #00f2fe, #4facfe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.desc {
  color: #94a3b8;
  line-height: 1.8;
  margin-bottom: 30px;
}

.role-preview {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin-bottom: 40px;
}

.role-box {
  flex: 1;
  padding: 20px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 20px;
}

.key-badge {
  display: inline-block;
  padding: 5px 15px;
  background: #334155;
  border-radius: 8px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #00f2fe;
}

.start-btn {
  width: 100%;
  height: 54px;
  font-size: 18px;
  background: linear-gradient(45deg, #00f2fe, #4facfe) !important;
  border: none !important;
  box-shadow: 0 10px 20px rgba(79, 172, 254, 0.3) !important;
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
  background: rgba(15, 23, 42, 0.8);
  backdrop-filter: blur(10px);
  z-index: 10;
}

.back-btn {
  color: white !important;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.back-btn:hover {
  opacity: 0.8;
}

.stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-item .label {
  font-size: 12px;
  color: #94a3b8;
}

.stat-item .value {
  font-size: 20px;
  font-weight: bold;
  color: #00f2fe;
}

.game-title {
  font-weight: 600;
  letter-spacing: 2px;
  color: rgba(255, 255, 255, 0.5);
}

.canvas-container {
  flex: 1;
  position: relative;
  overflow: hidden;
}

canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.mobile-controls {
  position: absolute;
  bottom: 40px;
  left: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  padding: 0 20px;
  pointer-events: none;
}

.p1-controls, .p2-controls {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  pointer-events: auto;
}

.ctrl-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 24px;
  backdrop-filter: blur(5px);
}

.ctrl-btn:active {
  background: rgba(79, 172, 254, 0.3);
}

.mobile-controls .label {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.5);
}

.danger-indicator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  border: 4px solid #ff4d4d;
  opacity: 0;
  transition: opacity 0.3s;
  box-shadow: inset 0 0 50px rgba(255, 77, 77, 0.5);
  z-index: 2;
}

.danger-indicator.active {
  opacity: 1;
  animation: danger-pulse 1s infinite alternate;
}

@keyframes danger-pulse {
  from { opacity: 0.3; box-shadow: inset 0 0 30px rgba(255, 77, 77, 0.3); }
  to { opacity: 0.8; box-shadow: inset 0 0 70px rgba(255, 77, 77, 0.6); }
}

/* 倒计时样式 */
.countdown-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: rgba(15, 23, 42, 0.4);
  backdrop-filter: blur(4px);
  z-index: 100;
  pointer-events: none;
}

.count-number {
  font-size: 120px;
  font-weight: 900;
  color: #00f2fe;
  text-shadow: 0 0 30px rgba(0, 242, 254, 0.5);
  animation: count-in 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite;
}

.count-text {
  font-size: 24px;
  color: white;
  letter-spacing: 4px;
  margin-top: -20px;
  opacity: 0.8;
}

@keyframes count-in {
  0% { transform: scale(2); opacity: 0; }
  50% { transform: scale(1); opacity: 1; }
  100% { transform: scale(0.8); opacity: 0; }
}

/* 结果弹窗 */
.result-overlay {
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

.result-card {
  text-align: center;
  padding: 40px;
  background: rgba(15, 23, 42, 0.9);
  border-radius: 30px;
  border: 1px solid rgba(0, 242, 254, 0.3);
  box-shadow: 0 0 50px rgba(0, 242, 254, 0.1);
}

.result-icon {
  font-size: 60px;
  margin-bottom: 20px;
}

.result-msg {
  color: #ff4d4d;
  margin: 10px 0;
  font-size: 16px;
}

.result-btns {
  display: flex;
  gap: 15px;
  margin-top: 30px;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
