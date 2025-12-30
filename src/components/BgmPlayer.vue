<!-- BgmPlayer.vue -->
<template>
  <div class="bgm-player" :class="{ 'is-minimized': isMinimized }">
    <div class="player-content" v-show="!isMinimized">
      <div class="song-info">
        <div class="music-icon" :class="{ 'is-playing': isPlaying }">
          <el-icon><Headset /></el-icon>
        </div>
        <div class="text-info">
          <span class="song-name">我们的浪漫曲</span>
          <span class="artist-name">张张包 & 小黄包</span>
        </div>
      </div>
      
      <div class="player-controls">
        <el-button 
          circle 
          class="control-btn" 
          @click="togglePlay"
        >
          <el-icon v-if="isPlaying"><VideoPause /></el-icon>
          <el-icon v-else><VideoPlay /></el-icon>
        </el-button>
        
        <div class="volume-control">
          <el-icon><Microphone /></el-icon>
          <el-slider 
            v-model="volume" 
            :min="0" 
            :max="100" 
            class="volume-slider"
            @input="updateVolume"
          />
        </div>
      </div>
      
      <el-button 
        link 
        class="minimize-btn" 
        @click="toggleMinimize(true)"
      >
        <el-icon><ArrowDown /></el-icon>
      </el-button>
    </div>
    
    <div class="minimized-trigger" v-show="isMinimized" @click="toggleMinimize(false)">
      <div class="music-icon" :class="{ 'is-playing': isPlaying }">
        <el-icon><Headset /></el-icon>
      </div>
    </div>
    
    <audio 
      ref="audioRef" 
      :src="musicUrl" 
      loop 
      @play="onPlay" 
      @pause="onPause"
    ></audio>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Headset, VideoPlay, VideoPause, Microphone, ArrowDown } from '@element-plus/icons-vue'

// 音乐地址（可以使用一个浪漫的轻音乐）
const musicUrl = ref('https://music.163.com/song/media/outer/url?id=1374056681.mp3') // 示例：告白气球轻音乐
const isPlaying = ref(false)
const isMinimized = ref(localStorage.getItem('bgm_minimized') !== 'false')
const volume = ref(parseInt(localStorage.getItem('bgm_volume') || '50'))
const audioRef = ref(null)

const togglePlay = () => {
  if (audioRef.value.paused) {
    audioRef.value.play().catch(err => {
      console.log('播放失败，可能需要用户交互:', err)
    })
  } else {
    audioRef.value.pause()
  }
}

const updateVolume = (val) => {
  if (audioRef.value) {
    audioRef.value.volume = val / 100
    localStorage.setItem('bgm_volume', val.toString())
  }
}

const toggleMinimize = (minimized) => {
  isMinimized.value = minimized
  localStorage.setItem('bgm_minimized', minimized.toString())
}

onMounted(() => {
  if (audioRef.value) {
    audioRef.value.volume = volume.value / 100
  }
  
  // 监听播放状态保存
  if (localStorage.getItem('bgm_playing') === 'true') {
    // 浏览器通常禁止非交互自动播放，所以这里只是尝试
    setTimeout(() => {
      audioRef.value.play().catch(() => {
        isPlaying.value = false
        localStorage.setItem('bgm_playing', 'false')
      })
    }, 1000)
  }
})

// 监听状态变化
const onPlay = () => {
  isPlaying.value = true
  localStorage.setItem('bgm_playing', 'true')
}

const onPause = () => {
  isPlaying.value = false
  localStorage.setItem('bgm_playing', 'false')
}
</script>

<style scoped>
.bgm-player {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 2000;
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.player-content {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 20px;
  padding: 15px 20px;
  box-shadow: 0 10px 30px rgba(255, 182, 193, 0.3);
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 240px;
}

.song-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.music-icon {
  width: 40px;
  height: 40px;
  background: #e63946;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 20px;
}

.music-icon.is-playing {
  animation: rotate 4s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.text-info {
  display: flex;
  flex-direction: column;
}

.song-name {
  font-size: 14px;
  font-weight: 700;
  color: #e63946;
}

.artist-name {
  font-size: 12px;
  color: #6d6875;
}

.player-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.control-btn {
  background: #e63946 !important;
  color: white !important;
  border: none !important;
  width: 36px !important;
  height: 36px !important;
  font-size: 18px !important;
  transition: all 0.3s !important;
}

.control-btn:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(230, 57, 70, 0.3);
}

.volume-control {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
  color: #6d6875;
}

.volume-slider {
  flex: 1;
}

:deep(.el-slider__bar) {
  background-color: #e63946;
}

:deep(.el-slider__button) {
  border-color: #e63946;
  width: 12px;
  height: 12px;
}

.minimize-btn {
  position: absolute;
  top: 5px;
  right: 5px;
  color: #6d6875 !important;
}

.minimized-trigger {
  width: 50px;
  height: 50px;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(255, 182, 193, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.5);
  transition: all 0.3s;
}

.minimized-trigger:hover {
  transform: scale(1.1);
  background: rgba(255, 255, 255, 0.9);
}

.is-minimized {
  bottom: 20px;
  right: 20px;
}
</style>
