<!-- Home.vue -->
<template>
  <el-container class="home-container">
    <!-- 顶部导航栏 -->
    <el-header class="home-header">
      <div class="header-left">
        <el-icon class="menu-toggle" @click="toggleSidebar">
          <Menu />
        </el-icon>
        <span class="app-title">张张包和小黄包的恋爱窝</span>
      </div>
      <div class="header-right">
        <el-button 
          circle 
          class="theme-toggle-btn" 
          @click="toggleDarkMode"
          :icon="isDarkMode ? Sunny : Moon"
        />
        <el-dropdown @command="handleDropdownCommand">
          <div class="user-info">
            <el-avatar :src="'/df49bc6ca7d5b77ace3eeaec5d0008c6.jpg'" class="user-avatar" />
            <span class="username">{{ userName }}</span>
            <el-icon class="arrow-icon">
              <ArrowDown />
            </el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人中心</el-dropdown-item>
              <el-dropdown-item command="logout" type="danger">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </el-header>

    <!-- 移动端遮罩层 -->
    <div 
      v-if="!isSidebarCollapse" 
      class="mobile-mask" 
      @click="isSidebarCollapse = true"
    ></div>

    <el-container class="main-wrapper">
      <!-- 侧边栏菜单 -->
      <el-aside
          :width="isSidebarCollapse ? '0' : '200px'"
          class="home-aside"
          :class="{ 'is-mobile-hidden': isSidebarCollapse }"
      >
        <el-menu
            default-active="1"
            class="aside-menu"
            background-color="#fff5f7"
            text-color="#6d6875"
            active-text-color="#e63946"
            :collapse="isSidebarCollapse"
            :collapse-transition="false"
        >
          <el-menu-item index="1" class="menu-item" @click="closeSidebarOnMobile">
            <el-icon><House /></el-icon>
            <template #title>首页</template>
          </el-menu-item>
          <el-menu-item index="2" class="menu-item"
                        @click="goToAnniversaryManage"
          >
            <el-icon><Calendar /></el-icon>
            <template #title>纪念日管理</template>
          </el-menu-item>
          <el-menu-item index="3" class="menu-item"  @click="goToSweetQuote">
            <el-icon><Message /></el-icon>
            <template #title>甜蜜语录库</template>
          </el-menu-item>
          <!-- 新增：恋爱相册 -->
          <el-menu-item index="4" class="menu-item" @click="goToLoveAlbum">
            <el-icon><Picture /></el-icon>
            <template #title>恋爱相册</template>
