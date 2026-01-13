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
        <el-dropdown trigger="click" @command="handleDropdownCommand">
          <div class="user-info">
            <el-avatar 
              :size="32" 
              :src="currentUser.avatar" 
              class="user-avatar"
            >
              {{ (currentUser.name && currentUser.name[0]) || 'U' }}
            </el-avatar>
            <span class="username">{{ currentUser.name }}</span>
            <el-icon class="el-icon--right">
              <ArrowDown />
            </el-icon>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">个人资料设置</el-dropdown-item>
              <el-dropdown-item v-if="isAdmin" command="admin">管理员后台</el-dropdown-item>
              <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
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
            :default-active="activeMenu"
            class="aside-menu"
            background-color="#fff5f7"
            text-color="#6d6875"
            active-text-color="#e63946"
            :collapse="isSidebarCollapse"
            :collapse-transition="false"
        >
          <el-menu-item index="1" class="menu-item" @click="goToDashboard">
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
          <el-menu-item index="9" class="menu-item" @click="goToGames">
            <el-icon><Cherry /></el-icon>
            <template #title>恋爱游戏</template>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-main class="home-main" @click="closeSidebarOnMobile">
        <router-view v-slot="{ Component }">
          <transition name="fade-transform" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import {ref, onMounted, computed} from 'vue'
import { useRouter, useRoute } from 'vue-router'
// @ts-ignore
import AV from 'leancloud-storage'
import { currentUser } from '../services/chatManager';
// 引入Element Plus组件和图标
import {
  ElContainer, ElHeader, ElAside, ElMain,
  ElMenu, ElMenuItem, ElDropdown, ElDropdownMenu,
  ElDropdownItem, ElAvatar, ElIcon
} from 'element-plus'
import {Menu, ArrowDown, House, Calendar, Message, Picture, Document, List, Stamp, ChatDotRound, Moon, Sunny, Cherry} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()

// 根据当前路由计算激活的菜单项
const activeMenu = computed(() => {
  const path = route.path
  if (path.includes('/home/dashboard')) return '1'
  if (path.includes('/home/anniversary-manage')) return '2'
  if (path.includes('/home/sweet-quote')) return '3'
  if (path.includes('/home/love-album')) return '4'
  if (path.includes('/home/dian-dian-di-di')) return '5'
  if (path.includes('/home/bucket-list')) return '6'
  if (path.includes('/home/contracts')) return '7'
  if (path.includes('/home/chat')) return '8'
  if (path.includes('/home/games')) return '9'
  return '1'
})

// 移动端自动折叠侧边栏
const closeSidebarOnMobile = () => {
  if (window.innerWidth <= 768) {
    isSidebarCollapse.value = true
  }
}

const toggleSidebar = () => {
  isSidebarCollapse.value = !isSidebarCollapse.value
}

// 导航跳转
const goToDashboard = () => {
  closeSidebarOnMobile()
  router.push('/home/dashboard')
}
const goToAnniversaryManage = () => {
  closeSidebarOnMobile()
  router.push('/home/anniversary-manage')
}
const goToSweetQuote = () => {
  closeSidebarOnMobile()
  router.push('/home/sweet-quote')
}
const goToLoveAlbum = () => {
  closeSidebarOnMobile()
  router.push('/home/love-album')
}
const goToDianDianDiDi = () => {
  closeSidebarOnMobile()
  router.push('/home/dian-dian-di-di');
};
const goToBucketList = () => {
  closeSidebarOnMobile()
  router.push('/home/bucket-list')
}
const goToContracts = () => {
  closeSidebarOnMobile()
  router.push('/home/contracts')
}
const goToChat = () => {
  closeSidebarOnMobile()
  router.push('/home/chat')
}
const goToGames = () => {
  closeSidebarOnMobile()
  router.push('/home/games')
}

// 侧边栏状态
const isSidebarCollapse = ref(window.innerWidth <= 768)

// 暗黑模式逻辑
const isDarkMode = ref(localStorage.getItem('theme') === 'dark')
const isAdmin = ref(localStorage.getItem('isAdmin') === 'true')

const handleDropdownCommand = (command) => {
  if (command === 'logout') {
    AV.User.logOut()
    localStorage.clear()
    router.push('/login')
  } else if (command === 'profile') {
    router.push('/profile')
  } else if (command === 'admin') {
    router.push('/admin')
  }
}

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

onMounted(() => {
  updateTheme()
  window.addEventListener('resize', () => {
    if (window.innerWidth <= 768) {
      isSidebarCollapse.value = true
    }
  })
})
</script>

<style scoped>
/* 页面整体布局 */
.home-container {
  height: 100vh;
  width: 100%;
  display: flex;
  flex-direction: column;
}

/* 顶部导航样式 */
.home-header {
  height: 60px !important;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  box-shadow: 0 2px 10px rgba(230, 57, 70, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 24px;
  z-index: 1002;
  border-bottom: 1px solid rgba(230, 57, 70, 0.1);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.menu-toggle {
  cursor: pointer;
  font-size: 22px;
  color: #e63946;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  transition: all 0.3s;
}

.menu-toggle:hover {
  background-color: rgba(230, 57, 70, 0.1);
}

.app-title {
  font-size: 20px;
  font-weight: 700;
  color: #e63946;
  white-space: nowrap;
  letter-spacing: 0.5px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 15px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 20px;
  transition: all 0.3s;
}

.user-info:hover {
  background: rgba(230, 57, 70, 0.05);
}

.user-avatar {
  border: 2px solid #fff;
  box-shadow: 0 2px 8px rgba(230, 57, 70, 0.1);
}

.username {
  font-size: 14px;
  color: #6d6875;
  font-weight: 500;
}

.theme-toggle-btn {
  font-size: 18px !important;
  border: none !important;
  background: transparent !important;
  color: #ff4757 !important;
}

.theme-toggle-btn:hover {
  transform: rotate(15deg);
}

/* 侧边栏与主内容包裹层 */
.main-wrapper {
  flex: 1;
  display: flex;
  overflow: hidden;
  background-color: #fdf2f4;
}

/* 侧边栏样式 */
.home-aside {
  background-color: #fff5f7;
  border-right: 1px solid rgba(230, 57, 70, 0.1);
  transition: width 0.3s ease;
  overflow: hidden;
  height: 100%;
}

.aside-menu {
  border-right: none !important;
  background-color: transparent !important;
  padding-top: 10px;
}

/* 侧边栏项目悬停与激活 */
:deep(.el-menu-item) {
  margin: 4px 12px;
  border-radius: 12px;
  height: 50px;
  line-height: 50px;
  transition: all 0.3s ease;
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

/* 视图切换动画 */
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.5s cubic-bezier(0.55, 0, 0.1, 1);
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(-30px);
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
}
</style>
