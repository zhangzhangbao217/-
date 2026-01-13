<template>
  <div class="album-content-wrapper">
    <div class="album-main">
      <div class="page-title-bar">
        <h2>{{ title }} ✨</h2>
        <p>每一帧都是心动的瞬间</p>
      </div>

      <!-- 3D 场景 -->
      <div class="scene-container">
        <div class="scene">
          <div class="ball" :style="ballStyle">
            <div 
              v-for="(img, idx) in photoList" 
              :key="`photo_${idx}`"
              class="photo-card"
              :class="{ 'is-active': activeIdx === idx }"
              :style="getPhotoStyle(idx)"
              @click="openPhoto(idx)"
            >
              <div class="photo-inner">
                <img :src="img" alt="回忆" />
                <div class="photo-frame"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 背景粒子效果 -->
      <div class="particles">
        <div v-for="i in 20" :key="i" class="particle"></div>
      </div>

      <div class="upload-area">
        <el-upload
          action="#"
          :auto-upload="true"
          :before-upload="handleUpload"
          :show-file-list="false"
          accept="image/*"
        >
          <el-button type="primary" class="romantic-upload-btn">
            <el-icon><Camera /></el-icon>
            添加新回忆
          </el-button>
        </el-upload>
      </div>

      <!-- 放大展示 -->
      <transition name="zoom">
        <div v-if="isZoomed" class="zoom-overlay" @click="closeZoom">
          <div class="zoomed-card" @click.stop>
            <img :src="photoList[activeIdx]" alt="放大照片" />
            <div class="zoomed-info">
              <p>记录于 {{ new Date().toLocaleDateString() }}</p>
              <el-button circle :icon="Delete" type="danger" size="small" @click="deletePhoto(activeIdx)" />
            </div>
            <el-icon class="close-icon" @click="closeZoom"><Close /></el-icon>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue'
import { Camera, Delete, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const title = ref('我们的专属回忆')

const staticPhotos = [
  '/4d73516d866b0b83635639b8f81e3c2c.jpg',
  '/9b73ec5057f40e63f099161a50f70820.jpg',
  '/d52fc37974aaffa0d02e9362f10e5d91.jpg',
  '/d5653d2f76e32e0e4ce97aba54a0c6c9.jpg',
  '/df49bc6ca7d5b77ace3eeaec5d0008c6.jpg',
  '/ed2f20b1e6fa3f80f1544d618ccaa44c.jpg'
]

const photoList = ref([...staticPhotos])
const activeIdx = ref(0)
const isZoomed = ref(false)

const rotationY = ref(0)
const rotationX = ref(-10)
const isReversing = ref(false)
const autoOpenTimer = ref(null)
const rotationTimer = ref(null)
const reverseTimer = ref(null)

const ballStyle = computed(() => ({
  transform: `rotateX(${rotationX.value}deg) rotateY(${rotationY.value}deg)`
}))

const getPhotoStyle = (idx) => {
  const total = photoList.value.length
  const angle = (360 / total) * idx
  const radius = window.innerWidth < 768 ? 150 : 250
  
  return {
    transform: `rotateY(${angle}deg) translateZ(${radius}px)`,
    zIndex: Math.round(Math.cos((rotationY.value + angle) * Math.PI / 180) * 100)
  }
}

const startRotation = () => {
  rotationTimer.value = setInterval(() => {
    if (!isZoomed.value) {
      const speed = 0.5
      rotationY.value += isReversing.value ? -speed : speed
    }
  }, 16)

  reverseTimer.value = setInterval(() => {
    isReversing.value = !isReversing.value
  }, 6000)
}

const startAutoOpen = () => {
  autoOpenTimer.value = setInterval(() => {
    if (!isZoomed.value) {
      let minAngleDiff = 360
      let frontIdx = 0
      
      photoList.value.forEach((_, idx) => {
        const photoAngle = (360 / photoList.value.length) * idx
        const currentTotalAngle = (rotationY.value + photoAngle) % 360
        const diff = Math.abs(currentTotalAngle)
        const normalizedDiff = Math.min(diff, 360 - diff)
        
        if (normalizedDiff < minAngleDiff) {
          minAngleDiff = normalizedDiff
          frontIdx = idx
        }
      })
      
      openPhoto(frontIdx)
      
      setTimeout(() => {
        if (isZoomed.value) closeZoom()
      }, 3000)
    }
  }, 5000)
}

const openPhoto = (idx) => {
  activeIdx.value = idx
  isZoomed.value = true
}

const closeZoom = () => {
  isZoomed.value = false
}

let db = null
const initIndexedDB = () => {
  return new Promise((resolve) => {
    const request = window.indexedDB.open('LoveAlbumDB', 1)
    request.onupgradeneeded = (e) => {
      db = e.target.result
      if (!db.objectStoreNames.contains('photos')) {
        db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true })
      }
    }
    request.onsuccess = (e) => {
      db = e.target.result
      resolve()
    }
    request.onerror = () => resolve()
  })
}

