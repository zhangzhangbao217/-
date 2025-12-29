<!-- BucketList.vue -->
<template>
  <el-container class="bucket-container">
    <div class="love-bg-decoration"></div>
    <el-header class="bucket-header">
      <div class="header-left">
        <el-icon class="back-btn" @click="goBack"><ArrowLeft /></el-icon>
        <span class="page-title">爱情清单</span>
      </div>
    </el-header>

    <el-main class="bucket-main">
      <div class="page-intro">
        <h2>我们要一起做的 100 件事 📝</h2>
        <p>余生很长，想和你一件件去实现</p>
        <div class="progress-bar-wrapper">
          <el-progress :percentage="completionPercentage" :stroke-width="15" striped striped-flow color="#e63946" />
          <span class="progress-text">已完成 {{ completedCount }}/{{ bucketList.length }}</span>
        </div>
      </div>

      <div class="list-wrapper">
        <el-row :gutter="20">
          <el-col :xs="24" :sm="12" :md="8" v-for="(item, index) in bucketList" :key="index">
            <el-card 
              class="bucket-card" 
              :class="{ 'is-completed': item.completed }"
              @click="toggleComplete(index)"
            >
              <div class="card-content">
                <div class="item-index">#{{ index + 1 }}</div>
                <div class="item-text">{{ item.text }}</div>
                <div class="item-status">
                  <el-icon v-if="item.completed" class="check-icon"><CircleCheckFilled /></el-icon>
                  <el-icon v-else class="pending-icon"><CircleCheck /></el-icon>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft, CircleCheck, CircleCheckFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const router = useRouter()
const goBack = () => router.push('/home')

interface BucketItem {
  text: string
  completed: boolean
}

const bucketList = ref<BucketItem[]>([
  { text: '一起看一场日出', completed: true },
  { text: '一起去一次迪士尼', completed: false },
  { text: '一起穿情侣装逛街', completed: true },
  { text: '一起养一只宠物', completed: false },
  { text: '一起去海边看日落', completed: false },
  { text: '一起拍一组写真', completed: false },
  { text: '一起做一顿大餐', completed: true },
  { text: '一起去滑雪', completed: false },
  { text: '一起坐一次摩天轮', completed: false },
  { text: '一起在雨中漫步', completed: false },
  { text: '一起去听一场音乐会', completed: false },
  { text: '一起拼一个1000片的拼图', completed: false }
])

const completedCount = computed(() => bucketList.value.filter(i => i.completed).length)
const completionPercentage = computed(() => Math.round((completedCount.value / bucketList.value.length) * 100))

onMounted(() => {
  const saved = localStorage.getItem('love_bucket_list')
  if (saved) {
    bucketList.value = JSON.parse(saved)
  }
})

const toggleComplete = (index: number) => {
  bucketList.value[index].completed = !bucketList.value[index].completed
  localStorage.setItem('love_bucket_list', JSON.stringify(bucketList.value))
  if (bucketList.value[index].completed) {
    ElMessage.success('又完成了一个心愿，真棒！✨')
  }
}
</script>

<style scoped>
.bucket-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #fff5f7 0%, #ffeef2 100%);
}
.love-bg-decoration {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30' fill='%23ffccd5' opacity='0.15'%3E%3Cpath d='M15 25C12.343 25 10 22.657 10 20c0-3 5-7 5-7s5 4 5 7c0 2.657-2.343 5-5 5z'/%3E%3C/svg%3E");
  z-index: 0; pointer-events: none;
}
.bucket-header {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  display: flex; align-items: center; padding: 0 20px;
  box-shadow: 0 2px 10px rgba(255, 182, 193, 0.2);
  z-index: 10;
}
.header-left { display: flex; align-items: center; gap: 10px; }
.back-btn { font-size: 20px; cursor: pointer; color: #e63946; }
.page-title { font-size: 18px; font-weight: 600; color: #e63946; }

.bucket-main { position: relative; z-index: 1; padding: 20px; max-width: 1000px; margin: 0 auto; }
.page-intro { text-align: center; margin-bottom: 40px; }
.page-intro h2 { color: #e63946; margin-bottom: 10px; }
.page-intro p { color: #999; margin-bottom: 20px; }

.progress-bar-wrapper { max-width: 500px; margin: 0 auto; }
.progress-text { display: block; margin-top: 10px; color: #666; font-size: 14px; }

.bucket-card {
  margin-bottom: 20px; border-radius: 15px; cursor: pointer;
  transition: all 0.3s; border: 1px solid rgba(255, 182, 193, 0.3);
}
.bucket-card:hover { transform: translateY(-5px); box-shadow: 0 8px 20px rgba(255, 182, 193, 0.3); }
.bucket-card.is-completed { background-color: #fff9fa; border-color: #ffccd5; opacity: 0.8; }
.bucket-card.is-completed .item-text { text-decoration: line-through; color: #999; }

.card-content { display: flex; align-items: center; gap: 15px; padding: 5px; }
.item-index { font-size: 18px; font-weight: bold; color: #ffccd5; font-style: italic; }
.item-text { flex: 1; font-size: 15px; color: #666; }
.check-icon { color: #e63946; font-size: 24px; }
.pending-icon { color: #ffccd5; font-size: 24px; }

@media (max-width: 768px) {
  .bucket-main { padding: 10px; }
  .item-text { font-size: 14px; }
}
</style>