<!--            新增点点滴滴-->
          </el-menu-item>
          <el-menu-item index="5" class="menu-item" @click="goToDianDianDiDi">
            <el-icon><Document /></el-icon>
            <template #title>点点滴滴</template>
          </el-menu-item>
          <el-menu-item index="6" class="menu-item" @click="goToBucketList">
            <el-icon><List /></el-icon>
            <template #title>爱情清单</template>
          </el-menu-item>
          <el-menu-item index="7" class="menu-item" @click="goToContracts">
            <el-icon><Stamp /></el-icon>
            <template #title>专属契约</template>
          </el-menu-item>
          <el-menu-item index="8" class="menu-item" @click="goToChat">
            <el-icon><ChatDotRound /></el-icon>
            <template #title>秘密聊天室</template>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="home-main" @click="closeSidebarOnMobile">
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
          <h2 @click="triggerEasterEgg">欢迎回来，{{ userName }} <span class="heart-trigger">💖</span></h2>

          <!-- 视图切换过渡容器 -->
          <transition name="view-fade">
            <div key="time-content">
              <!-- 已恋爱时长视图 -->
              <template v-if="currentView === 'loveDuration'">
                <p>张张包和张张小黄包：</p>
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
          <el-card class="stats-card">
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
          <!-- src/views/Home.vue 中 stats-card-group 区域的待办纪念日卡片 -->
          <el-card class="stats-card" @click="goToAnniversaryManage">
            <div class="stats-content">
              <span class="stats-label">待办纪念日</span>
              <span class="stats-value">{{ futureAnniversaries.length }}个</span>
            </div>
          </el-card>
          <el-card class="stats-card" @click="goToSweetQuote" >
            <div class="stats-content">
              <span class="stats-label">甜蜜语录</span>
              <span class="stats-value">36条</span>
            </div>
          </el-card>
          <el-card class="stats-card" @click="goToChat" >
            <div class="stats-content">
              <span class="stats-label">秘密聊天</span>
              <span class="stats-value">点击进入</span>
            </div>
          </el-card>
        </div>

        <!-- 新增：爱情树养成区域 -->
        <div class="love-tree-section">
          <div class="tree-header">
            <h3>我们的爱情树 🌳</h3>
            <p>已茁壮成长 {{ loveTreeLevel }} 天</p>
          </div>
          <div class="tree-container">
            <div class="tree-visual">
              <div class="tree-trunk"></div>
              <div class="tree-leaves" :style="{ transform: `scale(${0.5 + loveTreeProgress * 0.5})` }">
                <div v-for="n in 5" :key="n" class="leaf-cluster"></div>
                <div v-for="n in 8" :key="'heart-'+n" class="tree-heart">❤️</div>
              </div>
            </div>
            <div class="tree-info">
              <div class="progress-bar-container">
                <div class="progress-bar-fill" :style="{ width: (loveTreeProgress * 100) + '%' }"></div>
              </div>
              <p class="growth-tip">{{ growthTip }}</p>
              <el-button type="danger" round size="large" class="water-btn" @click="waterTree" :disabled="isWatering">
                <el-icon><ColdDrink /></el-icon> 浇灌爱意
              </el-button>
            </div>
          </div>
        </div>

        <!-- 浪漫心形进度条 -->
        <div class="romantic-heart-progress">
          <div class="heart-container">
            <div class="heart-bg"></div>
            <div class="heart-fill"></div>
          </div>
          <p class="progress-text">我们的爱意持续升温中...</p>
        </div>

        <!-- 新增：今日情话页脚 -->
        <div class="home-footer-quote" @click="refreshQuote">
          <div class="quote-content">
            <el-icon class="quote-icon-left"><ChatDotRound /></el-icon>
            <span class="quote-text">{{ currentQuote }}</span>
            <el-icon class="quote-icon-right"><ChatDotRound /></el-icon>
          </div>
          <p class="quote-tip">点击刷新情话 ✨</p>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import {ref, onMounted, onUnmounted, watch, defineComponent, computed} from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import DianDianDiDi from "@/views/DianDianDiDi.vue";
// 引入Element Plus组件和图标
import {
  ElContainer, ElHeader, ElAside, ElMain,
  ElMenu, ElMenuItem, ElDropdown, ElDropdownMenu,
  ElDropdownItem, ElAvatar, ElCard, ElButton, ElMessage, ElIcon
} from 'element-plus'
import {Menu, ArrowDown, House, Calendar, Message, Picture, Document, List, Stamp, ColdDrink, ChatDotRound, Moon, Sunny} from '@element-plus/icons-vue'

defineComponent({
  name: 'Home',
  components: {
    DianDianDiDi,
  },
});

const router = useRouter()

// 爱情树相关逻辑
const loveTreeLevel = ref(0)
const loveTreeProgress = ref(0.2)
const isWatering = ref(false)
const growthTip = ref('点击按钮，用爱意浇灌我们的爱情树吧～')

const waterTree = () => {
  if (isWatering.value) return
  isWatering.value = true
  growthTip.value = '正在浇灌中，爱意满满... ✨'
  
  setTimeout(() => {
    loveTreeProgress.value = Math.min(1, loveTreeProgress.value + 0.05)
    isWatering.value = false
    growthTip.value = '浇灌成功！爱情树又长大了一点点 🌱'
    ElMessage({
      message: '爱意浇灌成功！✨',
      type: 'success',
      duration: 2000,
      offset: 100
    })
    localStorage.setItem('loveTreeProgress', loveTreeProgress.value.toString())
  }, 1500)
}

