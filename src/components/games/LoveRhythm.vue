<template>
  <div class="love-rhythm-game">
    <div v-if="!gameStarted" class="game-menu glass-effect">
      <el-button class="menu-back-btn" link @click="$emit('back')">
        <el-icon><ArrowLeft /></el-icon>
        返回大厅
      </el-button>
      <div class="menu-content">
        <div class="game-icon">🎵❤️</div>
        <h2 class="title">共鸣节拍</h2>
        <p class="desc">
          <span>你弹和弦，我弹主旋律</span><br/>
          <span>共同谱写属于我们的恋爱乐章</span>
        </p>
        
        <div class="role-preview">
          <div class="role-box p1">
            <div class="keys">A S D F</div>
            <p>左侧节奏</p>
          </div>
          <div class="role-box p2">
            <div class="keys">H J K L</div>
            <p>右侧旋律</p>
          </div>
        </div>

        <el-button class="start-btn" type="primary" size="large" round @click="startGame">
          开始合奏
        </el-button>
      </div>
    </div>

    <div v-else class="game-play">
      <div class="game-header">
        <el-button class="back-btn" link @click="$emit('back')">
          <el-icon><ArrowLeft /></el-icon>
          返回游戏主页
        </el-button>
        <div class="score-display">
          <div class="score-num">{{ score }}</div>
          <div class="combo" v-if="combo > 1">{{ combo }} COMBO!</div>
        </div>
        <div class="harmony-meter">
          <div class="meter-bar" :style="{ width: harmony + '%' }"></div>
          <div class="meter-label">共鸣度 {{ Math.round(harmony) }}%</div>
        </div>
      </div>

      <div class="rhythm-stage" :class="{ 'is-shaking': isShaking }">
        <div class="track-container p1-tracks">
          <div v-for="i in 4" :key="'p1-'+i" class="track">
            <div class="hit-zone" :class="{ active: p1Keys[i-1] }"></div>
            <div 
              v-for="note in p1Notes.filter(n => !n.hit && n.track === i-1)" 
              :key="note.id"
              class="note"
              :style="{ top: note.pos + '%' }"
            ></div>
            <!-- 点击特效层 -->
            <div v-for="effect in p1Effects.filter(e => e.track === i-1)" :key="effect.id" 
                 class="hit-effect" :class="effect.type">
              {{ effect.text }}
            </div>
          </div>
        </div>

        <div class="center-divider">
          <div class="heart-pulse" :style="{ transform: `scale(${1 + combo * 0.01})` }">
            <span class="heart-main">❤️</span>
            <div class="heart-glow"></div>
          </div>
        </div>

        <div class="track-container p2-tracks">
          <div v-for="i in 4" :key="'p2-'+i" class="track">
            <div class="hit-zone" :class="{ active: p2Keys[i-1] }"></div>
            <div 
              v-for="note in p2Notes.filter(n => !n.hit && n.track === i-1)" 
              :key="note.id"
              class="note melody"
              :style="{ top: note.pos + '%' }"
            ></div>
            <!-- 点击特效层 -->
            <div v-for="effect in p2Effects.filter(e => e.track === i-1)" :key="effect.id" 
                 class="hit-effect" :class="effect.type">
              {{ effect.text }}
            </div>
          </div>
        </div>
      </div>

      <!-- 结果弹窗 -->
      <transition name="scale">
        <div v-if="showResult" class="result-overlay glass-effect">
          <div class="result-card">
            <div class="result-icon">🎶</div>
            <h3>合奏完成！</h3>
            <div class="result-stats">
              <div class="stat">
                <span class="label">最终得分</span>
                <span class="val">{{ score }}</span>
              </div>
              <div class="stat">
                <span class="label">最高连击</span>
                <span class="val">{{ maxCombo }}</span>
              </div>
              <div class="stat">
                <span class="label">共鸣等级</span>
                <span class="val">{{ harmonyLevel }}</span>
              </div>
            </div>
            <div class="result-btns">
              <el-button type="primary" round @click="startGame">再次挑战</el-button>
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
const showResult = ref(false)
const score = ref(0)
const combo = ref(0)
const maxCombo = ref(0)
const harmony = ref(50)
const isShaking = ref(false)

interface Note {
  id: number
  track: number
  pos: number
  hit: boolean
}

interface Effect {
  id: number
  track: number
  text: string
  type: 'perfect' | 'good' | 'miss'
}

const p1Notes = ref<Note[]>([])
const p2Notes = ref<Note[]>([])
const p1Effects = ref<Effect[]>([])
const p2Effects = ref<Effect[]>([])
const p1Keys = ref([false, false, false, false])
const p2Keys = ref([false, false, false, false])

let effectId = 0

