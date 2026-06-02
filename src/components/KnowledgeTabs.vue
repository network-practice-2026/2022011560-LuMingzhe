<template>
  <div class="knowledge-tabs">
    <button
      v-for="tab in tabs"
      :key="tab.id"
      class="tab-btn"
      :class="{ active: activeId === tab.id }"
      @click="$emit('select', tab.id)"
    >
      {{ tab.title }}
    </button>
  </div>
</template>

<script setup>
defineProps({
  tabs: {
    type: Array,
    required: true
  },
  activeId: {
    type: String,
    required: true
  }
})

defineEmits(['select'])
</script>

<style scoped>
.knowledge-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--spacing);
}

.tab-btn {
  padding: 8px 16px;
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  color: var(--text-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-family: var(--font-family);
  font-size: 14px;
  line-height: 1.5;
  transition: border-color 0.15s, color 0.15s, background-color 0.15s;
}

.tab-btn:hover {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.tab-btn.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}
</style>
