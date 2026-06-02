<template>
  <div class="app">
    <NavigationPage
      v-if="currentPage === 'nav'"
      @navigate="handleNavigate"
    />
    <ProtocolPage
      v-else-if="currentPage === 'protocol'"
      @back="currentPage = 'nav'"
    />
    <SimulationPage
      v-else-if="currentPage === 'simulation'"
      @back="currentPage = 'nav'"
    />
    <KnowledgePage
      v-else-if="currentPage === 'knowledge'"
      @back="currentPage = 'nav'"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import NavigationPage from './pages/NavigationPage.vue'
import ProtocolPage from './pages/ProtocolPage.vue'
import SimulationPage from './pages/SimulationPage.vue'
import KnowledgePage from './pages/KnowledgePage.vue'

const currentPage = ref('nav')

const handleNavigate = (page) => {
  currentPage.value = page
}
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

:root {
  --bg-color: #FFFFFF;
  --text-color: #333333;
  --primary-color: #0066FF;
  --border-color: #E5E5E5;
  --muted-text-color: #666666;
  --subtle-bg-color: #FAFAFA;
  --active-bg-color: #F0F7FF;
  --border-radius: 2px;
  --spacing: 24px;
  --font-family: system-ui, -apple-system, sans-serif;
}

body {
  font-family: var(--font-family);
  line-height: 1.5;
  background: var(--bg-color);
  color: var(--text-color);
}

.app {
  min-height: 100vh;
}
</style>