const triggerEffect = (player: 1 | 2, track: number, type: 'perfect' | 'good' | 'miss') => {
  const id = effectId++
  const text = type.toUpperCase()
  const effects = player === 1 ? p1Effects.value : p2Effects.value
  
  effects.push({ id, track, text, type })
  
  if (type === 'miss') {
    isShaking.value = true
    setTimeout(() => isShaking.value = false, 200)
  }

  setTimeout(() => {
    const idx = effects.findIndex(e => e.id === id)
    if (idx !== -1) effects.splice(idx, 1)
  }, 600)
}

let gameLoopId: number | null = null
let noteId = 0
let lastNoteTime = 0

const startGame = () => {
  gameStarted.value = true
  showResult.value = false
  score.value = 0
  combo.value = 0
  maxCombo.value = 0
  harmony.value = 50
  p1Notes.value = []
  p2Notes.value = []
  lastNoteTime = 0
  
  gameLoopId = requestAnimationFrame(update)
}

const update = (timestamp: number) => {
  if (!gameStarted.value || showResult.value) return

  // 生成音符
  if (timestamp - lastNoteTime > 600) {
    if (Math.random() > 0.3) {
      p1Notes.value.push({ id: noteId++, track: Math.floor(Math.random() * 4), pos: -10, hit: false })
    }
    if (Math.random() > 0.3) {
      p2Notes.value.push({ id: noteId++, track: Math.floor(Math.random() * 4), pos: -10, hit: false })
    }
    lastNoteTime = timestamp
  }

  // 移动音符
  const moveNotes = (notes: Note[]) => {
    for (let i = notes.length - 1; i >= 0; i--) {
      const note = notes[i]
      if (!note) continue
      
      note.pos += 0.8
      if (note.pos > 100) {
        if (!note.hit) {
          handleMiss()
        }
        notes.splice(i, 1)
      }
    }
  }

  moveNotes(p1Notes.value)
  moveNotes(p2Notes.value)

  // 缓慢降低共鸣度
  harmony.value = Math.max(0, harmony.value - 0.05)

  if (harmony.value <= 0) {
    // endGame(true) // 可以设置失败条件，但恋爱游戏通常不设置强制失败
  }

  gameLoopId = requestAnimationFrame(update)
}

const handleHit = (player: 1 | 2, track: number) => {
  const notes = player === 1 ? p1Notes.value : p2Notes.value
  const hitNote = notes.find(n => n.track === track && n.pos > 75 && n.pos < 95 && !n.hit)
  
  if (hitNote) {
    hitNote.hit = true
    const precision = Math.abs(hitNote.pos - 87) // 87 是最完美点
    const type = precision < 4 ? 'perfect' : 'good'
    
    score.value += (type === 'perfect' ? 200 : 100) + combo.value * 10
    combo.value++
    maxCombo.value = Math.max(maxCombo.value, combo.value)
    harmony.value = Math.min(100, harmony.value + (type === 'perfect' ? 3 : 1))
    
    triggerEffect(player, track, type)
  } else {
    handleMiss(player, track)
  }
}

const handleMiss = (player?: 1 | 2, track?: number) => {
  combo.value = 0
  harmony.value = Math.max(0, harmony.value - 5)
  if (player !== undefined && track !== undefined) {
    triggerEffect(player, track, 'miss')
  }
}

const handleKeyDown = (e: KeyboardEvent) => {
  const keyMap1 = ['a', 's', 'd', 'f']
  const keyMap2 = ['h', 'j', 'k', 'l']
  
  const idx1 = keyMap1.indexOf(e.key.toLowerCase())
  if (idx1 !== -1) {
    p1Keys.value[idx1] = true
    handleHit(1, idx1)
  }
  
  const idx2 = keyMap2.indexOf(e.key.toLowerCase())
  if (idx2 !== -1) {
    p2Keys.value[idx2] = true
    handleHit(2, idx2)
  }
}

const handleKeyUp = (e: KeyboardEvent) => {
  const keyMap1 = ['a', 's', 'd', 'f']
  const keyMap2 = ['h', 'j', 'k', 'l']
  
  const idx1 = keyMap1.indexOf(e.key.toLowerCase())
  if (idx1 !== -1) p1Keys.value[idx1] = false
  
  const idx2 = keyMap2.indexOf(e.key.toLowerCase())
  if (idx2 !== -1) p2Keys.value[idx2] = false
}

const harmonyLevel = computed(() => {
  if (harmony.value > 90) return '灵魂伴侣'
  if (harmony.value > 70) return '心有灵犀'
  if (harmony.value > 50) return '渐入佳境'
  return '磨合中'
})

const endGame = () => {
  showResult.value = true
  if (gameLoopId) cancelAnimationFrame(gameLoopId)
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('keyup', handleKeyUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('keyup', handleKeyUp)
  if (gameLoopId) cancelAnimationFrame(gameLoopId)
})
</script>