// 今日情话逻辑
const quotes = [
  "我喜欢你，胜过削好的水果，周末的睡懒觉，和冬天的暖气。",
  "遇见你之后，我的伟大抱负和一腔热血，都变成了一心只想对你好。",
  "我并没有那种把人生过得极其精彩的本事，但我希望能和你一起把日子过得有滋有味。",
  "这世间最温柔的，大概就是你眉眼间的笑意，和晚风里的私语。",
  "你是我这一生，等了半世的未完待续。",
  "我也说不清楚你哪里好，但就是谁都替代不了。",
  "这漫长的一生，我想和你慢慢走，慢慢看，慢慢变老。",
  "我想和你分享我的每一个黄昏，和每一个有你的清晨。"
]
const currentQuote = ref(quotes[Math.floor(Math.random() * quotes.length)])
const refreshQuote = () => {
  const old = currentQuote.value
  let next = old
  while(next === old) {
    next = quotes[Math.floor(Math.random() * quotes.length)]
  }
  currentQuote.value = next
}

// 移动端自动折叠侧边栏
const closeSidebarOnMobile = () => {
  if (window.innerWidth <= 768) {
    isSidebarCollapse.value = true
  }
}

// 跳转至纪念日管理页面
const goToAnniversaryManage = () => {
  closeSidebarOnMobile()
  router.push({
    name: 'AnniversaryManage',
    query: {
      anniversaries: JSON.stringify(futureAnniversaries.value)
    }
  })
}
// 新增：跳转至甜蜜语录库
const goToSweetQuote = () => {
  closeSidebarOnMobile()
  router.push('/sweet-quote')
}
//跳转恋爱相册
const goToLoveAlbum = () => {
  closeSidebarOnMobile()
  router.push('/love-album')
}
//跳转到点点滴滴
const goToDianDianDiDi = () => {
  closeSidebarOnMobile()
  router.push({ name: 'DianDianDiDi' });
};
//跳转到爱情清单
const goToBucketList = () => {
  closeSidebarOnMobile()
  router.push('/bucket-list')
}
//跳转到专属契约
const goToContracts = () => {
  closeSidebarOnMobile()
  router.push('/contracts')
}
//跳转到聊天室
const goToChat = () => {
  closeSidebarOnMobile()
  router.push('/chat')
}
// 核心配置：你的恋爱开始时间（固定为2019-12-29 13:14:00）
const userName = ref('亲爱的')
const loveStartDate = ref('2019-12-29 13:14:00')

// 视图切换状态
const currentView = ref('loveDuration')
// 已恋爱时长数据 (实际数据)
const loveDuration = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })
// 显示用时长数据 (用于滚动效果)
const displayLoveDuration = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })

// 滚动数字效果
const animateNumbers = (targetObj, displayObj) => {
  const keys = Object.keys(targetObj)
  keys.forEach(key => {
    const start = displayObj[key]
    const end = targetObj[key]
    if (start === end) return
    
    // 如果差距太大（比如刚进入页面），使用动画；如果差距小（每秒更新），直接赋值或微小步进
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

// 纪念日相关（动态生成）
const anniversaryTarget = ref({ name: '', date: '' }) // 当前倒计时的纪念日
const anniversaryCountdown = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })
const displayAnniversaryCountdown = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })
const futureAnniversaries = ref([]) // 所有未来纪念日列表
// 侧边栏状态
const isSidebarCollapse = ref(window.innerWidth <= 768)

// 暗黑模式逻辑
const isDarkMode = ref(localStorage.getItem('theme') === 'dark')
const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value
  localStorage.setItem('theme', isDarkMode.value ? 'dark' : 'light')
  updateTheme()
}
const updateTheme = () => {
  if (isDarkMode.value) {
    document.documentElement.classList.add('dark-mode')
  } else {
    document.documentElement.classList.remove('dark-mode')
  }
}

// 惊喜彩蛋逻辑
const clickCount = ref(0)
const lastClickTime = ref(0)
const triggerEasterEgg = () => {
  const now = Date.now()
  if (now - lastClickTime.value > 1000) {
    clickCount.value = 1
  } else {
    clickCount.value++
  }
  lastClickTime.value = now

  if (clickCount.value === 5) {
    clickCount.value = 0
    ElMessage({
      message: '🎉 恭喜触发隐藏彩蛋！我永远爱你！💕',
      type: 'success',
      duration: 5000,
      showClose: true,
      center: true,
      offset: 200
    })
    // 触发全局满屏爱心效果（通过 App.vue 监听或简单在此触发一些动画）
    const event = new CustomEvent('easter-egg-triggered')
    window.dispatchEvent(event)
  }
}

