<template>
  <div ref="containerRef" class="packet-animator">
    <!-- 数据包 -->
    <div
      v-for="packet in visiblePackets"
      :key="packet.id"
      class="packet"
      :style="getPacketStyle(packet)"
      :title="getPacketTooltip(packet)"
    >
      <div class="packet-body" :style="{ backgroundColor: packet.color }">
        <span class="packet-flags">{{ packet.flags.join('/') }}</span>
      </div>
    </div>

    <!-- 状态标签（悬浮显示） -->
    <div
      v-for="(pos, nodeId) in nodePositions"
      :key="`state-${nodeId}`"
      v-if="showNodeStates"
      class="node-state-label"
      :style="getStateLabelStyle(pos, nodeId)"
    >
      {{ nodeStates[nodeId]?.state }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps({
  // 数据包定义
  packets: {
    type: Array,
    default: () => []
  },
  // 节点位置映射 { nodeId: { x, y } }
  nodePositions: {
    type: Object,
    required: true
  },
  // 节点状态
  nodeStates: {
    type: Object,
    default: () => ({})
  },
  // 动画进度 (0-100)
  progress: {
    type: Number,
    default: 100
  },
  // 是否显示节点状态
  showNodeStates: {
    type: Boolean,
    default: true
  }
})

const containerRef = ref(null)
const containerSize = ref({ width: 0, height: 0 })

// 监听容器大小变化
const updateContainerSize = () => {
  if (containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect()
    containerSize.value = { width: rect.width, height: rect.height }
  }
}

// 计算可见的数据包
const visiblePackets = computed(() => {
  return props.packets.map((packet, index) => ({
    ...packet,
    id: packet.id || `packet-${index}`,
    displayProgress: Math.min(props.progress, 100)
  }))
})

// 计算数据包位置
const getPacketPosition = (packet) => {
  const fromPos = props.nodePositions[packet.from]
  const toPos = props.nodePositions[packet.to]

  if (!fromPos || !toPos) return { x: 0, y: 0 }

  const p = packet.displayProgress / 100
  return {
    x: fromPos.x + (toPos.x - fromPos.x) * p,
    y: fromPos.y + (toPos.y - fromPos.y) * p
  }
}

// 数据包样式
const getPacketStyle = (packet) => {
  const pos = getPacketPosition(packet)
  return {
    left: `${pos.x}px`,
    top: `${pos.y}px`,
    transform: 'translate(-50%, -50%)'
  }
}

// 状态标签样式
const getStateLabelStyle = (pos, nodeId) => {
  const state = props.nodeStates[nodeId]
  const color = state?.color || '#999'

  return {
    left: `${pos.x}px`,
    top: `${pos.y + 35}px`,
    transform: 'translateX(-50%)',
    color: color,
    borderColor: color
  }
}

// 数据包提示文字
const getPacketTooltip = (packet) => {
  const parts = [
    `Flags: ${packet.flags.join('/')}`
  ]
  if (packet.seq !== undefined && packet.seq !== null) {
    parts.push(`SEQ: ${packet.seq}`)
  }
  if (packet.ack !== undefined && packet.ack !== null) {
    parts.push(`ACK: ${packet.ack}`)
  }
  return parts.join('\n')
}

// 初始化
onMounted(() => {
  updateContainerSize()
  window.addEventListener('resize', updateContainerSize)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateContainerSize)
})

// 监听节点位置变化
watch(() => props.nodePositions, updateContainerSize, { deep: true })
</script>

<style scoped>
.packet-animator {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 10;
}

.packet {
  position: absolute;
  pointer-events: auto;
  transition: left 0.3s ease-out, top 0.3s ease-out;
}

.packet-body {
  min-width: 48px;
  height: 24px;
  border-radius: var(--border-radius);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 8px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.packet-flags {
  font-size: 10px;
  font-weight: 600;
  color: white;
  white-space: nowrap;
}

.node-state-label {
  position: absolute;
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  background: white;
  border: 1px solid;
  border-radius: var(--border-radius);
  white-space: nowrap;
}
</style>
