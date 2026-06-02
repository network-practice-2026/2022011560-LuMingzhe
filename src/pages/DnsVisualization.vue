<template>
  <div class="dns-visualization">
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

      <!-- 查询路径说明 -->
      <div class="query-path">
        <span class="path-label">当前查询:</span>
        <span class="path-value">{{ currentQuery }}</span>
      </div>
    </div>

    <!-- 信息面板 -->
    <InfoPanel
      :step-title="currentStep?.title"
      :step-description="currentStep?.description"
      :step-number="displayStepNumber"
    >
      <template #extra>
        <!-- DNS报文详情 -->
        <div v-if="currentStep?.data?.dnsPacket" class="packet-details">
          <h4 class="details-title">DNS查询报文</h4>
          <table class="details-table">
            <tbody>
              <tr>
                <td class="label">查询类型</td>
                <td class="value">{{ currentStep.data.dnsPacket.queryType }}</td>
              </tr>
              <tr>
                <td class="label">查询域名</td>
                <td class="value">{{ currentStep.data.dnsPacket.domain }}</td>
              </tr>
              <tr>
                <td class="label">记录类型</td>
                <td class="value">{{ currentStep.data.dnsPacket.recordType }}</td>
              </tr>
              <tr v-if="currentStep.data.dnsPacket.response">
                <td class="label">响应IP</td>
                <td class="value">{{ currentStep.data.dnsPacket.response }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 缓存信息 -->
        <div v-if="currentStep?.data?.cacheInfo" class="cache-info">
          <h4 class="details-title">缓存信息</h4>
          <p class="cache-text">{{ currentStep.data.cacheInfo }}</p>
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

// 显示的步骤编号
const displayStepNumber = computed(() => {
  return isAtStart.value ? null : currentStepIndex.value + 1
})

// 当前查询域名
const currentQuery = computed(() => {
  return currentStep.value?.data?.dnsPacket?.domain || 'www.example.com'
})

// 计算节点位置
const nodePositions = computed(() => {
  // 依赖 viewVersion，当画布拖动时触发重新计算
  viewVersion.value
  const positions = {}
  const topology = props.animationData.topology

  if (!topology || !topologyWrapper.value) return positions

  const wrapperRect = topologyWrapper.value.getBoundingClientRect()
  const scaleX = wrapperRect.width / 700
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
.dns-visualization {
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

.query-path {
  padding: 12px 16px;
  background: #F0F7FF;
  border-radius: var(--border-radius);
  border-left: 3px solid var(--primary-color);
}

.path-label {
  font-size: 13px;
  color: #666;
  margin-right: 8px;
}

.path-value {
  font-size: 14px;
  font-weight: 600;
  color: var(--primary-color);
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

.cache-info {
  margin-top: 16px;
  padding: 12px;
  background: #F5F5F5;
  border-radius: var(--border-radius);
}

.cache-text {
  font-size: 13px;
  color: #666;
  line-height: 1.6;
  margin: 0;
}
</style>
