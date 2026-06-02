<template>
  <div class="http-visualization">
    <!-- 可视化区域 -->
    <div class="visualization-area">
      <div ref="topologyWrapper" class="topology-wrapper">
        <NetworkTopology
          v-if="animationData?.topology?.nodes?.length"
          ref="networkRef"
          :nodes="animationData.topology.nodes"
          :edges="animationData.topology.edges"
          :node-states="nodeStates"
          @node-click="handleNodeClick"
          @view-change="handleViewChange"
        />

        <!-- 数据包动画层 -->
        <PacketAnimator
          v-if="Object.keys(nodePositions).length > 0"
          :packets="currentPackets"
          :node-positions="nodePositions"
          :node-states="nodeStates"
          :progress="100"
          :show-node-states="false"
        />
      </div>

      <!-- 连接状态 -->
      <div class="connection-status">
        <span class="status-label">连接状态:</span>
        <span class="status-value" :class="connectionStateClass">
          {{ connectionState }}
        </span>
      </div>
    </div>

    <!-- 信息面板 -->
    <InfoPanel
      :step-title="currentStep?.title"
      :step-description="currentStep?.description"
      :step-number="displayStepNumber"
    >
      <template #extra>
        <!-- HTTP报文详情 -->
        <div v-if="currentStep?.data?.httpPacket" class="http-details">
          <h4 class="details-title">HTTP {{ currentStep.data.httpPacket.type }}</h4>

          <!-- 请求行/状态行 -->
          <div class="http-line">
            <code>{{ currentStep.data.httpPacket.startLine }}</code>
          </div>

          <!-- 首部字段 -->
          <div class="headers-section">
            <h5 class="section-title">首部字段</h5>
            <table class="headers-table">
              <tbody>
                <tr v-for="(value, key) in currentStep.data.httpPacket.headers" :key="key">
                  <td class="header-name">{{ key }}</td>
                  <td class="header-value">{{ value }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 消息体 -->
          <div v-if="currentStep.data.httpPacket.body" class="body-section">
            <h5 class="section-title">消息体</h5>
            <pre class="body-content">{{ currentStep.data.httpPacket.body }}</pre>
          </div>
        </div>

        <!-- 时序说明 -->
        <div v-if="currentStep?.data?.timing" class="timing-info">
          <h4 class="details-title">时序信息</h4>
          <p class="timing-text">{{ currentStep.data.timing }}</p>
        </div>
      </template>
    </InfoPanel>

    <!-- 步骤控制器 -->
    <StepController
      :current-step-index="currentStepIndex"
      :total-steps="totalSteps"
      :has-next="hasNext"
      :has-prev="hasPrev"
      :is-at-start="isAtStart"
      :is-at-end="isAtEnd"
      @next="next"
      @prev="prev"
      @reset="reset"
      @goto="goto"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import NetworkTopology from '../components/NetworkTopology.vue'
import PacketAnimator from '../components/PacketAnimator.vue'
import InfoPanel from '../components/InfoPanel.vue'
import StepController from '../components/StepController.vue'
import { useAnimationState } from '../composables/useAnimationState.js'

const props = defineProps({
  animationData: {
    type: Object,
    required: true
  }
})

const networkRef = ref(null)
const viewVersion = ref(0)

const handleViewChange = () => {
  viewVersion.value++
}
const topologyWrapper = ref(null)

const animationDataRef = computed(() => props.animationData)
const {
  currentStepIndex,
  currentStep,
  totalSteps,
  hasNext,
  hasPrev,
  isAtStart,
  isAtEnd,
  currentPackets,
  next,
  prev,
  reset,
  goto,
  computeNodeStates
} = useAnimationState(animationDataRef)

const nodeStates = computed(() => computeNodeStates())

const displayStepNumber = computed(() => {
  return isAtStart.value ? null : currentStepIndex.value + 1
})

// 连接状态
const connectionState = computed(() => {
  if (isAtStart.value) return '未连接'
  if (currentStep.value?.data?.connected) return '已连接'
  return '连接中'
})

const connectionStateClass = computed(() => {
  if (isAtStart.value) return 'disconnected'
  if (currentStep.value?.data?.connected) return 'connected'
  return 'connecting'
})

const nodePositions = computed(() => {
  // 依赖 viewVersion，当画布拖动时触发重新计算
  viewVersion.value
  const positions = {}
  const topology = props.animationData.topology

  if (!topology || !topologyWrapper.value) return positions

  const wrapperRect = topologyWrapper.value.getBoundingClientRect()
  const scaleX = wrapperRect.width / 600
  const scaleY = wrapperRect.height / 400

  topology.nodes.forEach(node => {
    positions[node.id] = {
      x: (node.x || 0) * scaleX,
      y: (node.y || 0) * scaleY
    }
  })

  return positions
})

const handleNodeClick = (nodeId) => {
  console.log('Node clicked:', nodeId)
}

onMounted(() => {
  nextTick(() => {
    if (isAtStart.value) {
      next()
    }
  })
})
</script>

<style scoped>
.http-visualization {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 24px;
  padding-bottom: 80px; /* 为浮动控制器预留空间 */
}

.visualization-area {
  flex: 1;
  min-height: 300px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.topology-wrapper {
  position: relative;
  flex: 1;
  min-height: 250px;
}

.topology-wrapper :deep(.network-topology) {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.connection-status {
  padding: 12px 16px;
  background: #F5F5F5;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-label {
  font-size: 13px;
  color: #666;
}

.status-value {
  font-size: 13px;
  font-weight: 600;
  font-family: monospace;
}

.status-value.connected {
  color: #67C23A;
}

.status-value.connecting {
  color: #E6A23C;
}

.status-value.disconnected {
  color: #999;
}

.http-details {
  margin-bottom: 16px;
}

.details-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 12px;
}

.http-line {
  padding: 12px;
  background: #F5F5F5;
  border-radius: var(--border-radius);
  margin-bottom: 16px;
}

.http-line code {
  font-family: monospace;
  font-size: 13px;
  color: var(--text-color);
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: #666;
  margin-bottom: 8px;
  text-transform: uppercase;
}

.headers-section {
  margin-bottom: 16px;
}

.headers-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.headers-table td {
  padding: 6px 10px;
  border: 1px solid #E5E5E5;
}

.header-name {
  background: #F5F5F5;
  color: #666;
  width: 120px;
  font-weight: 500;
}

.header-value {
  color: var(--text-color);
  font-family: monospace;
}

.body-section {
  margin-top: 16px;
}

.body-content {
  padding: 12px;
  background: #F8F8F8;
  border: 1px solid #E5E5E5;
  border-radius: var(--border-radius);
  font-family: monospace;
  font-size: 12px;
  color: #333;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
  max-height: 150px;
  overflow-y: auto;
}

.timing-info {
  margin-top: 16px;
  padding: 12px;
  background: #F0F7FF;
  border-radius: var(--border-radius);
  border-left: 3px solid var(--primary-color);
}

.timing-text {
  font-size: 13px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}
</style>
