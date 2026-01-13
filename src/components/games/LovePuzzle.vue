<template>
  <div class="love-puzzle-game">
    <div v-if="!gameStarted" class="game-menu glass-effect">
      <el-button class="menu-back-btn" link @click="$emit('back')">
        <el-icon><ArrowLeft /></el-icon>
        返回大厅
      </el-button>
      <div class="menu-content">
        <div class="game-icon">🧩❤️</div>
        <h2 class="title">爱意拼图</h2>
        <p class="desc">
          <span>将散落的记忆碎片重新拼凑</span><br/>
          <span>这是属于你们共同的甜蜜瞬间</span>
        </p>
        
        <div class="difficulty-selector">
          <div 
            v-for="d in difficulties" 
            :key="d.label"
            class="diff-item"
            :class="{ active: gridSize === d.value }"
            @click="gridSize = d.value"
          >
            {{ d.label }}
          </div>
        </div>

        <el-button class="start-btn" type="primary" size="large" round @click="startGame">
          开始拼图
        </el-button>
      </div>
    </div>

    <div v-else class="game-play">
      <div class="game-header">
        <el-button class="back-btn" link @click="$emit('back')">
          <el-icon><ArrowLeft /></el-icon>
          返回游戏主页
        </el-button>
        <div class="game-info">
          <span class="timer">⏱️ {{ formatTime(timer) }}</span>
          <span class="progress">已完成: {{ completionPercentage }}%</span>
        </div>
        <el-button size="small" type="primary" plain @click="showOriginal = !showOriginal">
          {{ showOriginal ? '回到游戏' : '查看原图' }}
        </el-button>
      </div>

      <div class="puzzle-container" ref="containerRef">
        <!-- 原图参考 -->
        <div v-if="showOriginal" class="original-preview">
          <img :src="puzzleImage" alt="Original" />
        </div>

        <!-- 拼图板 -->
        <div 
          v-else 
          class="puzzle-board"
          :style="boardStyle"
        >
          <div 
            v-for="piece in pieces" 
            :key="piece.id"
            class="puzzle-piece"
            :class="{ 'is-correct': piece.isCorrect, 'is-dragging': draggingId === piece.id }"
            :style="getPieceStyle(piece)"
            @mousedown="startDrag($event, piece)"
            @touchstart="startDrag($event, piece)"
          >
            <div class="piece-content" :style="getPieceContentStyle(piece)"></div>
          </div>
        </div>
      </div>

      <!-- 胜利弹窗 -->
      <transition name="scale">
        <div v-if="gameWin" class="win-overlay glass-effect">
          <div class="win-card">
            <div class="win-icon">🎊</div>
            <h3>拼图完成！</h3>
            <p>你们用时 {{ formatTime(timer) }} 拼凑出了这段美好记忆</p>
            <div class="final-image">
              <img :src="puzzleImage" alt="Finished" />
            </div>
            <div class="win-btns">
              <el-button type="primary" round @click="startGame">换一张再玩</el-button>
              <el-button round @click="gameStarted = false">返回大厅</el-button>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ArrowLeft } from '@element-plus/icons-vue'

const emit = defineEmits(['back'])
const gameStarted = ref(false)
const gameWin = ref(false)
const showOriginal = ref(false)
const timer = ref(0)
const gridSize = ref(3) // 3x3, 4x4 etc.
const draggingId = ref<number | null>(null)
let timerInterval: number | null = null

const difficulties = [
  { label: '初级 (3x3)', value: 3 },
  { label: '中级 (4x4)', value: 4 },
  { label: '高级 (5x5)', value: 5 }
]

// 拼图图片（使用一张高质量的浪漫插画）
const puzzleImage = 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=1000&auto=format&fit=crop'

interface Piece {
  id: number
  currentX: number
  currentY: number
  targetX: number
  targetY: number
  isCorrect: boolean
}

const pieces = ref<Piece[]>([])
const containerRef = ref<HTMLDivElement | null>(null)

const startGame = () => {
  gameStarted.value = true
  gameWin.value = false
  showOriginal.value = false
  timer.value = 0
  initPuzzle()
  startTimer()
}

const initPuzzle = () => {
  const newPieces: Piece[] = []
  const total = gridSize.value * gridSize.value
  
  for (let i = 0; i < total; i++) {
    const row = Math.floor(i / gridSize.value)
    const col = i % gridSize.value
    
    newPieces.push({
      id: i,
      targetX: col,
      targetY: row,
      // 随机初始位置
      currentX: Math.random() * 80, 
      currentY: Math.random() * 80,
      isCorrect: false
    })
  }
  
  pieces.value = newPieces
  checkCompletion()
}

const startTimer = () => {
  if (timerInterval) clearInterval(timerInterval)
  timerInterval = window.setInterval(() => {
    timer.value++
  }, 1000)
}

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
}

const completionPercentage = computed(() => {
  const correct = pieces.value.filter(p => p.isCorrect).length
  return Math.round((correct / pieces.value.length) * 100)
})

const boardStyle = computed(() => ({
  aspectRatio: '1/1',
  width: '100%',
  maxWidth: '500px',
  position: 'relative',
  background: 'rgba(255,255,255,0.05)',
  borderRadius: '15px',
  overflow: 'hidden',
  border: '2px solid rgba(255,255,255,0.1)'
}))

