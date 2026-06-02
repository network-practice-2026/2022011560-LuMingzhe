<template>
  <div class="split-layout">
    <aside class="sidebar">
      <header class="sidebar-header">
        <button
          class="back-btn"
          @click="$emit('back')"
        >
          ← 返回
        </button>
        <h2 class="page-title">{{ title }}</h2>
      </header>

      <nav class="nav-list">
        <button
          v-for="item in items"
          :key="item.id"
          class="nav-item"
          :class="{ active: currentId === item.id }"
          @click="$emit('select', item.id)"
        >
          <span class="nav-item-title">{{ item.title }}</span>
          <span class="nav-item-desc">{{ item.description }}</span>
        </button>
      </nav>
    </aside>

    <main class="content">
      <slot />
    </main>
  </div>
</template>

<script setup>
defineProps({
  title: {
    type: String,
    required: true
  },
  items: {
    type: Array,
    required: true
  },
  currentId: {
    type: String,
    default: ''
  }
})

defineEmits(['back', 'select'])
</script>

<style scoped>
.split-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-color);
}

.sidebar {
  width: 320px;
  flex-shrink: 0;
  border-right: 1px solid var(--border-color);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  padding: var(--spacing);
  border-bottom: 1px solid var(--border-color);
}

.back-btn {
  background: none;
  border: none;
  color: var(--primary-color);
  font-size: 14px;
  cursor: pointer;
  padding: 0;
  margin-bottom: 16px;
  font-family: var(--font-family);
  line-height: 1.5;
}

.back-btn:hover {
  text-decoration: underline;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-color);
}

.nav-list {
  flex: 1;
  overflow-y: auto;
  padding: 12px 0;
}

.nav-item {
  width: 100%;
  padding: 16px var(--spacing);
  cursor: pointer;
  border: none;
  border-left: 2px solid transparent;
  background: transparent;
  transition: background-color 0.15s, border-color 0.15s;
  text-align: left;
  font-family: var(--font-family);
  line-height: 1.5;
}

.nav-item:hover {
  background: var(--subtle-bg-color);
}

.nav-item.active {
  background: var(--active-bg-color);
  border-left-color: var(--primary-color);
}

.nav-item-title {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  margin-bottom: 4px;
}

.nav-item-desc {
  display: block;
  font-size: 12px;
  color: #888;
  line-height: 1.5;
}

.nav-item.active .nav-item-title {
  color: var(--primary-color);
}

.content {
  flex: 1;
  padding: var(--spacing);
  overflow-y: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

@media (max-width: 768px) {
  .split-layout {
    flex-direction: column;
  }

  .sidebar {
    width: 100%;
    border-right: none;
    border-bottom: 1px solid var(--border-color);
    max-height: 40vh;
  }
}
</style>
