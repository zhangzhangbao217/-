<template>
  <div id="app-container">
    <!-- 背景漂浮爱心 -->
    <div class="floating-hearts-container">
      <div 
        v-for="heart in hearts" 
        :key="heart.id"
        class="floating-heart"
        :style="{
          left: heart.left + '%',
          animationDuration: heart.duration + 's',
          animationDelay: heart.delay + 's',
          fontSize: heart.size + 'px',
          opacity: heart.opacity
        }"
      >❤️</div>
    </div>

    <!-- 全局心动光标 -->
    <div 
      class="heart-cursor" 
      :style="{ left: cursorX + 'px', top: cursorY + 'px', transform: `translate(-50%, -50%) scale(${isClicking ? 0.8 : 1})` }"
    >❤️</div>

    <!-- 点击特效粒子 -->
    <div v-for="particle in particles" :key="particle.id" 
         class="click-particle" 
         :style="{ left: particle.x + 'px', top: particle.y + 'px', transform: `translate(-50%, -50%) rotate(${particle.rotate}deg) scale(${particle.scale})`, opacity: particle.opacity }">
      ❤️
    </div>

    <!-- 全局加载动效 -->
    <transition name="fade">
      <div v-if="isLoading" class="global-loading">
        <div class="loading-heart-wrapper">
          <div class="loading-heart">❤️</div>
          <p class="loading-text">爱意加载中...</p>
        </div>
      </div>
    </transition>

    <!-- 路由出口：增加平滑过渡动画 -->
    <router-view v-slot="{ Component }">
      <transition name="fade-slide" mode="out-in">
        <component :is="Component" />
      </transition>
    </router-view>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { initChat } from './services/chatManager'

const router = useRouter()
const cursorX = ref(-100)
const cursorY = ref(-100)
const isClicking = ref(false)
const isLoading = ref(false)

// 路由监听加载
router.beforeEach((to, from, next) => {
  isLoading.value = true
  next()
})

router.afterEach(() => {
  setTimeout(() => {
    isLoading.value = false
  }, 800) // 延迟关闭，确动画完整
})

interface Particle {
  id: number
  x: number
  y: number
  rotate: number
  scale: number
  opacity: number
}

const particles = ref<Particle[]>([])
let particleId = 0

const createParticles = (x: number, y: number) => {
  for (let i = 0; i < 6; i++) {
    const id = particleId++
    const particle: Particle = {
      id,
      x,
      y,
      rotate: Math.random() * 360,
      scale: 0.5 + Math.random(),
      opacity: 1
    }
    particles.value.push(particle)
    
    // 动画效果
    setTimeout(() => {
      const index = particles.value.findIndex(p => p.id === id)
      if (index !== -1) {
        const p = particles.value[index]
        if (p) {
          p.x += (Math.random() - 0.5) * 100
          p.y += (Math.random() - 0.5) * 100
          p.opacity = 0
          p.scale = 0
        }
      }
    }, 10)

    // 移除粒子
    setTimeout(() => {
      particles.value = particles.value.filter(p => p.id !== id)
    }, 1000)
  }
}

interface Heart {
  id: number
  left: number
  duration: number
  delay: number
  size: number
  opacity: number
}

const hearts = ref<Heart[]>([])
const heartCount = 15

const generateHearts = () => {
  const newHearts: Heart[] = []
  for (let i = 0; i < heartCount; i++) {
    newHearts.push({
      id: i,
      left: Math.random() * 100,
      duration: 10 + Math.random() * 20,
      delay: Math.random() * -20,
      size: 10 + Math.random() * 20,
      opacity: 0.1 + Math.random() * 0.3
    })
  }
  hearts.value = newHearts
}

const updateCursor = (e: MouseEvent) => {
  cursorX.value = e.clientX
  cursorY.value = e.clientY
}

const handleMouseDown = (e: MouseEvent) => {
  isClicking.value = true
  createParticles(e.clientX, e.clientY)
}
const handleMouseUp = () => isClicking.value = false

const triggerEasterEggBurst = () => {
  // 触发一次大量的粒子喷发
  const centerX = window.innerWidth / 2
  const centerY = window.innerHeight / 2
  for (let i = 0; i < 30; i++) {
    setTimeout(() => {
      createParticles(
        centerX + (Math.random() - 0.5) * 300, 
        centerY + (Math.random() - 0.5) * 300
      )
    }, i * 50)
  }
}

