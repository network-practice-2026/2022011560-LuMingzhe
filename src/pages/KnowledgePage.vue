<template>
  <SplitLayout
    title="计算机网络知识图库"
    :items="knowledgeItems"
    :current-id="currentId"
    @back="$emit('back')"
    @select="selectLibrary"
  >
    <template #sidebar-actions>
      <button
        class="add-page-btn"
        type="button"
        aria-label="添加新的知识图库页面"
        @click="showCreateModal = true"
      >
        +
      </button>
    </template>

    <div class="knowledge-page">
      <div class="content-header">
        <h3>{{ currentItem?.title || '暂无知识库页面' }}</h3>
        <p>{{ currentItem?.description || '请稍后重试' }}</p>
      </div>

      <KnowledgeTabs
        v-if="tabs.length"
        :tabs="tabs"
        :active-id="activeTab"
        :is-builtin="Boolean(currentItem?.isBuiltin)"
        @select="activeTab = $event"
        @add-tab="handleAddTab"
        @rename-tab="handleRenameTab"
        @delete-tab="handleDeleteTab"
      />

      <div v-if="loading" class="state-box">加载中...</div>

      <div v-else-if="error" class="state-box error-box">
        <p>{{ error }}</p>
        <button class="retry-btn" @click="loadActiveTab">重试</button>
      </div>

      <KnowledgeGraphView
        v-else-if="activeTab === 'graph' && graphData"
        :graph="graphData"
        :layers="layers"
      />

      <KnowledgeLayerView
        v-else-if="currentLayer"
        :library-id="currentId"
        :layer="currentLayer"
        :is-builtin="Boolean(currentItem?.isBuiltin)"
        @layer-updated="handleLayerUpdated"
      />

      <div v-else class="state-box">暂无知识库数据</div>
    </div>

    <CreateKnowledgeLibraryModal
      v-if="showCreateModal"
      @cancel="showCreateModal = false"
      @created="handleLibraryCreated"
    />
  </SplitLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import SplitLayout from '../components/SplitLayout.vue'
import KnowledgeTabs from '../components/KnowledgeTabs.vue'
import KnowledgeLayerView from '../components/KnowledgeLayerView.vue'
import KnowledgeGraphView from '../components/KnowledgeGraphView.vue'
import CreateKnowledgeLibraryModal from '../components/CreateKnowledgeLibraryModal.vue'
import {
  createKnowledgeLibraryTab,
  deleteKnowledgeLibraryTab,
  fetchKnowledgeLibraries,
  fetchKnowledgeLibraryGraph,
  fetchKnowledgeLibraryLayer,
  fetchKnowledgeLibraryLayers,
  fetchKnowledgeLibraryTabs,
  updateKnowledgeLibraryTab
} from '../services/knowledgeApi.js'

const graphTab = { id: 'graph', title: '知识图谱' }

const knowledgeItems = ref([])
const tabs = ref([])
const currentId = ref('')
const activeTab = ref('')
const layers = ref([])
const layerCache = ref({})
const graphData = ref(null)
const loading = ref(false)
const error = ref('')
const showCreateModal = ref(false)

const currentItem = computed(() =>
  knowledgeItems.value.find(item => item.id === currentId.value)
)
const currentLayer = computed(() => layerCache.value[activeTab.value] || null)

const resetLibraryData = () => {
  tabs.value = []
  activeTab.value = ''
  layers.value = []
  layerCache.value = {}
  graphData.value = null
  error.value = ''
}

const selectLibrary = id => {
  if (currentId.value === id) return
  currentId.value = id
}

const loadKnowledgeLibraries = async () => {
  if (knowledgeItems.value.length > 0) return
  knowledgeItems.value = await fetchKnowledgeLibraries()
  currentId.value = knowledgeItems.value[0]?.id || ''
}

const loadTabs = async () => {
  if (!currentId.value || tabs.value.length > 0) return
  const libraryTabs = await fetchKnowledgeLibraryTabs(currentId.value)
  tabs.value = [...libraryTabs, graphTab]
  activeTab.value = tabs.value[0]?.id || 'graph'
}

const loadLayers = async () => {
  if (!currentId.value || layers.value.length > 0) return
  layers.value = await fetchKnowledgeLibraryLayers(currentId.value)
}

const loadLayer = async id => {
  if (!currentId.value || !id || id === 'graph' || layerCache.value[id]) return
  const layer = await fetchKnowledgeLibraryLayer(currentId.value, id)
  layerCache.value = {
    ...layerCache.value,
    [id]: layer
  }
}