const getPieceStyle = (piece: Piece) => {
  const size = 100 / gridSize.value
  return {
    width: `${size}%`,
    height: `${size}%`,
    left: `${piece.currentX}%`,
    top: `${piece.currentY}%`,
    position: 'absolute',
    zIndex: draggingId.value === piece.id ? 10 : 1,
    transition: draggingId.value === piece.id ? 'none' : 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    cursor: piece.isCorrect ? 'default' : 'grab'
  }
}

const getPieceContentStyle = (piece: Piece) => {
  const size = 100 / gridSize.value
  return {
    width: '100%',
    height: '100%',
    backgroundImage: `url(${puzzleImage})`,
    backgroundSize: `${gridSize.value * 100}% ${gridSize.value * 100}%`,
    backgroundPosition: `${(piece.targetX / (gridSize.value - 1)) * 100}% ${(piece.targetY / (gridSize.value - 1)) * 100}%`,
    borderRadius: '4px',
    boxShadow: piece.isCorrect ? 'none' : '0 4px 12px rgba(0,0,0,0.2)',
    border: piece.isCorrect ? '1px solid rgba(255,255,255,0.1)' : '2px solid white'
  }
}

let startX = 0
let startY = 0
let initialPieceX = 0
let initialPieceY = 0

const startDrag = (e: MouseEvent | TouchEvent, piece: Piece) => {
  if (piece.isCorrect) return
  
  draggingId.value = piece.id
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  
  startX = clientX
  startY = clientY
  initialPieceX = piece.currentX
  initialPieceY = piece.currentY
  
  window.addEventListener('mousemove', handleDrag)
  window.addEventListener('touchmove', handleDrag, { passive: false })
  window.addEventListener('mouseup', stopDrag)
  window.addEventListener('touchend', stopDrag)
}

const handleDrag = (e: MouseEvent | TouchEvent) => {
  if (draggingId.value === null || !containerRef.value) return
  
  const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
  const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY
  
  const dx = ((clientX - startX) / containerRef.value.clientWidth) * 100
  const dy = ((clientY - startY) / containerRef.value.clientHeight) * 100
  
  const piece = pieces.value.find(p => p.id === draggingId.value)
  if (piece) {
    piece.currentX = Math.max(0, Math.min(100 - 100 / gridSize.value, initialPieceX + dx))
    piece.currentY = Math.max(0, Math.min(100 - 100 / gridSize.value, initialPieceY + dy))
  }
  
  if ('touches' in e) e.preventDefault()
}

const stopDrag = () => {
  if (draggingId.value === null) return
  
  const piece = pieces.value.find(p => p.id === draggingId.value)
  if (piece) {
    const size = 100 / gridSize.value
    const targetX = piece.targetX * size
    const targetY = piece.targetY * size
    
    // 吸附检查
    if (Math.abs(piece.currentX - targetX) < 5 && Math.abs(piece.currentY - targetY) < 5) {
      piece.currentX = targetX
      piece.currentY = targetY
      piece.isCorrect = true
      checkCompletion()
    }
  }
  
  draggingId.value = null
  window.removeEventListener('mousemove', handleDrag)
  window.removeEventListener('touchmove', handleDrag)
  window.removeEventListener('mouseup', stopDrag)
  window.removeEventListener('touchend', stopDrag)
}

const checkCompletion = () => {
  if (pieces.value.every(p => p.isCorrect)) {
    gameWin.value = true
    if (timerInterval) clearInterval(timerInterval)
  }
}

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})
</script>

<style scoped>
.love-puzzle-game {
  height: 100vh;
  background: #1a1a2e;
  color: white;
  overflow: hidden;
  position: relative;
  font-family: "PingFang SC", sans-serif;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(15px);
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
  border-radius: 40px;
  text-align: center;
  z-index: 10;
}

.title {
  font-size: 32px;
  margin-bottom: 15px;
  background: linear-gradient(45deg, #ff758c, #ff7eb3);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.difficulty-selector {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin: 30px 0;
}

.diff-item {
  padding: 10px 20px;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: all 0.3s;
}

.diff-item.active {
  background: #ff758c;
  box-shadow: 0 5px 15px rgba(255, 117, 140, 0.4);
}

.start-btn {
  width: 100%;
  height: 54px;
  font-size: 18px;
  background: linear-gradient(45deg, #ff758c, #ff7eb3) !important;
  border: none !important;
  box-shadow: 0 10px 20px rgba(255, 117, 140, 0.3) !important;
}

/* 游戏界面 */
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

.game-info {
  display: flex;
  gap: 20px;
  font-weight: 600;
}

.puzzle-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.puzzle-board {
  box-shadow: 0 20px 50px rgba(0,0,0,0.5);
}

.original-preview img {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 15px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
}

.puzzle-piece.is-correct {
  z-index: 0 !important;
}

.puzzle-piece.is-dragging {
  cursor: grabbing;
}

/* 胜利界面 */
.win-overlay {
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

.win-card {
  text-align: center;
  padding: 40px;
  background: rgba(26, 26, 46, 0.95);
  border-radius: 40px;
  max-width: 500px;
  width: 90%;
  border: 2px solid #ff758c;
}

.win-icon { font-size: 60px; margin-bottom: 10px; }

.final-image {
  margin: 20px 0;
}

.final-image img {
  width: 100%;
  border-radius: 15px;
}

.win-btns {
  display: flex;
  gap: 15px;
}

.scale-enter-active, .scale-leave-active {
  transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.scale-enter-from, .scale-leave-to {
  transform: scale(0.5);
  opacity: 0;
}
</style>
