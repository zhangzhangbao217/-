<!-- src/views/DianDianDiDi.vue -->
<template>
  <el-container class="dian-container">
    <!-- 顶部导航栏 -->
    <el-header class="dian-header">
      <div class="header-left">
        <el-icon class="back-btn" @click="goBack">
          <ArrowLeft />
        </el-icon>
        <span class="page-title">恋爱点点滴滴</span>
      </div>
    </el-header>

    <el-main class="dian-main">
      <!-- 页面标题 + 新增按钮 -->
      <div class="page-title-bar">
        <h2>我们的独家记忆 📖</h2>
        <p>记录生活里的每一个小瞬间</p>
        <el-button type="primary" class="add-btn" @click="dialogVisible = true">
          记录瞬间
        </el-button>
      </div>

      <!-- 新增记录弹窗 -->
      <el-dialog
          title="记录新的瞬间"
          v-model="dialogVisible"
          width="90%"
          max-width="400px"
          :close-on-click-modal="false"
      >
        <el-form label-position="top">
          <el-form-item label="日期">
            <el-date-picker
                v-model="newItem.date"
                type="date"
                placeholder="选择日期"
                style="width: 100%"
                value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="标题">
            <el-input v-model="newItem.title" placeholder="给这个瞬间起个名字吧" />
          </el-form-item>
          <el-form-item label="心情">
            <el-radio-group v-model="newItem.mood">
              <el-radio-button label="🥰 甜蜜" />
              <el-radio-button label="😄 开心" />
              <el-radio-button label="🤣 搞笑" />
              <el-radio-button label="🥺 感动" />
            </el-radio-group>
          </el-form-item>
          <el-form-item label="内容">
            <el-input
                v-model="newItem.content"
                type="textarea"
                :rows="3"
                placeholder="发生了什么有趣的事呢？"
            />
          </el-form-item>
        </el-form>
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="addItem">保存记忆</el-button>
          </span>
        </template>
      </el-dialog>

      <!-- 时间轴列表 -->
      <div class="timeline-wrapper">
        <el-empty v-if="memoryList.length === 0" description="还没有记录哦，快去写下第一条吧~" />
        <el-timeline v-else>
          <el-timeline-item
              v-for="(item, index) in sortedMemoryList"
              :key="index"
              :timestamp="item.date"
              placement="top"
          >
            <!-- 自定义节点图标 -->
            <template #dot>
              <div class="heart-dot">❤️</div>
            </template>
            
            <el-card class="memory-card" @click="viewDetail(item)">
              <div class="card-header">
                <div class="title-with-mood">
                  <h3>{{ item.title }}</h3>
                  <span class="mood-tag" v-if="item.mood">{{ item.mood }}</span>
                </div>
                <el-button
                    type="text"
                    class="delete-btn"
                    @click.stop="deleteItem(item.id)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
              <p class="memory-content">{{ item.content }}</p>
              <div class="click-tip">点击查看详情 ✨</div>
            </el-card>
          </el-timeline-item>
        </el-timeline>
      </div>

      <!-- 详情弹窗 -->
      <el-dialog
          v-model="detailVisible"
          title="记忆详情"
          width="90%"
          max-width="500px"
          custom-class="detail-dialog"
          center
      >
        <div v-if="selectedMemory" class="memory-detail-content">
          <div class="detail-header">
            <span class="detail-date">{{ selectedMemory.date }}</span>
            <span class="detail-mood" v-if="selectedMemory.mood">{{ selectedMemory.mood }}</span>
          </div>
          <h2 class="detail-title">{{ selectedMemory.title }}</h2>
          <div class="detail-divider"></div>
          <p class="detail-text">{{ selectedMemory.content }}</p>
          <div class="detail-footer">
            <span class="heart-icon">❤️</span>
            <span class="footer-text">这段记忆被妥善收藏着</span>
          </div>
        </div>
      </el-dialog>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  ElContainer, ElHeader, ElMain, ElCard, ElButton,
  ElTimeline, ElTimelineItem, ElDialog, ElInput,
  ElForm, ElFormItem, ElDatePicker, ElEmpty, ElIcon, ElMessage, ElMessageBox,
  ElRadioButton, ElRadioGroup
} from 'element-plus'
import { ArrowLeft, Delete } from '@element-plus/icons-vue'
import dayjs from 'dayjs'

