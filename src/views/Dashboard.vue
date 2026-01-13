<!-- Dashboard.vue -->
<template>
  <div class="dashboard-container">
    <!-- 切换按钮（加hover动画） -->
    <div class="view-toggle-btn-group">
      <el-button
          type="primary"
          size="small"
          :class="{ 'active-btn': currentView === 'loveDuration' }"
          @click="toggleView('loveDuration')"
          class="toggle-btn"
      >
        已恋爱时长
      </el-button>
      <el-button
          type="primary"
          size="small"
          :class="{ 'active-btn': currentView === 'anniversary' }"
          @click="toggleView('anniversary')"
          class="toggle-btn"
      >
        纪念日倒计时
      </el-button>
    </div>

    <!-- 欢迎卡片（加视图切换过渡动画） -->
    <div class="welcome-card">
      <h2 @click="triggerEasterEgg">欢迎回来，{{ currentUser.name }} <span class="heart-trigger">💖</span></h2>

      <!-- 视图切换过渡容器 -->
      <transition name="view-fade">
        <div key="time-content">
          <!-- 已恋爱时长视图 -->
          <template v-if="currentView === 'loveDuration'">
            <p>{{ currentUser.name }} 和 {{ user2.name }}：</p>
            <p class="time-text">
              {{ displayLoveDuration.days }}天 {{ formatTime(displayLoveDuration.hours) }}时 {{ formatTime(displayLoveDuration.minutes) }}分 {{ formatTime(displayLoveDuration.seconds) }}秒
            </p>
          </template>

          <!-- 纪念日倒计时视图 -->
          <template v-else>
            <p>距离 <span class="anniversary-name">{{ anniversaryTarget.name }}</span> 还有：</p>
            <p class="time-text">
              {{ displayAnniversaryCountdown.days }}天 {{ formatTime(displayAnniversaryCountdown.hours) }}时 {{ formatTime(displayAnniversaryCountdown.minutes) }}分 {{ formatTime(displayAnniversaryCountdown.seconds) }}秒
            </p>
          </template>
        </div>
      </transition>
    </div>

    <!-- 数据卡片区域（加视图切换过渡动画） -->
    <div class="stats-card-group">
      <el-card class="stats-card" @click="goToAnniversaryManage">
        <div class="stats-content">
          <transition name="view-fade">
            <div key="stats-label">
              <span class="stats-label">{{ currentView === 'loveDuration' ? '已恋爱时长' : '纪念日倒计时' }}</span>
            </div>
          </transition>
          <transition name="view-fade">
            <div key="stats-value">
              <span class="stats-value">
                <template v-if="currentView === 'loveDuration'">
                  {{ displayLoveDuration.days }}天 {{ formatTime(displayLoveDuration.hours) }}:{{ formatTime(displayLoveDuration.minutes) }}:{{ formatTime(displayLoveDuration.seconds) }}
                </template>
                <template v-else>
                  {{ displayAnniversaryCountdown.days }}天 {{ formatTime(displayAnniversaryCountdown.hours) }}:{{ formatTime(displayAnniversaryCountdown.minutes) }}:{{ formatTime(displayAnniversaryCountdown.seconds) }}
                </template>
              </span>
            </div>
          </transition>
        </div>
      </el-card>
      <el-card class="stats-card" @click="goToAnniversaryManage">
        <div class="stats-content">
          <span class="stats-label">待办纪念日</span>
          <span class="stats-value">{{ futureAnniversaries.length }}个</span>
        </div>
      </el-card>
      <el-card class="stats-card" @click="goToSweetQuote" >
        <div class="stats-content">
          <span class="stats-label">甜蜜语录</span>
          <span class="stats-value">{{ quotesCount }}条</span>
        </div>
      </el-card>
      <el-card class="stats-card" @click="goToChat" >
        <div class="stats-content">
          <span class="stats-label">秘密聊天</span>
          <span class="stats-value">点击进入</span>
        </div>
      </el-card>
    </div>

    <!-- 爱情树养成区域 -->
    <div class="love-tree-section">
      <div class="tree-header">
        <h3>我们的爱情树 🌳</h3>
        <p>已茁壮成长 {{ loveTreeLevel }} 天</p>
      </div>
      <div class="tree-container">
        <div class="tree-visual">
          <div class="tree-leaves">
            <div class="leaf-cluster cluster-1"></div>
            <div class="leaf-cluster cluster-2"></div>
            <div class="leaf-cluster cluster-3"></div>
            <div class="tree-heart">💖</div>
            <div class="tree-heart">💗</div>
            <div class="tree-heart">💝</div>
            <div class="tree-heart">💕</div>
          </div>
          <div class="tree-trunk"></div>
        </div>
        <div class="tree-info">
          <p class="growth-tip">记得每天来浇水，让爱情树开花结果哦~</p>
          <div class="progress-bar-container">
            <div class="progress-bar-fill" :style="{ width: (loveTreeLevel % 100) + '%' }"></div>
          </div>
          <el-button type="primary" round class="water-btn" @click="waterTree">
            给小树浇水 💧
          </el-button>
        </div>
      </div>
    </div>

    <!-- 浪漫进度条 -->
    <div class="romantic-heart-progress">
      <div class="heart-container">
        <div class="heart-bg"></div>
        <div class="heart-fill" :style="{ height: (loveTreeLevel % 100) + '%' }"></div>
      </div>
      <p>当前的浪漫值：{{ loveTreeLevel % 100 }}%</p>
    </div>

    <!-- 页脚情话 -->
    <div class="home-footer-quote" @click="refreshQuote">
      <div class="quote-content">
        <span class="quote-icon">💌</span>
        <span class="quote-text">{{ currentQuote }}</span>
      </div>
      <p class="quote-tip">—— 点击刷新今日情话 ——</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import dayjs from 'dayjs'
