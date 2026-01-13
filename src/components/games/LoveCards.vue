<template>
  <div class="love-cards-game">
    <div v-if="!gameStarted" class="game-menu glass-effect">
      <el-button class="menu-back-btn" link @click="$emit('back')">
        <el-icon><ArrowLeft /></el-icon>
        返回大厅
      </el-button>
      <div class="menu-content">
        <div class="game-icon">💌❤️</div>
        <h2 class="title">心动卡牌</h2>
        <p class="desc">
          <span>100+ 个直抵灵魂的深度问题</span>
          <br/>
          <span>放下手机，开启一场灵魂的对视与对白</span>
        </p>
        
        <div class="category-selector">
          <div 
            v-for="cat in categories" 
            :key="cat.id"
            class="cat-item"
            :class="{ active: selectedCategory === cat.id }"
            @click="selectedCategory = cat.id"
          >
            <span class="cat-icon">{{ cat.icon }}</span>
            <span class="cat-name">{{ cat.name }}</span>
          </div>
        </div>

        <el-button class="start-btn" type="primary" size="large" round @click="startGame">
          开始交流
        </el-button>
      </div>
    </div>

    <div v-else class="game-play">
      <div class="game-header">
        <el-button class="back-btn" link @click="$emit('back')">
          <el-icon><ArrowLeft /></el-icon>
          返回游戏主页
        </el-button>
        <div class="category-badge">
          {{ categories.find(c => c.id === selectedCategory)?.name }}
        </div>
        <div class="progress">
          <span class="count">{{ exploredCount }}</span>
          <span class="total">/ {{ totalQuestions }}</span>
        </div>
      </div>

      <div class="card-stage">
        <div 
          class="card-wrapper" 
          :class="{ 'is-flipped': isFlipped, 'switching': isSwitching }"
          :style="cardTransform"
          @click="handleCardClick"
          @mousemove="handleMouseMove"
          @mouseleave="resetTilt"
        >
          <!-- 粒子层 -->
          <div class="particles-container">
            <div v-for="p in particles" :key="p.id" 
                 class="particle" 
                 :style="{ 
                   left: p.x + 'px', 
                   top: p.y + 'px', 
                   '--tx': p.tx + 'px', 
                   '--ty': p.ty + 'px',
                   '--rot': p.rot + 'deg'
                 }">
              ❤️
            </div>
          </div>
          <!-- 卡片背面 -->
          <div class="card-face card-back glass-effect">
            <div class="card-pattern"></div>
            <div class="card-logo">💝</div>
            <div class="tap-to-reveal">点击揭开问题</div>
          </div>
          
          <!-- 卡片正面 -->
          <div class="card-face card-front glass-effect">
            <div class="card-inner-content">
              <div class="quote-mark top">“</div>
              <p class="question-text" :class="{ 'long-text': currentQuestion.length > 30 }">
                {{ currentQuestion }}
              </p>
              <div class="quote-mark bottom">”</div>
            </div>
            <div class="next-hint">再次点击抽取下一张</div>
          </div>
        </div>
      </div>

      <div class="game-footer">
        <div class="action-btns">
          <button class="action-btn share-btn" @click="handleAction('share')">
            <el-icon><Share /></el-icon>
            <span>分享感动</span>
          </button>
          <button class="action-btn next-btn" @click="drawCard">
            <el-icon><RefreshRight /></el-icon>
            <span>换一个</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ArrowLeft, Share, RefreshRight } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const emit = defineEmits(['back'])
const gameStarted = ref(false)
const isFlipped = ref(false)
const isSwitching = ref(false)
const exploredCount = ref(0)
const selectedCategory = ref('icebreaker')

// 3D 倾斜效果
const tilt = ref({ x: 0, y: 0 })
const cardTransform = computed(() => {
  const rotateY = isFlipped.value ? 180 + tilt.value.x : tilt.value.x
  return {
    transform: isSwitching.value ? undefined : `rotateY(${rotateY}deg) rotateX(${tilt.value.y}deg)`,
    '--rot-y': `${rotateY}deg`
  }
})

const handleMouseMove = (e: MouseEvent) => {
  if (isSwitching.value) return
  const card = e.currentTarget as HTMLElement
  const rect = card.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  const centerX = rect.width / 2
  const centerY = rect.height / 2
  
  tilt.value.x = (x - centerX) / 10
  tilt.value.y = (centerY - y) / 10
}

const resetTilt = () => {
  tilt.value.x = 0
  tilt.value.y = 0
}

// 粒子效果
const particles = ref<any[]>([])
let particleId = 0

const createParticles = (e: MouseEvent) => {
  const card = e.currentTarget as HTMLElement
  const rect = card.getBoundingClientRect()
  const count = 12
  
  for (let i = 0; i < count; i++) {
    const id = particleId++
    const angle = (Math.PI * 2 * i) / count
    const velocity = 50 + Math.random() * 50
    particles.value.push({
      id,
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      tx: Math.cos(angle) * velocity,
      ty: Math.sin(angle) * velocity,
      rot: Math.random() * 360
    })
    
    setTimeout(() => {
      particles.value = particles.value.filter(p => p.id !== id)
    }, 1000)
  }
}