const router = useRouter()
const goBack = () => router.push('/home')

interface Memory {
  id: number
  date: string
  title: string
  content: string
  mood?: string
}

// 初始数据（硬编码在代码中，所有人打开都能看到）
const memoryList = ref<Memory[]>([
  { id: 1, date: '2019-12-29', title: '相遇', content: '那是我们的第一次认识，就这样开始了长达我们六年的感情', mood: '🥰 甜蜜' },
  { id: 2, date: '2020-07-25', title: '奔现', content: '这是我们的第一次见面！！', mood: '😄 开心' },
  { id: 3, date: '2020-10-01', title: '第二次见面', content: '这一次我们见面，在一起看了电影，一起爬山', mood: '🥺 感动' },
  { id: 4, date: '2021-07-02', title: '玩耍', content: '发生了很多甜蜜的事情......', mood: '🥰 甜蜜' },
  { id: 5, date: '2021-12-10', title: '吃', content: '这一次张张包给了好多好多好吃的。', mood: '🥰 甜蜜' },
  { id: 6, date: '2022-12-01', title: '......', content: '......', mood: '🥰 甜蜜' },
  { id: 7, date: '2024-05-01', title: '见家长', content: '第一次进他领居家，见了我的爸爸妈妈奶奶姐姐，我们一家人都很开心。', mood: '😄 开心' },
  { id: 8, date: '2025-07-31', title: '一起', content: '结束了长达五年的异地恋，开启了我们甜蜜的生活', mood: '🥰 甜蜜' }
])

const dialogVisible = ref(false)
const detailVisible = ref(false)
const selectedMemory = ref<Memory | null>(null)

const newItem = ref({
  date: dayjs().format('YYYY-MM-DD'),
  title: '',
  content: '',
  mood: '🥰 甜蜜'
})

// 按日期正序排列（最早的在前）
const sortedMemoryList = computed(() => {
  return [...memoryList.value].sort((a, b) => dayjs(a.date).unix() - dayjs(b.date).unix())
})

// 读取存储
onMounted(() => {
  const saved = localStorage.getItem('love_memories')
  if (saved) {
    const localData = JSON.parse(saved)
    // 过滤掉本地存储中已经存在于初始数据中的记忆（通过内容判断）
    const localOnly = localData.filter((localItem: Memory) => {
      return !memoryList.value.some(initItem => 
        initItem.date === localItem.date && initItem.title === localItem.title
      )
    })
    memoryList.value = [...memoryList.value, ...localOnly]
  }
})

// 保存记忆
const addItem = () => {
  if (!newItem.value.title || !newItem.value.content) {
    ElMessage.warning('标题和内容都要写哦~')
    return
  }
  const item: Memory = {
    id: Date.now(),
    date: newItem.value.date,
    title: newItem.value.title,
    content: newItem.value.content,
    mood: newItem.value.mood
  }
  memoryList.value.push(item)
  saveToStorage()
  dialogVisible.value = false
  // 重置表单
  newItem.value = {
    date: dayjs().format('YYYY-MM-DD'),
    title: '',
    content: '',
    mood: '🥰 甜蜜'
  }
  ElMessage.success('成功保存了一段美好记忆！')
}

// 查看详情
const viewDetail = (item: Memory) => {
  selectedMemory.value = item
  detailVisible.value = true
}

// 删除记忆
const deleteItem = (id: number) => {
  ElMessageBox.confirm('确定要删除这段记忆吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    memoryList.value = memoryList.value.filter(m => m.id !== id)
    saveToStorage()
    ElMessage.success('已删除')
  })
}

const saveToStorage = () => {
  localStorage.setItem('love_memories', JSON.stringify(memoryList.value))
}
</script>

<style scoped>
.dian-container {
  min-height: 100vh;
  background: transparent;
  position: relative;
  overflow-x: hidden;
}

.dian-header {
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  display: flex;
  align-items: center;
  padding: 0 20px;
  box-shadow: 0 4px 15px rgba(255, 192, 203, 0.15);
  z-index: 10;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 10px;
}

.back-btn {
  font-size: 20px;
  cursor: pointer;
  color: #e63946;
  padding: 8px;
  border-radius: 50%;
  transition: all 0.3s;
}

.back-btn:hover {
  background-color: rgba(230, 57, 70, 0.1);
  transform: scale(1.1);
}