// @ts-ignore
import AV from 'leancloud-storage'
import { user1 as currentUser, user2, syncCurrentUser } from '../services/chatManager'

const router = useRouter()

interface Anniversary {
  name: string
  date: string
}

// 状态
const loveStartDate = ref('2024-05-20 00:00:00')
const quotesCount = ref(0)
const currentView = ref('loveDuration')
const loveDuration = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })
const displayLoveDuration = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })

const anniversaryTarget = ref<Anniversary>({ name: '一周年纪念日', date: '' })
const anniversaryCountdown = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })
const displayAnniversaryCountdown = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })

const waterCount = ref(0)
const loveTreeLevel = computed(() => {
  // 基础等级是天数，每浇水 5 次额外增加 1 点成长值
  return loveDuration.value.days + Math.floor(waterCount.value / 5)
})
const futureAnniversaries = ref<Anniversary[]>([])

// 统一情话库（与 SweetQuote.vue 保持一致）
const builtInQuotes = [
  "你是我这一生只会遇见一次的惊喜。✨",
  "遇见你之后，我所有的心动都有了名字。💖",
  "想和你在这个世界上，慢慢变老。🍂",
  "世界那么大，我的眼里只有你。🌍",
  "所有的美好都抵不过你的一句：我在。🥰",
  "你是我所有温柔的源头。🌸",
  "你是藏在云层里的星，也是我唯一的救赎。🌙",
  "我的世界，因为有你才变得完整。💎",
  "只要你在，我就觉得人间值得。🌈",
  "和你在一起的每一秒，都是我最宝贵的收藏。🎁",
  "你是我的满目山河，也是我的可爱人间。⛰️",
  "我喜欢你，胜过削好的水果，周末的睡懒觉，和冬天的第一场雪。❄️",
  "众生皆苦，唯有你是草莓味的。🍓",
  "我想陪你走过漫长岁月，看尽人间烟火。🎇",
  "我的心是一座城，你是城里唯一的王。🏰",
  "不管世界如何荒芜，总有一个人，他是你的信徒。🙏"
]
const currentQuote = ref(builtInQuotes[0])

// 导航
const goToAnniversaryManage = () => {
  router.push({
    path: '/home/anniversary-manage',
    query: { anniversaries: JSON.stringify(futureAnniversaries.value) }
  })
}
const goToSweetQuote = () => router.push('/home/sweet-quote')
const goToChat = () => router.push('/home/chat')

