<template>
  <div class="web-access-simulation">
    <!-- 场景说明 -->
    <div class="scenario-header">
      <h4 class="scenario-title">场景：H1访问Web服务器</h4>
      <p class="scenario-desc">
        H1(192.168.1.2)通过浏览器访问www.abc.com，展示从t0到t1期间网络中的完整通信过程。
        初始状态：H1的ARP表和交换机S的交换表均为空。
      </p>
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
          :show-node-states="false"
        />
      </div>

      <!-- 网络状态面板 -->
      <div class="network-state">
        <div class="state-section">
          <h5 class="state-title">H1的ARP表</h5>
          <table class="state-table">
            <thead>
              <tr>
                <th>IP地址</th>
                <th>MAC地址</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(entry, idx) in h1ArpTable" :key="idx">
                <td class="mono">{{ entry.ip }}</td>
                <td class="mono">{{ entry.mac }}</td>
              </tr>
              <tr v-if="h1ArpTable.length === 0">
                <td colspan="2" class="empty">表为空</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="state-section">
          <h5 class="state-title">交换机S交换表</h5>
          <table class="state-table">
            <thead>
              <tr>
                <th>MAC地址</th>
                <th>端口</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(entry, idx) in switchTable" :key="idx">
                <td class="mono">{{ entry.mac }}</td>
                <td>{{ entry.port }}</td>
              </tr>
              <tr v-if="switchTable.length === 0">
                <td colspan="2" class="empty">表为空</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="state-section">
          <h5 class="state-title">当前通信</h5>
          <div class="comm-info">
            <div class="comm-item">
              <span class="label">源:</span>
              <span class="value">{{ currentStep?.data?.src || '-' }}</span>
            </div>
            <div class="comm-item">
              <span class="label">目的:</span>
              <span class="value">{{ currentStep?.data?.dst || '-' }}</span>
            </div>
            <div class="comm-item">
              <span class="label">协议:</span>
              <span class="value protocol">{{ currentStep?.data?.protocol || '-' }}</span>
            </div>
            <div class="comm-item">
              <span class="label">目的:</span>
              <span class="value">{{ currentStep?.data?.purpose || '-' }}</span>
            </div>
          </div>
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
        <!-- 数据包详情 -->
        <div v-if="currentStep?.data?.packet" class="packet-details">
          <h4 class="details-title">报文详情</h4>
          <table class="details-table">
            <tbody>
              <tr v-if="currentStep.data.packet.ethType">
                <td class="label">以太网类型</td>
                <td class="value">{{ currentStep.data.packet.ethType }}</td>
              </tr>
              <tr v-if="currentStep.data.packet.srcIp">
                <td class="label">源IP</td>
                <td class="value mono">{{ currentStep.data.packet.srcIp }}</td>
              </tr>
              <tr v-if="currentStep.data.packet.dstIp">
                <td class="label">目的IP</td>
                <td class="value mono">{{ currentStep.data.packet.dstIp }}</td>
              </tr>
              <tr v-if="currentStep.data.packet.srcMac">
                <td class="label">源MAC</td>
                <td class="value mono">{{ currentStep.data.packet.srcMac }}</td>
              </tr>
              <tr v-if="currentStep.data.packet.dstMac">
                <td class="label">目的MAC</td>
                <td class="value mono">{{ currentStep.data.packet.dstMac }}</td>
              </tr>
              <tr v-if="currentStep.data.packet.flags">
                <td class="label">标志</td>
                <td class="value">
                  <span
                    v-for="(val, flag) in currentStep.data.packet.flags"
                    :key="flag"
                    class="flag-badge"
                    :class="{ active: val }"
                  >
                    {{ flag.toUpperCase() }}
                  </span>
                </td>
              </tr>
              <tr v-if="currentStep.data.payload">
                <td class="label">载荷</td>
                <td class="value">{{ currentStep.data.payload }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 状态变化 -->
        <div v-if="currentStep?.data?.stateChange" class="state-change">
          <h4 class="details-title">状态变化</h4>
          <p class="change-desc">{{ currentStep.data.stateChange }}</p>
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
const topologyWrapper = ref(null)
const viewVersion = ref(0) // 用于触发节点位置重新计算

const handleViewChange = () => {
  viewVersion.value++
}

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

// H1的ARP表
const h1ArpTable = computed(() => {
  const table = []
  if (currentStepIndex.value >= 1) {
    table.push({ ip: '192.168.1.1', mac: '00:00:00:00:01:01' })
  }
  if (currentStepIndex.value >= 5) {
    table.push({ ip: '192.168.1.254', mac: '00:00:00:00:01:FE' })
  }
  return table
})

// 交换机交换表
const switchTable = computed(() => {
  const table = []
  if (currentStepIndex.value >= 0) {
    table.push({ mac: '00:00:00:00:02:01', port: '1' })
  }
  if (currentStepIndex.value >= 1) {
    table.push({ mac: '00:00:00:00:01:01', port: '3' })
  }
  if (currentStepIndex.value >= 5) {
    table.push({ mac: '00:00:00:00:01:FE', port: '4' })
  }
  return table
})

const nodePositions = computed(() => {
  // 依赖 viewVersion，当画布拖动时触发重新计算
  viewVersion.value

  const positions = {}
  const topology = props.animationData.topology

  if (!topology || !topologyWrapper.value) return positions

  const wrapperRect = topologyWrapper.value.getBoundingClientRect()
  const scaleX = wrapperRect.width / 800
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
.web-access-simulation {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 16px;
  padding-bottom: 80px;
}

.scenario-header {
  padding: 12px 16px;
  background: #F0F7FF;
  border-radius: var(--border-radius);
  border-left: 3px solid var(--primary-color);
}

.scenario-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 4px 0;
}

.scenario-desc {
  font-size: 12px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

.visualization-area {
  height: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.topology-wrapper {
  position: relative;
  height: 200px;
  flex-shrink: 0;
}

.topology-wrapper :deep(.network-topology) {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.network-state {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  padding: 12px;
  background: #F5F5F5;
  border-radius: var(--border-radius);
}

.state-section {
  background: white;
  padding: 10px;
  border-radius: 2px;
}

.state-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 8px 0;
}

.state-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 11px;
}

.state-table th,
.state-table td {
  padding: 4px 6px;
  text-align: left;
  border: 1px solid #E0E0E0;
}

.state-table th {
  background: #F5F5F5;
  font-weight: 500;
  color: #666;
}

.state-table .mono {
  font-family: monospace;
  font-size: 10px;
}

.state-table .empty {
  text-align: center;
  color: #999;
  font-style: italic;
}

.comm-info {
  font-size: 11px;
}

.comm-item {
  display: flex;
  margin-bottom: 4px;
}

.comm-item .label {
  color: #666;
  width: 40px;
  flex-shrink: 0;
}

.comm-item .value {
  color: var(--text-color);
  font-weight: 500;
}

.comm-item .protocol {
  color: var(--primary-color);
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

.details-table .mono {
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

.state-change {
  margin-top: 16px;
  padding: 12px;
  background: #F0F7FF;
  border-radius: var(--border-radius);
  border-left: 3px solid var(--primary-color);
}

.change-desc {
  font-size: 13px;
  color: #666;
  margin: 0;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .network-state {
    grid-template-columns: 1fr;
  }
}
</style>
