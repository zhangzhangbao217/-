<template>
  <div class="admin-page">
    <div class="admin-header">
      <el-button icon="ArrowLeft" circle @click="router.push('/home')" />
      <h2>🛠️ 管理员后台</h2>
      <div class="stats">总用户数: {{ users.length }}</div>
    </div>

    <div class="user-list">
      <el-table :data="users" style="width: 100%" v-loading="loading">
        <el-table-column label="头像" width="80">
          <template #default="scope">
            <el-avatar :size="40" :src="scope.row.avatar || '/nv.jpg'" />
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="username" label="账号 (手机)" width="150" />
        <el-table-column label="恋爱状态">
          <template #default="scope">
            <el-tag :type="scope.row.partnerId ? 'success' : 'info'">
              {{ scope.row.partnerId ? `已关联: ${scope.row.partnerName}` : '单身模式' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="注册时间" width="180">
          <template #default="scope">
            {{ new Date(scope.row.createdAt).toLocaleString() }}
          </template>
        </el-table-column>
        <el-table-column label="操作" fixed="right" width="120">
          <template #default="scope">
            <el-button type="danger" link @click="handleDelete(scope.row)">注销</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
// @ts-ignore
import AV from 'leancloud-storage'

const router = useRouter()
const users = ref([])
const loading = ref(false)

const fetchUsers = async () => {
  loading.value = true
  try {
    const query = new AV.Query('_User')
    query.descending('createdAt')
    const results = await query.find()
    users.value = results.map(u => ({
      id: u.id,
      username: u.getUsername(),
      nickname: u.get('nickname'),
      avatar: u.get('avatar'),
      partnerId: u.get('partnerId'),
      partnerName: u.get('partnerName'),
      createdAt: u.createdAt
    }))
  } catch (error) {
    ElMessage.error('获取用户列表失败：' + error.message)
    if (error.code === 403) {
      ElMessage.error('权限不足，请确保你是管理员')
      router.push('/home')
    }
  } finally {
    loading.value = false
  }
}

const handleDelete = (user) => {
  ElMessageBox.confirm(`确定要注销用户 ${user.nickname} 吗？此操作不可逆。`, '警告', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    // 真实场景需要后端接口支持，这里模拟
    ElMessage.success('操作成功（仅模拟）')
  }).catch(() => {})
}

onMounted(() => {
  const currentUser = AV.User.current()
  if (!currentUser || !currentUser.get('isAdmin')) {
    ElMessage.error('非管理员禁止访问')
    router.push('/home')
    return
  }
  fetchUsers()
})
</script>

<style scoped>
.admin-page {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.admin-header {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-bottom: 30px;
  background: white;
  padding: 15px 25px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}

.admin-header h2 {
  margin: 0;
  flex: 1;
}

.stats {
  font-weight: bold;
  color: #666;
}

.user-list {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.05);
}
</style>
