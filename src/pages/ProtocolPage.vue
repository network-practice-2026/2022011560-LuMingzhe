<template>
  <SplitLayout
    title="协议原理可视化"
    :items="protocolItems"
    :current-id="currentProtocolId"
    @back="$emit('back')"
    @select="currentProtocolId = $event"
  >
    <div v-if="loading" class="protocol-placeholder">
      <p>加载中...</p>
    </div>

    <div v-else-if="error" class="protocol-placeholder">
      <p>{{ error }}</p>
      <button class="retry-btn" @click="loadProtocols">重试</button>
    </div>

    <div v-else-if="animationLoading" class="protocol-placeholder">
      <p>正在加载可视化数据...</p>
    </div>

    <div v-else-if="animationError" class="protocol-placeholder">
      <p>{{ animationError }}</p>
      <button class="retry-btn" @click="loadProtocolAnimation(currentProtocolId)">重试</button>
    </div>

    <div v-else-if="currentComponent && currentAnimation" class="protocol-wrapper">
      <component :is="currentComponent" :animation-data="currentAnimation" />
    </div>

    <div v-else class="protocol-placeholder">
      <h3>{{ currentItem?.title || '暂无协议数据' }}</h3>
      <p>{{ currentItem?.description || '请稍后重试' }}</p>
      <p class="placeholder-note">该协议的可视化正在开发中...</p>
    </div>
  </SplitLayout>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import SplitLayout from '../components/SplitLayout.vue'
import DnsVisualization from './DnsVisualization.vue'
import TcpHandshakeVisualization from './TcpHandshakeVisualization.vue'
import TcpCloseVisualization from './TcpCloseVisualization.vue'
import HttpVisualization from './HttpVisualization.vue'
import ArpVisualization from './ArpVisualization.vue'
import { fetchProtocol, fetchProtocols } from '../services/protocolApi.js'

const componentMap = {
  dns: DnsVisualization,
  'tcp-handshake': TcpHandshakeVisualization,
  'tcp-close': TcpCloseVisualization,
  'http-request': HttpVisualization,
  arp: ArpVisualization
}

const protocolItems = ref([])
const currentProtocolId = ref('')
const animationCache = ref({})
const loading = ref(false)
const error = ref('')
const animationLoading = ref(false)
const animationError = ref('')

const currentItem = computed(() =>
  protocolItems.value.find(item => item.id === currentProtocolId.value)
)

const currentComponent = computed(() => componentMap[currentProtocolId.value] || null)
const currentAnimation = computed(() => animationCache.value[currentProtocolId.value] || null)

const loadProtocolAnimation = async (id) => {
  if (!id || animationCache.value[id]) return

  animationLoading.value = true
  animationError.value = ''

  try {
    const protocol = await fetchProtocol(id)
    animationCache.value = {
      ...animationCache.value,
      [id]: protocol
    }
  } catch (err) {
    animationError.value = err.message || '协议可视化数据加载失败'
  } finally {
    animationLoading.value = false
  }
}

const loadProtocols = async () => {
  loading.value = true
  error.value = ''

  try {
    protocolItems.value = await fetchProtocols()
    currentProtocolId.value = protocolItems.value[0]?.id || ''
    await loadProtocolAnimation(currentProtocolId.value)
  } catch (err) {
    error.value = err.message || '协议列表加载失败'
  } finally {
    loading.value = false
  }
}

watch(currentProtocolId, (id) => {
  loadProtocolAnimation(id)
})

onMounted(() => {
  loadProtocols()
})

defineEmits(['back'])
</script>

<style scoped>
.protocol-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.protocol-placeholder {
  padding: 48px;
  text-align: center;
}

.protocol-placeholder h3 {
  font-size: 20px;
  color: var(--text-color);
  margin-bottom: 16px;
}

.protocol-placeholder p {
  color: #666;
  margin-bottom: 24px;
  line-height: 1.6;
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

.placeholder-note {
  color: #999;
  font-size: 14px;
  padding: 24px;
  border: 1px dashed #E5E5E5;
  border-radius: var(--border-radius);
}
</style>