.page-title {
  font-size: 18px;
  font-weight: 600;
  color: #e63946;
}

.dian-main {
  position: relative;
  z-index: 1;
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.page-title-bar {
  text-align: center;
  margin-bottom: 30px;
}

.page-title-bar h2 {
  color: #e63946;
  font-size: 26px;
  margin-bottom: 12px;
  font-weight: 700;
  text-shadow: 0 2px 4px rgba(230, 57, 70, 0.1);
}

.page-title-bar p {
  color: #8d99ae;
  margin-bottom: 25px;
  font-size: 15px;
}

.add-btn {
  background-color: #e63946;
  border: none;
  padding: 12px 30px;
  border-radius: 25px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(230, 57, 70, 0.3);
  transition: all 0.3s;
}

.add-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(230, 57, 70, 0.4);
}

.timeline-wrapper {
  padding: 10px;
}

.memory-card {
  background: rgba(255, 255, 255, 0.6) !important;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.5) !important;
  border-radius: 20px !important;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  padding-bottom: 5px;
}

.memory-card:hover {
  transform: translateY(-5px) scale(1.01);
  background: rgba(255, 255, 255, 0.8) !important;
  box-shadow: 0 12px 24px rgba(255, 182, 193, 0.3) !important;
}

.click-tip {
  position: absolute;
  bottom: 10px;
  right: 20px;
  font-size: 12px;
  color: #e63946;
  opacity: 0;
  transition: opacity 0.3s;
}

.memory-card:hover .click-tip {
  opacity: 0.6;
}

.title-with-mood {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* 详情弹窗样式 */
:deep(.detail-dialog) {
  background: rgba(255, 255, 255, 0.9) !important;
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  border-radius: 28px !important;
  border: 1px solid rgba(255, 255, 255, 0.5) !important;
  overflow: hidden;
}

.memory-detail-content {
  padding: 10px 5px;
  text-align: center;
}

.detail-header {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 20px;
}

.detail-date {
  color: #8d99ae;
  font-size: 14px;
}

.detail-mood {
  background-color: rgba(230, 57, 70, 0.1);
  color: #e63946;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 600;
}

.detail-title {
  color: #e63946;
  font-size: 24px;
  margin: 10px 0;
  font-weight: 700;
}

.detail-divider {
  width: 60px;
  height: 4px;
  background: linear-gradient(to right, #ffccd5, #e63946);
  margin: 20px auto;
  border-radius: 2px;
}

.detail-text {
  color: #4a4e69;
  line-height: 1.8;
  font-size: 16px;
  white-space: pre-wrap;
  text-align: left;
  background: rgba(255, 255, 255, 0.5);
  padding: 25px;
  border-radius: 20px;
  margin-top: 25px;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.detail-footer {
  margin-top: 35px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.heart-icon {
  font-size: 28px;
  animation: heartbeat 1.5s infinite;
}

.footer-text {
  color: #8d99ae;
  font-size: 13px;
  font-style: italic;
}

@keyframes heartbeat {
  0% { transform: scale(1); }
  14% { transform: scale(1.3); }
  28% { transform: scale(1); }
  42% { transform: scale(1.3); }
  70% { transform: scale(1); }
}

.mood-tag {
  background-color: rgba(230, 57, 70, 0.05);
  color: #e63946;
  padding: 2px 10px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  border: 1px solid rgba(230, 57, 70, 0.1);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.card-header h3 {
  margin: 0;
  color: #e63946;
  font-size: 20px;
  font-weight: 700;
}

.heart-dot {
  font-size: 20px;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

.delete-btn {
  color: #8d99ae;
  transition: all 0.3s;
}

.delete-btn:hover {
  color: #e63946;
  transform: scale(1.2);
}

.memory-content {
  color: #6d6875;
  line-height: 1.6;
  margin: 0;
  font-size: 15px;
}

:deep(.el-timeline-item__node) {
  background-color: #e63946;
  box-shadow: 0 0 0 4px rgba(230, 57, 70, 0.1);
}

:deep(.el-timeline-item__timestamp) {
  color: #e63946;
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 8px;
}

@media (max-width: 768px) {
  .dian-main {
    padding: 15px 10px;
  }
  
  .page-title-bar h2 {
    font-size: 22px;
  }
}

</style>
