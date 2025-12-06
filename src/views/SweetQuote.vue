<!-- src/views/SweetQuote.vue -->
<template>
  <el-container class="quote-container">
    <!-- 背景爱心装饰 -->
    <div class="love-bg-decoration"></div>

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
  background: linear-gradient(120deg, #fff9fb, #ffe6ef);
  position: relative;
  overflow: hidden;
}

/* 背景爱心装饰 */
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

/* 顶部导航栏 */
.quote-header {
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
.quote-main {
  padding: 30px 20px;
  position: relative;
  z-index: 1;
}
.page-title-bar {
  text-align: center;
  margin-bottom: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
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
/* 新增语录按钮样式 */
.add-btn {
  background-color: #ffd1dc;
  border-color: #ffb6c1;
  color: #e63946;
  transition: all 0.3s ease;
}
.add-btn:hover {
  background-color: #ffb6c1;
  border-color: #e63946;
  color: #fff;
  transform: scale(1.05);
}

/* 新增语录弹窗样式 */
.quote-input {
  width: 100%;
}
.dialog-footer .el-button {
  background-color: #ffd1dc;
  border-color: #ffb6c1;
  color: #e63946;
}
.dialog-footer .el-button--primary {
  background-color: #e63946;
  border-color: #e63946;
}
.dialog-footer .el-button--primary:hover {
  background-color: #ff6b81;
  border-color: #ff6b81;
}

/* 语录列表 */
.quote-list {
  max-width: 800px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}
.quote-item {
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 182, 193, 0.3);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(255, 192, 203, 0.1);
  transition: all 0.4s ease;
  padding: 20px;
}
.quote-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 18px rgba(255, 192, 203, 0.2);
  background-color: #fff;
}
.quote-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}
.quote-text {
  color: #333;
  font-size: 1.1rem;
  line-height: 1.6;
  flex: 1;
  margin-right: 10px;
}
.like-icon {
  cursor: pointer;
  font-size: 1.2rem;
  transition: transform 0.3s;
}
.like-icon:hover {
  transform: scale(1.2);
}
</style>