// 后台保活逻辑：播放一段静音音频
const enableBackgroundMode = () => {
  const audio = new Audio();
  // 这是一个 1秒的静音 base64 音频
  audio.src = 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAA==';
  audio.loop = true;
  audio.play().catch(() => {
    console.log('后台保活音频播放失败，可能需要用户交互');
  });
}

onMounted(() => {
  // 初始化全局聊天连接
  initChat(true);
  
  // 请求通知权限
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }

  generateHearts()
  window.addEventListener('mousemove', updateCursor)
  window.addEventListener('mousedown', handleMouseDown)
  window.addEventListener('mouseup', handleMouseUp)
  window.addEventListener('easter-egg-triggered', triggerEasterEggBurst)
  
  // 只要用户有点击行为，就尝试开启后台保活
  window.addEventListener('click', enableBackgroundMode, { once: true });
})

onUnmounted(() => {
  window.removeEventListener('mousemove', updateCursor)
  window.removeEventListener('mousedown', handleMouseDown)
  window.removeEventListener('mouseup', handleMouseUp)
  window.removeEventListener('easter-egg-triggered', triggerEasterEggBurst)
})
</script>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  transition: background-color 0.5s, color 0.5s;
}

body {
  font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
  overflow-x: hidden;
  cursor: none; /* 隐藏默认光标 */
  background-color: #fff9fb;
}

/* 暗黑模式样式 (Sweet Night) */
:root.dark-mode body {
  background-color: #1a1a2e;
  color: #e0e0e0;
}

:root.dark-mode .home-header,
:root.dark-mode .home-aside,
:root.dark-mode .welcome-card,
:root.dark-mode .stats-card,
:root.dark-mode .love-tree-section,
:root.dark-mode .home-footer-quote,
:root.dark-mode .bgm-player .player-content {
  background: rgba(30, 30, 50, 0.7) !important;
  color: #e0e0e0 !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
}

:root.dark-mode .app-title,
:root.dark-mode .username,
:root.dark-mode .time-text,
:root.dark-mode .stats-value,
:root.dark-mode .tree-header h3 {
  color: #ff7f9d !important;
}

:root.dark-mode .aside-menu {
  background-color: #1a1a2e !important;
}

:root.dark-mode .el-menu-item {
  color: #a0a0a0 !important;
}

:root.dark-mode .el-menu-item.is-active {
  color: #ff4757 !important;
  background: rgba(255, 71, 87, 0.1) !important;
}

:root.dark-mode .global-loading {
  background: rgba(26, 26, 46, 0.95);
}

#app-container {
  min-height: 100vh;
  position: relative;
}

/* 背景漂浮爱心样式 */
.floating-hearts-container {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
}

.floating-heart {
  position: absolute;
  bottom: -50px;
  animation: floatUp linear infinite;
  user-select: none;
}

@keyframes floatUp {
  0% {
    transform: translateY(0) rotate(0deg);
    opacity: 0;
  }
  10% {
    opacity: inherit;
  }
  90% {
    opacity: inherit;
  }
  100% {
    transform: translateY(-110vh) rotate(360deg);
    opacity: 0;
  }
}

/* 心动光标样式 */
.heart-cursor {
  position: fixed;
  pointer-events: none;
  z-index: 9999;
  font-size: 20px;
  transition: transform 0.15s ease-out;
  filter: drop-shadow(0 0 5px rgba(230, 57, 70, 0.5));
}

.click-particle {
  position: fixed;
  pointer-events: none;
  z-index: 9998;
  font-size: 16px;
  transition: all 0.8s cubic-bezier(0.25, 0.46, 0.45, 0.94);
  user-select: none;
}

/* 路由过渡动画：淡入并轻微上移 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}

/* 全局加载动效样式 */
.global-loading {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 249, 251, 0.9);
  backdrop-filter: blur(10px);
  z-index: 99999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-heart-wrapper {
  text-align: center;
}

.loading-heart {
  font-size: 60px;
  animation: heartBeat 1.2s infinite cubic-bezier(0.215, 0.61, 0.355, 1);
  filter: drop-shadow(0 0 15px rgba(230, 57, 70, 0.4));
}

.loading-text {
  margin-top: 20px;
  color: #e63946;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 2px;
}

@keyframes heartBeat {
  0% { transform: scale(0.95); }
  5% { transform: scale(1.1); }
  39% { transform: scale(0.85); }
  45% { transform: scale(1); }
  60% { transform: scale(0.95); }
  100% { transform: scale(0.9); }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

/* 针对移动端的点击态优化 */
button, .el-button, .menu-item, .back-btn {
  cursor: none !important;
}
</style>
