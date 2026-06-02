<template>
  <div class="nav-page">
    <header class="header">
      <p class="eyebrow">Network Learning Platform</p>
      <h1 class="title">计算机网络实习</h1>
      <p class="subtitle">围绕协议原理、综合场景和知识体系展开交互式学习</p>
    </header>

    <main class="cards-container">
      <button
        class="nav-card"
        @click="$emit('navigate', 'protocol')"
      >
        <span class="card-index">01</span>
        <h2 class="card-title">协议原理可视化</h2>
        <p class="card-desc">
          深入理解 DNS 解析、TCP 连接建立、HTTP 请求响应和 ARP 地址解析。
        </p>
        <span class="card-action">进入模块</span>
      </button>

      <button
        class="nav-card"
        @click="$emit('navigate', 'simulation')"
      >
        <span class="card-index">02</span>
        <h2 class="card-title">综合网络场景模拟</h2>
        <p class="card-desc">
          按步骤观察主机、交换机、路由器、DNS 和 Web 服务器之间的数据流动。
        </p>
        <span class="card-action">进入模块</span>
      </button>

      <button
        class="nav-card"
        @click="$emit('navigate', 'knowledge')"
      >
        <span class="card-index">03</span>
        <h2 class="card-title">计算机网络知识图库</h2>
        <p class="card-desc">
          围绕 TCP/IP 五层模型学习概念、协议、设备、封装和层间协作。
        </p>
        <span class="card-action">进入模块</span>
      </button>
    </main>
  </div>
</template>

<script setup>
defineEmits(['navigate'])
</script>

<style scoped>
.nav-page {
  min-height: 100vh;
  padding: calc(var(--spacing) * 2) var(--spacing);
  background: var(--bg-color);
}

.header {
  max-width: 1200px;
  margin: 0 auto calc(var(--spacing) * 2);
}

.eyebrow {
  font-size: 13px;
  color: var(--primary-color);
  margin-bottom: 8px;
  font-weight: 500;
}

.title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 8px;
  letter-spacing: -0.5px;
}

.subtitle {
  font-size: 16px;
  color: var(--muted-text-color);
  font-weight: 400;
  max-width: 560px;
}

.cards-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--spacing);
  max-width: 1200px;
  margin: 0 auto;
}

.nav-card {
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: var(--spacing);
  cursor: pointer;
  transition: border-color 0.15s, background-color 0.15s;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  text-align: left;
  min-height: 280px;
  font-family: var(--font-family);
  line-height: 1.5;
}

.nav-card:hover {
  border-color: var(--primary-color);
  background: var(--subtle-bg-color);
}

.card-index {
  font-size: 13px;
  color: var(--primary-color);
  font-weight: 600;
  margin-bottom: var(--spacing);
}

.card-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 12px;
}

.card-desc {
  font-size: 14px;
  color: var(--muted-text-color);
  line-height: 1.5;
  flex-grow: 1;
}

.card-action {
  font-size: 14px;
  color: var(--primary-color);
  margin-top: var(--spacing);
}

@media (max-width: 900px) {
  .cards-container {
    grid-template-columns: 1fr;
  }

  .nav-card {
    min-height: auto;
  }
}
</style>
