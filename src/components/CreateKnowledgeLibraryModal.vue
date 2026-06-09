<template>
  <div class="modal-mask" @click.self="$emit('cancel')">
    <section class="modal-card" role="dialog" aria-modal="true" aria-labelledby="create-library-title">
      <header class="modal-header">
        <h3 id="create-library-title">添加知识库</h3>
        <button class="close-btn" type="button" aria-label="关闭" @click="$emit('cancel')">×</button>
      </header>

      <div class="mode-tabs">
        <button
          type="button"
          class="mode-btn"
          :class="{ active: mode === 'manual' }"
          @click="mode = 'manual'"
        >
          手动创建
        </button>
        <button
          type="button"
          class="mode-btn"
          :class="{ active: mode === 'json' }"
          @click="mode = 'json'"
        >
          JSON 导入
        </button>
      </div>

      <form class="library-form" @submit.prevent="submit">
        <template v-if="mode === 'manual'">
          <label class="form-field">
            <span>标题</span>
            <input v-model.trim="title" type="text" placeholder="例如：OSI 七层模型" />
          </label>

          <label class="form-field">
            <span>描述</span>
            <textarea v-model.trim="description" rows="4" placeholder="简要描述这个知识库的学习范围"></textarea>
          </label>
        </template>

        <label v-else class="form-field">
          <span>知识库 JSON</span>
          <textarea v-model="jsonText" rows="12" placeholder="粘贴包含 title、description、tabs、layers、graph 的 JSON"></textarea>
        </label>

        <p v-if="error" class="error-text">{{ error }}</p>

        <footer class="modal-actions">
          <button class="secondary-btn" type="button" @click="$emit('cancel')">取消</button>
          <button class="primary-btn" type="submit" :disabled="submitting">
            {{ submitting ? '创建中...' : '创建知识库' }}
          </button>
        </footer>
      </form>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { createKnowledgeLibrary } from '../services/knowledgeApi.js'

const emit = defineEmits(['cancel', 'created'])

const mode = ref('manual')
const title = ref('')
const description = ref('')
const jsonText = ref('')
const error = ref('')
const submitting = ref(false)

const validatePayload = payload => {
  if (!payload || typeof payload !== 'object') {
    throw new Error('JSON 必须是对象')
  }

  if (typeof payload.title !== 'string' || payload.title.trim() === '') {
    throw new Error('请提供知识库标题')
  }

  if (typeof payload.description !== 'string' || payload.description.trim() === '') {
    throw new Error('请提供知识库描述')
  }

  if (payload.tabs !== undefined && !Array.isArray(payload.tabs)) {
    throw new Error('tabs 必须是数组')
  }

  if (payload.layers !== undefined && !Array.isArray(payload.layers)) {
    throw new Error('layers 必须是数组')
  }

  if (payload.graph !== undefined && (typeof payload.graph !== 'object' || Array.isArray(payload.graph))) {
    throw new Error('graph 必须是对象')
  }

  return payload
}

const manualPayload = () => validatePayload({
  title: title.value,
  description: description.value,
  tabs: [],
  layers: [],
  graph: { categories: [], nodes: [], edges: [] }
})

const jsonPayload = () => {
  try {
    return validatePayload(JSON.parse(jsonText.value))
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error('JSON 格式不正确')
    }
    throw err
  }
}

const submit = async () => {
  error.value = ''
  submitting.value = true

  try {
    const payload = mode.value === 'manual' ? manualPayload() : jsonPayload()
    const library = await createKnowledgeLibrary(payload)
    emit('created', library)
  } catch (err) {
    error.value = err.message || '创建知识库失败'
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing);
  background: rgba(0, 0, 0, 0.28);
}

.modal-card {
  width: min(640px, 100%);
  max-height: calc(100vh - 48px);
  overflow: auto;
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing);
  border-bottom: 1px solid var(--border-color);
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

.close-btn {
  border: none;
  background: transparent;
  color: var(--muted-text-color);
  cursor: pointer;
  font-size: 24px;
  line-height: 1;
}

.mode-tabs {
  display: flex;
  gap: 8px;
  padding: var(--spacing) var(--spacing) 0;
}

.mode-btn {
  padding: 8px 14px;
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  color: var(--text-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-family: var(--font-family);
}

.mode-btn.active {
  border-color: var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.library-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: var(--spacing);
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: var(--text-color);
  font-size: 14px;
}

.form-field input,
.form-field textarea {
  width: 100%;
  padding: 10px 12px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-color);
  font-family: var(--font-family);
  font-size: 14px;
  line-height: 1.5;
  resize: vertical;
}

.form-field input:focus,
.form-field textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.error-text {
  color: #C84040;
  font-size: 13px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.primary-btn,
.secondary-btn {
  padding: 8px 16px;
  border-radius: var(--border-radius);
  cursor: pointer;
  font-family: var(--font-family);
  line-height: 1.5;
}

.primary-btn {
  border: 1px solid var(--primary-color);
  background: var(--primary-color);
  color: white;
}

.primary-btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.secondary-btn {
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  color: var(--text-color);
}
</style>
