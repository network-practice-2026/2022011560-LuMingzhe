<template>
  <div class="info-panel">
    <div v-if="title || stepTitle" class="panel-header">
      <span v-if="stepNumber !== null" class="step-number">步骤 {{ stepNumber }}</span>
      <h3 class="panel-title">{{ stepTitle || title }}</h3>
    </div>

    <div v-if="description || stepDescription" class="panel-description">
      <p>{{ stepDescription || description }}</p>
    </div>

    <!-- 扩展内容插槽 -->
    <div v-if="$slots.extra || $slots.default" class="panel-extra">
      <slot name="extra" />
      <slot />
    </div>

    <!-- 当没有内容时的占位 -->
    <div v-else-if="!title && !stepTitle && !description && !stepDescription" class="panel-empty">
      <p>{{ emptyText }}</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  // 静态标题（用于没有步骤数据时）
  title: {
    type: String,
    default: ''
  },
  // 静态描述
  description: {
    type: String,
    default: ''
  },
  // 当前步骤标题（优先级高于title）
  stepTitle: {
    type: String,
    default: ''
  },
  // 当前步骤描述（优先级高于description）
  stepDescription: {
    type: String,
    default: ''
  },
  // 步骤编号（从1开始）
  stepNumber: {
    type: Number,
    default: null
  },
  // 空状态提示文字
  emptyText: {
    type: String,
    default: '点击"开始"按钮查看动画讲解'
  }
})
</script>

<style scoped>
.info-panel {
  padding: 24px;
  background: white;
  border: 1px solid #E5E5E5;
  border-radius: var(--border-radius);
}

.panel-header {
  margin-bottom: 16px;
}

.step-number {
  display: inline-block;
  font-size: 12px;
  color: var(--primary-color);
  font-weight: 500;
  margin-bottom: 4px;
}

.panel-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0;
  line-height: 1.4;
}

.panel-description {
  font-size: 14px;
  color: #666;
  line-height: 1.7;
  margin-bottom: 20px;
}

.panel-description p {
  margin: 0;
}

.panel-extra {
  border-top: 1px solid #E5E5E5;
  padding-top: 20px;
}

.panel-empty {
  padding: 40px 20px;
  text-align: center;
  color: #999;
  font-size: 14px;
}
</style>
