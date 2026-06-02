<template>
  <div class="step-controller" :class="{ floating: isFloating }">
    <div class="step-info">
      <span class="step-counter">{{ displayStepIndex }} / {{ totalSteps }}</span>
      <span class="step-label">步骤</span>
    </div>

    <div class="control-buttons">
      <button
        class="control-btn"
        :disabled="!hasPrev"
        @click="$emit('prev')"
        title="上一步"
      >
        ←
      </button>

      <button
        class="control-btn primary"
        :disabled="isAtEnd"
        @click="$emit('next')"
      >
        {{ isAtStart ? '开始' : '下一步' }}
      </button>

      <button
        class="control-btn"
        :disabled="isAtStart"
        @click="$emit('reset')"
        title="重置"
      >
        ↺
      </button>
    </div>

    <div class="step-progress">
      <div
        v-for="(_, index) in totalSteps"
        :key="index"
        class="step-dot"
        :class="{
          completed: index < currentStepIndex,
          active: index === currentStepIndex,
          pending: index > currentStepIndex
        }"
        @click="$emit('goto', index)"
        :title="`跳转到步骤 ${index + 1}`"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  currentStepIndex: {
    type: Number,
    required: true
  },
  totalSteps: {
    type: Number,
    required: true
  },
  hasNext: {
    type: Boolean,
    default: false
  },
  hasPrev: {
    type: Boolean,
    default: false
  },
  isAtStart: {
    type: Boolean,
    default: true
  },
  isAtEnd: {
    type: Boolean,
    default: false
  },
  floating: {
    type: Boolean,
    default: true
  }
})

defineEmits(['next', 'prev', 'reset', 'goto'])

const displayStepIndex = computed(() => {
  return props.isAtStart ? 0 : props.currentStepIndex + 1
})

const isFloating = computed(() => props.floating)
</script>

<style scoped>
.step-controller {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 16px 24px;
  background: #F5F5F5;
  border-top: 1px solid #E5E5E5;
}

.step-controller.floating {
  position: fixed;
  bottom: 0;
  left: 320px; /* 左侧边栏宽度 */
  right: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid #E5E5E5;
  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.05);
}

@media (max-width: 768px) {
  .step-controller.floating {
    left: 0;
  }
}

.step-info {
  display: flex;
  align-items: baseline;
  gap: 4px;
}

.step-counter {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

.step-label {
  font-size: 14px;
  color: #666;
}

.control-buttons {
  display: flex;
  gap: 8px;
  flex: 1;
  justify-content: center;
}

.control-btn {
  padding: 8px 16px;
  border: 1px solid #D9D9D9;
  background: white;
  color: var(--text-color);
  font-size: 14px;
  cursor: pointer;
  border-radius: var(--border-radius);
  font-family: var(--font-family);
  min-width: 60px;
  transition: all 0.15s;
}

.control-btn:hover:not(:disabled) {
  border-color: var(--primary-color);
  color: var(--primary-color);
}

.control-btn.primary {
  background: var(--primary-color);
  border-color: var(--primary-color);
  color: white;
  min-width: 80px;
}

.control-btn.primary:hover:not(:disabled) {
  opacity: 0.9;
}

.control-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.step-progress {
  display: flex;
  gap: 8px;
  align-items: center;
}

.step-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #D9D9D9;
  cursor: pointer;
  transition: all 0.15s;
}

.step-dot:hover {
  transform: scale(1.2);
}

.step-dot.completed {
  background: var(--primary-color);
}

.step-dot.active {
  background: var(--primary-color);
  transform: scale(1.5);
  box-shadow: 0 0 0 2px rgba(0, 102, 255, 0.2);
}

.step-dot.pending:hover {
  background: #999;
}
</style>
