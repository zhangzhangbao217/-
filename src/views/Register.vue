<template>
  <div class="register-page">
    <div class="register-card">
      <div class="register-logo">
        <h2>💞 开启甜蜜之旅</h2>
        <p>创建一个属于你们的恋爱空间</p>
      </div>

      <el-form
        ref="registerFormRef"
        :model="registerForm"
        :rules="registerRules"
        class="register-form"
        label-position="top"
      >
        <el-form-item label="你的手机号" prop="mobile">
          <el-input
            v-model="registerForm.mobile"
            placeholder="请输入手机号"
            size="large"
          >
            <template #prefix>
              <el-icon><Iphone /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="验证码" prop="code">
          <div class="code-input-group">
            <el-input
              v-model="registerForm.code"
              placeholder="请输入验证码"
              size="large"
            />
            <el-button 
              type="primary" 
              :disabled="!!countdown" 
              @click="sendSmsCode"
              class="send-code-btn"
            >
              {{ countdown ? `${countdown}s后重发` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>

        <el-form-item label="设置密码" prop="password">
          <el-input
            v-model="registerForm.password"
            type="password"
            placeholder="设置你的专属密码"
            show-password
            size="large"
          >
            <template #prefix>
              <el-icon><Lock /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <el-form-item label="你的昵称" prop="nickname">
          <el-input
            v-model="registerForm.nickname"
            placeholder="例如：张张包"
            size="large"
          >
            <template #prefix>
              <el-icon><User /></el-icon>
            </template>
          </el-input>
        </el-form-item>

        <div class="register-actions">
          <el-button
            type="primary"
            size="large"
            class="register-btn"
            :loading="isLoading"
            @click="handleRegister"
          >
            立即注册
          </el-button>
          <div class="back-to-login">
            已有账号？<el-link type="primary" @click="router.push('/login')">去登录</el-link>
          </div>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { Iphone, Lock, User } from '@element-plus/icons-vue'
// @ts-ignore
import AV from 'leancloud-storage'

const router = useRouter()
const registerFormRef = ref(null)
const isLoading = ref(false)
const countdown = ref(0)
let timer = null

const registerForm = reactive({
  mobile: '',
  code: '',
  password: '',
  nickname: ''
})

const registerRules = {
  mobile: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '手机号格式不正确', trigger: 'blur' }
  ],
  code: [
    { required: true, message: '请输入验证码', trigger: 'blur' },
    { len: 6, message: '验证码为6位数字', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码至少6位', trigger: 'blur' }
  ],
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' }
  ]
}

const sendSmsCode = async () => {
  if (!/^1[3-9]\d{9}$/.test(registerForm.mobile)) {
    ElMessage.warning('请先输入正确的手机号')
    return
  }

  try {
    // 调用 LeanCloud 真实发送短信验证码接口
    await AV.Cloud.requestSmsCode(registerForm.mobile)
    
    ElMessage.success('验证码已发送，请查收短信')
    countdown.value = 60
    timer = setInterval(() => {
      countdown.value--
      if (countdown.value <= 0) {
        clearInterval(timer)
      }
    }, 1000)
  } catch (error) {
    console.error('验证码发送失败:', error)
    if (error.code === 403 || error.message.includes('not allowed for clients')) {
      ElMessageBox.alert(
        '由于 LeanCloud 安全限制，请前往 LeanCloud 控制台 -> 短信 -> 设置 -> 安全设置，勾选“启用客户端发送短信验证码”，否则无法直接从手机端发送验证码。',
        '需要开启权限',
        { confirmButtonText: '我知道了' }
      )
    } else if (error.message.includes('签名无效') || error.message.includes('signature')) {
      ElMessageBox.alert(
        '验证码发送失败：签名无效。这是因为您还没有在 LeanCloud 后台申请短信签名。\n\n**解决方法**：\n1. 前往 LeanCloud 控制台 -> 短信 -> 设置 -> 测试手机号。\n2. 将您的手机号 **' + registerForm.mobile + '** 添加到测试列表中。\n3. 测试手机号收验证码是免费的，且不需要申请签名，可以直接测试。',
        '需要添加测试手机号',
        { confirmButtonText: '去添加', dangerouslyUseHTMLString: true }
      )
    } else {
      ElMessage.error('验证码发送失败：' + (error.message || '请检查 LeanCloud 短信服务配置'))
    }
  }
}

const handleRegister = async () => {
  try {
    await registerFormRef.value.validate()
    isLoading.value = true

    // 使用 LeanCloud 的手机号验证码注册/登录接口
    // 该方法如果用户不存在会自动创建，如果已存在则直接登录
    const user = await AV.User.signUpOrlogInWithMobilePhone(
      registerForm.mobile, 
      registerForm.code
    )
    
    // 如果是新用户，设置初始信息
    if (user.isNew()) {
      user.set('nickname', registerForm.nickname)
      user.set('avatar', '/nv.jpg')
      user.set('loveStartDate', '2019-12-29')
      // 设置密码，方便下次用账号密码登录
      user.setPassword(registerForm.password)
      await user.save()
    }
    
    ElMessage.success('注册并登录成功！')
    
    // 存储必要信息
    localStorage.setItem('chat_user_id', user.id)
    localStorage.setItem('isAdmin', user.get('isAdmin') ? 'true' : 'false')
    
    router.push('/home')
  } catch (error) {
    console.error('注册失败:', error)
    ElMessage.error('操作失败：' + (error.message || '验证码错误或系统异常'))
  } finally {
    isLoading.value = false
  }
}

onUnmounted(() => {
  if (timer) clearInterval(timer)
})
</script>

<style scoped>
.register-page {
  width: 100vw;
  height: 100vh;
  background: linear-gradient(135deg, #ffbad2 0%, #ff80ab 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
}

.register-card {
  width: 100%;
  max-width: 450px;
  padding: 35px;
  background: #fff;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(255, 105, 180, 0.2);
}

.register-logo {
  text-align: center;
  margin-bottom: 30px;
}

.register-logo h2 {
  color: #ff1493;
  margin-bottom: 5px;
}

.register-logo p {
  color: #ff69b4;
  font-size: 14px;
}

.code-input-group {
  display: flex;
  gap: 10px;
  width: 100%;
}

.send-code-btn {
  white-space: nowrap;
  min-width: 110px;
}

.register-actions {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.register-btn {
  width: 100%;
  height: 48px;
  font-size: 16px;
  background: #ff69b4;
  border: none;
}

.register-btn:hover {
  background: #ff1493;
}

.back-to-login {
  font-size: 14px;
  color: #666;
}
</style>