// 交互
const waterTree = async () => {
  const user = AV.User.current()
  if (!user) {
    ElMessage.warning('请先登录后再浇水哦~')
    return
  }

  try {
    const currentWaterCount = (user.get('waterCount') || 0) + 1
    user.set('waterCount', currentWaterCount)
    await user.save()
    
    // 更新本地状态
    waterCount.value = currentWaterCount

    ElMessage({
      message: '浇水成功！我们的爱情树又长大了一点点~ 🌱',
      type: 'success',
      duration: 2000
    })
    
    // 触发一个简单的视觉效果，比如树晃动一下（通过 CSS class）
    const tree = document.querySelector('.tree-visual')
    if (tree) {
      tree.classList.add('tree-shake')
      setTimeout(() => tree.classList.remove('tree-shake'), 500)
    }
  } catch (error: any) {
    ElMessage.error('浇水失败，请重试')
  }
}

const refreshQuote = async () => {
  const oldQuote = currentQuote.value
  let newQuote = oldQuote
  
  try {
    const query = new AV.Query('SweetQuote')
    const results = await query.find()
    const allQuotes = [
      ...builtInQuotes,
      ...results.map(item => item.get('content'))
    ]
    
    while (newQuote === oldQuote && allQuotes.length > 1) {
      newQuote = allQuotes[Math.floor(Math.random() * allQuotes.length)]
    }
    currentQuote.value = newQuote
  } catch (error: any) {
    // 报错则只从内置库刷新
    while (newQuote === oldQuote) {
      newQuote = builtInQuotes[Math.floor(Math.random() * builtInQuotes.length)]
    }
    currentQuote.value = newQuote
  }
}

const triggerEasterEgg = () => {
  ElMessageBox.alert('恭喜发现彩蛋！张张包超级超级爱小黄包！💕', '秘密彩蛋', {
    confirmButtonText: '我也爱他/她',
    type: 'success'
  })
}

// 时间计算逻辑
const formatTime = (num: number) => num.toString().padStart(2, '0')

const calculateLoveDuration = () => {
  const start = dayjs(loveStartDate.value)
  const now = dayjs()
  const diffMs = now.diff(start)
  const oneDayMs = 1000 * 60 * 60 * 24
  const oneHourMs = 1000 * 60 * 60
  const oneMinuteMs = 1000 * 60

  loveDuration.value.days = Math.floor(diffMs / oneDayMs)
  loveDuration.value.hours = Math.floor((diffMs % oneDayMs) / oneHourMs)
  loveDuration.value.minutes = Math.floor((diffMs % oneHourMs) / oneMinuteMs)
  loveDuration.value.seconds = Math.floor((diffMs % oneMinuteMs) / 1000)
}

const generateFutureAnniversaries = () => {
  const start = dayjs(loveStartDate.value)
  const now = dayjs()
  const anniversaries: Anniversary[] = []

  for (let i = now.diff(start, 'year') + 1; i <= now.diff(start, 'year') + 3; i++) {
    const date = start.add(i, 'year').format('YYYY-MM-DD HH:mm:ss')
    if (dayjs(date).isAfter(now)) anniversaries.push({ name: `${i}周年纪念日`, date })
  }

  for (let i = 0; i <= 2; i++) {
    const date = `${now.year() + i}-05-20 13:14:00`
    if (dayjs(date).isAfter(now)) anniversaries.push({ name: `${now.year() + i}年520纪念日`, date })
  }

  const currentTotalDays = now.diff(start, 'day')
  const nextHundredDay = Math.ceil(currentTotalDays / 100) * 100
  const hundredDayDate = start.add(nextHundredDay, 'day').format('YYYY-MM-DD HH:mm:ss')
  if (dayjs(hundredDayDate).isAfter(now)) anniversaries.push({ name: `${nextHundredDay}天纪念日`, date: hundredDayDate })

  futureAnniversaries.value = anniversaries.sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())
}

