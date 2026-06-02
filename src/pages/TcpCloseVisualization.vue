<template>
  <div class="tcp-close">
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

      <!-- 状态说明 -->
      <div class="state-info">
        <div class="state-row">
          <span class="state-label">主动关闭方:</span>
          <span class="state-value" :style="{ color: nodeStates.active?.color }">
            {{ nodeStates.active?.state || 'ESTABLISHED' }}
          </span>
        </div>
        <div class="state-row">
          <span class="state-label">被动关闭方:</span>
          <span class="state-value" :style="{ color: nodeStates.passive?.color }">
            {{ nodeStates.passive?.state || 'ESTABLISHED' }}
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
        <!-- 报文详情 -->
        <div v-if="currentStep?.data?.packet" class="packet-details">
          <h4 class="details-title">TCP报文段</h4>
          <table class="details-table">
            <tbody>
              <tr>
                <td class="label">序号 (SEQ)</td>
                <td class="value">{{ currentStep.data.packet.seq }}</td>
              </tr>
              <tr>
                <td class="label">确认号 (ACK)</td>
                <td class="value">{{ currentStep.data.packet.ack }}</td>
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

        <!-- 状态转换说明 -->
        <div v-if="currentStep?.data?.stateChange" class="state-change-info">
          <h4 class="details-title">状态转换</h4>
          <div class="state-transition">
            <span class="from-state">{{ currentStep.data.stateChange.from }}</span>
            <span class="arrow">→</span>
            <span class="to-state">{{ currentStep.data.stateChange.to }}</span>
          </div>
          <p class="state-reason">{{ currentStep.data.stateChange.reason }}</p>
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
.tcp-close {
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

.state-info {
  display: flex;
  gap: 32px;
  padding: 12px 16px;
  background: #F5F5F5;
  border-radius: var(--border-radius);
}

.state-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.state-label {
  font-size: 13px;
  color: #666;
}

.state-value {
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
  font-family: monospace;
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

.state-change-info {
  margin-top: 16px;
  padding: 16px;
  background: #F0F7FF;
  border-radius: var(--border-radius);
  border-left: 3px solid var(--primary-color);
}

.state-transition {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.from-state, .to-state {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  font-family: monospace;
}

.arrow {
  font-size: 18px;
  color: var(--primary-color);
}

.state-reason {
  font-size: 13px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}
</style>
