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
          <div class="right-links">
            <el-link type="primary" @click="router.push('/register')" class="register-link">立即注册</el-link>
            <el-link type="info" @click="handleForgetPwd">忘记密码？</el-link>
          </div>
        </el-form-item>

        <!-- 登录按钮 -->
        <el-form-item class="login-btn-item">
          <el-button
              type="primary"
              size="large"
              class="login-btn"
              :loading="isLoading"
              @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>

        <!-- 第三方登录入口 -->
        <div class="social-login">
          <div class="divider">
            <span>或者使用以下方式登入</span>
          </div>
          <div class="social-icons">
            <div class="social-icon wechat" @click="handleSocialLogin('wechat')">
              <div class="icon-wrapper">
                <img src="https://img.icons8.com/color/48/000000/weixing.png" alt="WeChat" />
              </div>
              <span>微信</span>
            </div>
            <div class="social-icon qq" @click="handleSocialLogin('qq')">
              <div class="icon-wrapper">
                <img src="https://img.icons8.com/color/48/000000/qq.png" alt="QQ" />
              </div>
              <span>QQ</span>
            </div>
          </div>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
// @ts-ignore
import AV from 'leancloud-storage'

// 表单引用
const loginFormRef = ref(null)
// 加载状态
const isLoading = ref(false)
// 路由实例
const router = useRouter()

// 登录表单数据
const loginForm = reactive({
  username: '', // 账号 (手机号)
  password: '', // 密码
  remember: false // 记住密码
})

// 表单验证规则
const loginRules = reactive({
  username: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入登录密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ]
})

// 登录逻辑
const handleLogin = async () => {
  try {
    await loginFormRef.value.validate()
    isLoading.value = true

    // 使用 LeanCloud 真实登录
    const user = await AV.User.logIn(loginForm.username, loginForm.password)
    
    ElMessage.success(`欢迎回来，${user.get('nickname') || '亲爱的'}！`)
    
    // 存储状态
    localStorage.setItem('chat_user_id', user.id)
    localStorage.setItem('isAdmin', user.get('isAdmin') ? 'true' : 'false')
    
    if (loginForm.remember) {
      localStorage.setItem('loginInfo', JSON.stringify({
        username: loginForm.username,
        password: loginForm.password
      }))
    } else {
      localStorage.removeItem('loginInfo')
    }
    
    router.push('/home')
  } catch (error) {
    ElMessage.error('登录失败：' + (error.message || '账号或密码错误'))
  } finally {
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

// 第三方登录处理
const handleSocialLogin = async (platform) => {
  const platformName = platform === 'wechat' ? '微信' : 'QQ'
  // 注意：LeanCloud 对内置的 'weixin' 和 'qq' 类型有严格的 session 校验。
  // 在开发/模拟环境下，我们使用自定义的类型名称（如 wechat_sim）来绕过验证。
  const authType = platform === 'wechat' ? 'wechat_sim' : 'qq_sim'
  
  try {
    isLoading.value = true
    
    // 弹窗提示：模拟第三方授权过程
    await ElMessageBox.confirm(
      `即将跳转至 ${platformName} 进行授权登录。由于当前为开发环境，我们将模拟授权成功的结果。`,
      `${platformName} 授权`,
      {
        confirmButtonText: '模拟授权',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    // 模拟从第三方获取的授权数据
    // 注意：LeanCloud 的 weixin/qq 登录要求 authData 中必须包含 openid
    const authData = {
      openid: `mock_openid_${Math.random().toString(36).substr(2, 9)}`,
      access_token: `mock_token_${Math.random().toString(36).substr(2, 9)}`,
      expires_in: 7200
    }

    // 使用 LeanCloud 的 loginWithAuthData 进行登录/注册
    // 这会自动关联第三方账号，如果用户不存在则自动创建
    const user = await AV.User.loginWithAuthData(authData, authType)
    
    // 设置一些默认信息（如果是新用户）
    if (!user.get('nickname')) {
      await user.save({
        nickname: `${platformName}用户_${user.id.substr(-4)}`,
        avatar: platform === 'wechat' 
          ? 'https://img.icons8.com/color/96/000000/weixing.png' 
          : 'https://img.icons8.com/color/96/000000/qq.png'
      })
    }

    ElMessage.success(`登录成功！欢迎回来，${user.get('nickname')}`)
    
    // 存储必要信息
    localStorage.setItem('chat_user_id', user.id)
    localStorage.setItem('isAdmin', user.get('isAdmin') ? 'true' : 'false')
    
    router.push('/home')
  } catch (error) {
    if (error !== 'cancel') {
      console.error(`${platformName}登录出错:`, error)
      ElMessage.error(`${platformName}登录失败: ${error.message || '未知错误'}`)
    }
  } finally {
    isLoading.value = false
  }
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
.form-actions :deep(.el-form-item__content) {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

/* 登录按钮 */
.login-btn-item :deep(.el-form-item__content) {
  margin-left: 0 !important;
  display: flex;
  justify-content: center;
}

.login-btn {
  width: 100%;
  max-width: 200px;
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

/* 第三方登录样式 */
.social-login {
  margin-top: 30px;
  text-align: center;
}

.divider {
  position: relative;
  margin-bottom: 20px;
  border-bottom: 1px solid #eee;
}

.divider span {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  padding: 0 15px;
  color: #999;
  font-size: 14px;
}

.social-icons {
  display: flex;
  justify-content: center;
  gap: 40px;
}

.social-icon {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.icon-wrapper {
  width: 54px;
  height: 54px;
  background: #fdfdfe;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.social-icon img {
  width: 32px;
  height: 32px;
}

.social-icon:hover .icon-wrapper {
  transform: translateY(-5px) scale(1.1);
  box-shadow: 0 8px 20px rgba(255, 105, 180, 0.2);
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
