<template>
  <div class="knowledge-tabs">
    <div
      v-for="tab in tabs"
      :key="tab.id"
      class="tab-item"
      :class="{ active: activeId === tab.id }"
    >
      <button class="tab-btn" @click="$emit('select', tab.id)">
        {{ tab.title }}
      </button>
      <div v-if="!isBuiltin && editMode && tab.id !== 'graph'" class="tab-actions">
        <button type="button" aria-label="重命名页面" @click.stop="$emit('rename-tab', tab)">编辑</button>
        <button type="button" aria-label="删除页面" @click.stop="$emit('delete-tab', tab)">删除</button>
      </div>
    </div>

    <button
      v-if="!isBuiltin && editMode"
      class="add-tab-btn"
      type="button"
      aria-label="添加新的知识页面"
      @click="$emit('add-tab')"
    >
      +
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
  },
  isBuiltin: {
    type: Boolean,
    default: true
  },
  editMode: {
    type: Boolean,
    default: false
  }
})

defineEmits(['select', 'add-tab', 'rename-tab', 'delete-tab'])
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

.tab-item {
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-color);
  overflow: hidden;
  transition: border-color 0.15s, color 0.15s, background-color 0.15s;
}

.tab-item:hover {
  border-color: var(--primary-color);
}

.tab-item.active {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
}

.tab-btn,
.add-tab-btn,
.tab-actions button {
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-family: var(--font-family);
  line-height: 1.5;
}

.tab-btn {
  padding: 8px 16px;
  color: var(--text-color);
  font-size: 14px;
}

.tab-item:hover .tab-btn {
  color: var(--primary-color);
}

.tab-item.active .tab-btn,
.tab-item.active .tab-actions button {
  color: white;
}

.tab-actions {
  display: flex;
  gap: 2px;
  padding-right: 6px;
}

.tab-actions button {
  padding: 4px 6px;
  font-size: 12px;
  opacity: 0.8;
}

.tab-actions button:hover {
  opacity: 1;
}

.add-tab-btn {
  min-width: 38px;
  border: 1px dashed var(--border-color);
  border-radius: var(--border-radius);
  color: var(--primary-color);
  font-size: 18px;
}

.add-tab-btn:hover {
  border-color: var(--primary-color);
  background: var(--active-bg-color);
}
</style>