const categories = [
  { id: 'icebreaker', name: '破冰初识', icon: '🌱', questions: [
    '你第一次见到我时，内心真正的想法是什么？',
    '你最喜欢我身上的哪一个特质？',
    '你理想中的“完美的一天”是怎样的？',
    '如果你能拥有一种超能力，你希望是什么？',
    '你觉得我什么时候看起来最有魅力？',
    '我们第一次约会时，哪个细节让你印象最深？',
    '如果你可以用三个词形容我，你会选哪三个？',
    '你最喜欢我的哪种穿搭风格？',
    '哪一首歌会让你立刻想起我？',
    '你最想和我一起尝试的第一个新鲜事物是什么？'
  ]},
  { id: 'deep', name: '深度灵魂', icon: '💎', questions: [
    '你认为一段长久的关系中，最重要的底线是什么？',
    '你觉得爱情中最不可或缺的三个要素是什么？',
    '如果生命只剩下最后 24 小时，你想和我怎么度过？',
    '你觉得我们的性格是互补多一点，还是相似多一点？',
    '我不在你身边的时候，你最想念我什么？',
    '你对我们的未来有什么具体的小期待吗？',
    '我做过的哪件事让你觉得最受感动？',
    '你觉得我为你做过的最勇敢的一件事是什么？',
    '你认为我们之间最需要磨合的地方在哪里？',
    '你最希望我如何表达对你的爱？'
  ]},
  { id: 'future', name: '未来蓝图', icon: '🚀', questions: [
    '你想象中我们五年后的生活是什么样子的？',
    '如果我们以后有了孩子，你希望他们更像谁？',
    '你理想中的居住城市是哪里？我们能一起去吗？',
    '你对我们共同的财务规划有什么想法？',
    '如果我们可以一起创业，你最想做什么？',
    '你希望我们老了以后，每天的生活是怎么度过的？',
    '在未来的家庭生活中，你最看重的是什么？',
    '你希望我们每年都能一起完成的一个愿望是什么？',
    '如果我们要买第一套房子，你最看重的装修细节是什么？',
    '你认为我们应该如何保持爱情的长久新鲜感？'
  ]},
  { id: 'naughty', name: '甜蜜互动', icon: '🔥', questions: [
    '现在请盯着我的眼睛看30秒，期间不许说话。',
    '如果现在可以对我做一个恶作剧，你会做什么？',
    '分享一个只有我们两个人才懂的“恋爱黑话”。',
    '如果要在对方身上纹一个图案，你希望对方纹什么？',
    '现在给我一个最长、最深情的拥抱。',
    '说出我身上的三个“萌点”。',
    '如果要把我们的故事拍成电影，你会给它起什么名字？',
    '模仿一个我平时最常做的小动作。',
    '现在请大声对我说一句你最想听的情话。',
    '如果可以交换身体一天，你第一件事会去做什么？'
  ]}
]

const currentQuestions = computed(() => {
  return categories.find(c => c.id === selectedCategory.value)?.questions || []
})

const totalQuestions = computed(() => currentQuestions.value.length)
const currentQuestion = ref('')

const startGame = () => {
  gameStarted.value = true
  exploredCount.value = 0
  drawCard()
}

const drawCard = () => {
  if (isSwitching.value) return
  
  isSwitching.value = true
  isFlipped.value = false
  
  setTimeout(() => {
    const questions = currentQuestions.value
    if (questions.length === 0) return
    let nextQ = questions[Math.floor(Math.random() * questions.length)]
    while (nextQ === currentQuestion.value && questions.length > 1) {
      nextQ = questions[Math.floor(Math.random() * questions.length)]
    }
    currentQuestion.value = nextQ || ''
    exploredCount.value++
    isSwitching.value = false
  }, 400)
}

const handleCardClick = (e: MouseEvent) => {
  if (isSwitching.value) return
  
  createParticles(e)
  
  if (!isFlipped.value) {
    isFlipped.value = true
  } else {
    drawCard()
  }
}

const handleAction = (type: string) => {
  if (type === 'share') {
    ElMessage.success('已保存当前浪漫瞬间')
  }
}
</script>

