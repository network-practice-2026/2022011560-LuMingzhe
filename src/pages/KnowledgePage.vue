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
        @select="activeTab = $event"
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
        :layer="currentLayer"
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
  fetchKnowledgeLibraries,
  fetchKnowledgeLibraryGraph,
  fetchKnowledgeLibraryLayer,
  fetchKnowledgeLibraryLayers,
  fetchKnowledgeLibraryTabs
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