const loadGraph = async () => {
  if (!currentId.value || graphData.value) return
  graphData.value = await fetchKnowledgeLibraryGraph(currentId.value)
}

const loadActiveTab = async () => {
  loading.value = true
  error.value = ''

  try {
    await loadKnowledgeLibraries()

    if (!currentId.value) return

    await loadTabs()
    await loadLayers()

    if (activeTab.value === 'graph') {
      await loadGraph()
    } else {
      await loadLayer(activeTab.value)
    }
  } catch (err) {
    error.value = err.message || '知识库数据加载失败'
  } finally {
    loading.value = false
  }
}

const handleLibraryCreated = library => {
  showCreateModal.value = false
  knowledgeItems.value = [...knowledgeItems.value, library]
  currentId.value = library.id
}

const handleAddTab = async () => {
  const title = window.prompt('请输入新页面标题')?.trim()
  if (!title || !currentId.value) return

  try {
    const { tab, layer } = await createKnowledgeLibraryTab(currentId.value, { title })
    const graph = tabs.value.find(tab => tab.id === 'graph')
    tabs.value = graph
      ? [...tabs.value.filter(tab => tab.id !== 'graph'), tab, graph]
      : [...tabs.value, tab]
    layers.value = [...layers.value, { id: layer.id, title: layer.title, order: layer.order, summary: layer.summary }]
    layerCache.value = { ...layerCache.value, [layer.id]: layer }
    activeTab.value = layer.id
  } catch (err) {
    error.value = err.message || '添加知识页面失败'
  }
}

const handleRenameTab = async tab => {
  const title = window.prompt('请输入页面标题', tab.title)?.trim()
  if (!title || title === tab.title || !currentId.value) return

  try {
    const { tab: nextTab, layer } = await updateKnowledgeLibraryTab(currentId.value, tab.id, { title })
    tabs.value = tabs.value.map(item => item.id === tab.id ? { ...item, title: nextTab.title } : item)
    handleLayerUpdated(layer)
  } catch (err) {
    error.value = err.message || '修改知识页面失败'
  }
}

const handleDeleteTab = async tab => {
  if (!currentId.value || !window.confirm(`确认删除“${tab.title}”？`)) return

  try {
    await deleteKnowledgeLibraryTab(currentId.value, tab.id)
    const index = tabs.value.findIndex(item => item.id === tab.id)
    tabs.value = tabs.value.filter(item => item.id !== tab.id)
    layers.value = layers.value.filter(item => item.id !== tab.id)
    const { [tab.id]: _removed, ...nextCache } = layerCache.value
    layerCache.value = nextCache

    if (activeTab.value === tab.id) {
      activeTab.value = tabs.value[Math.max(0, index - 1)]?.id || 'graph'
    }
  } catch (err) {
    error.value = err.message || '删除知识页面失败'
  }
}

const handleLayerUpdated = layer => {
  layerCache.value = {
    ...layerCache.value,
    [activeTab.value]: layer
  }
  layers.value = layers.value.map(item => item.id === activeTab.value
    ? { ...item, title: layer.title, summary: layer.summary }
    : item
  )
  tabs.value = tabs.value.map(item => item.id === activeTab.value
    ? { ...item, title: layer.title }
    : item
  )
}

watch(activeTab, () => {
  if (activeTab.value) {
    loadActiveTab()
  }
})

watch(currentId, () => {
  resetLibraryData()
  loadActiveTab()
})

onMounted(() => {
  loadActiveTab()
})

defineEmits(['back'])
</script>

<style scoped>
.add-page-btn {
  width: 100%;
  height: 40px;
  margin-top: 16px;
  border: 1px dashed var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-color);
  color: var(--primary-color);
  cursor: pointer;
  font-size: 22px;
  font-family: var(--font-family);
  line-height: 1;
}

.add-page-btn:hover {
  border-color: var(--primary-color);
  background: var(--active-bg-color);
}

.knowledge-page {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.content-header {
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
  margin-bottom: var(--spacing);
}

.content-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 8px;
}

.content-header p {
  font-size: 14px;
  color: var(--muted-text-color);
  line-height: 1.5;
}

.state-box {
  padding: 48px;
  text-align: center;
  color: var(--muted-text-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-color);
}

.error-box p {
  color: #C84040;
  margin-bottom: 16px;
}

.retry-btn {
  padding: 8px 16px;
  border: 1px solid var(--primary-color);
  background: var(--bg-color);
  color: var(--primary-color);
  border-radius: var(--border-radius);
  cursor: pointer;
  font-family: var(--font-family);
  line-height: 1.5;
}

.retry-btn:hover {
  background: var(--primary-color);
  color: white;
}
</style>