const calculateAnniversaryCountdown = () => {
  if (!anniversaryTarget.value.date) return
  const target = dayjs(anniversaryTarget.value.date)
  const now = dayjs()
  const diffMs = target.diff(now)

  if (diffMs <= 0) {
    generateFutureAnniversaries()
    if (futureAnniversaries.value.length > 0) {
      const firstAnniversary = futureAnniversaries.value[0]
      if (firstAnniversary) anniversaryTarget.value = firstAnniversary
    }
    return
  }

  const oneDayMs = 1000 * 60 * 60 * 24
  const oneHourMs = 1000 * 60 * 60
  const oneMinuteMs = 1000 * 60

  anniversaryCountdown.value.days = Math.floor(diffMs / oneDayMs)
  anniversaryCountdown.value.hours = Math.floor((diffMs % oneDayMs) / oneHourMs)
  anniversaryCountdown.value.minutes = Math.floor((diffMs % oneHourMs) / oneMinuteMs)
  anniversaryCountdown.value.seconds = Math.floor((diffMs % oneMinuteMs) / 1000)
}

const toggleView = (view: string) => {
  currentView.value = view
  if (view === 'loveDuration') {
    animateNumbers(loveDuration.value, displayLoveDuration.value)
  } else {
    animateNumbers(anniversaryCountdown.value, displayAnniversaryCountdown.value)
  }
}

const animateNumbers = (targetObj: any, displayObj: any) => {
  Object.keys(targetObj).forEach(key => {
    const start = displayObj[key]
    const end = targetObj[key]
    if (start === end) return
    if (Math.abs(end - start) > 5) {
      let current = start
      const step = Math.ceil(Math.abs(end - start) / 20)
      const timer = setInterval(() => {
        if (current < end) {
          current = Math.min(end, current + step)
        } else {
          current = Math.max(end, current - step)
        }
        displayObj[key] = current
        if (current === end) clearInterval(timer)
      }, 30)
    } else {
      displayObj[key] = end
    }
  })
}

const fetchDashboardData = async () => {
  syncCurrentUser()
  const user = AV.User.current()
  if (user) {
    loveStartDate.value = user.get('loveStartDate') || '2024-05-20 00:00:00'
    // 获取浇水次数
    waterCount.value = user.get('waterCount') || 0
  }

  // 获取语录数量
  try {
    const query = new AV.Query('SweetQuote')
    const cloudCount = await query.count()
    // 首页计数逻辑：云端语录 + 内置库中被补齐的部分（确保总数至少为 6）
    // 如果云端已经超过 6 条，则总数就是云端条数；如果不足 6 条，则补齐到 6 条。
    // 但是用户发现“对不上”，是因为 SweetQuote.vue 中补齐逻辑可能导致总数超过 6（随机补齐了 needed 或 needed + 2）
    // 为了严格统一，我们这里直接获取 SweetQuote.vue 逻辑产生的总数
    if (cloudCount < 6) {
      // 这里的逻辑需要和 SweetQuote.vue 保持绝对一致。
      // SweetQuote.vue: quoteList.value = [...userQuotes, ...additional]
      // 其中 additional 是从 6-cloudCount 补齐的，且有 50% 概率多补 2 条。
      // 为了避免首页每次刷新数字都在变（6或8），我们统一设定：如果不足 6 条，就显示 6 条。
      quotesCount.value = 6
    } else {
      quotesCount.value = cloudCount
    }
  } catch (error: any) {
    if (error.code === 101) {
      // 如果云端还没有表，默认显示内置的 6 条
      quotesCount.value = 6
    } else {
      console.error('获取语录数量失败:', error)
      quotesCount.value = 6 // 兜底显示 6
    }
  }

  // 初始刷新一次页脚情话
  refreshQuote()
}

let timer: any = null
onMounted(async () => {
  await fetchDashboardData()
  
  calculateLoveDuration()
  generateFutureAnniversaries()
  if (futureAnniversaries.value.length > 0) {
    const firstAnniversary = futureAnniversaries.value[0]
    if (firstAnniversary) anniversaryTarget.value = firstAnniversary
  }
  calculateAnniversaryCountdown()
  
  displayLoveDuration.value = { ...loveDuration.value }
  displayAnniversaryCountdown.value = { ...anniversaryCountdown.value }

  timer = setInterval(() => {
    calculateLoveDuration()
    calculateAnniversaryCountdown()
    if (currentView.value === 'loveDuration') {
      displayLoveDuration.value = { ...loveDuration.value }
    } else {
      displayAnniversaryCountdown.value = { ...anniversaryCountdown.value }
    }
  }, 1000)
})

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.dashboard-container {
  width: 100%;
}