<style scoped>
.love-cards-game {
  height: 100vh;
  background: radial-gradient(circle at top right, #ffafbd, #ffc3a0);
  color: #2c3e50;
  font-family: "PingFang SC", "Microsoft YaHei", sans-serif;
  overflow: hidden;
}

.glass-effect {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

/* 菜单界面 */
.game-menu {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.menu-content {
  max-width: 500px;
  width: 100%;
  padding: 40px;
  border-radius: 40px;
  text-align: center;
}

.game-logo-container {
  position: relative;
  width: 100px;
  height: 100px;
  margin: 0 auto 20px;
}

.logo-circle {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: white;
  border-radius: 50%;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 0.4; }
  100% { transform: scale(1); opacity: 0.8; }
}

.game-logo {
  position: relative;
  font-size: 60px;
  line-height: 100px;
}

.title {
  font-size: 32px;
  margin-bottom: 15px;
  background: linear-gradient(45deg, #ff4d79, #ff9a9e);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.desc {
  font-size: 16px;
  color: #666;
  line-height: 1.6;
  margin-bottom: 30px;
}

.category-selector {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  margin-bottom: 40px;
}

.cat-item {
  padding: 15px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.5);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: 2px solid transparent;
}

.cat-item:hover {
  transform: translateY(-3px);
  background: white;
}

.cat-item.active {
  background: white;
  border-color: #ff4d79;
  box-shadow: 0 10px 20px rgba(255, 77, 121, 0.15);
}

.cat-icon {
  font-size: 24px;
  display: block;
  margin-bottom: 5px;
}

.cat-name {
  font-size: 14px;
  font-weight: 600;
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
  padding: 20px;
}

.game-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
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

.category-badge {
  background: rgba(255, 255, 255, 0.3);
  padding: 6px 15px;
  border-radius: 20px;
  color: white;
  font-weight: 600;
  backdrop-filter: blur(5px);
}

.progress {
  color: white;
}

.progress .count {
  font-size: 24px;
  font-weight: bold;
}

.progress .total {
  opacity: 0.7;
}

/* 3D 卡片区域 */
.card-stage {
  flex: 1;
  perspective: 1500px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 40px 0;
}

.card-wrapper {
  position: relative;
  width: 320px;
  height: 480px;
  transition: transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform-style: preserve-3d;
  cursor: pointer;
}

/* 粒子样式 */
.particles-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 10;
}

.particle {
  position: absolute;
  font-size: 20px;
  user-select: none;
  animation: particle-fly 1s ease-out forwards;
}

@keyframes particle-fly {
  0% {
    transform: translate(0, 0) scale(1) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translate(var(--tx), var(--ty)) scale(0) rotate(var(--rot));
    opacity: 0;
  }
}

.card-wrapper.is-flipped {
  /* 移除这里的 transform，改由 inline style 控制 */
}

.card-wrapper.switching {
  animation: card-switch 0.8s ease-in-out forwards;
}

@keyframes card-switch {
  0% {
    transform: translateY(0) rotateY(var(--rot-y)) scale(1);
    opacity: 1;
  }
  40% {
    transform: translateY(-120vh) rotateY(var(--rot-y)) rotateX(20deg) scale(0.8);
    opacity: 0;
  }
  41% {
    transform: translateY(120vh) rotateY(0) scale(0.8);
    opacity: 0;
  }
  100% {
    transform: translateY(0) rotateY(0) scale(1);
    opacity: 1;
  }
}

.card-face {
  position: absolute;
  width: 100%;
  height: 100%;
  backface-visibility: hidden;
  border-radius: 30px;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.card-back {
  background: linear-gradient(135deg, #ff4d79, #ff9a9e);
  border: 10px solid white;
}

.card-pattern {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: radial-gradient(rgba(255,255,255,0.2) 2px, transparent 2px);
  background-size: 20px 20px;
}

.card-back .card-logo {
  font-size: 100px;
  margin-bottom: 20px;
}

.tap-to-reveal {
  color: white;
  font-size: 18px;
  font-weight: 600;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.card-front {
  transform: rotateY(180deg);
  background: white;
  border: 1px solid rgba(0,0,0,0.05);
}

.card-inner-content {
  text-align: center;
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  position: relative;
}

.quote-mark {
  font-size: 80px;
  color: #ff4d79;
  opacity: 0.1;
  position: absolute;
  line-height: 1;
}

.quote-mark.top { top: -20px; left: -20px; }
.quote-mark.bottom { bottom: -20px; right: -20px; }

.question-text {
  font-size: 28px;
  font-weight: 600;
  line-height: 1.5;
  color: #2c3e50;
  z-index: 1;
}

.question-text.long-text {
  font-size: 22px;
}

.next-hint {
  font-size: 14px;
  color: #999;
  margin-top: 20px;
}

/* 底部操作栏 */
.game-footer {
  padding-bottom: 20px;
}

.action-btns {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.action-btn {
  background: white;
  border: none;
  padding: 12px 25px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 10px 20px rgba(0,0,0,0.05);
}

.action-btn:active {
  transform: scale(0.95);
}

.share-btn { color: #ff4d79; }
.next-btn { background: #2c3e50; color: white; }

@media (max-width: 480px) {
  .card-wrapper {
    width: 280px;
    height: 420px;
  }
  
  .question-text {
    font-size: 24px;
  }
}
</style>
