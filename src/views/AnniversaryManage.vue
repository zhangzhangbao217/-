<!-- src/views/AnniversaryManage.vue -->
<template>
  <div class="manage-content-wrapper">
    <div class="manage-main">
      <div class="content-wrapper">
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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import dayjs from 'dayjs'
import { ElMain, ElCard, ElButton, ElEmpty, ElIcon, ElMessage } from 'element-plus'
import { Delete, Timer } from '@element-plus/icons-vue'
// @ts-ignore
import AV from 'leancloud-storage'

// 接收从Home页传递的待办纪念日数据
const props = defineProps({
  anniversaries: {
    type: Array,
    default: () => []
  }
})

// 响应式管理纪念日列表
const anniversaryList = ref([])
const loveStartDate = ref('2024-05-20 00:00:00')
let countdownTimer = null // 定时器标识

// 获取恋爱起始日期
const fetchLoveStartDate = async () => {
  const user = AV.User.current()
  if (user) {
    loveStartDate.value = user.get('loveStartDate') || '2024-05-20 00:00:00'
  }
}

// 统一生成纪念日逻辑（与 Dashboard.vue 保持一致）
const generateAnniversaries = () => {
  const start = dayjs(loveStartDate.value)
  const now = dayjs()
  const anniversaries = []

  // 1. 周年纪念日 (未来 3 年)
  for (let i = now.diff(start, 'year') + 1; i <= now.diff(start, 'year') + 3; i++) {
    const date = start.add(i, 'year').format('YYYY-MM-DD HH:mm:ss')
    if (dayjs(date).isAfter(now)) anniversaries.push({ name: `${i}周年纪念日`, date })
  }

  // 2. 520 纪念日 (今年及未来 2 年)
  for (let i = 0; i <= 2; i++) {
    const date = `${now.year() + i}-05-20 13:14:00`
    if (dayjs(date).isAfter(now)) anniversaries.push({ name: `${now.year() + i}年520纪念日`, date })
  }

  // 3. 百天纪念日 (下一个百天)
  const currentTotalDays = now.diff(start, 'day')
  const nextHundredDay = Math.ceil(currentTotalDays / 100) * 100
  const hundredDayDate = start.add(nextHundredDay, 'day').format('YYYY-MM-DD HH:mm:ss')
  if (dayjs(hundredDayDate).isAfter(now)) anniversaries.push({ name: `${nextHundredDay}天纪念日`, date: hundredDayDate })

  return anniversaries.sort((a, b) => dayjs(a.date).valueOf() - dayjs(b.date).valueOf())
}

// 初始化数据
const initData = async () => {
  if (props.anniversaries && props.anniversaries.length > 0) {
    // 如果有 props 传参，使用传参数据
    anniversaryList.value = props.anniversaries.map(item => ({
      ...item,
      countdown: ''
    }))
  } else {
    // 如果没有传参（直接点击侧边栏），则自行加载日期并生成
    await fetchLoveStartDate()
    const generated = generateAnniversaries()
    anniversaryList.value = generated.map((item, index) => ({
      id: index + 1,
      ...item,
      countdown: ''
    }))
  }
}

// 格式化日期显示
const formatDate = (dateStr) => {
  return dayjs(dateStr).format('YYYY年MM月DD日')
}

// 计算单个纪念日的实时倒计时
const calculateSingleCountdown = (dateStr) => {
  const target = dayjs(dateStr)
  const now = dayjs()

  if (now.isAfter(target)) return '已到达'

  const diffMs = target.diff(now)
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000)

  const formatNum = (num) => num.toString().padStart(2, '0')
  return `${days}天 ${formatNum(hours)}:${formatNum(minutes)}:${formatNum(seconds)}`
}

// 更新所有倒计时
const updateAllCountdowns = () => {
  anniversaryList.value.forEach(item => {
    item.countdown = calculateSingleCountdown(item.date)
  })
}

// 删除待办纪念日
const handleDelete = (index) => {
  anniversaryList.value.splice(index, 1)
}

// 组件挂载
onMounted(async () => {
  await initData()
  updateAllCountdowns()
  countdownTimer = setInterval(updateAllCountdowns, 1000)
})

// 组件卸载：清除定时器（防止内存泄漏）
onUnmounted(() => {
  if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<style scoped>
.manage-content-wrapper {
  height: 100%;
  width: 100%;
  overflow-y: auto;
  background: linear-gradient(135deg, #fff5f7 0%, #ffeef2 100%);
}

/* 主内容区 */
.manage-main {
  padding: 30px 20px;
  display: flex;
  justify-content: center;
}

.content-wrapper {
  width: 100%;
  max-width: 800px;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  padding: 40px;
  border-radius: 32px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 20px 50px rgba(255, 182, 193, 0.1);
}

.page-title-bar {
  text-align: center;
  margin-bottom: 40px;
  animation: fadeInDown 0.8s ease-out;
}

.page-title-bar h2 {
  color: #ff4757;
  font-size: 2rem;
  margin-bottom: 12px;
  font-weight: 800;
  background: linear-gradient(45deg, #ff4757, #ff7f9d);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.page-title-bar p {
  color: #ff7f9d;
  font-size: 1rem;
  font-weight: 500;
}

/* 纪念日列表 */
.anniversary-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.anniversary-item {
  background: rgba(255, 255, 255, 0.85) !important;
  backdrop-filter: blur(10px) !important;
  -webkit-backdrop-filter: blur(10px) !important;
  border: 1px solid rgba(255, 255, 255, 0.8) !important;
  border-radius: 20px !important;
  box-shadow: 0 8px 25px rgba(255, 182, 193, 0.15) !important;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
  overflow: hidden;
  animation: fadeInUp 0.6s ease-out both;
}

.anniversary-item:hover {
  transform: translateY(-5px) !important;
  box-shadow: 0 12px 30px rgba(255, 107, 129, 0.2) !important;
  border-color: rgba(255, 107, 129, 0.3) !important;
}

:deep(.el-card__body) {
  padding: 20px !important;
}

.item-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.item-name {
  font-size: 1.25rem;
  color: #ff4757;
  font-weight: 800;
  display: block;
  margin-bottom: 4px;
}

.item-date {
  color: #ff8fa3;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  font-weight: 500;
}

.delete-btn {
  font-size: 0.9rem !important;
  padding: 6px 12px !important;
  border-radius: 10px !important;
  transition: all 0.2s !important;
}

.countdown {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-top: 15px;
  border-top: 1px dashed rgba(255, 107, 129, 0.15);
  color: #2a9d8f;
  font-weight: 700;
  font-size: 1rem;
}

.time-icon {
  font-size: 1.1rem;
}

.time-value {
  color: #264653;
  font-family: 'PingFang SC', 'Microsoft YaHei', sans-serif;
  background: rgba(42, 157, 143, 0.08);
  padding: 4px 10px;
  border-radius: 6px;
  letter-spacing: 0.5px;
  font-weight: 800;
}

@media (max-width: 768px) {
  .manage-main {
    padding: 15px 10px;
  }
  
  .content-wrapper {
    padding: 25px 15px;
    border-radius: 20px;
  }
  
  .page-title-bar h2 {
    font-size: 1.6rem;
  }
  
  .item-content {
    flex-direction: row; /* 保持一行，或者在极窄屏幕下才换行 */
  }
  
  .item-name {
    font-size: 1.1rem;
  }
  
  .countdown {
    font-size: 0.9rem;
    flex-wrap: wrap;
  }
}
</style>
