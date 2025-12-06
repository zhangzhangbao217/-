<!-- src/views/AnniversaryManage.vue -->
<template>
  <el-container class="manage-container">
    <!-- 背景爱心装饰 -->
    <div class="love-bg-decoration"></div>

    <!-- 顶部导航栏 -->
    <el-header class="manage-header">
      <div class="header-left">
        <el-icon class="back-btn" @click="goBack">
          <ArrowLeft />
        </el-icon>
        <span class="page-title">纪念日管理中心</span>
      </div>
    </el-header>

    <el-main class="manage-main">
      <!-- 页面标题 -->
      <div class="page-title-bar">
        <h2>我的待办纪念日 💖</h2>
        <p>共 {{ anniversaryList.length }} 个待办</p>
      </div>

      <!-- 纪念日列表 -->
      <div class="anniversary-list">
        <el-empty v-if="anniversaryList.length === 0" description="暂无待办纪念日" />
        <el-card
            class="anniversary-item"
            v-for="(item, index) in anniversaryList"
            :key="index"
            hoverable
        >
          <div class="item-content">
            <div class="item-left">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-date">日期：{{ formatDate(item.date) }}</span>
            </div>
            <div class="item-right">
              <el-button
                  type="text"
                  icon="el-icon-delete"
                  class="delete-btn"
                  @click="handleDelete(index)"
              >
                删除
              </el-button>
            </div>
          </div>
          <!-- 动态读秒的倒计时（实时更新） -->
          <div class="countdown">
            距离还有：{{ item.countdown }}
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
// 引入Element Plus组件和图标
import { ElContainer, ElHeader, ElMain, ElCard, ElButton, ElEmpty } from 'element-plus'
import { ArrowLeft, Delete } from '@element-plus/icons-vue'

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
  height: 100vh;
  background: linear-gradient(120deg, #fff9fb, #ffe6ef);
  position: relative;
  overflow: hidden;
}

/* 背景爱心装饰（和Home页一致） */
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

/* 顶部导航 */
.manage-header {
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 12px rgba(255, 192, 203, 0.2);
  display: flex;
  align-items: center;
  padding: 0 20px;
  position: relative;
  z-index: 1;
}
.back-btn {
  cursor: pointer;
  font-size: 18px;
  color: #e63946;
  transition: color 0.3s;
}
.back-btn:hover {
  color: #ff6b81;
}
.page-title {
  font-size: 16px;
  font-weight: 500;
  color: #e63946;
  margin-left: 12px;
  text-shadow: 0 1px 2px rgba(230, 57, 70, 0.2);
}

/* 主内容区 */
.manage-main {
  padding: 30px 20px;
  position: relative;
  z-index: 1;
}
.page-title-bar {
  text-align: center;
  margin-bottom: 30px;
}
.page-title-bar h2 {
  color: #e63946;
  font-size: 1.8rem;
  text-shadow: 0 2px 4px rgba(230, 57, 70, 0.1);
}
.page-title-bar p {
  color: #6d6875;
  margin-top: 8px;
}

/* 纪念日列表 */
.anniversary-list {
  max-width: 800px;
  margin: 0 auto;
}
.anniversary-item {
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 182, 193, 0.3);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(255, 192, 203, 0.1);
  margin-bottom: 20px;
  transition: all 0.4s ease;
}
.anniversary-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 18px rgba(255, 192, 203, 0.2);
  background-color: #fff;
}
.item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}
.item-name {
  font-size: 1.2rem;
  color: #e63946;
  font-weight: 600;
}
.item-date {
  color: #6d6875;
  margin-top: 4px;
  display: block;
}
.delete-btn {
  color: #ff6b81;
  transition: color 0.3s;
}
.delete-btn:hover {
  color: #e63946;
}
.countdown {
  color: #2a9d8f;
  font-weight: 500;
  margin-top: 8px;
  border-top: 1px dashed rgba(255, 182, 193, 0.3);
  padding-top: 12px;
  font-size: 1rem;
}
</style>
