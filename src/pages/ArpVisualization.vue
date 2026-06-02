<template>
  <div class="arp-visualization">
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

      <!-- ARP缓存表 -->
      <div class="arp-cache">
        <h4 class="cache-title">ARP缓存表 (主机A)</h4>
        <table class="cache-table">
          <thead>
            <tr>
              <th>IP地址</th>
              <th>MAC地址</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(entry, index) in arpCacheEntries" :key="index">
              <td class="mono">{{ entry.ip }}</td>
              <td class="mono">{{ entry.mac }}</td>
              <td>
                <span class="status-badge" :class="entry.status">{{ entry.statusText }}</span>
              </td>
            </tr>
            <tr v-if="arpCacheEntries.length === 0">
              <td colspan="3" class="empty-cell">缓存表为空</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 信息面板 -->
    <InfoPanel
      :step-title="currentStep?.title"
      :step-description="currentStep?.description"
      :step-number="displayStepNumber"
    >
      <template #extra>
        <!-- ARP报文详情 -->
        <div v-if="currentStep?.data?.arpPacket" class="arp-details">
          <h4 class="details-title">ARP报文</h4>
          <table class="details-table">
            <tbody>
              <tr>
                <td class="label">操作类型</td>
                <td class="value">
                  <span class="op-type" :class="currentStep.data.arpPacket.opType">
                    {{ currentStep.data.arpPacket.opType === 'request' ? '请求 (1)' : '响应 (2)' }}
                  </span>
                </td>
              </tr>
              <tr>
                <td class="label">发送方MAC</td>
                <td class="value mono">{{ currentStep.data.arpPacket.senderMac }}</td>
              </tr>
              <tr>
                <td class="label">发送方IP</td>
                <td class="value mono">{{ currentStep.data.arpPacket.senderIp }}</td>
              </tr>
              <tr>
                <td class="label">目标方MAC</td>
                <td class="value mono">{{ currentStep.data.arpPacket.targetMac || '00:00:00:00:00:00' }}</td>
              </tr>
              <tr>
                <td class="label">目标方IP</td>
                <td class="value mono">{{ currentStep.data.arpPacket.targetIp }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 广播/单播说明 -->
        <div v-if="currentStep?.data?.transmission" class="transmission-info">
          <h4 class="details-title">传输方式</h4>
          <p class="transmission-text">
            <span class="transmission-type">{{ currentStep.data.transmission.type }}</span>
            {{ currentStep.data.transmission.desc }}
          </p>
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

// ARP缓存表条目
const arpCacheEntries = computed(() => {
  const entries = []

  // 根据当前步骤确定缓存表状态
  if (currentStepIndex.value >= 3) {
    entries.push({
      ip: '192.168.1.2',
      mac: '00:1B:44:11:3A:B7',
      status: 'complete',
      statusText: '已解析'
    })
  } else if (currentStepIndex.value >= 1) {
    entries.push({
      ip: '192.168.1.2',
      mac: '等待中...',
      status: 'pending',
      statusText: '解析中'
    })
  }

  return entries
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
.arp-visualization {
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
  height: 220px;
  flex-shrink: 0;
}

.topology-wrapper :deep(.network-topology) {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.arp-cache {
  padding: 12px 16px;
  background: #F5F5F5;
  border-radius: var(--border-radius);
  flex-shrink: 0;
}

.cache-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 10px;
}

.cache-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.cache-table th,
.cache-table td {
  padding: 6px 10px;
  text-align: left;
  border: 1px solid #E0E0E0;
}

.cache-table th {
  background: #E8E8E8;
  font-weight: 600;
  color: #666;
}

.cache-table td {
  background: white;
}

.cache-table .mono {
  font-family: monospace;
}

.cache-table .empty-cell {
  text-align: center;
  color: #999;
  font-style: italic;
}

.status-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 11px;
  border-radius: 2px;
  font-weight: 500;
}

.status-badge.complete {
  background: #E8F5E9;
  color: #2E7D32;
}

.status-badge.pending {
  background: #FFF3E0;
  color: #EF6C00;
}

.arp-details {
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

.details-table .mono {
  font-family: monospace;
}

.op-type {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 2px;
  font-size: 12px;
  font-weight: 600;
}

.op-type.request {
  background: #E3F2FD;
  color: #1565C0;
}

.op-type.response {
  background: #E8F5E9;
  color: #2E7D32;
}

.transmission-info {
  margin-top: 16px;
  padding: 12px;
  background: #F0F7FF;
  border-radius: var(--border-radius);
  border-left: 3px solid var(--primary-color);
}

.transmission-text {
  font-size: 13px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.transmission-type {
  font-weight: 600;
  color: var(--primary-color);
  margin-right: 4px;
}
</style>
