<!-- src/views/SweetQuote.vue -->
<template>
  <el-container class="quote-container">
    <!-- 顶部导航栏 -->
    <el-header class="quote-header">
      <div class="header-left">
        <el-icon class="back-btn" @click="goBack">
          <ArrowLeft />
        </el-icon>
        <span class="page-title">甜蜜语录库</span>
      </div>
    </el-header>

    <el-main class="quote-main">
      <!-- 页面标题 + 新增按钮 -->
      <div class="page-title-bar">
        <h2>我们的浪漫碎碎念 💖</h2>
        <p>共 {{ quoteList.length }} 条甜蜜语录</p>
        <!-- 新增语录按钮 -->
        <el-button type="primary" class="add-btn" @click="dialogVisible = true">
          新增语录
        </el-button>
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
            rows="4"
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
              <HeartFilled v-if="quote.isLiked" color="#e63946" />
              <Heart v-else color="#6d6875" />
            </el-icon>
          </div>
        </el-card>
      </div>
    </el-main>
  </el-container>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
// 引入Element Plus组件和图标
import { ElContainer, ElHeader, ElMain, ElCard, ElIcon, ElButton, ElDialog, ElInput } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()

// 初始甜蜜语录数据
const quoteList = ref([
  { id: 1, content: "遇见你，是银河赠我的糖。", isLiked: false },
  { id: 2, content: "世界在下沉，我们在恋爱。", isLiked: true },
  { id: 3, content: "你是我藏在微风里的欢喜。", isLiked: false },
  { id: 4, content: "每一次心跳，都是在说喜欢你。", isLiked: false },
  { id: 5, content: "我的所有温柔，都想给你。", isLiked: true },
  { id: 6, content: "和你一起，连发呆都很浪漫。", isLiked: false }
])

// 新增语录相关状态
const dialogVisible = ref(false) // 弹窗显示状态
const newQuoteContent = ref('') // 新语录输入内容

// 返回Home页
const goBack = () => {
  router.push('/home')
}

// 切换“喜欢”状态
const toggleLike = (index) => {
  quoteList.value[index].isLiked = !quoteList.value[index].isLiked
}

// 新增语录
const addQuote = () => {
  // 过滤空内容
  if (!newQuoteContent.value.trim()) return

  // 添加到语录列表
  quoteList.value.push({
    id: quoteList.value.length + 1, // 自动生成ID
    content: newQuoteContent.value.trim(),
    isLiked: false
  })

  // 清空输入框+关闭弹窗
  newQuoteContent.value = ''
  dialogVisible.value = false
}
</script>

<style scoped>
/* 页面整体风格 */
.quote-container {
  height: 100vh;
  background: transparent;
  position: relative;
  overflow: hidden;
}

/* 顶部导航栏 */
.quote-header {
  background-color: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(15px);
  -webkit-backdrop-filter: blur(15px);
  box-shadow: 0 4px 20px rgba(255, 182, 193, 0.2);
  display: flex;
  align-items: center;
  padding: 0 24px;
  position: relative;
  z-index: 10;
  border-bottom: 1px solid rgba(255, 255, 255, 0.5);
}

.back-btn {
  cursor: pointer;
  font-size: 20px;
  color: #e63946;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  padding: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.4);
}

.back-btn:hover {
  background-color: rgba(230, 57, 70, 0.15);
  transform: scale(1.1);
  color: #e63946;
}

.page-title {
  font-size: 18px;
  font-weight: 700;
  color: #e63946;
  margin-left: 15px;
  letter-spacing: 1px;
}

/* 主内容区 */
.quote-main {
  padding: 40px 24px;
  position: relative;
  z-index: 1;
  overflow-y: auto;
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
