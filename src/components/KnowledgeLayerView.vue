<template>
  <div class="layer-view">
    <section class="summary-card">
      <form v-if="summaryEditing && !isBuiltin" class="inline-form summary-form" @submit.prevent="updateSummary">
        <input v-model.trim="forms.summary.title" type="text" placeholder="页面标题" />
        <textarea v-model.trim="forms.summary.summary" rows="3" placeholder="页面摘要"></textarea>
        <div class="form-actions">
          <button type="submit" :disabled="submitting">保存摘要</button>
          <button type="button" class="secondary-btn" @click="cancelSummaryEdit">取消</button>
        </div>
        <p v-if="error && activeSection === 'summary'" class="error-text">{{ error }}</p>
      </form>

      <template v-else>
        <div class="card-toolbar" v-if="!isBuiltin">
          <button type="button" class="text-btn" @click="startSummaryEdit">编辑摘要</button>
        </div>
        <h3>{{ layer.title }}</h3>
        <p>{{ layer.summary }}</p>
      </template>
    </section>

    <section
      v-for="section in renderedSections"
      :key="section.id"
      class="section-card"
    >
      <div class="section-header-row">
        <button class="section-header" @click="toggle(section.id)">
          <span>{{ section.title }}</span>
          <span class="toggle-mark">{{ expanded[section.id] ? '−' : '+' }}</span>
        </button>
        <div v-if="!isBuiltin && section.custom" class="section-actions">
          <button type="button" @click="startSectionEdit(section)">编辑</button>
          <button type="button" @click="removeSection(section)">删除</button>
        </div>
      </div>

      <div v-if="expanded[section.id]" class="section-body">
        <form v-if="sectionEditing === section.id" class="inline-form compact-edit" @submit.prevent="saveSectionTitle(section)">
          <input v-model.trim="forms.sectionEdit.title" type="text" placeholder="section-card 标题" />
          <button type="submit" :disabled="submitting">保存</button>
          <button type="button" class="secondary-btn" @click="sectionEditing = ''">取消</button>
        </form>

        <div v-if="section.id === 'concepts'" class="item-grid">
          <article v-for="(item, index) in layer.concepts" :key="`${item.title}-${index}`" class="info-item">
            <template v-if="editingItemKey === itemKey(section.id, index)">
              <form class="inline-form item-edit-form" @submit.prevent="saveSectionItem(section, index)">
                <input v-model.trim="forms.item.title" type="text" placeholder="概念标题" />
                <textarea v-model.trim="forms.item.description" rows="2" placeholder="概念描述"></textarea>
                <div class="form-actions">
                  <button type="submit" :disabled="submitting">保存</button>
                  <button type="button" class="secondary-btn" @click="cancelItemEdit">取消</button>
                </div>
              </form>
            </template>
            <template v-else>
              <div class="card-toolbar" v-if="!isBuiltin">
                <button type="button" class="text-btn" @click="startSectionItemEdit(section, index, item)">编辑</button>
                <button type="button" class="text-btn" @click="removeSectionItem(section, index)">删除</button>
              </div>
              <h4>{{ item.title }}</h4>
              <p>{{ item.description }}</p>
            </template>
          </article>
        </div>

        <div v-else-if="section.id === 'protocols'" class="item-grid">
          <article v-for="(protocol, index) in layer.protocols" :key="`${protocol.name}-${index}`" class="info-item">
            <template v-if="editingItemKey === itemKey(section.id, index)">
              <form class="inline-form item-edit-form" @submit.prevent="saveSectionItem(section, index)">
                <input v-model.trim="forms.item.name" type="text" placeholder="协议名称" />
                <textarea v-model.trim="forms.item.description" rows="2" placeholder="协议描述"></textarea>
                <input v-model.trim="forms.item.examples" type="text" placeholder="示例，用逗号分隔" />
                <div class="form-actions">
                  <button type="submit" :disabled="submitting">保存</button>
                  <button type="button" class="secondary-btn" @click="cancelItemEdit">取消</button>
                </div>
              </form>
            </template>
            <template v-else>
              <div class="card-toolbar" v-if="!isBuiltin">
                <button type="button" class="text-btn" @click="startSectionItemEdit(section, index, protocol)">编辑</button>
                <button type="button" class="text-btn" @click="removeSectionItem(section, index)">删除</button>
              </div>
              <h4>{{ protocol.name }}</h4>
              <p>{{ protocol.description }}</p>
              <div v-if="protocol.examples?.length" class="tags">
                <span v-for="example in protocol.examples" :key="example" class="tag">
                  {{ example }}
                </span>
              </div>
            </template>
          </article>
        </div>

        <div v-else-if="section.id === 'devices'" class="item-grid">
          <article v-for="(device, index) in layer.devices" :key="`${device.name}-${index}`" class="info-item">
            <template v-if="editingItemKey === itemKey(section.id, index)">
              <form class="inline-form item-edit-form" @submit.prevent="saveSectionItem(section, index)">
                <input v-model.trim="forms.item.name" type="text" placeholder="设备/组件名称" />
                <textarea v-model.trim="forms.item.role" rows="2" placeholder="作用"></textarea>
                <div class="form-actions">
                  <button type="submit" :disabled="submitting">保存</button>
                  <button type="button" class="secondary-btn" @click="cancelItemEdit">取消</button>
                </div>
              </form>
            </template>
            <template v-else>
              <div class="card-toolbar" v-if="!isBuiltin">
                <button type="button" class="text-btn" @click="startSectionItemEdit(section, index, device)">编辑</button>
                <button type="button" class="text-btn" @click="removeSectionItem(section, index)">删除</button>
              </div>
              <h4>{{ device.name }}</h4>
              <p>{{ device.role }}</p>
            </template>
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
              v-for="(field, index) in layer.encapsulation.headerFields"
              :key="`${field}-${index}`"
              class="field-chip"
            >
              {{ field }}
              <button v-if="!isBuiltin" type="button" @click="removeHeaderField(index)">×</button>
            </span>
          </div>
          <p class="next-layer">向下交付：{{ layer.encapsulation.nextLayer }}</p>
        </div>

        <div v-else-if="section.id === 'collaboration'" class="collaboration-list">
          <div v-for="(item, index) in layer.collaboration" :key="`${item.targetLayer}-${index}`" class="collaboration-item">
            <template v-if="editingItemKey === itemKey(section.id, index)">
              <form class="inline-form item-edit-form" @submit.prevent="saveSectionItem(section, index)">
                <input v-model.trim="forms.item.targetLayer" type="text" placeholder="目标层级" />
                <textarea v-model.trim="forms.item.description" rows="2" placeholder="协作描述"></textarea>
                <div class="form-actions">
                  <button type="submit" :disabled="submitting">保存</button>
                  <button type="button" class="secondary-btn" @click="cancelItemEdit">取消</button>
                </div>
              </form>
            </template>
            <template v-else>
              <div class="card-toolbar" v-if="!isBuiltin">
                <button type="button" class="text-btn" @click="startSectionItemEdit(section, index, item)">编辑</button>
                <button type="button" class="text-btn" @click="removeSectionItem(section, index)">删除</button>
              </div>
              <strong>{{ item.targetLayer }}</strong>
              <p>{{ item.description }}</p>
            </template>
          </div>
        </div>

        <div v-else-if="section.custom" class="item-grid">
          <article v-for="(item, index) in section.items" :key="`${item.title}-${index}`" class="info-item">
            <template v-if="editingItemKey === itemKey(section.id, index)">
              <form class="inline-form item-edit-form" @submit.prevent="saveCustomSectionItem(section, index)">
                <input v-model.trim="forms.item.title" type="text" placeholder="卡片标题" />
                <textarea v-model.trim="forms.item.description" rows="2" placeholder="卡片描述"></textarea>
                <div class="form-actions">
                  <button type="submit" :disabled="submitting">保存</button>
                  <button type="button" class="secondary-btn" @click="cancelItemEdit">取消</button>
                </div>
              </form>
            </template>
            <template v-else>
              <div class="card-toolbar" v-if="!isBuiltin">
                <button type="button" class="text-btn" @click="startCustomItemEdit(section, index, item)">编辑</button>
                <button type="button" class="text-btn" @click="removeCustomSectionItem(section, index)">删除</button>
              </div>
              <h4>{{ item.title }}</h4>
              <p>{{ item.description }}</p>
            </template>
          </article>
        </div>

        <form v-if="itemAddingSection === section.id && section.id !== 'encapsulation'" class="inline-form add-item-form" @submit.prevent="addItem(section)">
          <template v-for="field in section.fields" :key="field.key">
            <textarea
              v-if="field.type === 'textarea'"
              v-model.trim="forms[section.formKey][field.key]"
              :rows="field.rows || 2"
              :placeholder="field.placeholder"
            ></textarea>
            <input
              v-else
              v-model.trim="forms[section.formKey][field.key]"
              type="text"
              :placeholder="field.placeholder"
            />
          </template>

          <div class="form-actions">
            <button type="submit" :disabled="submitting">添加{{ section.title }}</button>
            <button type="button" class="secondary-btn" @click="itemAddingSection = ''">取消</button>
          </div>
        </form>

        <form v-if="itemAddingSection === section.id && section.id === 'encapsulation'" class="inline-form add-item-form" @submit.prevent="addHeaderField">
          <input v-model.trim="forms.headerField.field" type="text" placeholder="新增封装字段" />
          <div class="form-actions">
            <button type="submit" :disabled="submitting">添加字段</button>
            <button type="button" class="secondary-btn" @click="itemAddingSection = ''">取消</button>
          </div>
        </form>

        <button
          v-if="!isBuiltin"
          type="button"
          class="section-add-btn"
          aria-label="添加卡片内容"
          @click="startAddItem(section)"
        >
          +
        </button>

        <p v-if="error && activeSection === section.id" class="error-text">{{ error }}</p>
      </div>
    </section>
    <form v-if="sectionCreating && !isBuiltin" class="floating-section-form" @submit.prevent="createSection">
      <input v-model.trim="forms.section.title" type="text" placeholder="新增 section-card 标题" />
      <div class="form-actions">
        <button type="submit" :disabled="submitting">添加</button>
        <button type="button" class="secondary-btn" @click="sectionCreating = false">取消</button>
      </div>
      <p v-if="error && activeSection === 'new-section'" class="error-text">{{ error }}</p>
    </form>

    <button
      v-if="!isBuiltin"
      type="button"
      class="floating-section-btn"
      aria-label="添加 section-card"
      @click="sectionCreating = true"
    >
      +
    </button>
  </div>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { KnowledgePageModel } from '../models/knowledgePageModel.js'
