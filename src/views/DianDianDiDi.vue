<!-- src/views/DianDianDiDi.vue -->
<template>
  <div class="dian-dian-di-di">
    <h1>这里是点点滴滴</h1>
    <p>欢迎来到我们的回忆录！</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const message = ref('记录我们的美好时光');
</script>

<style scoped>
.dian-dian-di-di {
  text-align: center;
  padding: 20px;
}

.dian-dian-di-di h1, .dian-dian-di-di p {
  color: #e63946;
}
</style>
