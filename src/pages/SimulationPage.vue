<template>
  <SplitLayout
    title="综合网络场景模拟"
    :items="simulationItems"
    :current-id="currentId"
    @back="$emit('back')"
    @select="currentId = $event"
  >
    <div v-if="loading" class="content-area">
      <div class="placeholder">加载中...</div>
    </div>

    <div v-else-if="error" class="content-area">
      <div class="placeholder">
        <p>{{ error }}</p>
        <button class="retry-btn" @click="loadSimulations">重试</button>
      </div>
    </div>

    <div v-else-if="simulationLoading" class="content-area">
      <div class="placeholder">正在加载场景数据...</div>
    </div>

    <div v-else-if="simulationError" class="content-area">
      <div class="placeholder">
        <p>{{ simulationError }}</p>
        <button class="retry-btn" @click="loadSimulationData(currentId)">重试</button>
      </div>
    </div>

    <div v-else-if="currentComponent && currentSimulation" class="simulation-wrapper">
      <component :is="currentComponent" :animation-data="currentSimulation" />
    </div>

    <div v-else class="content-area">
      <div class="content-header">
        <h3>{{ currentItem?.title || '暂无场景数据' }}</h3>
      </div>
      <div class="content-body">
        <div class="placeholder">
          <p>{{ currentItem?.description || '请稍后重试' }}</p>
          <p style="color: #999; margin-top: 16px;">
            场景模拟区域 - 待填充
          </p>
        </div>
      </div>
    </div>
  </SplitLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import SplitLayout from '../components/SplitLayout.vue'
import WebAccessSimulation from './WebAccessSimulation.vue'
import { fetchSimulation, fetchSimulations } from '../services/simulationApi.js'

const componentMap = {
  'web-access': WebAccessSimulation
}

const simulationItems = ref([])
const currentId = ref('')
const simulationCache = ref({})
const loading = ref(false)
const error = ref('')
const simulationLoading = ref(false)
const simulationError = ref('')

const currentItem = computed(() =>
  simulationItems.value.find(item => item.id === currentId.value)
)

const currentComponent = computed(() => componentMap[currentId.value] || null)
const currentSimulation = computed(() => simulationCache.value[currentId.value] || null)

const loadSimulationData = async (id) => {
  if (!id || Object.prototype.hasOwnProperty.call(simulationCache.value, id)) return

  simulationLoading.value = true
  simulationError.value = ''

  try {
    const simulation = await fetchSimulation(id)
    simulationCache.value = {
      ...simulationCache.value,
      [id]: simulation
    }
  } catch (err) {
    simulationError.value = err.message || '场景数据加载失败'
  } finally {
    simulationLoading.value = false
  }
}

const loadSimulations = async () => {
  loading.value = true
  error.value = ''

  try {
    simulationItems.value = await fetchSimulations()
    currentId.value = simulationItems.value[0]?.id || ''
    await loadSimulationData(currentId.value)
  } catch (err) {
    error.value = err.message || '场景列表加载失败'
  } finally {
    loading.value = false
  }
}

watch(currentId, (id) => {
  loadSimulationData(id)
})

onMounted(() => {
  loadSimulations()
})

defineEmits(['back'])
</script>

<style scoped>
.simulation-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.content-area {
  height: 100%;
}

.content-header {
  padding-bottom: 16px;
  border-bottom: 1px solid #E5E5E5;
  margin-bottom: var(--spacing);
}

.content-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

.content-body {
  min-height: 400px;
}

.placeholder {
  padding: 48px;
  text-align: center;
  color: #666;
  border: 1px dashed #E5E5E5;
  border-radius: var(--border-radius);
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
  margin-top: 16px;
}

.retry-btn:hover {
  background: var(--primary-color);
  color: white;
}
</style>
