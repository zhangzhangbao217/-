<template>
  <div class="love-sketch-game">
    <div v-if="!gameStarted" class="game-menu glass-effect">
      <el-button class="menu-back-btn" link @click="$emit('back')">
        <el-icon><ArrowLeft /></el-icon>
        返回大厅
      </el-button>
      <div class="menu-content">
        <div class="game-icon">🎨❤️</div>
        <h2 class="title">爱意涂鸦</h2>
        <p class="desc">
          <span>用画笔传递只有你们才懂的恋爱梗</span><br/>
          <span>看谁才是对方肚子里的“蛔虫”</span>
        </p>
        
        <div class="role-selection">
          <div 
            class="role-card" 
            :class="{ active: myRole === 'drawer' }"
            @click="myRole = 'drawer'"
          >
            <div class="role-icon">🖌️</div>
            <p>我是画手</p>
          </div>
          <div 
            class="role-card" 
            :class="{ active: myRole === 'guesser' }"
            @click="myRole = 'guesser'"
          >
            <div class="role-icon">🔍</div>
            <p>我是猜手</p>
          </div>
        </div>

        <el-button class="start-btn" type="primary" size="large" round @click="startGame">
          开始创作
        </el-button>
      </div>
    </div>

    <div v-else class="game-play">
      <div class="game-header">
        <el-button class="back-btn" link @click="$emit('back')">
          <el-icon><ArrowLeft /></el-icon>
          返回游戏主页
        </el-button>
        <div class="game-status">
          <span v-if="myRole === 'drawer'">请画出: <strong class="word">{{ currentWord }}</strong></span>
          <span v-else>正在观察对方创作...</span>
        </div>
        <div class="timer">⏱️ {{ timeLeft }}s</div>
      </div>

      <div class="sketch-container">
        <!-- 画布 -->
        <div class="canvas-wrapper glass-effect">
          <canvas 
            ref="canvasRef"
            @mousedown="startDrawing"
            @mousemove="draw"
            @mouseup="stopDrawing"
            @touchstart="startDrawing"
            @touchmove="draw"
            @touchend="stopDrawing"
            :class="{ 'no-pointer': myRole === 'guesser' }"
          ></canvas>
          
          <!-- 画笔工具栏 (仅画手可见) -->
          <div v-if="myRole === 'drawer'" class="toolbar">
            <div 
              v-for="c in colors" 
              :key="c"
              class="color-dot"
              :style="{ background: c }"
              :class="{ active: currentColor === c }"
              @click="currentColor = c"
            ></div>
            <div class="tool-btn" @click="clearCanvas">
              <el-icon><Delete /></el-icon>
            </div>
          </div>
        </div>

        <!-- 猜词区 (仅猜手可见) -->
        <div v-if="myRole === 'guesser'" class="guess-area">
          <el-input 
            v-model="guessInput" 
            placeholder="输入你的猜想..." 
            @keyup.enter="checkGuess"
          >
            <template #append>
              <el-button @click="checkGuess">提交</el-button>
            </template>
          </el-input>
        </div>
      </div>

      <!-- 胜利/结束弹窗 -->
      <transition name="scale">
        <div v-if="showResult" class="result-overlay glass-effect">
          <div class="result-card">
            <div class="result-icon">{{ isCorrect ? '🎉' : '⏰' }}</div>
            <h3>{{ isCorrect ? '猜对啦！' : '时间到' }}</h3>
            <p>正确答案是: <strong class="word">{{ currentWord }}</strong></p>
            <div class="result-btns">
              <el-button type="primary" round @click="nextRound">下一轮</el-button>
              <el-button round @click="gameStarted = false">返回大厅</el-button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { ArrowLeft, Delete } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['back'])
const gameStarted = ref(false)
const showResult = ref(false)
const myRole = ref<'drawer' | 'guesser'>('drawer')
const currentWord = ref('')
const guessInput = ref('')
const timeLeft = ref(60)
const isCorrect = ref(false)
let timerInterval: number | null = null

const colors = ['#000000', '#ff4d79', '#4facfe', '#4caf50', '#ffeb3b', '#9c27b0']
const currentColor = ref('#ff4d79')

const words = ['亲亲', '拥抱', '看电影', '喝奶茶', '玫瑰花', '游乐园', '牵手', '烛光晚餐', '爱心', '结婚戒指', '一见钟情', '摩天轮', '海边日落', '猫咪', '围巾']

const canvasRef = ref<HTMLCanvasElement | null>(null)
let ctx: CanvasRenderingContext2D | null = null
let isDrawing = false

const startGame = () => {
  gameStarted.value = true
  showResult.value = false
  isCorrect.value = false
  timeLeft.value = 60
  currentWord.value = words[Math.floor(Math.random() * words.length)] || ''
  
  nextTick(() => {
    initCanvas()
    startTimer()
  })
}