// 监听窗口大小变化
onMounted(() => {
  window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
      // 屏幕变宽时自动展开（可选）
      // isSidebarCollapse.value = false
    } else {
      // 屏幕变窄时自动折叠
      isSidebarCollapse.value = true
    }
  })
})

// 定时器标识
let timeTimer = null

// 格式化时间（不足两位补0）
const formatTime = (num) => {
  return num.toString().padStart(2, '0')
}

// 计算已恋爱时长（核心：从2019-12-29到当前时间）
const calculateLoveDuration = () => {
  const start = dayjs(loveStartDate.value)
  const now = dayjs()
  const diffMs = now.diff(start) // 时间差（毫秒）

  // 分解为天/时/分/秒
  const oneDayMs = 1000 * 60 * 60 * 24
  const oneHourMs = 1000 * 60 * 60
  const oneMinuteMs = 1000 * 60

  loveDuration.value.days = Math.floor(diffMs / oneDayMs)
  loveDuration.value.hours = Math.floor((diffMs % oneDayMs) / oneHourMs)
  loveDuration.value.minutes = Math.floor((diffMs % oneHourMs) / oneMinuteMs)
  loveDuration.value.seconds = Math.floor((diffMs % oneMinuteMs) / 1000)
}

// 生成未来的重要纪念日（基于2019-12-29动态计算）
const generateFutureAnniversaries = () => {
  const start = dayjs(loveStartDate.value)
  const now = dayjs()
  const anniversaries = []

  // 1. 恋爱周年纪念日（比如2025年是6周年，2026年7周年...）
  for (let yearOffset = now.diff(start, 'year') + 1; yearOffset <= now.diff(start, 'year') + 3; yearOffset++) {
    const anniversaryDate = start.add(yearOffset, 'year').format('YYYY-MM-DD HH:mm:ss')
    if (dayjs(anniversaryDate).isAfter(now)) {
      anniversaries.push({
        name: `${yearOffset}周年纪念日`,
        date: anniversaryDate
      })
    }
  }

  // 2. 每年520纪念日（5月20日13:14）
  for (let yearOffset = 0; yearOffset <= 2; yearOffset++) {
    const currentYear = now.year() + yearOffset
    const love520Date = `${currentYear}-05-20 13:14:00`
    if (dayjs(love520Date).isAfter(now)) {
      anniversaries.push({
        name: `${currentYear}年520纪念日`,
        date: love520Date
      })
    }
  }

  // 3. 下一个整数百天纪念日（比如当前已恋爱2200天→2300天）
  const currentTotalDays = now.diff(start, 'day')
  const nextHundredDay = Math.ceil(currentTotalDays / 100) * 100
  const hundredDayDate = start.add(nextHundredDay, 'day').format('YYYY-MM-DD HH:mm:ss')
  if (dayjs(hundredDayDate).isAfter(now)) {
    anniversaries.push({
      name: `${nextHundredDay}天纪念日`,
      date: hundredDayDate
    })
  }

  // 按日期排序（最近的纪念日排第一）
  const sorted = anniversaries.sort((a, b) => dayjs(a.date) - dayjs(b.date))
  futureAnniversaries.value = sorted
  return sorted
}

// 选择最近的纪念日作为倒计时目标
const setRecentAnniversary = () => {
  const sortedAnniversaries = generateFutureAnniversaries()
  if (sortedAnniversaries.length > 0) {
    anniversaryTarget.value = sortedAnniversaries[0]
  } else {
    anniversaryTarget.value = { name: '暂无未来纪念日', date: now.format('YYYY-MM-DD HH:mm:ss') }
  }
}

