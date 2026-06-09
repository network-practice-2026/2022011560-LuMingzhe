<template>
  <div class="layer-view">
    <section class="summary-card">
      <div class="layer-order">TCP/IP 五层模型 · 第 {{ layer.order }} 层</div>
      <h3>{{ layer.title }}</h3>
      <p>{{ layer.summary }}</p>
    </section>

    <section
      v-for="section in sections"
      :key="section.id"
      class="section-card"
    >
      <button class="section-header" @click="toggle(section.id)">
        <span>{{ section.title }}</span>
        <span class="toggle-mark">{{ expanded[section.id] ? '−' : '+' }}</span>
      </button>

      <div v-if="expanded[section.id]" class="section-body">
        <div v-if="section.id === 'concepts'" class="item-grid">
          <article v-for="item in layer.concepts" :key="item.title" class="info-item">
            <h4>{{ item.title }}</h4>
            <p>{{ item.description }}</p>
          </article>
        </div>

        <div v-else-if="section.id === 'protocols'" class="item-grid">
          <article v-for="protocol in layer.protocols" :key="protocol.name" class="info-item">
            <h4>{{ protocol.name }}</h4>
            <p>{{ protocol.description }}</p>
            <div v-if="protocol.examples?.length" class="tags">
              <span v-for="example in protocol.examples" :key="example" class="tag">
                {{ example }}
              </span>
            </div>
          </article>
        </div>

        <div v-else-if="section.id === 'devices'" class="item-grid">
          <article v-for="device in layer.devices" :key="device.name" class="info-item">
            <h4>{{ device.name }}</h4>
            <p>{{ device.role }}</p>
          </article>
        </div>

        <div v-else-if="section.id === 'encapsulation'" class="encapsulation">
          <form v-if="!isBuiltin" class="inline-form" @submit.prevent="updateEncapsulation">
            <input v-model.trim="forms.encapsulation.pdu" type="text" placeholder="PDU 名称" />
            <input v-model.trim="forms.encapsulation.nextLayer" type="text" placeholder="下一层" />
            <button type="submit" :disabled="submitting">更新封装信息</button>
          </form>

          <div class="pdu-card">
            <span class="pdu-label">PDU</span>
            <strong>{{ layer.encapsulation.pdu }}</strong>
          </div>
          <div class="field-list">
            <span
              v-for="field in layer.encapsulation.headerFields"
              :key="field"
              class="field-chip"
            >
              {{ field }}
            </span>
          </div>
          <p class="next-layer">向下交付：{{ layer.encapsulation.nextLayer }}</p>

          <form v-if="!isBuiltin" class="inline-form compact" @submit.prevent="addHeaderField">
            <input v-model.trim="forms.headerField.field" type="text" placeholder="新增封装字段" />
            <button type="submit" :disabled="submitting">添加字段</button>
          </form>
        </div>

        <div v-else-if="section.id === 'collaboration'" class="collaboration-list">
          <div v-for="item in layer.collaboration" :key="item.targetLayer" class="collaboration-item">
            <strong>{{ item.targetLayer }}</strong>
            <p>{{ item.description }}</p>
          </div>
        </div>

        <form v-if="!isBuiltin && section.id !== 'encapsulation'" class="inline-form" @submit.prevent="addSectionItem(section.id)">
          <template v-if="section.id === 'concepts'">
            <input v-model.trim="forms.concepts.title" type="text" placeholder="概念标题" />
            <textarea v-model.trim="forms.concepts.description" rows="2" placeholder="概念描述"></textarea>
          </template>

          <template v-else-if="section.id === 'protocols'">
            <input v-model.trim="forms.protocols.name" type="text" placeholder="协议名称" />
            <textarea v-model.trim="forms.protocols.description" rows="2" placeholder="协议描述"></textarea>
            <input v-model.trim="forms.protocols.examples" type="text" placeholder="示例，用逗号分隔" />
          </template>

          <template v-else-if="section.id === 'devices'">
            <input v-model.trim="forms.devices.name" type="text" placeholder="设备/组件名称" />
            <textarea v-model.trim="forms.devices.role" rows="2" placeholder="作用"></textarea>
          </template>

          <template v-else-if="section.id === 'collaboration'">
            <input v-model.trim="forms.collaboration.targetLayer" type="text" placeholder="目标层级" />
            <textarea v-model.trim="forms.collaboration.description" rows="2" placeholder="协作描述"></textarea>
          </template>

          <button type="submit" :disabled="submitting">添加{{ section.title }}</button>
        </form>

        <p v-if="error && activeSection === section.id" class="error-text">{{ error }}</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import {
  addKnowledgeLayerHeaderField,
  addKnowledgeLayerItem,
  updateKnowledgeLibraryLayer
} from '../services/knowledgeApi.js'