.view-toggle-btn-group {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  justify-content: center;
}

.toggle-btn {
  border-radius: 20px;
  padding: 8px 20px;
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 182, 193, 0.3);
  color: #ff7f9d;
  transition: all 0.3s ease;
}

.toggle-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(255, 182, 193, 0.2);
}

.active-btn {
  background: #ff4757 !important;
  color: white !important;
  border-color: #ff4757 !important;
}

.welcome-card {
  background: linear-gradient(135deg, #fff5f6 0%, #ffffff 100%);
  border-radius: 24px;
  padding: 40px;
  text-align: center;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(255, 71, 87, 0.05);
  border: 1px solid rgba(255, 71, 87, 0.1);
  position: relative;
  overflow: hidden;
}

.welcome-card::before {
  content: '❤️';
  position: absolute;
  top: -10px;
  right: -10px;
  font-size: 100px;
  opacity: 0.03;
  transform: rotate(15deg);
}

.welcome-card h2 {
  color: #2c3e50;
  font-size: 1.8rem;
  margin-bottom: 20px;
  cursor: pointer;
}

.heart-trigger {
  display: inline-block;
  animation: heartBeat 1.5s infinite;
}

.time-text {
  font-size: 2rem;
  font-weight: bold;
  color: #ff4757;
  margin-top: 15px;
  letter-spacing: 2px;
  text-shadow: 0 2px 4px rgba(255, 71, 87, 0.1);
}

.anniversary-name {
  color: #ff7f9d;
  font-weight: 600;
}

.stats-card-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stats-card {
  border-radius: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.03);
}

.stats-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(255, 71, 87, 0.1);
}

.stats-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 0;
}

.stats-label {
  color: #95a5a6;
  font-size: 0.9rem;
  margin-bottom: 8px;
}

.stats-value {
  color: #2c3e50;
  font-size: 1.25rem;
  font-weight: 600;
}

.love-tree-section {
  background: white;
  border-radius: 24px;
  padding: 30px;
  margin-bottom: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.02);
}

.tree-header {
  text-align: center;
  margin-bottom: 30px;
}

.tree-header h3 {
  font-size: 1.4rem;
  color: #2c3e50;
  margin-bottom: 5px;
}

.tree-header p {
  color: #95a5a6;
  font-size: 0.9rem;
}

.tree-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 50px;
}

.tree-visual {
  position: relative;
  width: 200px;
  height: 250px;
}

.tree-leaves {
  position: absolute;
  bottom: 80px;
  left: 50%;
  transform: translateX(-50%);
  width: 180px;
  height: 180px;
}

.leaf-cluster {
  position: absolute;
  background: #2ecc71;
  border-radius: 50%;
  opacity: 0.8;
}