import {
  addKnowledgeLayerCustomSectionItem,
  addKnowledgeLayerHeaderField,
  addKnowledgeLayerItem,
  createKnowledgeLayerSection,
  deleteKnowledgeLayerCustomSectionItem,
  deleteKnowledgeLayerHeaderField,
  deleteKnowledgeLayerItem,
  deleteKnowledgeLayerSection,
  updateKnowledgeLayerCustomSectionItem,
  updateKnowledgeLayerItem,
  updateKnowledgeLayerSection,
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

const pageModel = computed(() => KnowledgePageModel.fromLayer(props.layer, { isBuiltin: props.isBuiltin }))
const renderedSections = computed(() => pageModel.value.sections)

const expanded = reactive({
  concepts: true,
  protocols: true,
  devices: true,
  encapsulation: true,
  collaboration: true
})

const createEmptySectionForms = () => renderedSections.value.reduce((nextForms, section) => {
  if (!section.custom && section.id !== 'encapsulation') {
    nextForms[section.id] = section.createEmptyForm()
  }
  return nextForms
}, {})

const forms = reactive({
  summary: { title: '', summary: '' },
  ...createEmptySectionForms(),
  encapsulation: { pdu: '', nextLayer: '' },
  headerField: { field: '' },
  section: { title: '' },
  sectionEdit: { title: '' },
  customItem: { title: '', description: '' },
  item: {}
})
const submitting = ref(false)
const error = ref('')
const activeSection = ref('')
const summaryEditing = ref(false)
const sectionEditing = ref('')
const sectionCreating = ref(false)
const itemAddingSection = ref('')
const editingItemKey = ref('')

const resetForms = () => {
  forms.summary = {
    title: props.layer.title || '',
    summary: props.layer.summary || ''
  }
  Object.assign(forms, createEmptySectionForms())
  forms.encapsulation = {
    pdu: props.layer.encapsulation?.pdu || '',
    nextLayer: props.layer.encapsulation?.nextLayer || ''
  }
  forms.headerField = { field: '' }
  forms.section = { title: '' }
  forms.sectionEdit = { title: '' }
  forms.customItem = { title: '', description: '' }
  forms.item = {}
}

const sectionPayload = section => section.createPayload(forms[section.formKey])

const editPayload = section => section.createPayload(forms.item)

const itemKey = (sectionId, index) => `${sectionId}:${index}`

const withSubmit = async (section, fallbackMessage, action) => {
  activeSection.value = section
  error.value = ''
  submitting.value = true

  try {
    const layer = await action()
    emit('layer-updated', layer)
    return layer
  } catch (err) {
    error.value = err.message || fallbackMessage
    return null
  } finally {
    submitting.value = false
  }
}

const addItem = async section => {
  if (section.custom) {
    const layer = await withSubmit(section.id, '添加卡片失败', () =>
      addKnowledgeLayerCustomSectionItem(props.libraryId, props.layer.id, section.id, section.createPayload(forms.customItem))
    )
    if (layer) {
      itemAddingSection.value = ''
      forms.customItem = { title: '', description: '' }
    }
    return
  }

  const layer = await withSubmit(section.id, '添加知识字段失败', () =>
    addKnowledgeLayerItem(props.libraryId, props.layer.id, section.id, sectionPayload(section))
  )
  if (layer) {
    itemAddingSection.value = ''
    resetForms()
  }
}

const updateEncapsulation = async () => {
  await withSubmit('encapsulation', '更新封装信息失败', () =>
    updateKnowledgeLibraryLayer(props.libraryId, props.layer.id, {
      encapsulation: {
        pdu: forms.encapsulation.pdu,
        nextLayer: forms.encapsulation.nextLayer
      }
    })
  )
}

const addHeaderField = async () => {
  const layer = await withSubmit('encapsulation', '添加封装字段失败', () =>
    addKnowledgeLayerHeaderField(props.libraryId, props.layer.id, forms.headerField.field)
  )
  if (layer) {
    itemAddingSection.value = ''
    forms.headerField.field = ''
  }
}

const removeHeaderField = async index => {
  await withSubmit('encapsulation', '删除封装字段失败', () =>
    deleteKnowledgeLayerHeaderField(props.libraryId, props.layer.id, index)
  )
}

const startSummaryEdit = () => {
  summaryEditing.value = true
  forms.summary = { title: props.layer.title, summary: props.layer.summary }
}

const cancelSummaryEdit = () => {
  summaryEditing.value = false
  forms.summary = { title: props.layer.title, summary: props.layer.summary }
}

const updateSummary = async () => {
  const layer = await withSubmit('summary', '更新摘要失败', () =>
    updateKnowledgeLibraryLayer(props.libraryId, props.layer.id, { ...forms.summary })
  )
  if (layer) summaryEditing.value = false
}

const createSection = async () => {
  const layer = await withSubmit('new-section', '添加 section-card 失败', () =>
    createKnowledgeLayerSection(props.libraryId, props.layer.id, { ...forms.section })
  )
  if (layer) {
    forms.section.title = ''
    sectionCreating.value = false
    const nextSection = layer.customSections?.at(-1)
    if (nextSection) expanded[nextSection.id] = true
  }
}

const startSectionEdit = section => {
  sectionEditing.value = section.id
  forms.sectionEdit.title = section.title
}

const saveSectionTitle = async section => {
  const layer = await withSubmit(section.id, '修改 section-card 失败', () =>
    updateKnowledgeLayerSection(props.libraryId, props.layer.id, section.id, { title: forms.sectionEdit.title })
  )
  if (layer) sectionEditing.value = ''
}

const removeSection = async section => {
  if (!window.confirm(`确认删除“${section.title}”？`)) return
  await withSubmit(section.id, '删除 section-card 失败', () =>
    deleteKnowledgeLayerSection(props.libraryId, props.layer.id, section.id)
  )
}

const startAddItem = section => {
  itemAddingSection.value = itemAddingSection.value === section.id ? '' : section.id
  if (section.id === 'encapsulation') {
    forms.headerField = { field: '' }
    return
  }
  forms[section.formKey] = section.createEmptyForm()
}

const startSectionItemEdit = (section, index, item) => {
  editingItemKey.value = itemKey(section.id, index)
  forms.item = section.createFormFromItem(item)
}

const startCustomItemEdit = (section, index, item) => {
  editingItemKey.value = itemKey(section.id, index)
  forms.item = section.createFormFromItem(item)
}

const cancelItemEdit = () => {
  editingItemKey.value = ''
  forms.item = {}
}

const saveSectionItem = async (section, index) => {
  const layer = await withSubmit(section.id, '修改知识卡片失败', () =>
    updateKnowledgeLayerItem(props.libraryId, props.layer.id, section.id, index, editPayload(section))
  )
  if (layer) cancelItemEdit()
}

const removeSectionItem = async (section, index) => {
  await withSubmit(section.id, '删除知识卡片失败', () =>
    deleteKnowledgeLayerItem(props.libraryId, props.layer.id, section.id, index)
  )
}

const saveCustomSectionItem = async (section, index) => {
  const layer = await withSubmit(section.id, '修改卡片失败', () =>
    updateKnowledgeLayerCustomSectionItem(props.libraryId, props.layer.id, section.id, index, section.createPayload(forms.item))
  )
  if (layer) cancelItemEdit()
}

const removeCustomSectionItem = async (section, index) => {
  await withSubmit(section.id, '删除卡片失败', () =>
    deleteKnowledgeLayerCustomSectionItem(props.libraryId, props.layer.id, section.id, index)
  )
}

const toggle = (id) => {
  expanded[id] = !expanded[id]
}

watch(() => props.layer.id, () => {
  renderedSections.value.forEach(section => {
    expanded[section.id] = true
  })
  error.value = ''
  activeSection.value = ''
  summaryEditing.value = false
  sectionEditing.value = ''
  sectionCreating.value = false
  itemAddingSection.value = ''
  editingItemKey.value = ''
  resetForms()
})

watch(() => props.layer.customSections, sections => {
  ;(sections || []).forEach(section => {
    if (expanded[section.id] === undefined) expanded[section.id] = true
  })
}, { immediate: true })

watch(() => props.layer.encapsulation, () => {
  forms.encapsulation = {
    pdu: props.layer.encapsulation?.pdu || '',
    nextLayer: props.layer.encapsulation?.nextLayer || ''
  }
}, { immediate: true })

watch(() => [props.layer.title, props.layer.summary], () => {
  forms.summary = {
    title: props.layer.title || '',
    summary: props.layer.summary || ''
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

.section-card {
  position: relative;
}

.section-header-row {
  display: flex;
  background: var(--subtle-bg-color);
}

.section-header {
  flex: 1;
  padding: 16px var(--spacing);
  border: none;
  background: transparent;
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

.section-actions,
.card-toolbar,
.form-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.section-actions {
  padding-right: 16px;
}

.section-actions button,
.text-btn,
.secondary-btn {
  border: 1px solid var(--border-color);
  background: var(--bg-color);
  color: var(--muted-text-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-family: var(--font-family);
  font-size: 12px;
  line-height: 1.5;
  padding: 4px 8px;
}

.card-toolbar {
  justify-content: flex-end;
  margin-bottom: 8px;
}

.toggle-mark {
  color: var(--primary-color);
  font-size: 20px;
  line-height: 1;
}

.section-body {
  position: relative;
  padding: var(--spacing);
  padding-bottom: 56px;
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

.field-chip button {
  margin-left: 6px;
  border: none;
  background: transparent;
  color: var(--primary-color);
  cursor: pointer;
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

.summary-form,
.item-edit-form,
.compact-edit {
  margin-top: 0;
  padding-top: 0;
  border-top: none;
}

.inline-form.compact,
.compact-edit {
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

.inline-form button.secondary-btn,
.secondary-btn {
  background: var(--bg-color);
  color: var(--muted-text-color);
  border-color: var(--border-color);
}

.inline-form button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.section-add-btn,
.floating-section-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border-color);
  border-radius: 999px;
  background: var(--bg-color);
  color: var(--primary-color);
  cursor: pointer;
  font-family: var(--font-family);
  line-height: 1;
}

.section-add-btn {
  position: absolute;
  right: 16px;
  bottom: 16px;
  width: 32px;
  height: 32px;
  background: var(--active-bg-color);
  opacity: 0.78;
  font-size: 18px;
}

.section-add-btn:hover,
.floating-section-btn:hover {
  border-color: var(--primary-color);
  opacity: 1;
}

.floating-section-btn {
  position: fixed;
  right: 32px;
  bottom: 32px;
  z-index: 20;
  width: 52px;
  height: 52px;
  background: var(--primary-color);
  color: white;
  font-size: 28px;
}

.floating-section-form {
  position: fixed;
  right: 32px;
  bottom: 96px;
  z-index: 20;
  width: min(320px, calc(100vw - 64px));
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-color);
}

.add-item-form {
  margin-bottom: 16px;
}

.floating-section-form input {
  width: 100%;
  padding: 8px 10px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  color: var(--text-color);
  font-family: var(--font-family);
  font-size: 13px;
  line-height: 1.5;
}

.floating-section-form .form-actions {
  margin-top: 10px;
}

.floating-section-form button {
  padding: 8px 14px;
  border: 1px solid var(--primary-color);
  border-radius: var(--border-radius);
  background: var(--primary-color);
  color: white;
  cursor: pointer;
  font-family: var(--font-family);
}

.floating-section-form button.secondary-btn {
  background: var(--bg-color);
  color: var(--muted-text-color);
  border-color: var(--border-color);
}

.error-text {
  margin-top: 12px;
  color: #C84040;
  font-size: 13px;
}
</style>
