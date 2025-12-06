<template>

  <el-container class="album-container">
    <div class="romantic-bg"></div>

    <el-header class="album-header">
      <div class="header-left">
        <el-icon class="back-btn" @click="goBack">
          <ArrowLeft />
        </el-icon>
        <span class="page-title">恋爱相册</span>
      </div>
    </el-header>
    <el-main class="album-main">
      <div class="page-title-bar">
        <h2>我们的专属回忆 📸</h2>
        <p>每一张都是心动的证据</p>
      </div>
      <el-carousel
          allow-drag
          :interval="3000"
          type="card"
          class="fullscreen-carousel"
          indicator-position="outside"
      >
        <el-carousel-item v-for="(img, idx) in photoList" :key="`album_${idx}`">
          <div class="photo-wrapper">
            <img
                :src="img"
                alt="你的照片"
                class="fullscreen-img"
                @click="toggleZoom(idx)"
            >
            <el-button
                class="delete-btn"
                :icon="Delete"
                type="danger"
                size="small"
                @click.stop="deletePhoto(idx)"
            />
          </div>
        </el-carousel-item>
        <el-carousel-item v-if="photoList.length === 0">
          <div class="empty-placeholder">
            点击下方按钮上传照片~
          </div>
        </el-carousel-item>
      </el-carousel>
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
            上传照片
          </el-button>
        </el-upload>
      </div>
      <div
          v-if="isZoomed"
          class="zoom-overlay"
          @click="toggleZoom(-1)"
      >
        <img
            :src="photoList[activeZoomIdx]"
            alt="放大照片"
            class="zoomed-img"
            @click.stop
        />
      </div>
    </el-main>
  </el-container>
</template>

<script setup>
// 你的原有导入（一字未改）
import { useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { ArrowLeft, Camera, Delete } from '@element-plus/icons-vue'
import {
  ElCarousel,
  ElCarouselItem,
  ElUpload,
  ElButton,
  ElIcon,
  ElMessage
} from 'element-plus'

// 你的原有逻辑（一字未改）
const router = useRouter()
const goBack = () => router.push('/home')
const photoList = ref([])
const isZoomed = ref(false)
const activeZoomIdx = ref(-1)

// ===================== 仅修改这部分：替换为IndexedDB存储（大容量） =====================
let db = null
// 初始化IndexedDB（大容量存储，替代localStorage）
const initIndexedDB = () => {
  return new Promise((resolve) => {
    const request = window.indexedDB.open('LoveAlbumDB', 1)
    // 首次创建/升级数据库
    request.onupgradeneeded = (e) => {
      db = e.target.result
      // 创建存储表，主键自增
      if (!db.objectStoreNames.contains('photos')) {
        db.createObjectStore('photos', { keyPath: 'id', autoIncrement: true })
      }
    }
    // 初始化成功
    request.onsuccess = (e) => {
      db = e.target.result
      resolve()
    }
    // 兼容无IndexedDB的浏览器（降级为localStorage）
    request.onerror = () => {
      ElMessage.warning('浏览器不支持大容量存储，将使用普通存储')
      resolve()
    }
  })
}

// 从IndexedDB读取照片（替代localStorage.getItem）
const getPhotos = async () => {
  if (!db) await initIndexedDB()
  // 有IndexedDB则读DB，无则读localStorage（降级）
  if (db) {
    return new Promise((resolve) => {
      const transaction = db.transaction('photos', 'readonly')
      const store = transaction.objectStore('photos')
      const request = store.getAll()
      request.onsuccess = (e) => {
        // 提取照片base64列表
        const photos = e.target.result.map(item => item.base64)
        photoList.value = photos
        resolve(photos)
      }
    })
  } else {
    // 降级逻辑（原有localStorage）
    const raw = localStorage.getItem('loveAlbum')
    photoList.value = raw ? JSON.parse(raw) : []
  }
}

// 同步照片到IndexedDB（替代localStorage.setItem）
const syncToStorage = async () => {
  if (!db) await initIndexedDB()
  // 有IndexedDB则存DB，无则存localStorage（降级）
  if (db) {
    // 清空旧数据（保证和photoList一致）
    const clearTx = db.transaction('photos', 'readwrite')
    const clearStore = clearTx.objectStore('photos')
    clearStore.clear()
    // 写入新数据
    const tx = db.transaction('photos', 'readwrite')
    const store = tx.objectStore('photos')
    photoList.value.forEach(base64 => {
      store.add({ base64 })
    })
    tx.oncomplete = () => {
      ElMessage.success('照片已大容量保存，刷新不丢失')
    }
  } else {
    // 降级逻辑（原有localStorage）
    localStorage.setItem('loveAlbum', JSON.stringify(photoList.value))
    ElMessage.success('照片已保存')
  }
}
// ===================== 存储层修改结束 =====================

// 你的原有业务逻辑（一字未改）
onMounted(async () => {
  await getPhotos() // 仅改：调用新的读取函数
  ElMessage.success('相册初始化完成')
})

const handleUpload = (file) => {
  if (!file.type.startsWith('image/')) {
    ElMessage.error('请选择图片文件！')
    return false
  }
  const reader = new FileReader()
  reader.onload = (e) => {
    if (e.target.result) {
      photoList.value.push(e.target.result)
      syncToStorage() // 仅改：调用新的存储函数
      ElMessage.success('照片上传成功！')
    } else {
      ElMessage.error('照片读取失败，请重试~')
    }
  }
  reader.readAsDataURL(file)
  return false
}

const deletePhoto = (idx) => {
  photoList.value.splice(idx, 1)
  syncToStorage() // 仅改：调用新的存储函数
  ElMessage.success('照片已删除~')
}

const toggleZoom = (idx) => {
  if (idx === -1) {
    isZoomed.value = false
    activeZoomIdx.value = -1
  } else {
    isZoomed.value = true
    activeZoomIdx.value = idx
  }
}
</script>

<style scoped>

  /* 页面整体浪漫背景 */
.album-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
  margin: 0;
  padding: 0;
  background: linear-gradient(120deg, #ffdddd, #ffe6e6);
}

.romantic-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20' fill='%23ffcccc' opacity='0.1'%3E%3Cpath d='M10 15C8.343 15 7 13.657 7 12c0-2 3-4 3-4s3 2 3 4c0 1.657-1.343 3-3 3zm0-10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z'/%3E%3C/svg%3E") repeat;
  animation: bgFlow 18s infinite ease;
  z-index: -1;
}
@keyframes bgFlow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}

