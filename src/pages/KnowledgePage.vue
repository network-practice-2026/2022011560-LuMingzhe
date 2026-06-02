<template>
  <SplitLayout
    title="计算机网络知识图库"
    :items="knowledgeItems"
    :current-id="currentId"
    @back="$emit('back')"
    @select="currentId = $event"
  >
    <div class="knowledge-page">
      <div class="content-header">
        <h3>TCP/IP 五层模型知识库</h3>
        <p>围绕应用层、传输层、网络层、数据链路层、物理层组织核心概念、协议、设备和封装过程。</p>
      </div>

      <KnowledgeTabs
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
  </SplitLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import SplitLayout from '../components/SplitLayout.vue'
import KnowledgeTabs from '../components/KnowledgeTabs.vue'
import KnowledgeLayerView from '../components/KnowledgeLayerView.vue'
import KnowledgeGraphView from '../components/KnowledgeGraphView.vue'
import {
  fetchKnowledgeGraph,
  fetchKnowledgeLayer,
  fetchKnowledgeLayers
} from '../services/knowledgeApi.js'

const knowledgeItems = [
  {
    id: 'tcp-ip-knowledge',
    title: 'TCP/IP 五层模型',
    description: '分层学习核心概念、协议、设备、封装与协作关系'
  }
]

const layerTabs = [
  { id: 'application', title: '应用层' },
  { id: 'transport', title: '传输层' },
  { id: 'network', title: '网络层' },
  { id: 'data-link', title: '数据链路层' },
  { id: 'physical', title: '物理层' }
]

const tabs = [
  ...layerTabs,
  { id: 'graph', title: '知识图谱' }
]

const currentId = ref('tcp-ip-knowledge')
const activeTab = ref('application')
const layers = ref([])
const layerCache = ref({})
const graphData = ref(null)
const loading = ref(false)
const error = ref('')

const currentLayer = computed(() => layerCache.value[activeTab.value] || null)

const loadLayers = async () => {
  if (layers.value.length > 0) return
  layers.value = await fetchKnowledgeLayers()
}

const loadLayer = async (id) => {
  if (layerCache.value[id]) return
  const layer = await fetchKnowledgeLayer(id)
  layerCache.value = {
    ...layerCache.value,
    [id]: layer
  }
}

const loadGraph = async () => {
  if (graphData.value) return
  graphData.value = await fetchKnowledgeGraph()
}

const loadActiveTab = async () => {
  loading.value = true
  error.value = ''

  try {
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

watch(activeTab, () => {
  loadActiveTab()
})

onMounted(() => {
  loadActiveTab()
})

defineEmits(['back'])
</script>

<style scoped>
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
