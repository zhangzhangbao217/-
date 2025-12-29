<!-- Contracts.vue -->
<template>
  <el-container class="contract-container">
    <div class="love-bg-decoration"></div>
    <el-header class="contract-header">
      <div class="header-left">
        <el-icon class="back-btn" @click="goBack"><ArrowLeft /></el-icon>
        <span class="page-title">专属契约</span>
      </div>
    </el-header>

    <el-main class="contract-main">
      <div class="page-intro">
        <h2>我们的甜蜜约定 📜</h2>
        <p>签下这份契约，就要遵守一辈子哦</p>
      </div>

      <div class="contracts-grid">
        <div v-for="(contract, index) in contracts" :key="index" class="contract-paper">
          <div class="paper-header">
            <span class="contract-no">NO.{{ String(index + 1).padStart(3, '0') }}</span>
            <div class="stamp-placeholder">已生效</div>
          </div>
          <h3 class="contract-title">{{ contract.title }}</h3>
          <div class="contract-content">
            <p>{{ contract.content }}</p>
          </div>
          <div class="contract-signatures">
            <div class="sig">
              <span class="label">甲方：</span>
              <span class="name">张张包</span>
            </div>
            <div class="sig">
              <span class="label">乙方：</span>
              <span class="name">小黄包</span>
            </div>
          </div>
          <div class="contract-footer">
            日期：{{ contract.date }}
          </div>
        </div>
      </div>
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'

const router = useRouter()
const goBack = () => router.push('/home')

const contracts = ref([
  {
    title: '不许生气超过一小时协议',
    content: '无论发生什么争吵，双方必须在60分钟内主动寻求和解。甲方负责亲亲，乙方负责抱抱。',
    date: '2019-12-29'
  },
  {
    title: '家务劳动分配方案',
    content: '甲方负责洗碗和倒垃圾，乙方负责做饭和擦桌子。特殊节日双方共同劳动。',
    date: '2020-05-20'
  },
  {
    title: '终身陪伴补充协议',
    content: '本契约长期有效。无论贫穷富有、疾病健康，双方需保持每日至少一次的“我爱你”告白。',
    date: '2021-01-01'
  }
])
</script>

<style scoped>
.contract-container {
  min-height: 100vh;
  background: #fdfcfb;
  position: relative;
}
.love-bg-decoration {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='30' height='30' fill='%23ffccd5' opacity='0.1'%3E%3Cpath d='M15 25C12.343 25 10 22.657 10 20c0-3 5-7 5-7s5 4 5 7c0 2.657-2.343 5-5 5z'/%3E%3C/svg%3E");
  z-index: 0; pointer-events: none;
}
.contract-header {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  display: flex; align-items: center; padding: 0 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  z-index: 10;
}
.header-left { display: flex; align-items: center; gap: 10px; }
.back-btn { font-size: 20px; cursor: pointer; color: #b8860b; }
.page-title { font-size: 18px; font-weight: 600; color: #b8860b; }

.contract-main { position: relative; z-index: 1; padding: 30px 20px; max-width: 900px; margin: 0 auto; }
.page-intro { text-align: center; margin-bottom: 50px; }
.page-intro h2 { color: #8b4513; font-family: "STKaiti", "KaiTi", serif; margin-bottom: 10px; }
.page-intro p { color: #bc8f8f; }

.contracts-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 30px; }

.contract-paper {
  background: #fff;
  padding: 30px;
  border: 1px solid #eee;
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
  position: relative;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  background-image: linear-gradient(#f9f9f9 1px, transparent 1px);
  background-size: 100% 25px;
}

.paper-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
.contract-no { font-family: monospace; color: #ccc; font-size: 12px; }
.stamp-placeholder {
  width: 60px; height: 60px; border: 2px solid #e63946; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  color: #e63946; font-weight: bold; font-size: 12px;
  transform: rotate(-20deg); opacity: 0.6;
}

.contract-title {
  color: #333; font-size: 20px; text-align: center; margin-bottom: 25px;
  font-family: "STKaiti", "KaiTi", serif; border-bottom: 2px solid #8b4513;
  padding-bottom: 5px; display: inline-block; align-self: center;
}

.contract-content { flex: 1; margin-bottom: 30px; }
.contract-content p { color: #555; line-height: 25px; text-indent: 2em; font-size: 15px; }

.contract-signatures { display: flex; justify-content: space-around; margin-bottom: 20px; }
.sig { display: flex; flex-direction: column; align-items: center; }
.sig .label { font-size: 12px; color: #999; margin-bottom: 5px; }
.sig .name { font-family: "STKaiti", "KaiTi", serif; font-size: 18px; color: #333; border-bottom: 1px solid #333; min-width: 80px; text-align: center; }

.contract-footer { text-align: right; font-size: 12px; color: #bbb; }

@media (max-width: 768px) {
  .contracts-grid { grid-template-columns: 1fr; }
  .contract-paper { padding: 20px; }
}
</style>
