<!-- Contracts.vue -->
<template>
  <div class="contract-content-wrapper">
    <div class="contract-main">
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
              <span class="name">{{ currentUser.name }}</span>
            </div>
            <div class="sig">
              <span class="label">乙方：</span>
              <span class="name">{{ user2.name }}</span>
            </div>
          </div>
          <div class="contract-footer">
            日期：{{ contract.date }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { currentUser, user2 } from '../services/chatManager'

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
.contract-content-wrapper {
  min-height: 100%;
  background: transparent;
  position: relative;
}

.contract-main {
  padding: 20px 0;
  max-width: 1000px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
}

.page-intro {
  text-align: center;
  margin-bottom: 50px;
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(255, 255, 255, 0.6) !important;
  padding: 25px 50px !important;
  border-radius: 30px !important;
  box-shadow: 0 10px 30px rgba(255, 182, 193, 0.2) !important;
  display: inline-block;
  left: 50%;
  transform: translateX(-50%);
  position: relative;
  animation: fadeInDown 0.8s ease-out;
}

@keyframes fadeInDown {
  from { opacity: 0; transform: translate(-50%, -20px); }
  to { opacity: 1; transform: translate(-50%, 0); }
}

.page-intro h2 {
  color: #ff4757;
  font-size: 2.2rem;
  margin-bottom: 10px;
  font-family: "STKaiti", "KaiTi", serif;
  font-weight: 700;
}

.page-intro p {
  color: #ff7f9d;
  font-size: 1.1rem;
  opacity: 0.9;
}

.contracts-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
  gap: 30px;
  margin-top: 30px;
}

.contract-paper {
  background: rgba(255, 255, 255, 0.7) !important;
  backdrop-filter: blur(12px) !important;
  -webkit-backdrop-filter: blur(12px) !important;
  border: 1px solid rgba(255, 255, 255, 0.6) !important;
  padding: 40px 35px;
  border-radius: 24px !important;
  box-shadow: 0 15px 40px rgba(255, 182, 193, 0.2) !important;
  position: relative;
  min-height: 350px;
  display: flex;
  flex-direction: column;
  background-image: linear-gradient(rgba(255, 107, 129, 0.05) 1px, transparent 1px) !important;
  background-size: 100% 30px !important;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
  animation: fadeInUp 0.6s ease-out both;
}

@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.contract-paper:hover {
  transform: translateY(-10px) scale(1.02) !important;
  background: rgba(255, 255, 255, 0.85) !important;
  box-shadow: 0 20px 50px rgba(255, 107, 129, 0.3) !important;
}

.paper-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 25px;
}

.contract-no {
  font-family: 'Courier New', Courier, monospace;
  color: #ffb3c1;
  font-size: 14px;
  font-weight: 600;
}

.stamp-placeholder {
  width: 70px;
  height: 70px;
  border: 3px solid #ff4757;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #ff4757;
  font-weight: 900;
  font-size: 14px;
  transform: rotate(-25deg);
  opacity: 0.7;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 0 10px rgba(255, 71, 87, 0.2);
}

.contract-title {
  color: #ff4757;
  font-size: 22px;
  text-align: center;
  margin-bottom: 30px;
  font-family: "STKaiti", "KaiTi", serif;
  border-bottom: 2px solid #ff4757;
  padding-bottom: 8px;
  display: inline-block;
  align-self: center;
  font-weight: 700;
}

.contract-content {
  flex: 1;
  margin-bottom: 40px;
}

.contract-content p {
  color: #4a4a4a;
  line-height: 1.8;
  text-indent: 2em;
  font-size: 16px;
  font-family: "STKaiti", "KaiTi", serif;
}

.contract-signatures {
  display: flex;
  justify-content: space-around;
  margin-bottom: 25px;
  padding-top: 20px;
  border-top: 1px dashed rgba(255, 71, 87, 0.2);
}

.sig {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.sig .label {
  font-size: 13px;
  color: #ff7f9d;
  margin-bottom: 8px;
}

.sig .name {
  font-family: "STKaiti", "KaiTi", serif;
  font-size: 20px;
  color: #333;
  border-bottom: 1.5px solid #ff4757;
  min-width: 100px;
  text-align: center;
  padding: 0 10px 5px;
}

.contract-footer {
  text-align: right;
  font-size: 13px;
  color: #ffb3c1;
  font-weight: 500;
}

@media (max-width: 768px) {
  .contracts-grid {
    grid-template-columns: 1fr;
  }
  
  .contract-paper {
    padding: 30px 25px;
  }
  
  .page-intro {
    padding: 20px 30px !important;
    width: 90%;
  }
  
  .page-intro h2 {
    font-size: 1.8rem;
  }
}
</style>
