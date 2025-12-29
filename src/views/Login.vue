<template>
  <div class="login-page">
    <!-- 登录卡片容器 -->
    <div class="login-card">
      <div class="login-logo">
        <h2>💖 甜蜜登录</h2>
        <p>输入专属暗号，进入恋爱小屋～</p>
      </div>

      <!-- 登录表单 -->
      <el-form
          ref="loginFormRef"
          :model="loginForm"
          :rules="loginRules"
          class="login-form"
          label-width="80px"
      >
        <!-- 账号输入框 -->
        <el-form-item label="账号" prop="username">
          <el-input
              v-model="loginForm.username"
              placeholder="请输入开启甜蜜时光的账号"
              prefix-icon="el-icon-user"
              clearable
              size="large"
          />
        </el-form-item>

        <!-- 密码输入框 -->
        <el-form-item label="密码" prop="password">
          <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="请输入开启甜蜜时光的专属密码"
              prefix-icon="el-icon-lock"
              clearable
              show-password
              size="large"
          />
        </el-form-item>

        <!-- 记住密码 & 忘记密码 -->
        <el-form-item class="form-actions">
          <el-checkbox v-model="loginForm.remember" size="large">记住密码</el-checkbox>
          <el-link type="primary" @click="handleForgetPwd">忘记密码？</el-link>
        </el-form-item>

        <!-- 登录按钮 -->
        <el-form-item>
          <el-button
              type="primary"
              size="large"
              class="login-btn"
              :loading="isLoading"
              @click="handleLogin"
              full-width
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router' // 路由跳转（需配置router）

// 表单引用
const loginFormRef = ref(null)
// 加载状态
const isLoading = ref(false)
// 路由实例
const router = useRouter()

// 登录表单数据
const loginForm = reactive({
  username: '', // 账号
  password: '', // 密码
  remember: false // 记住密码
})

// 表单验证规则（可自定义正则）
const loginRules = reactive({
  username: [
    { required: true, message: '请输入登录账号', trigger: 'blur' },
    { pattern: /^Hgtzsx$/, message: '账号格式错误（请重新输入小笨蛋）', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入登录密码', trigger: 'blur' },
    { pattern: /^hgt1314521zsx$/, message: '密码格式错误（请重新输入，大笨蛋）', trigger: 'blur' }
  ]
})

// 登录逻辑
const handleLogin = async () => {
  try {
    // 第一步：表单验证
    await loginFormRef.value.validate()
    isLoading.value = true

    // 第二步：模拟登录请求（替换为真实接口）
    setTimeout(() => {
      // 模拟登录成功
      ElMessage.success('暗号正确！欢迎进入甜蜜小屋～')
      // 存储token（模拟登录状态）
      localStorage.setItem('token', 'love_token_1314521')
      // 标记为管理员，允许修改内容
      localStorage.setItem('isAdmin', 'true')
      // 记住密码逻辑
      if (loginForm.remember) {
        localStorage.setItem('loginInfo', JSON.stringify({
          username: loginForm.username,
          password: loginForm.password
        }))
      } else {
        localStorage.removeItem('loginInfo')
      }
      // 跳转到首页（需配置/home路由）
      router.push('/home')
      isLoading.value = false
    }, 1000) // 模拟接口延迟1秒

  } catch (error) {
    // 表单验证失败提示
    ElMessage.error('请输入正确的账号密码～')
    isLoading.value = false
  }
}

// 忘记密码处理
const handleForgetPwd = () => {
  ElMessageBox.alert('请联系管理员重置密码～', '忘记密码', {
    confirmButtonText: '确定',
    type: 'info'
  })
}

// 页面初始化：读取记住的密码
onMounted(() => {
  const savedLoginInfo = localStorage.getItem('loginInfo')
  if (savedLoginInfo) {
    const { username, password } = JSON.parse(savedLoginInfo)
    loginForm.username = username
    loginForm.password = password
    loginForm.remember = true
  }
})
</script>

<style scoped>
/* 页面整体样式 */
.login-page {
  width: 100vw;
  height: 100vh;
  /* 粉色渐变背景，适配恋爱主题 */
  background: linear-gradient(135deg, #ffbad2 0%, #ff80ab 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
}

/* 登录卡片 */
.login-card {
  width: 90%;
  max-width: 500px;
  padding: 40px;
  background: #fff;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(255, 105, 180, 0.2);
  /* 悬停动画 */
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

@media (max-width: 768px) {
  .login-card {
    padding: 30px 20px;
  }
  
  .login-logo h2 {
    font-size: 24px;
  }
  
  .login-logo p {
    font-size: 14px;
  }

  :deep(.el-form-item__label) {
    float: none;
    display: block;
    text-align: left;
    padding: 0 0 8px;
  }

  :deep(.el-form-item__content) {
    margin-left: 0 !important;
  }
}

.login-card:hover {
  transform: translateY(-5px) scale(1.01);
  box-shadow: 0 12px 40px rgba(255, 105, 180, 0.3);
}

/* 登录logo/标题 */
.login-logo {
  text-align: center;
  margin-bottom: 30px;
}

.login-logo h2 {
  color: #ff1493;
  font-size: 28px;
  margin-bottom: 8px;
}

.login-logo p {
  color: #ff69b4;
  font-size: 16px;
}

/* 登录表单 */
.login-form {
  margin-top: 10px;
}

/* 表单项间距 */
.el-form-item {
  margin-bottom: 20px;
}

/* 表单操作区（记住密码+忘记密码） */
.form-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
}

/* 登录按钮 */
.login-btn {
  height: 50px;
  font-size: 18px;
  background-color: #ff69b4;
  border-color: #ff69b4;
  transition: all 0.2s ease;
}

.login-btn:hover {
  background-color: #ff1493;
  border-color: #ff1493;
}

.login-btn:active {
  transform: scale(0.98);
}

/* 响应式适配（手机端） */
@media (max-width: 576px) {
  .login-card {
    width: 100%;
    padding: 30px 20px;
  }

  .login-logo h2 {
    font-size: 24px;
  }
}

</style>
