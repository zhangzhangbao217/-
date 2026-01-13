<!-- BucketList.vue -->
<template>
  <div class="bucket-content-wrapper">
    <div class="bucket-main">
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
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { CircleCheck, CircleCheckFilled } from '@element-plus/icons-vue'

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
  { text: '一起拍一组写真', completed: true },
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
  // 移除本地存储读取，改为完全由代码控制状态
})

// 移除 toggleComplete 函数，使其无法被修改
</script>

<style scoped>
.bucket-content-wrapper {
  min-height: 100%;
  background: transparent;
  position: relative;
}

.bucket-main {
  padding: 20px 0;
  position: relative;
  z-index: 1;
}
.page-intro { text-align: center; margin-bottom: 40px; }
.page-intro h2 { color: #e63946; margin-bottom: 10px; }
.page-intro p { color: #999; margin-bottom: 20px; }

.progress-bar-wrapper { max-width: 500px; margin: 0 auto; }
.progress-text { display: block; margin-top: 10px; color: #666; font-size: 14px; }

.bucket-card {
  margin-bottom: 20px; border-radius: 15px;
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
