<!-- Home.vue -->
<template>
  <el-container class="home-container">
    <!-- 背景爱心装饰 -->
    <div class="love-bg-decoration"></div>

    <!-- 顶部导航栏 -->
    <el-header class="home-header">
      <div class="header-left">
        <el-icon class="menu-toggle" @click="toggleSidebar">
          <Menu />
        </el-icon>
        <span class="app-title">张张包和小黄包的恋爱窝</span>
      </div>
      <div class="header-right">
        <el-dropdown @command="handleDropdownCommand">
          <div class="user-info">
            <el-avatar icon="el-icon-user" class="user-avatar" />
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
          <el-menu-item index="5" class="menu-item" @click="goToDianDianDiDi"> <!-- 新增条目 -->
            <el-icon><Document /></el-icon> <!-- 使用合适的图标 -->
            <template #title>点点滴滴</template>
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
          <h2>欢迎回来，{{ userName }} 💖</h2>

          <!-- 视图切换过渡容器 -->
          <transition name="view-fade">
            <div key="time-content">
              <!-- 已恋爱时长视图 -->
              <template v-if="currentView === 'loveDuration'">
                <p>张张包和张张小黄包：</p>
                <p class="time-text">
                  {{ loveDuration.days }}天 {{ formatTime(loveDuration.hours) }}时 {{ formatTime(loveDuration.minutes) }}分 {{ formatTime(loveDuration.seconds) }}秒
                </p>
              </template>

              <!-- 纪念日倒计时视图 -->
              <template v-else>
                <p>距离 <span class="anniversary-name">{{ anniversaryTarget.name }}</span> 还有：</p>
                <p class="time-text">
                  {{ anniversaryCountdown.days }}天 {{ formatTime(anniversaryCountdown.hours) }}时 {{ formatTime(anniversaryCountdown.minutes) }}分 {{ formatTime(anniversaryCountdown.seconds) }}秒
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
                      {{ loveDuration.days }}天 {{ formatTime(loveDuration.hours) }}:{{ formatTime(loveDuration.minutes) }}:{{ formatTime(loveDuration.seconds) }}
                    </template>
                    <template v-else>
                      {{ anniversaryCountdown.days }}天 {{ formatTime(anniversaryCountdown.hours) }}:{{ formatTime(anniversaryCountdown.minutes) }}:{{ formatTime(anniversaryCountdown.seconds) }}
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
        </div>
        <!-- 新增：浪漫心形进度条 -->
        <div class="romantic-heart-progress">
          <div class="heart-container">
            <div class="heart-bg"></div>
            <div class="heart-fill"></div>
          </div>
          <p class="progress-text">我们的爱意持续升温中...</p>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import {ref, onMounted, onUnmounted, watch, defineComponent} from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import DianDianDiDi from "@/views/DianDianDiDi.vue";
// 引入Element Plus组件和图标
import {
  ElContainer, ElHeader, ElAside, ElMain,
  ElMenu, ElMenuItem, ElDropdown, ElDropdownMenu,
  ElDropdownItem, ElAvatar, ElCard, ElButton
} from 'element-plus'
import {Menu, ArrowDown, House, Calendar, Message, Picture, Document} from '@element-plus/icons-vue'

defineComponent({
  name: 'Home',
  components: {
    // 注册 DianDianDiDi 组件（如果需要直接渲染）
    DianDianDiDi,
  },
});

const router = useRouter()

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
      // 将待办纪念日数组转为JSON字符串传递
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
// 核心配置：你的恋爱开始时间（固定为2019-12-29 13:14:00）
const userName = ref('亲爱的')
const loveStartDate = ref('2019-12-29 13:14:00')

// 视图切换状态
const currentView = ref('loveDuration')
// 已恋爱时长数据
const loveDuration = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })
// 纪念日相关（动态生成）
const anniversaryTarget = ref({ name: '', date: '' }) // 当前倒计时的纪念日
const anniversaryCountdown = ref({ days: 0, hours: 0, minutes: 0, seconds: 0 })
const futureAnniversaries = ref([]) // 所有未来纪念日列表
// 侧边栏状态
const isSidebarCollapse = ref(window.innerWidth <= 768)

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
  } else {
    calculateAnniversaryCountdown()
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
  setRecentAnniversary() // 生成纪念日列表
  startTimer() // 启动时间更新
})

