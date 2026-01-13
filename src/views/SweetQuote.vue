<!-- src/views/SweetQuote.vue -->
<template>
  <div class="quote-content-wrapper">
    <div class="quote-main">
      <div class="content-wrapper">
        <!-- 页面标题 + 新增按钮 -->
        <div class="page-title-bar">
          <h2>我们的浪漫碎碎念 💖</h2>
          <p>共 {{ quoteList.length }} 条甜蜜语录</p>
          <!-- 按钮组 -->
          <div class="btn-group">
            <el-button type="primary" class="add-btn" @click="dialogVisible = true">
              新增语录
            </el-button>
            <el-button type="success" class="refresh-btn" @click="refreshQuotes" :loading="loading">
              随机刷新
            </el-button>
          </div>
        </div>

        <!-- 语录列表 -->
        <div class="quote-list">
          <el-card
              class="quote-item"
              v-for="(quote, index) in quoteList"
              :key="quote.id"
              hoverable
          >
            <div class="quote-content">
              <span class="quote-text">{{ quote.content }}</span>
              <!-- 喜欢按钮 -->
              <el-icon class="like-icon" @click="toggleLike(index)">
                <Lollipop v-if="quote.isLiked" color="#e63946" />
                <Cherry v-else color="#6d6875" />
              </el-icon>
            </div>
          </el-card>
        </div>
      </div>

      <!-- 新增语录弹窗 -->
      <el-dialog
          title="添加甜蜜语录"
          v-model="dialogVisible"
          width="400px"
          :close-on-click-modal="false"
          :destroy-on-close="true"
      >
        <el-input
            v-model="newQuoteContent"
            type="textarea"
            :rows="4"
            placeholder="输入你的甜蜜语录吧~"
            class="quote-input"
        />
        <template #footer>
          <span class="dialog-footer">
            <el-button @click="dialogVisible = false">取消</el-button>
            <el-button type="primary" @click="addQuote">确定</el-button>
          </span>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
// 引入Element Plus组件和图标
import { ElCard, ElIcon, ElButton, ElDialog, ElInput, ElMessage } from 'element-plus'
import { Cherry, Lollipop } from '@element-plus/icons-vue'
// @ts-ignore
import AV from 'leancloud-storage'

// 语录列表数据
const quoteList = ref([])
const loading = ref(false)

// 内置情话库（兜底数据）
const builtInQuotes = [
  "你是我这一生只会遇见一次的惊喜。✨",
  "遇见你之后，我所有的心动都有了名字。💖",
  "想和你在这个世界上，慢慢变老。🍂",
  "世界那么大，我的眼里只有你。🌍",
  "所有的美好都抵不过你的一句：我在。🥰",
  "你是我所有温柔的源头。🌸",
  "你是藏在云层里的星，也是我唯一的救赎。🌙",
  "我的世界，因为有你才变得完整。💎",
  "只要你在，我就觉得人间值得。🌈",
  "和你在一起的每一秒，都是我最宝贵的收藏。🎁",
  "你是我的满目山河，也是我的可爱人间。⛰️",
  "我喜欢你，胜过削好的水果，周末的睡懒觉，和冬天的第一场雪。❄️",
  "众生皆苦，唯有你是草莓味的。🍓",
  "我想陪你走过漫长岁月，看尽人间烟火。🎇",
  "我的心是一座城，你是城里唯一的王。🏰",
  "不管世界如何荒芜，总有一个人，他是你的信徒。🙏"
]

// 新增语录相关状态
const dialogVisible = ref(false) // 弹窗显示状态
const newQuoteContent = ref('') // 新语录输入内容

// 获取语录列表
const fetchQuotes = async () => {
  loading.value = true
  try {
    const query = new AV.Query('SweetQuote')
    query.descending('createdAt')
    const results = await query.find()
    
    let userQuotes = results.map(item => ({
      id: item.id,
      content: item.get('content'),
      isLiked: item.get('isLiked') || false,
      raw: item,
      isBuiltIn: false
    }))

    // 如果用户添加的不足 6 条，用内置库随机补齐
    if (userQuotes.length < 6) {
      const needed = 6 - userQuotes.length
      const shuffled = [...builtInQuotes].sort(() => 0.5 - Math.random())
      // 统一补齐到 6 条，不再随机多补，确保和首页计数一致
      const additional = shuffled.slice(0, needed).map((content, idx) => ({
        id: `builtin-${idx}`,
        content,
        isLiked: false,
        isBuiltIn: true
      }))
      quoteList.value = [...userQuotes, ...additional]
    } else {
      quoteList.value = userQuotes
    }
  } catch (error) {
    // 如果是 101 错误（查询的 Class 不存在），说明还没有语录，使用内置库
    if (error.code === 101) {
      const shuffled = [...builtInQuotes].sort(() => 0.5 - Math.random())
      quoteList.value = shuffled.slice(0, 6).map((content, idx) => ({
        id: `builtin-${idx}`,
        content,
        isLiked: false,
        isBuiltIn: true
      }))
    } else {
      console.error('获取语录失败:', error)
      ElMessage.error('获取语录失败')
    }
  } finally {
    loading.value = false
  }
}