.album-header {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 10px rgba(255, 107, 158, 0.1);
  border: none;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}
.back-btn {
  font-size: 24px;
  color: #e53e3e;
  cursor: pointer;
}
.page-title {
  font-size: 22px;
  font-weight: 700;
  color: #e53e3e;
}

.album-main {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}

.page-title-bar {
  position: relative;
  margin-bottom: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 12px 24px;
  border-radius: 25px;
  text-align: center;
  box-shadow: 0 3px 15px rgba(255, 107, 158, 0.15);
}
.page-title-bar h2 {
  margin: 0;
  font-size: 26px;
  color: #e53e3e;
}
.page-title-bar p {
  margin: 6px 0 0;
  font-size: 14px;
  color: #999;
}

.fullscreen-carousel {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  border: none;
  overflow: hidden;
}

.photo-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}
.fullscreen-img {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 4px 15px rgba(255, 107, 158, 0.2);
}

.delete-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  padding: 0;
  z-index: 3;
}

.empty-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 20px;
}

.upload-area {
  margin-top: 30px;
}
.romantic-upload-btn {
  background: linear-gradient(90deg, #ff4081, #ff6b9e);
  border: none;
  padding: 14px 40px;
  font-size: 16px;
  border-radius: 50px;
  box-shadow: 0 4px 15px rgba(255, 107, 158, 0.3);
  color: #fff;
}

.zoom-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 245, 248, 0.97);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  cursor: zoom-out;
}
.zoomed-img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 12px 35px rgba(255, 107, 158, 0.4);
}

@media (max-width: 768px) {
  .fullscreen-carousel {
    height: 50vh;
  }
  .romantic-upload-btn {
    padding: 12px 30px;
    font-size: 14px;
  }
}

/* 调整轮播图和照片大小 */
.fullscreen-carousel {
  height: 70vh !important; /* 增大轮播图高度 */
  max-width: 1400px !important;
}

.fullscreen-img {
  max-width: 90% !important;
  max-height: 90% !important;
  transition: transform 0.3s ease !important;
}

.photo-wrapper:hover .fullscreen-img {
  transform: scale(1.02) !important; /* hover时轻微放大增加互动感 */
}

/* 增加浪漫装饰元素 */
.album-container::before,
.album-container::after {
  content: '';
  position: fixed;
  width: 100%;
  height: 100%;
  background-image:
      radial-gradient(circle, #ffccd5 2px, transparent 2px),
      radial-gradient(circle, #ffb6c1 2px, transparent 2px);
  background-size: 50px 50px;
  background-position: 0 0, 25px 25px;
  opacity: 0.2;
  z-index: -1;
  pointer-events: none;
  animation: float 30s linear infinite;
}

.album-container::after {
  animation-delay: 15s !important;
  background-image:
      radial-gradient(circle, #ff9aa2 2px, transparent 2px),
      radial-gradient(circle, #fadadd 2px, transparent 2px);
}

/* 增强标题浪漫感 */
.page-title-bar {
  padding: 20px 30px !important;
  border: 1px solid rgba(255, 182, 193, 0.3) !important;
}

.page-title-bar h2 {
  font-size: 32px !important;
  text-shadow: 0 2px 10px rgba(255, 107, 158, 0.3) !important;
  letter-spacing: 2px !important;
}

.page-title-bar p {
  font-size: 16px !important;
  color: #e57373 !important;
  letter-spacing: 1px !important;
}

/* 美化上传按钮 */
.romantic-upload-btn {
  padding: 16px 45px !important;
  font-size: 18px !important;
  transition: all 0.3s ease !important;
}

.romantic-upload-btn:hover {
  transform: translateY(-3px) !important;
  box-shadow: 0 8px 25px rgba(255, 107, 158, 0.4) !important;
}

/* 增加漂浮动画 */
@keyframes float {
  0% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(1deg);
  }
  100% {
    transform: translateY(0) rotate(0deg);
  }
}

/* 调整删除按钮样式 */
.delete-btn {
  background-color: rgba(255, 66, 107, 0.8) !important;
  transition: all 0.3s ease !important;
}

.delete-btn:hover {
  background-color: #ff426b !important;
  transform: scale(1.1) !important;
}

/* 增强背景效果 */
.romantic-bg {
  background: linear-gradient(135deg, #fff0f5, #ffe4e1, #fff0f5) !important;
  animation: bgFlow 15s infinite ease !important;
}

@keyframes bgFlow {
  0% { background-position: 0% 0%; }
  25% { background-position: 50% 25%; }
  50% { background-position: 100% 50%; }
  75% { background-position: 50% 75%; }
  100% { background-position: 0% 100%; }
}

/* 移动端适配调整 */
@media (max-width: 768px) {
  .fullscreen-carousel {
    height: 60vh !important;
  }

  .page-title-bar h2 {
    font-size: 26px !important;
  }
}
</style>