// 生命周期：页面卸载时清除定时器（防止内存泄漏）
onUnmounted(() => {
  if (timeTimer) clearInterval(timeTimer)
})
</script>

<style scoped>
/* 浪漫心形进度条样式 */
.romantic-heart-progress {
  margin-top: 50px;
  text-align: center;
  position: relative;
  z-index: 1;
}
.heart-container {
  position: relative;
  width: 120px;
  height: 100px;
  margin: 0 auto;
  cursor: pointer; /* 鼠标指针变手型 */
}
/* 心形基础形状（浅粉色背景） */
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
/* 浅粉色背景心形 */
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
/* 深粉色填充心形（进度动画） */
.heart-fill {
  transform: scaleX(0); /* 初始进度0 */
  transform-origin: left center; /* 从左侧开始填充 */
  animation: heartProgress 10s linear infinite; /* 默认10秒填满，循环 */
  overflow: hidden;
  transition: animation-duration 0.3s ease; /* 动画时长过渡，更丝滑 */
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
/* 进度填充动画 */
@keyframes heartProgress {
  0% { transform: scaleX(0); }   /* 进度0% */
  100% { transform: scaleX(1); } /* 进度100% */
}
/* 新增：鼠标悬浮时加速填充 */
.heart-container:hover .heart-fill {
  animation: heartProgress 3s linear infinite; /* 悬浮时3秒填满 */
}
/* 进度文字（悬浮时变色） */
.progress-text {
  color: #6d6875;
  margin-top: 15px;
  font-size: 1rem;
  text-shadow: 0 1px 2px rgba(0,0,0,0.05);
  transition: color 0.3s ease;
}
.heart-container:hover + .progress-text {
  color: #e63946; /* 悬浮时文字变深粉色 */
}
/* 页面整体浪漫背景 */
.home-container {
  min-height: 100vh;
  background: linear-gradient(120deg, #fff9fb, #ffe6ef);
  position: relative;
  overflow-x: hidden;
}

/* 背景爱心纹理+缓慢浮动 */
.love-bg-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' fill='%23ffccd5' opacity='0.1'%3E%3Cpath d='M10 15C8.343 15 7 13.657 7 12c0-2 3-4 3-4s3 2 3 4c0 1.657-1.343 3-3 3zm0-10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'/%3E%3C/svg%3E");
  background-repeat: repeat;
  animation: floatBg 20s linear infinite;
  z-index: 0;
}
@keyframes floatBg {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}

/* 顶部导航样式 */
.home-header {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(255, 192, 203, 0.2);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
  position: relative;
  z-index: 1;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}
.menu-toggle {
  cursor: pointer;
  font-size: 18px;
  color: #e63946;
  transition: color 0.3s;
}
.menu-toggle:hover {
  color: #ff6b81;
}
.app-title {
  font-size: 16px;
  font-weight: 500;
  color: #e63946;
  text-shadow: 0 1px 2px rgba(230, 57, 70, 0.2);
}
.header-right {
  display: flex;
  align-items: center;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: transform 0.3s;
}
.user-info:hover {
  transform: scale(1.05);
}
.user-avatar {
  background-color: #ffd1dc;
  border: 2px solid #ffb6c1;
}
.username {
  color: #333;
  font-weight: 500;
}
.arrow-icon {
  font-size: 14px;
  color: #999;
}

/* 侧边栏样式+hover动画 */
.home-aside {
  background-color: rgba(255, 245, 247, 0.9);
  backdrop-filter: blur(8px);
  box-shadow: 2px 0 12px rgba(255, 192, 203, 0.1);
  transition: all 0.3s;
  position: relative;
  z-index: 10;
}

/* 移动端遮罩层 */
.mobile-mask {
  display: none;
}

@media (max-width: 768px) {
  .home-aside {
    position: fixed; /* 改为 fixed 确保浮在最上层 */
    height: calc(100vh - 60px);
    top: 60px;
    left: 0;
    z-index: 1001; /* 提高层级 */
    box-shadow: 4px 0 15px rgba(255, 192, 203, 0.3);
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
  
  .main-wrapper {
    width: 100%;
    overflow-x: hidden;
  }
  
  /* 移动端展开时的效果 */
  .home-aside {
    transition: transform 0.3s ease, width 0.3s ease !important;
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

  .app-title {
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 150px;
  }
  
  .username {
    display: none;
  }

  .home-main {
    padding: 15px 10px !important;
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .welcome-card, .stats-card {
    width: 100%;
    max-width: 100%;
    margin-left: 0;
    margin-right: 0;
    padding: 20px 15px;
  }

  .time-text {
    font-size: 1rem;
    word-break: break-all;
    line-height: 1.4;
  }
}

.aside-menu {
  border-right: none;
  height: 100%;
}
.menu-item {
  transition: all 0.3s;
}
.menu-item:hover {
  background-color: rgba(255, 182, 193, 0.2);
  transform: translateX(5px);
}
.menu-item .el-icon {
  transition: color 0.3s;
}
.menu-item:hover .el-icon {
  color: #e63946;
}

/* 主内容区 */
.home-main {
  padding: 30px 20px;
  position: relative;
  z-index: 1;
}

/* 切换按钮+hover动画 */
.view-toggle-btn-group {
  margin-bottom: 20px;
  display: flex;
  gap: 10px;
  justify-content: center;
}
.toggle-btn {
  background-color: #ffd1dc;
  border-color: #ffb6c1;
  color: #e63946;
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  transform-origin: center;
}
.toggle-btn:hover {
  background-color: #ffb6c1;
  border-color: #e63946;
  transform: scale(1.08);
  box-shadow: 0 4px 8px rgba(255, 182, 193, 0.3);
}
.active-btn {
  background-color: #e63946;
  border-color: #e63946;
  color: #fff;
}
.active-btn:hover {
  background-color: #ff6b81;
  border-color: #ff6b81;
  transform: scale(1.08);
  box-shadow: 0 4px 8px rgba(230, 57, 70, 0.3);
}

/* 视图切换淡入淡出动画 */
.view-fade-enter-active,
.view-fade-leave-active {
  transition: all 0.5s ease;
  opacity: 1;
  transform: translateY(0);
}
.view-fade-enter-from,
.view-fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* 欢迎卡片+hover动画 */
.welcome-card {
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  padding: 30px 24px;
  border-radius: 16px;
  box-shadow: 0 6px 16px rgba(255, 192, 203, 0.15);
  margin-bottom: 30px;
  text-align: center;
  transition: all 0.4s ease;
  border: 1px solid rgba(255, 182, 193, 0.3);
}
.welcome-card:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 10px 20px rgba(255, 192, 203, 0.25);
  background-color: #fff;
}
.welcome-card h2 {
  color: #e63946;
  margin-bottom: 12px;
  font-size: 1.8rem;
  text-shadow: 0 2px 4px rgba(230, 57, 70, 0.1);
  animation: pulseText 3s ease-in-out infinite;
}
@keyframes pulseText {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.9; color: #ff6b81; }
}
.welcome-card p {
  color: #6d6875;
  margin: 6px 0;
  font-size: 1.1rem;
}
.anniversary-name {
  color: #e63946;
  font-weight: 600;
}
.time-text {
  font-size: 1.6rem;
  color: #e63946;
  font-weight: 600;
  margin-top: 15px;
  letter-spacing: 1px;
  text-shadow: 0 1px 3px rgba(230, 57, 70, 0.15);
}

/* 数据卡片+hover动画 */
.stats-card-group {
  display: flex;
  gap: 25px;
}

@media (max-width: 768px) {
  .stats-card-group {
    flex-direction: column;
    gap: 15px;
  }
  
  .welcome-card h2 {
    font-size: 1.4rem;
  }
  
  .time-text {
    font-size: 1.1rem;
  }

  .stats-value {
    font-size: 1.4rem;
  }
}

.stats-card {
  flex: 1;
  text-align: center;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 182, 193, 0.2);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(255, 192, 203, 0.1);
  transition: all 0.4s ease;
  overflow: hidden;
  position: relative;
}
.stats-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 18px rgba(255, 192, 203, 0.2);
  background-color: #fff;
}
.stats-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 0;
  height: 3px;
  background: linear-gradient(90deg, #ffb6c1, #e63946);
  transition: width 0.4s ease;
}
.stats-card:hover::before {
  width: 100%;
}
.stats-content {
  padding: 25px 0;
  position: relative;
}
.stats-label {
  display: block;
  color: #6d6875;
  margin-bottom: 10px;
  font-size: 1rem;
}
.stats-value {
  font-size: 1.8rem;
  font-weight: 600;
  color: #e63946;
  text-shadow: 0 1px 2px rgba(230, 57, 70, 0.1);
}
</style>
