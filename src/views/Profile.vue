<template>
  <div class="profile-page">
    <div class="profile-container">
      <div class="profile-header">
        <el-button icon="ArrowLeft" circle @click="router.back()" class="back-btn" />
        <h2>💑 个人资料设置</h2>
      </div>

      <el-tabs v-model="activeTab" class="profile-tabs">
        <el-tab-pane label="我的资料" name="me">
          <div class="form-section">
            <div class="avatar-upload">
              <el-avatar :size="100" :src="meForm.avatar" />
              <el-upload
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                @change="handleAvatarChange($event, 'me')"
              >
                <el-button type="primary" link>更换我的头像</el-button>
              </el-upload>
            </div>
            
            <el-form label-position="top">
              <el-form-item label="我的昵称">
                <el-input v-model="meForm.nickname" placeholder="请输入你的昵称" />
              </el-form-item>
              <el-form-item label="我的账号 (手机号)">
                <el-input v-model="meForm.username" disabled />
              </el-form-item>
              <el-form-item label="恋爱开始日期">
                <el-date-picker
                  v-model="meForm.loveStartDate"
                  type="date"
                  placeholder="选择我们的恋爱纪念日"
                  format="YYYY-MM-DD"
                  value-format="YYYY-MM-DD"
                  style="width: 100%"
                />
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>

        <el-tab-pane label="爱人资料" name="partner">
          <div class="form-section">
            <div class="avatar-upload">
              <el-avatar :size="100" :src="partnerForm.avatar" />
              <el-upload
                action="#"
                :auto-upload="false"
                :show-file-list="false"
                @change="handleAvatarChange($event, 'partner')"
              >
                <el-button type="primary" link>更换爱人头像</el-button>
              </el-upload>
            </div>
            
            <el-form label-position="top">
              <el-form-item label="爱人昵称">
                <el-input v-model="partnerForm.name" placeholder="例如：小黄包" />
              </el-form-item>
              <el-form-item label="关联爱人账号 ID (可选)">
                <el-input v-model="partnerForm.id" placeholder="对方的用户 ID" />
                <p class="tip">填写对方 ID 后，你们的聊天记录将实时同步</p>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>

      <div class="save-actions">
        <el-button type="danger" size="large" @click="handleSave" :loading="saving" class="save-btn">
          保存所有修改
        </el-button>
        <el-button @click="handleLogout" class="logout-btn">退出登录</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
// @ts-ignore
import AV from 'leancloud-storage'

const router = useRouter()
const activeTab = ref('me')
const saving = ref(false)

const meForm = reactive({
  nickname: '',
  username: '',
  avatar: '/nv.jpg',
  loveStartDate: '2019-12-29'
})

const partnerForm = reactive({
  name: '另一半',
  id: '',
  avatar: '/nan.jpg'
})

onMounted(() => {
  const user = AV.User.current()
  if (user) {
    meForm.nickname = user.get('nickname') || ''
    meForm.username = user.getUsername() || ''
    meForm.avatar = user.get('avatar') || '/nv.jpg'
    meForm.loveStartDate = user.get('loveStartDate') || '2019-12-29'
    
    partnerForm.name = user.get('partnerName') || '另一半'
    partnerForm.id = user.get('partnerId') || ''
    partnerForm.avatar = user.get('partnerAvatar') || '/nan.jpg'
  } else {
    router.push('/login')
  }
})

const handleAvatarChange = (file, target) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    if (target === 'me') {
      meForm.avatar = e.target.result
    } else {
      partnerForm.avatar = e.target.result
    }
  }
  reader.readAsDataURL(file.raw)
}

const handleSave = async () => {
  const user = AV.User.current()
  if (!user) return

  saving.value = true
  try {
    user.set('nickname', meForm.nickname)
    user.set('avatar', meForm.avatar)
    user.set('loveStartDate', meForm.loveStartDate)
    user.set('partnerName', partnerForm.name)
    user.set('partnerId', partnerForm.id)
    user.set('partnerAvatar', partnerForm.avatar)
    
    await user.save()
    ElMessage.success('保存成功！重启应用后生效')
    setTimeout(() => window.location.reload(), 1500)
  } catch (error) {
    ElMessage.error('保存失败：' + error.message)
  } finally {
    saving.value = false
  }
}

const handleLogout = () => {
  AV.User.logOut()
  localStorage.clear()
  router.push('/login')
}
</script>

<style scoped>
.profile-page {
  min-height: 100vh;
  background: #fdf2f5;
  padding: 20px;
}

.profile-container {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.05);
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 30px;
}

.profile-header h2 {
  margin: 0;
  color: #333;
}

.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  margin-bottom: 25px;
}

.form-section {
  padding: 20px 0;
}

.tip {
  font-size: 12px;
  color: #999;
  margin-top: 5px;
}

.save-actions {
  margin-top: 40px;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.save-btn {
  height: 50px;
  font-size: 18px;
}

.logout-btn {
  width: 100%;
}

.profile-tabs :deep(.el-tabs__item.is-active) {
  color: #ff4757;
}

.profile-tabs :deep(.el-tabs__active-bar) {
  background-color: #ff4757;
}
</style>