const props = defineProps({
  libraryId: {
    type: String,
    required: true
  },
  layer: {
    type: Object,
    required: true
  },
  isBuiltin: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['layer-updated'])

const sections = [
  { id: 'concepts', title: '核心概念' },
  { id: 'protocols', title: '典型协议' },
  { id: 'devices', title: '相关设备/组件' },
  { id: 'encapsulation', title: '数据封装' },
  { id: 'collaboration', title: '层间协作关系' }
]

const expanded = reactive({
  concepts: true,
  protocols: true,
  devices: true,
  encapsulation: true,
  collaboration: true
})

const forms = reactive({
  concepts: { title: '', description: '' },
  protocols: { name: '', description: '', examples: '' },
  devices: { name: '', role: '' },
  collaboration: { targetLayer: '', description: '' },
  encapsulation: { pdu: '', nextLayer: '' },
  headerField: { field: '' }
})
const submitting = ref(false)
const error = ref('')
const activeSection = ref('')

const resetForms = () => {
  forms.concepts = { title: '', description: '' }
  forms.protocols = { name: '', description: '', examples: '' }
  forms.devices = { name: '', role: '' }
  forms.collaboration = { targetLayer: '', description: '' }
  forms.encapsulation = {
    pdu: props.layer.encapsulation?.pdu || '',
    nextLayer: props.layer.encapsulation?.nextLayer || ''
  }
  forms.headerField = { field: '' }
}

const sectionPayload = section => {
  if (section === 'protocols') {
    return {
      name: forms.protocols.name,
      description: forms.protocols.description,
      examples: forms.protocols.examples.split(/[，,\n]/).map(example => example.trim()).filter(Boolean)
    }
  }

  return { ...forms[section] }
}

const addSectionItem = async section => {
  activeSection.value = section
  error.value = ''
  submitting.value = true

  try {
    const layer = await addKnowledgeLayerItem(props.libraryId, props.layer.id, section, sectionPayload(section))
    emit('layer-updated', layer)
    resetForms()
  } catch (err) {
    error.value = err.message || '添加知识字段失败'
  } finally {
    submitting.value = false
  }
}

const updateEncapsulation = async () => {
  activeSection.value = 'encapsulation'
  error.value = ''
  submitting.value = true

  try {
    const layer = await updateKnowledgeLibraryLayer(props.libraryId, props.layer.id, {
      encapsulation: {
        pdu: forms.encapsulation.pdu,
        nextLayer: forms.encapsulation.nextLayer
      }
    })
    emit('layer-updated', layer)
  } catch (err) {
    error.value = err.message || '更新封装信息失败'
  } finally {
    submitting.value = false
  }
}

const addHeaderField = async () => {
  activeSection.value = 'encapsulation'
  error.value = ''
  submitting.value = true

  try {
    const layer = await addKnowledgeLayerHeaderField(props.libraryId, props.layer.id, forms.headerField.field)
    emit('layer-updated', layer)
    forms.headerField.field = ''
  } catch (err) {
    error.value = err.message || '添加封装字段失败'
  } finally {
    submitting.value = false
  }
}

const toggle = (id) => {
  expanded[id] = !expanded[id]
}

watch(() => props.layer.id, () => {
  sections.forEach(section => {
    expanded[section.id] = true
  })
  error.value = ''
  activeSection.value = ''
  resetForms()
})

watch(() => props.layer.encapsulation, () => {
  forms.encapsulation = {
    pdu: props.layer.encapsulation?.pdu || '',
    nextLayer: props.layer.encapsulation?.nextLayer || ''
  }
}, { immediate: true })
</script>

<style scoped>
.layer-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing);
}

.summary-card,
.section-card {
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
}

.summary-card {
  padding: var(--spacing);
}

.layer-order {
  font-size: 12px;
  color: var(--primary-color);
  margin-bottom: 8px;
  font-weight: 500;
}

.summary-card h3 {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 12px;
}

.summary-card p {
  color: var(--muted-text-color);
  line-height: 1.5;
}

.section-header {
  width: 100%;
  padding: 16px var(--spacing);
  border: none;
  background: var(--subtle-bg-color);
  color: var(--text-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--font-family);
  line-height: 1.5;
}

.toggle-mark {
  color: var(--primary-color);
  font-size: 20px;
  line-height: 1;
}

.section-body {
  padding: var(--spacing);
  border-top: 1px solid var(--border-color);
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.info-item {
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-color);
}

.info-item h4 {
  font-size: 15px;
  color: var(--text-color);
  margin-bottom: 8px;
}

.info-item p,
.collaboration-item p,
.next-layer {
  font-size: 13px;
  color: var(--muted-text-color);
  line-height: 1.5;
}

.tags,
.field-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.tag,
.field-chip {
  padding: 3px 8px;
  background: var(--active-bg-color);
  color: var(--primary-color);
  border-radius: var(--border-radius);
  font-size: 12px;
}

.encapsulation {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pdu-card {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.pdu-label {
  font-size: 12px;
  color: var(--muted-text-color);
}

.pdu-card strong {
  color: var(--primary-color);
  font-size: 18px;
}

.collaboration-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.collaboration-item {
  padding: 14px 16px;
  background: var(--subtle-bg-color);
  border-left: 2px solid var(--primary-color);
  border-radius: var(--border-radius);
}

.collaboration-item strong {
  display: block;
  margin-bottom: 6px;
  color: var(--text-color);
}

.inline-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--border-color);
}

.inline-form.compact {
  flex-direction: row;
  align-items: flex-start;
}

.inline-form input,
.inline-form textarea {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-color);
  font-family: var(--font-family);
  font-size: 13px;
  line-height: 1.5;
  resize: vertical;
}

.inline-form input:focus,
.inline-form textarea:focus {
  outline: none;
  border-color: var(--primary-color);
}

.inline-form button {
  align-self: flex-start;
  padding: 8px 14px;
  border: 1px solid var(--primary-color);
  border-radius: var(--border-radius);
  background: var(--primary-color);
  color: white;
  cursor: pointer;
  font-family: var(--font-family);
  line-height: 1.5;
}

.inline-form button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.error-text {
  margin-top: 12px;
  color: #C84040;
  font-size: 13px;
}
</style>