// 计算纪念日倒计时
const calculateAnniversaryCountdown = () => {
  const target = dayjs(anniversaryTarget.value.date)
  const now = dayjs()
  const diffMs = target.diff(now)

  const oneDayMs = 1000 * 60 * 60 * 24
  const oneHourMs = 1000 * 60 * 60
  const oneMinuteMs = 1000 * 60

  anniversaryCountdown.value.days = Math.floor(diffMs / oneDayMs)
  anniversaryCountdown.value.hours = Math.floor((diffMs % oneDayMs) / oneHourMs)
  anniversaryCountdown.value.minutes = Math.floor((diffMs % oneHourMs) / oneMinuteMs)
  anniversaryCountdown.value.seconds = Math.floor((diffMs % oneMinuteMs) / 1000)
}

// 统一计算函数（根据当前视图切换）
const calculateTime = () => {
  if (currentView.value === 'loveDuration') {
    calculateLoveDuration()
    animateNumbers(loveDuration.value, displayLoveDuration.value)
  } else {
    calculateAnniversaryCountdown()
    animateNumbers(anniversaryCountdown.value, displayAnniversaryCountdown.value)
  }
}

// 切换视图
const toggleView = (viewType) => {
  currentView.value = viewType
  if (viewType === 'anniversary') {
    setRecentAnniversary() // 切换到纪念日时重新计算最近目标
  }
  calculateTime()
}

// 启动定时器（每秒更新时间）
const startTimer = () => {
  calculateTime() // 初始化计算
  // 首次进入时，确保 display 数据从 0 滚动到当前值
  animateNumbers(loveDuration.value, displayLoveDuration.value)
  if (anniversaryTarget.value.date) {
    animateNumbers(anniversaryCountdown.value, displayAnniversaryCountdown.value)
  }
  
  timeTimer = setInterval(calculateTime, 1000) // 每秒刷新
}

// 切换侧边栏
const toggleSidebar = () => {
  isSidebarCollapse.value = !isSidebarCollapse.value
}

// 退出登录逻辑
const handleDropdownCommand = (command) => {
  if (command === 'logout') {
    localStorage.removeItem('token')
    router.push('/login')
  }
}

// 监听视图变化，确保数据同步
watch(currentView, () => {
  calculateTime()
})

// 生命周期：页面挂载时初始化
onMounted(() => {
  updateTheme() // 初始化主题
  setRecentAnniversary() // 生成纪念日列表
  startTimer() // 启动时间更新
  
  // 初始化爱情树数据
  const start = dayjs(loveStartDate.value)
  const now = dayjs()
  loveTreeLevel.value = now.diff(start, 'day')
  
  const savedProgress = localStorage.getItem('loveTreeProgress')
  if (savedProgress) {
    loveTreeProgress.value = parseFloat(savedProgress)
  }
})

// 生命周期：页面卸载时清除定时器（防止内存泄漏）
onUnmounted(() => {
  if (timeTimer) clearInterval(timeTimer)
})
</script>

<style scoped>
/* 爱情树养成区域样式 */
.love-tree-section {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 30px;
  padding: 30px;
  margin-bottom: 35px;
  box-shadow: 0 15px 45px rgba(255, 182, 193, 0.2);
}

.tree-header {
  text-align: center;
  margin-bottom: 30px;
}

.tree-header h3 {
  color: #e63946;
  font-size: 22px;
  margin-bottom: 8px;
  font-weight: 700;
}

.tree-header p {
  color: #6d6875;
  font-size: 14px;
}

.tree-container {
  display: flex;
  align-items: center;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 30px;
}

.tree-visual {
  position: relative;
  width: 200px;
  height: 250px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
}

