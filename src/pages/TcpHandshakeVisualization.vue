<template>
  <div class="tcp-handshake">
    <!-- 调试信息 -->
    <div v-if="false" class="debug-info">
      Step: {{ currentStepIndex }}, Data: {{ animationData?.title }}
    </div>

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
          :show-node-states="true"
        />
      </div>

      <!-- 时序图说明 -->
      <div class="sequence-info">
        <div class="sequence-row">
          <span class="sequence-label">客户端状态:</span>
          <span class="sequence-value" :style="{ color: nodeStates.client?.color }">
            {{ nodeStates.client?.state || 'CLOSED' }}
          </span>
        </div>
        <div class="sequence-row">
          <span class="sequence-label">服务器状态:</span>
          <span class="sequence-value" :style="{ color: nodeStates.server?.color }">
            {{ nodeStates.server?.state || 'LISTEN' }}
          </span>
        </div>
      </div>
    </div>

    <!-- 信息面板 -->
    <InfoPanel
      :step-title="currentStep?.title"
      :step-description="currentStep?.description"
      :step-number="displayStepNumber"
    >
      <template #extra>
        <!-- 数据包详情表格 -->
        <div v-if="currentStep?.data?.packet" class="packet-details">
          <h4 class="details-title">数据包详情</h4>
          <table class="details-table">
            <tbody>
              <tr>
                <td class="label">源端口</td>
                <td class="value">{{ currentStep.data.packet.srcPort }}</td>
              </tr>
              <tr>
                <td class="label">目的端口</td>
                <td class="value">{{ currentStep.data.packet.dstPort }}</td>
              </tr>
              <tr>
                <td class="label">序号 (SEQ)</td>
                <td class="value">{{ currentStep.data.packet.seq }}</td>
              </tr>
              <tr>
                <td class="label">确认号 (ACK)</td>
                <td class="value">{{ currentStep.data.packet.ack || '-' }}</td>
              </tr>
              <tr>
                <td class="label">标志位</td>
                <td class="value">
                  <span
                    v-for="(value, flag) in currentStep.data.packet.flags"
                    :key="flag"
                    class="flag-badge"
                    :class="{ active: value }"
                  >
                    {{ flag.toUpperCase() }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
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

const emit = defineEmits(['back'])

const networkRef = ref(null)
const topologyWrapper = ref(null)
const viewVersion = ref(0)

const handleViewChange = () => {
  viewVersion.value++
}

// 使用动画状态管理
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

// 计算节点状态
const nodeStates = computed(() => computeNodeStates())

// 显示的步骤编号（从1开始）
const displayStepNumber = computed(() => {
  return isAtStart.value ? null : currentStepIndex.value + 1
})

// 计算节点在DOM中的位置（相对于topologyWrapper）
const nodePositions = computed(() => {
  // 依赖 viewVersion，当画布拖动时触发重新计算
  viewVersion.value

  const positions = {}
  const topology = props.animationData.topology

  if (!topology || !topologyWrapper.value) return positions

  const wrapperRect = topologyWrapper.value.getBoundingClientRect()

  // 计算缩放比例
  const scaleX = wrapperRect.width / 600  // 假设画布宽度为600
  const scaleY = wrapperRect.height / 400  // 假设画布高度为400

  topology.nodes.forEach(node => {
    positions[node.id] = {
      x: (node.x || 0) * scaleX,
      y: (node.y || 0) * scaleY
    }
  })

  return positions
})

// 处理节点点击
const handleNodeClick = (nodeId) => {
  console.log('Node clicked:', nodeId)
}

onMounted(() => {
  // 自动开始第一步
  nextTick(() => {
    if (isAtStart.value) {
      next()
    }
  })
})
</script>

<style scoped>
.tcp-handshake {
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

.sequence-info {
  display: flex;
  gap: 32px;
  padding: 12px 16px;
  background: #F5F5F5;
  border-radius: var(--border-radius);
}

.sequence-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sequence-label {
  font-size: 13px;
  color: #666;
}

.sequence-value {
  font-size: 13px;
  font-weight: 600;
  font-family: monospace;
}

.packet-details {
  margin-bottom: 16px;
}

.details-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 12px;
}

.details-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.details-table td {
  padding: 8px 12px;
  border: 1px solid #E5E5E5;
}

.details-table .label {
  background: #F5F5F5;
  color: #666;
  width: 100px;
  font-weight: 500;
}

.details-table .value {
  color: var(--text-color);
}

.flag-badge {
  display: inline-block;
  padding: 2px 8px;
  margin-right: 6px;
  font-size: 11px;
  font-weight: 600;
  background: #E5E5E5;
  color: #999;
  border-radius: 2px;
}

.flag-badge.active {
  background: var(--primary-color);
  color: white;
}
</style>