<style scoped>
.love-rhythm-game {
  height: 100vh;
  background: #050505;
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
  background: linear-gradient(45deg, #00f2fe, #4facfe);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.keys {
  font-family: monospace;
  font-size: 20px;
  letter-spacing: 5px;
  color: #00f2fe;
  margin-bottom: 10px;
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
  background: rgba(0,0,0,0.8);
  z-index: 5;
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

.score-display {
  text-align: center;
}

.score-num { font-size: 28px; font-weight: bold; color: #00f2fe; }
.combo { font-size: 14px; color: #ff4d79; animation: pulse 0.2s; }

.harmony-meter {
  width: 150px;
  height: 10px;
  background: rgba(255,255,255,0.1);
  border-radius: 5px;
  position: relative;
}

.meter-bar {
  height: 100%;
  background: linear-gradient(to right, #4facfe, #00f2fe);
  border-radius: 5px;
  transition: width 0.3s;
}

.meter-label {
  position: absolute;
  top: 15px;
  width: 100%;
  text-align: center;
  font-size: 10px;
  color: #999;
}

.rhythm-stage {
  flex: 1;
  display: flex;
  padding: 0 40px;
  position: relative;
  transition: transform 0.1s;
}

.rhythm-stage.is-shaking {
  animation: shake 0.2s infinite;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.track-container {
  flex: 1;
  display: flex;
  gap: 10px;
  height: 100%;
}

.track {
  flex: 1;
  background: linear-gradient(to bottom, rgba(255,255,255,0.02), rgba(255,255,255,0.05));
  position: relative;
  border-left: 1px solid rgba(255,255,255,0.05);
  border-right: 1px solid rgba(255,255,255,0.05);
}

.hit-zone {
  position: absolute;
  bottom: 10%;
  width: 100%;
  height: 60px;
  border-top: 2px solid rgba(0, 242, 254, 0.2);
  border-bottom: 2px solid rgba(0, 242, 254, 0.2);
  background: rgba(0, 242, 254, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

.hit-zone::after {
  content: '';
  width: 100%;
  height: 2px;
  background: rgba(0, 242, 254, 0.5);
  box-shadow: 0 0 10px rgba(0, 242, 254, 0.8);
}

.hit-zone.active {
  background: rgba(0, 242, 254, 0.3);
  box-shadow: inset 0 0 20px rgba(0, 242, 254, 0.5);
}

/* 点击特效 */
.hit-effect {
  position: absolute;
  bottom: 15%;
  left: 50%;
  transform: translateX(-50%);
  font-weight: 900;
  font-size: 24px;
  pointer-events: none;
  animation: effect-up 0.6s ease-out forwards;
  z-index: 10;
  text-shadow: 0 0 10px currentColor;
}

.hit-effect.perfect { color: #ffeb3b; font-size: 32px; }
.hit-effect.good { color: #00f2fe; }
.hit-effect.miss { color: #ff4d4d; }

@keyframes effect-up {
  0% { transform: translate(-50%, 0) scale(0.5); opacity: 0; }
  20% { transform: translate(-50%, -20px) scale(1.2); opacity: 1; }
  100% { transform: translate(-50%, -60px) scale(1); opacity: 0; }
}

.note {
  position: absolute;
  width: calc(100% - 4px);
  left: 2px;
  height: 20px;
  background: linear-gradient(to right, #00f2fe, #4facfe);
  box-shadow: 0 0 20px rgba(0, 242, 254, 0.8);
  border-radius: 10px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.note.melody {
  background: linear-gradient(to right, #ff4d79, #ff9a9e);
  box-shadow: 0 0 20px rgba(255, 77, 121, 0.8);
}

.center-divider {
  width: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.heart-pulse {
  position: relative;
  font-size: 50px;
  z-index: 2;
  transition: transform 0.1s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.heart-glow {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 60px;
  height: 60px;
  background: radial-gradient(circle, rgba(255, 77, 121, 0.6) 0%, transparent 70%);
  border-radius: 50%;
  animation: glow-pulse 2s infinite;
  z-index: -1;
}

@keyframes glow-pulse {
  0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.5; }
  50% { transform: translate(-50%, -50%) scale(2); opacity: 0.2; }
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
  background: rgba(10, 10, 10, 0.95);
  border-radius: 40px;
  width: 90%;
  max-width: 400px;
  border: 1px solid #00f2fe;
}

.result-stats {
  margin: 30px 0;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.stat {
  display: flex;
  justify-content: space-between;
  padding: 10px;
  background: rgba(255,255,255,0.05);
  border-radius: 10px;
}

.stat .val { color: #00f2fe; font-weight: bold; }

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}
</style>
