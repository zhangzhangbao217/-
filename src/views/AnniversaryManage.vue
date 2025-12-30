<!-- src/views/AnniversaryManage.vue -->
<template>
  <el-container class="manage-container">
    <el-header class="manage-header">
      <div class="header-left">
        <el-icon class="back-btn" @click="goBack">
          <ArrowLeft />
        </el-icon>
        <span class="page-title">纪念日管理中心</span>
      </div>
    </el-header>

    <el-main class="manage-main">
      <div class="page-title-bar">
        <h2>我的待办纪念日 💖</h2>
        <p>共 {{ anniversaryList.length }} 个待办</p>
      </div>

      <div class="anniversary-list">
        <el-empty v-if="anniversaryList.length === 0" description="暂无待办纪念日" />
        <el-card
            class="anniversary-item"
            v-for="(item, index) in anniversaryList"
            :key="index"
            shadow="hover"
        >
          <div class="item-content">
            <div class="item-left">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-date">日期：{{ formatDate(item.date) }}</span>
            </div>
            <div class="item-right">
              <el-button
                  type="danger"
                  link
                  :icon="Delete"
                  class="delete-btn"
                  @click="handleDelete(index)"
              >
                删除
              </el-button>
            </div>
          </div>
          <div class="countdown">
            <el-icon class="time-icon"><Timer /></el-icon>
            距离还有：<span class="time-value">{{ item.countdown }}</span>
          </div>
        </el-card>
      </div>
    </el-main>
  </el-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { ElContainer, ElHeader, ElMain, ElCard, ElButton, ElEmpty, ElIcon } from 'element-plus'
import { ArrowLeft, Delete, Timer } from '@element-plus/icons-vue'

// 接收从Home页传递的待办纪念日数据
const props = defineProps({
  anniversaries: {
    type: Array,
    default: () => []
  }
})

// 响应式管理纪念日列表（给每个项添加countdown属性用于动态倒计时）
const anniversaryList = ref(
    props.anniversaries.map(item => ({
      ...item,
      countdown: '' // 初始化倒计时字段
    }))
)
const router = useRouter()
let countdownTimer = null // 定时器标识（用于每秒更新倒计时）

// 返回Home页
const goBack = () => {
  router.push('/home')
}

// 格式化日期显示
const formatDate = (dateStr) => {
  return dayjs(dateStr).format('YYYY年MM月DD日 HH:mm:ss')
}

// 计算单个纪念日的实时倒计时（精确到秒）
const calculateSingleCountdown = (dateStr) => {
  const target = dayjs(dateStr)
  const now = dayjs()

  // 若纪念日已过期
  if (now.isAfter(target)) {
    return '已过期'
  }

  // 计算时间差（毫秒）
  const diffMs = target.diff(now)
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)

  // 不足两位补零（保证格式统一）
  const formatNum = (num) => num.toString().padStart(2, '0')
  return `${days}天 ${formatNum(hours)}:${formatNum(minutes)}:${formatNum(seconds)}`
}

// 更新所有纪念日的倒计时（每秒执行）
const updateAllCountdowns = () => {
  anniversaryList.value.forEach(item => {
    item.countdown = calculateSingleCountdown(item.date)
  })
}

// 删除待办纪念日
const handleDelete = (index) => {
  anniversaryList.value.splice(index, 1)
  updateAllCountdowns() // 删除后重新计算倒计时
}

// 组件挂载：启动秒级定时器
onMounted(() => {
  updateAllCountdowns() // 初始化倒计时
  countdownTimer = setInterval(updateAllCountdowns, 1000) // 每秒更新一次
})

// 组件卸载：清除定时器（防止内存泄漏）
onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style scoped>
.manage-container {
  min-height: 100vh;
  background: transparent;
  position: relative;
  overflow-x: hidden;
}

/* 顶部导航 */
.manage-header {
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

/* 主内容区 */
.manage-main {
  padding: 40px 20px;
  max-width: 900px;
  margin: 0 auto;
}

.page-title-bar {
  text-align: center;
  margin-bottom: 40px;
  animation: fadeInDown 0.8s ease-out;
}

@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.page-title-bar h2 {
  color: #ff4757;
  font-size: 2.2rem;
  margin-bottom: 12px;
  font-weight: 700;
  text-shadow: 2px 2px 4px rgba(255, 71, 87, 0.1);
}

.page-title-bar p {
  color: #ff7f9d;
  font-size: 1.1rem;
  opacity: 0.9;
}

/* 纪念日列表 */
.anniversary-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.anniversary-item {
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(255, 255, 255, 0.6) !important;
  border-radius: 24px !important;
  box-shadow: 0 10px 30px rgba(255, 182, 193, 0.15) !important;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
  overflow: hidden;
  animation: fadeInUp 0.6s ease-out both;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.anniversary-item:hover {
  transform: translateY(-8px) scale(1.01) !important;
  background: rgba(255, 255, 255, 0.85) !important;
  box-shadow: 0 15px 40px rgba(255, 107, 129, 0.25) !important;
}

:deep(.el-card__body) {
  padding: 25px !important;
}

.item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.item-name {
  font-size: 1.4rem;
  color: #ff4757;
  font-weight: 700;
  display: block;
  margin-bottom: 6px;
}

.item-date {
  color: #ff8fa3;
  font-size: 1rem;
  display: flex;
  align-items: center;
  gap: 6px;
}

.delete-btn {
  font-size: 1rem !important;
  padding: 8px 16px !important;
  border-radius: 12px !important;
  transition: all 0.3s !important;
}

.delete-btn:hover {
  background: rgba(255, 71, 87, 0.1) !important;
  transform: scale(1.05);
}

.countdown {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-top: 20px;
  border-top: 1px dashed rgba(255, 107, 129, 0.2);
  color: #2a9d8f;
  font-weight: 600;
  font-size: 1.1rem;
}

.time-icon {
  font-size: 1.2rem;
  color: #2a9d8f;
}

.time-value {
  color: #264653;
  font-family: 'Courier New', Courier, monospace;
  background: rgba(42, 157, 143, 0.1);
  padding: 4px 12px;
  border-radius: 8px;
  letter-spacing: 1px;
}

@media (max-width: 768px) {
  .manage-main {
    padding: 20px 15px;
  }
  
  .page-title-bar h2 {
    font-size: 1.8rem;
  }
  
  .item-content {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .item-right {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }
  
  .item-name {
    font-size: 1.2rem;
  }
  
  .countdown {
    font-size: 1rem;
    flex-wrap: wrap;
  }
}
</style>