const initCanvas = () => {
  if (!canvasRef.value) return
  const canvas = canvasRef.value
  const rect = canvas.parentElement!.getBoundingClientRect()
  canvas.width = rect.width
  canvas.height = rect.height
  ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 4
  }
}

const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = window.setInterval(() => {
    timeLeft.value--
    if (timeLeft.value <= 0) {
      endRound()
    }
  }, 1000)
}

const startDrawing = (e: MouseEvent | TouchEvent) => {
  if (myRole.value === 'guesser' || !ctx) return
  isDrawing = true
  const { x, y } = getPos(e)
  ctx.beginPath()
  ctx.moveTo(x, y)
  ctx.strokeStyle = currentColor.value
}

const draw = (e: MouseEvent | TouchEvent) => {
  if (!isDrawing || !ctx) return
  const { x, y } = getPos(e)
  ctx.lineTo(x, y)
  ctx.stroke()
  
  // 在真实场景中，这里会通过 WebSocket 发送坐标点给 guesser
}

const stopDrawing = () => {
  isDrawing = false
}

const getPos = (e: MouseEvent | TouchEvent) => {
  const canvas = canvasRef.value!
  const rect = canvas.getBoundingClientRect()
  
  let clientX = 0
  let clientY = 0
  
  if ('touches' in e) {
    const touch = e.touches[0]
    if (touch) {
      clientX = touch.clientX
      clientY = touch.clientY
    }
  } else {
    clientX = e.clientX
    clientY = e.clientY
  }
  
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  }
}

const clearCanvas = () => {
  if (!ctx || !canvasRef.value) return
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
}

const checkGuess = () => {
  if (guessInput.value.trim() === currentWord.value) {
    isCorrect.value = true
    endRound()
  } else {
    ElMessage.error('不对哦，再想想！')
    guessInput.value = ''
  }
}

const endRound = () => {
  showResult.value = true
  if (timerInterval) clearInterval(timerInterval)
}

const nextRound = () => {
  // 交换角色
  myRole.value = myRole.value === 'drawer' ? 'guesser' : 'drawer'
  guessInput.value = ''
  startGame()
}

onMounted(() => {
  window.addEventListener('resize', initCanvas)
})
</script>

<style scoped>
.love-sketch-game {
  height: 100vh;
  background: #fdfcfb;
  color: #2c3e50;
  overflow: hidden;
  position: relative;
  font-family: "PingFang SC", sans-serif;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05);
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
}

.title {
  font-size: 32px;
  margin-bottom: 15px;
  background: linear-gradient(45deg, #ff9a9e, #fad0c4);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.role-selection {
  display: flex;
  gap: 20px;
  justify-content: center;
  margin: 30px 0;
}

.role-card {
  flex: 1;
  padding: 20px;
  border-radius: 20px;
  background: #f8f9fa;
  cursor: pointer;
  transition: all 0.3s;
  border: 2px solid transparent;
}

.role-card.active {
  background: white;
  border-color: #ff9a9e;
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(255, 154, 158, 0.2);
}

.role-icon { font-size: 40px; margin-bottom: 10px; }

.start-btn {
  width: 100%;
  height: 54px;
  font-size: 18px;
  background: linear-gradient(45deg, #ff9a9e, #fad0c4) !important;
  border: none !important;
  box-shadow: 0 10px 20px rgba(255, 154, 158, 0.3) !important;
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
  border-bottom: 1px solid #eee;
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

.word { color: #ff4d79; font-size: 20px; margin-left: 10px; }

.sketch-container {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background: #f5f7fa;
}

.canvas-wrapper {
  flex: 1;
  position: relative;
  border-radius: 20px;
  overflow: hidden;
}

canvas {
  width: 100%;
  height: 100%;
  background: white;
  cursor: crosshair;
}

.no-pointer { cursor: default; pointer-events: none; }

.toolbar {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  background: white;
  padding: 10px 20px;
  border-radius: 30px;
  display: flex;
  gap: 15px;
  align-items: center;
  box-shadow: 0 5px 20px rgba(0,0,0,0.1);
}

.color-dot {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  transition: transform 0.2s;
}

.color-dot.active { transform: scale(1.3); border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.2); }

.tool-btn {
  font-size: 20px;
  cursor: pointer;
  color: #666;
}

.guess-area {
  max-width: 500px;
  margin: 0 auto;
  width: 100%;
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
  background: white;
  border-radius: 40px;
  width: 90%;
  max-width: 400px;
}

.result-icon { font-size: 60px; margin-bottom: 10px; }
.result-btns { display: flex; gap: 15px; margin-top: 30px; }

@media (max-width: 480px) {
  .toolbar { padding: 8px 15px; gap: 10px; }
  .color-dot { width: 20px; height: 20px; }
}
</style>