.tree-trunk {
  width: 30px;
  height: 100px;
  background: linear-gradient(to right, #8d6e63, #5d4037);
  border-radius: 5px 5px 0 0;
  position: relative;
  z-index: 1;
}

.tree-leaves {
  position: absolute;
  bottom: 80px;
  width: 180px;
  height: 180px;
  transition: transform 1s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: flex;
  justify-content: center;
  align-items: center;
}

.leaf-cluster {
  position: absolute;
  width: 100px;
  height: 100px;
  background: rgba(129, 199, 132, 0.8);
  border-radius: 50%;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
}

.leaf-cluster:nth-child(1) { top: 0; left: 40px; }
.leaf-cluster:nth-child(2) { top: 40px; left: 0; background: rgba(102, 187, 106, 0.85); }
.leaf-cluster:nth-child(3) { top: 40px; right: 0; background: rgba(102, 187, 106, 0.85); }
.leaf-cluster:nth-child(4) { bottom: 0; left: 20px; background: rgba(76, 175, 80, 0.9); }
.leaf-cluster:nth-child(5) { bottom: 0; right: 20px; background: rgba(76, 175, 80, 0.9); }

.tree-heart {
  position: absolute;
  font-size: 20px;
  animation: heartPulse 2s infinite ease-in-out;
}

.tree-heart:nth-child(6) { top: 20px; left: 80px; animation-delay: 0s; }
.tree-heart:nth-child(7) { top: 60px; left: 30px; animation-delay: 0.3s; }
.tree-heart:nth-child(8) { top: 60px; right: 30px; animation-delay: 0.6s; }
.tree-heart:nth-child(9) { bottom: 40px; left: 50px; animation-delay: 0.9s; }
.tree-heart:nth-child(10) { bottom: 40px; right: 50px; animation-delay: 1.2s; }
.tree-heart:nth-child(11) { top: 90px; left: 85px; animation-delay: 1.5s; }
.tree-heart:nth-child(12) { top: 10px; left: 40px; animation-delay: 1.8s; }
.tree-heart:nth-child(13) { top: 110px; right: 45px; animation-delay: 2.1s; }

@keyframes heartPulse {
  0%, 100% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.3); opacity: 1; text-shadow: 0 0 10px rgba(230, 57, 70, 0.5); }
}

.heart-trigger {
  cursor: pointer;
  display: inline-block;
  transition: transform 0.3s;
}

.heart-trigger:active {
  transform: scale(1.5);
}

.home-footer-quote {
  margin-top: 40px;
  padding: 25px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
  animation: fadeInUp 1s ease-out;
}

.home-footer-quote:hover {
  background: rgba(255, 255, 255, 0.6);
  transform: translateY(-5px);
  box-shadow: 0 10px 25px rgba(255, 182, 193, 0.2);
}

.quote-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  margin-bottom: 8px;
}

.quote-text {
  font-size: 16px;
  color: #e63946;
  font-style: italic;
  font-weight: 500;
  line-height: 1.6;
}

.quote-icon-left, .quote-icon-right {
  font-size: 20px;
  color: rgba(230, 57, 70, 0.3);
}