// 随机刷新功能
const refreshQuotes = async () => {
  await fetchQuotes()
  // 在获取完数据后再做一次随机打乱显示
  quoteList.value = [...quoteList.value].sort(() => 0.5 - Math.random())
}

onMounted(() => {
  fetchQuotes()
})

// 切换“喜欢”状态
const toggleLike = async (index) => {
  const quote = quoteList.value[index]
  if (quote.isBuiltIn) {
    // 内置语录只切换本地状态，不保存到云端
    quote.isLiked = !quote.isLiked
    return
  }
  
  try {
    const item = quote.raw
    item.set('isLiked', !quote.isLiked)
    await item.save()
    quote.isLiked = !quote.isLiked
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

// 新增语录
const addQuote = async () => {
  if (!newQuoteContent.value.trim()) return

  try {
    const SweetQuote = AV.Object.extend('SweetQuote')
    const quote = new SweetQuote()
    quote.set('content', newQuoteContent.value.trim())
    quote.set('isLiked', false)
    
    const result = await quote.save()
    
    // 添加到本地列表开头
    quoteList.value.unshift({
      id: result.id,
      content: result.get('content'),
      isLiked: false,
      raw: result
    })

    newQuoteContent.value = ''
    dialogVisible.value = false
    ElMessage.success('添加成功！')
  } catch (error) {
    ElMessage.error('添加失败：' + error.message)
  }
}
</script>

<style scoped>
/* 页面整体风格 */
.quote-content-wrapper {
  min-height: 100%;
  background: transparent;
  position: relative;
}

/* 主内容区 */
.quote-main {
  padding: 20px 0;
  position: relative;
  z-index: 1;
}

.page-title-bar {
  text-align: center;
  margin-bottom: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.page-title-bar h2 {
  color: #e63946;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: 2px;
  background: linear-gradient(45deg, #e63946, #ff8fa3);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 0 4px 10px rgba(230, 57, 70, 0.1);
}

.page-title-bar p {
  color: #6d6875;
  font-size: 1.1rem;
  font-weight: 500;
}

/* 按钮组样式 */
.btn-group {
  display: flex;
  gap: 15px;
  justify-content: center;
}

/* 刷新按钮样式 */
.refresh-btn {
  background: #2ecc71 !important;
  border: none !important;
  color: white !important;
  padding: 12px 30px !important;
  border-radius: 20px !important;
  font-weight: 700 !important;
  font-size: 16px !important;
  box-shadow: 0 8px 20px rgba(46, 204, 113, 0.3) !important;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
}

.refresh-btn:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 12px 25px rgba(46, 204, 113, 0.4) !important;
}

/* 新增语录按钮样式 */
.add-btn {
  background: #e63946 !important;
  border: none !important;
  color: white !important;
  padding: 12px 30px !important;
  border-radius: 20px !important;
  font-weight: 700 !important;
  font-size: 16px !important;
  box-shadow: 0 8px 20px rgba(230, 57, 70, 0.3) !important;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
}

.add-btn:hover {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 12px 25px rgba(230, 57, 70, 0.4) !important;
}

/* 语录列表 */
.quote-list {
  max-width: 1000px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 25px;
}

.quote-item {
  background: rgba(255, 255, 255, 0.55) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.6) !important;
  border-radius: 24px !important;
  box-shadow: 0 10px 30px rgba(255, 182, 193, 0.2) !important;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
  padding: 25px;
}

.quote-item:hover {
  transform: translateY(-10px) rotate(1deg);
  background: rgba(255, 255, 255, 0.75) !important;
  box-shadow: 0 15px 40px rgba(255, 182, 193, 0.35) !important;
}

.quote-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 15px;
}

.quote-text {
  color: #4a4e69;
  font-size: 1.2rem;
  line-height: 1.8;
  flex: 1;
  font-weight: 500;
  font-style: italic;
}

.like-icon {
  cursor: pointer;
  font-size: 1.5rem;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.like-icon:hover {
  transform: scale(1.3) rotate(15deg);
}

/* 对话框样式 */
:deep(.el-dialog) {
  border-radius: 30px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

:deep(.el-dialog__title) {
  color: #e63946;
  font-weight: 700;
}

:deep(.el-textarea__inner) {
  border-radius: 15px;
  border: 1px solid rgba(255, 182, 193, 0.3);
  padding: 15px;
  font-size: 16px;
}

:deep(.el-textarea__inner:focus) {
  border-color: #e63946;
  box-shadow: 0 0 0 2px rgba(230, 57, 70, 0.1);
}
</style>