const getPhotos = async () => {
  if (!db) await initIndexedDB()
  if (db) {
    const transaction = db.transaction('photos', 'readonly')
    const store = transaction.objectStore('photos')
    const request = store.getAll()
    request.onsuccess = (e) => {
      const dynamicPhotos = e.target.result.map(item => item.base64)
      photoList.value = [...staticPhotos, ...dynamicPhotos]
    }
  }
}

const syncToStorage = async () => {
  if (!db) await initIndexedDB()
  if (db) {
    const clearTx = db.transaction('photos', 'readwrite')
    clearTx.objectStore('photos').clear()
    const tx = db.transaction('photos', 'readwrite')
    const store = tx.objectStore('photos')
    photoList.value.forEach(item => {
      if (!staticPhotos.includes(item)) {
        store.add({ base64: item })
      }
    })
  }
}

onMounted(async () => {
  await getPhotos()
  startRotation()
  startAutoOpen()
})

onUnmounted(() => {
  clearInterval(rotationTimer.value)
  clearInterval(reverseTimer.value)
  clearInterval(autoOpenTimer.value)
})

const handleUpload = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    photoList.value.push(e.target.result)
    syncToStorage()
    ElMessage.success('照片上传成功！')
  }
  reader.readAsDataURL(file)
  return false
}

const deletePhoto = (idx) => {
  photoList.value.splice(idx, 1)
  syncToStorage()
  closeZoom()
  ElMessage.success('照片已删除')
}
</script>

<style scoped>
.album-content-wrapper {
  min-height: 100%;
  background: transparent;
  position: relative;
}

.album-main {
  padding: 20px 0;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-title-bar {
  text-align: center;
  margin-bottom: 20px;
}

.page-title-bar h2 {
  color: #ff6b81;
  font-size: 28px;
  margin-bottom: 5px;
}

.scene-container {
  width: 100%;
  height: 50vh;
  display: flex;
  justify-content: center;
  align-items: center;
  perspective: 1200px;
}

.scene {
  transform-style: preserve-3d;
  width: 200px;
  height: 200px;
}

.ball {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
  transition: transform 0.1s linear;
}

.photo-card {
  position: absolute;
  width: 120px;
  height: 120px;
  left: 50%;
  top: 50%;
  margin-left: -60px;
  margin-top: -60px;
  transition: all 0.5s ease;
  cursor: pointer;
}

.photo-inner {
  width: 100%;
  height: 100%;
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.photo-inner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.photo-frame {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  pointer-events: none;
}

.photo-card:hover {
  transform: scale(1.2) !important;
  z-index: 1000 !important;
}

.upload-area {
  margin-top: auto;
  padding-bottom: 40px;
  z-index: 10;
}

.romantic-upload-btn {
  background: linear-gradient(45deg, #ff758c, #ff7eb3);
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  font-weight: bold;
  box-shadow: 0 4px 15px rgba(255, 117, 140, 0.4);
}

.particles {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 0;
}

.particle {
  position: absolute;
  width: 4px;
  height: 4px;
  background: #fff;
  border-radius: 50%;
  opacity: 0.3;
  animation: float 10s infinite linear;
}

@keyframes float {
  0% { transform: translateY(100vh) scale(1); opacity: 0; }
  50% { opacity: 0.5; }
  100% { transform: translateY(-100px) scale(0.5); opacity: 0; }
}

.zoom-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 2000;
  backdrop-filter: blur(5px);
}

.zoomed-card {
  position: relative;
  max-width: 90vw;
  max-height: 80vh;
  animation: popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.zoomed-card img {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 12px;
  border: 4px solid #fff;
  box-shadow: 0 0 50px rgba(255, 117, 140, 0.3);
}

.zoomed-info {
  margin-top: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: #ccc;
}

.close-icon {
  position: absolute;
  top: -40px;
  right: -10px;
  font-size: 30px;
  color: #fff;
  cursor: pointer;
}

@keyframes popIn {
  from { transform: scale(0.5); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.zoom-enter-active, .zoom-leave-active {
  transition: opacity 0.3s;
}
.zoom-enter-from, .zoom-leave-to {
  opacity: 0;
}
</style>