.quote-tip {
  font-size: 12px;
  color: #9e9e9e;
  margin: 0;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.tree-info {
  flex: 1;
  min-width: 250px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

.progress-bar-container {
  width: 100%;
  height: 16px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

.progress-bar-fill {
  height: 100%;
  background: linear-gradient(to right, #81c784, #4caf50);
  border-radius: 8px;
  transition: width 1s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 0 10px rgba(76, 175, 80, 0.3);
}

.growth-tip {
  color: #6d6875;
  font-size: 15px;
  font-style: italic;
  text-align: center;
}

.water-btn {
  padding: 15px 40px !important;
  font-size: 18px !important;
  font-weight: 700 !important;
  box-shadow: 0 10px 25px rgba(230, 57, 70, 0.3) !important;
  transition: all 0.3s !important;
}

.water-btn:not(:disabled):hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 15px 35px rgba(230, 57, 70, 0.4) !important;
}

.water-btn:disabled {
  background: #ffcdd2 !important;
  border-color: #ffcdd2 !important;
}

/* 浪漫心形进度条样式 */
.romantic-heart-progress {
  margin-top: 50px;
  text-align: center;
  position: relative;
  z-index: 1;
  padding: 30px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  border-radius: 30px;
  border: 1px solid rgba(255, 255, 255, 0.4);
}
.heart-container {
  position: relative;
  width: 120px;
  height: 100px;
  margin: 0 auto;
  cursor: pointer;
}
.heart-bg, .heart-fill {
  position: absolute;
  width: 120px;
  height: 100px;
  top: 0;
  left: 0;
}
.heart-bg::before, .heart-bg::after,
.heart-fill::before, .heart-fill::after {
  content: "";
  position: absolute;
  width: 60px;
  height: 100px;
  border-radius: 50px 50px 0 0;
}
.heart-bg::before, .heart-bg::after {
  background-color: #ffccd5;
}
.heart-bg::before {
  left: 60px;
  transform: rotate(-45deg);
  transform-origin: 0 100%;
}
.heart-bg::after {
  left: 0;
  transform: rotate(45deg);
  transform-origin: 100% 100%;
}
.heart-fill {
  transform: scaleX(0);
  transform-origin: left center;
  animation: heartProgress 10s linear infinite;
  overflow: hidden;
  transition: animation-duration 0.3s ease;
}
.heart-fill::before, .heart-fill::after {
  background-color: #e63946;
}
.heart-fill::before {
  left: 60px;
  transform: rotate(-45deg);
  transform-origin: 0 100%;
}
.heart-fill::after {
  left: 0;
  transform: rotate(45deg);
  transform-origin: 100% 100%;
}
@keyframes heartProgress {
  0% { transform: scaleX(0); }
  100% { transform: scaleX(1); }
}
.heart-container:hover .heart-fill {
  animation: heartProgress 3s linear infinite;
}
.progress-text {
  color: #6d6875;
  margin-top: 15px;
  font-size: 1rem;
  text-shadow: 0 1px 2px rgba(0,0,0,0.05);
  transition: color 0.3s ease;
}
.heart-container:hover + .progress-text {
  color: #e63946;
}

/* 页面整体浪漫背景 */
.home-container {
  min-height: 100vh;
  background: transparent;
  position: relative;
  overflow-x: hidden;
}

/* 顶部导航样式 */
.home-header {
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  box-shadow: 0 4px 20px rgba(255, 182, 193, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  position: relative;
  z-index: 1002;
  border-bottom: 1px solid rgba(255, 255, 255, 0.5);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.menu-toggle {
  cursor: pointer;
  font-size: 20px;
  color: #e63946;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  padding: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
}

.menu-toggle:hover {
  background-color: rgba(230, 57, 70, 0.15);
  transform: rotate(90deg) scale(1.1);
}

.app-title {
  font-size: 20px;
  font-weight: 700;
  color: #e63946;
  letter-spacing: 1.5px;
  background: linear-gradient(45deg, #e63946, #ff8fa3);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 4px 8px rgba(230, 57, 70, 0.1);
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.theme-toggle-btn {
  font-size: 20px !important;
  border: none !important;
  background: rgba(255, 255, 255, 0.5) !important;
  color: #ff4757 !important;
  transition: all 0.3s !important;
}

.theme-toggle-btn:hover {
  transform: rotate(30deg) scale(1.1);
  background: white !important;
}

/* 侧边栏样式 */
.home-aside {
  background-color: rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-right: 1px solid rgba(255, 255, 255, 0.4);
  box-shadow: 10px 0 30px rgba(255, 182, 193, 0.1);
  transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  z-index: 10;
}

.aside-menu {
  border-right: none !important;
  background-color: transparent !important;
  padding-top: 20px;
}

:deep(.el-menu-item) {
  margin: 10px 16px;
  border-radius: 16px;
  height: 56px;
  line-height: 56px;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  color: #6d6875 !important;
}

:deep(.el-menu-item:hover) {
  background-color: rgba(230, 57, 70, 0.1) !important;
  transform: translateX(8px) scale(1.02);
  color: #e63946 !important;
}

:deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, rgba(230, 57, 70, 0.15), rgba(255, 143, 163, 0.15)) !important;
  color: #e63946 !important;
  font-weight: 700;
  box-shadow: 0 8px 20px rgba(230, 57, 70, 0.15);
}

:deep(.el-menu-item .el-icon) {
  font-size: 20px;
  margin-right: 12px;
  transition: all 0.4s;
}

:deep(.el-menu-item:hover .el-icon) {
  transform: scale(1.2);
  color: #e63946;
}

/* 欢迎卡片优化 */
.welcome-card {
  background: rgba(255, 255, 255, 0.55);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 30px;
  padding: 40px;
  margin-bottom: 35px;
  box-shadow: 0 15px 45px rgba(255, 182, 193, 0.25);
  text-align: center;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  position: relative;
  overflow: hidden;
}

.welcome-card h2 {
  color: #e63946;
  font-size: 28px;
  margin-bottom: 25px;
  font-weight: 700;
  letter-spacing: 1px;
}

.time-text {
  font-size: 32px;
  color: #e63946;
  font-weight: 800;
  margin: 20px 0;
  letter-spacing: 2px;
  text-shadow: 0 2px 10px rgba(230, 57, 70, 0.2);
}

/* 切换按钮样式 */
.view-toggle-btn-group {
  margin-bottom: 25px;
  display: flex;
  gap: 15px;
  justify-content: center;
}

.toggle-btn {
  background: rgba(255, 255, 255, 0.5) !important;
  border: 1px solid rgba(255, 255, 255, 0.6) !important;
  color: #6d6875 !important;
  backdrop-filter: blur(5px);
  border-radius: 12px !important;
  padding: 10px 20px !important;
  transition: all 0.3s !important;
}

.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.8) !important;
  transform: translateY(-2px);
  color: #e63946 !important;
}

.active-btn {
  background: #e63946 !important;
  color: white !important;
  border-color: #e63946 !important;
  box-shadow: 0 4px 15px rgba(230, 57, 70, 0.3) !important;
}

/* 数据卡片优化 */
.stats-card-group {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
}

.stats-card {
  background: rgba(255, 255, 255, 0.55) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.6) !important;
  border-radius: 24px !important;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.stats-card:hover {
  transform: translateY(-10px) scale(1.03);
  background: rgba(255, 255, 255, 0.75) !important;
  box-shadow: 0 15px 35px rgba(255, 182, 193, 0.3) !important;
}

.stats-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 25px 0;
}

.stats-label {
  color: #6d6875;
  font-size: 1rem;
  font-weight: 500;
}

.stats-value {
  color: #e63946;
  font-size: 1.8rem;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(230, 57, 70, 0.1);
}

/* 视图切换动画 */
.view-fade-enter-active,
.view-fade-leave-active {
  transition: all 0.5s ease;
}
.view-fade-enter-from,
.view-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 移动端遮罩层 */
.mobile-mask {
  display: none;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .home-header {
    padding: 0 15px !important;
    background: rgba(255, 255, 255, 0.98) !important;
    box-shadow: 0 2px 15px rgba(255, 182, 193, 0.2) !important;
  }

  .menu-toggle {
    font-size: 26px !important;
    color: #e63946 !important;
    background: rgba(230, 57, 70, 0.12) !important;
    box-shadow: 0 2px 10px rgba(230, 57, 70, 0.15);
    padding: 8px !important;
  }

  .app-title {
    font-size: 15px !important;
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .header-right {
    gap: 8px !important;
  }

  .username {
    display: none;
  }

  .home-aside {
    position: fixed;
    height: calc(100vh - 60px);
    top: 60px;
    left: 0;
    z-index: 1001;
    background-color: rgba(255, 255, 255, 0.98) !important;
    backdrop-filter: blur(10px) !important;
    box-shadow: 10px 0 25px rgba(255, 182, 193, 0.3);
  }
  
  .home-aside.is-mobile-hidden {
    width: 0 !important;
    transform: translateX(-100%);
    opacity: 0;
    pointer-events: none;
  }

  .home-aside:not(.is-mobile-hidden) {
    width: 200px !important;
    transform: translateX(0);
    opacity: 1;
  }

  :deep(.el-menu-item) {
    margin: 8px 12px !important;
    height: 50px !important;
    line-height: 50px !important;
    font-size: 15px !important;
  }

  :deep(.el-menu-item .el-icon) {
    font-size: 22px !important;
  }

  .mobile-mask {
    display: block;
    position: fixed;
    top: 60px;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: rgba(0, 0, 0, 0.3);
    z-index: 1000;
    backdrop-filter: blur(2px);
  }

  .home-main {
    padding: 15px !important;
    width: 100%;
  }

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
