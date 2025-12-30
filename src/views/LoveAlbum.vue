<template>

  <el-container class="album-container">
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
const staticPhotos = [
  '/4d73516d866b0b83635639b8f81e3c2c.jpg',
  '/9b73ec5057f40e63f099161a50f70820.jpg',
  '/d52fc37974aaffa0d02e9362f10e5d91.jpg',
  '/d5653d2f76e32e0e4ce97aba54a0c6c9.jpg',
  '/df49bc6ca7d5b77ace3eeaec5d0008c6.jpg',
  '/ed2f20b1e6fa3f80f1544d618ccaa44c.jpg'
]
const photoList = ref([...staticPhotos])
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
        const dynamicPhotos = e.target.result.map(item => item.base64)
        // 合并静态照片和动态照片
        photoList.value = [...staticPhotos, ...dynamicPhotos]
        resolve(photoList.value)
      }
    })
  } else {
    // 降级逻辑（原有localStorage）
    const raw = localStorage.getItem('loveAlbum')
    const dynamicPhotos = raw ? JSON.parse(raw) : []
    photoList.value = [...staticPhotos, ...dynamicPhotos]
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
    // 写入新数据（仅保存动态上传的照片，不重复保存静态照片）
    const tx = db.transaction('photos', 'readwrite')
    const store = tx.objectStore('photos')
    photoList.value.forEach(item => {
      // 如果不是静态照片路径，则保存
      if (!staticPhotos.includes(item)) {
        store.add({ base64: item })
      }
    })
    tx.oncomplete = () => {
      ElMessage.success('照片已大容量保存，刷新不丢失')
    }
  } else {
    // 降级逻辑（原有localStorage）
    const dynamicPhotos = photoList.value.filter(item => !staticPhotos.includes(item))
    localStorage.setItem('loveAlbum', JSON.stringify(dynamicPhotos))
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
.album-container {
  min-height: 100vh;
  background: transparent;
  position: relative;
  overflow-x: hidden;
}

.album-header {
  background: rgba(255, 255, 255, 0.6) !important;
  backdrop-filter: blur(15px) !important;
  -webkit-backdrop-filter: blur(15px) !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.4) !important;
  display: flex;
  align-items: center;
  padding: 0 20px;
  position: sticky;
  top: 0;
  z-index: 100;
  height: 64px !important;
}

.back-btn {
  cursor: pointer;
  font-size: 20px;
  color: #ff6b81;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  padding: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.5);
  margin-right: 8px;
}

.back-btn:hover {
  color: #ff4757;
  transform: scale(1.1) rotate(-10deg);
  background: white;
  box-shadow: 0 4px 12px rgba(255, 107, 129, 0.2);
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #ff4757;
  letter-spacing: 1px;
}

.album-main {
  padding: 40px 20px;
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-title-bar {
  text-align: center;
  margin-bottom: 40px;
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(255, 255, 255, 0.6) !important;
  padding: 20px 40px !important;
  border-radius: 30px !important;
  box-shadow: 0 10px 30px rgba(255, 182, 193, 0.2) !important;
  animation: fadeInDown 0.8s ease-out;
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translateY(-20px); }
  to { opacity: 1; transform: translateY(0); }
}

.page-title-bar h2 {
  color: #ff4757;
  font-size: 2.2rem !important;
  margin-bottom: 8px;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(255, 71, 87, 0.1);
  letter-spacing: 2px !important;
}

.page-title-bar p {
  color: #ff7f9d !important;
  font-size: 1.1rem !important;
  opacity: 0.9;
  letter-spacing: 1px !important;
}

.fullscreen-carousel {
  width: 100%;
  height: 65vh !important;
  margin-bottom: 40px;
}

.photo-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 20px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.fullscreen-img {
  max-width: 95% !important;
  max-height: 95% !important;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 15px 45px rgba(255, 107, 129, 0.25);
  transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
}

.photo-wrapper:hover .fullscreen-img {
  transform: scale(1.05) !important;
}

.delete-btn {
  position: absolute;
  top: 15px;
  right: 15px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: rgba(255, 71, 87, 0.8) !important;
  border: none !important;
  backdrop-filter: blur(5px);
  z-index: 10;
  transition: all 0.3s ease !important;
}

.delete-btn:hover {
  background: #ff4757 !important;
  transform: scale(1.1) rotate(90deg) !important;
}

.empty-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff7f9d;
  font-size: 1.5rem;
  font-weight: 600;
}

.upload-area {
  margin-top: 20px;
}

.romantic-upload-btn {
  background: linear-gradient(135deg, #ff4757, #ff6b81) !important;
  border: none !important;
  padding: 18px 50px !important;
  font-size: 1.2rem !important;
  border-radius: 50px !important;
  box-shadow: 0 10px 25px rgba(255, 71, 87, 0.3) !important;
  color: #fff !important;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
}

.romantic-upload-btn:hover {
  transform: translateY(-5px) scale(1.05) !important;
  box-shadow: 0 15px 35px rgba(255, 71, 87, 0.4) !important;
}

.zoom-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(255, 245, 248, 0.98);
  backdrop-filter: blur(10px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  cursor: zoom-out;
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.zoomed-img {
  max-width: 90%;
  max-height: 90%;
  object-fit: contain;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(255, 107, 129, 0.4);
  animation: zoomIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes zoomIn {
  from { transform: scale(0.8); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

@media (max-width: 768px) {
  .fullscreen-carousel {
    height: 50vh !important;
  }
  
  .page-title-bar {
    padding: 15px 25px !important;
  }
  
  .page-title-bar h2 {
    font-size: 1.8rem !important;
  }
  
  .romantic-upload-btn {
    padding: 15px 35px !important;
    font-size: 1rem !important;
  }
}
</style>