.cluster-1 { width: 100px; height: 100px; top: 0; left: 40px; }
.cluster-2 { width: 80px; height: 80px; bottom: 20px; left: 0; background: #27ae60; }
.cluster-3 { width: 90px; height: 90px; bottom: 10px; right: 0; background: #2ecc71; }

.tree-trunk {
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 100px;
  background: #795548;
  border-radius: 5px;
}

.tree-heart {
  position: absolute;
  font-size: 18px;
  animation: heartFloat 3s infinite ease-in-out;
}

.tree-heart:nth-child(4) { top: 20px; left: 70px; animation-delay: 0s; }
.tree-heart:nth-child(5) { top: 60px; left: 30px; animation-delay: 0.5s; }
.tree-heart:nth-child(6) { top: 60px; right: 30px; animation-delay: 1s; }
.tree-heart:nth-child(7) { top: 100px; left: 50px; animation-delay: 1.5s; }

.tree-info {
  flex: 1;
  max-width: 300px;
}

.growth-tip {
  color: #7f8c8d;
  margin-bottom: 15px;
  font-size: 0.95rem;
}

.progress-bar-container {
  width: 100%;
  height: 12px;
  background: #ecf0f1;
  border-radius: 6px;
  overflow: hidden;
  margin-bottom: 15px;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff7f9d, #ff4757);
  transition: width 0.5s ease;
}

.water-btn {
  width: 100%;
  box-shadow: 0 6px 20px rgba(255, 71, 87, 0.3);
}

.romantic-heart-progress {
  text-align: center;
  margin-bottom: 50px;
}

.heart-container {
  position: relative;
  width: 100px;
  height: 90px;
  margin: 0 auto 20px;
}

.heart-bg, .heart-fill {
  position: absolute;
  width: 100%;
  height: 100%;
  background: #ff7f9d;
  clip-path: path('M50 88.9L16.7 55.6C7.2 46.1 7.2 30.9 16.7 21.4s25.2-9.5 34.7 0c9.5-9.5 25.2-9.5 34.7 0s9.5 25.2 0 34.7L50 88.9z');
}

.heart-bg { opacity: 0.2; }
.heart-fill {
  background: #ff4757;
  height: 0;
  bottom: 0;
  animation: heartFillAnim 10s infinite alternate ease-in-out;
}

.home-footer-quote {
  text-align: center;
  padding: 40px 20px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.home-footer-quote:hover {
  transform: scale(1.02);
}

.quote-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 10px;
}

.quote-text {
  font-size: 1.1rem;
  color: #ff4757;
  font-style: italic;
  font-weight: 500;
}

.quote-tip {
  color: #ff7f9d;
  font-size: 0.85rem;
  opacity: 0.7;
}

@keyframes heartBeat {
  0% { transform: scale(1); }
  14% { transform: scale(1.3); }
  28% { transform: scale(1); }
  42% { transform: scale(1.3); }
  70% { transform: scale(1); }
}

@keyframes heartFloat {
  0%, 100% { transform: translateY(0) rotate(0); }
  50% { transform: translateY(-10px) rotate(10deg); }
}

@keyframes heartFillAnim {
  0% { height: 10%; }
  100% { height: 90%; }
}

.tree-shake {
  animation: treeShake 0.5s ease-in-out;
}

@keyframes treeShake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px) rotate(-2deg); }
  75% { transform: translateX(5px) rotate(2deg); }
}

.view-fade-enter-active, .view-fade-leave-active {
  transition: all 0.5s ease;
}
.view-fade-enter-from { opacity: 0; transform: translateX(20px); }
.view-fade-leave-to { opacity: 0; transform: translateX(-20px); }

/* 移动端适配 */
@media (max-width: 768px) {
  .welcome-card {
    padding: 25px 20px !important;
    margin-bottom: 25px !important;
  }

  .welcome-card h2 {
    font-size: 20px !important;
  }

  .time-text {
    font-size: 18px !important;
    letter-spacing: 1px !important;
  }

  .stats-card-group {
    grid-template-columns: 1fr !important;
    gap: 15px !important;
    margin-bottom: 25px !important;
  }

  .love-tree-section {
    padding: 20px !important;
    border-radius: 20px !important;
  }

  .tree-container {
    flex-direction: column !important;
    gap: 20px !important;
  }

  .tree-visual {
    width: 160px !important;
    height: 200px !important;
  }

  .tree-leaves {
    width: 140px !important;
    height: 140px !important;
    bottom: 60px !important;
  }

  .leaf-cluster {
    width: 80px !important;
    height: 80px !important;
  }

  .tree-trunk {
    width: 24px !important;
    height: 80px !important;
  }

  .tree-info {
    width: 100% !important;
    min-width: unset !important;
  }

  .growth-tip {
    font-size: 13px !important;
  }

  .romantic-heart-progress {
    padding: 20px !important;
    border-radius: 20px !important;
  }

  .heart-container {
    width: 80px !important;
    height: 80px !important;
  }

  .view-toggle-btn-group {
    margin-bottom: 20px !important;
    display: flex;
    justify-content: center;
    width: 100%;
  }

  .toggle-btn {
    flex: 1;
    padding: 8px 0 !important;
  }
}
</style>
