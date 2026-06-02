<template>
  <div ref="networkContainer" class="network-topology"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { Network } from 'vis-network/standalone'

const props = defineProps({
  // 拓扑节点数据
  nodes: {
    type: Array,
    required: true
  },
  // 拓扑边数据
  edges: {
    type: Array,
    required: true
  },
  // 节点状态（用于高亮和显示状态标签）
  nodeStates: {
    type: Object,
    default: () => ({})
  },
  // 选中的节点ID
  selectedNodeId: {
    type: String,
    default: null
  }
})

const emit = defineEmits(['nodeClick', 'edgeClick', 'viewChange'])

const networkContainer = ref(null)
let network = null

// 节点基础样式
const getNodeOptions = () => ({
  shape: 'box',
  font: {
    face: 'system-ui, -apple-system, sans-serif',
    size: 14,
    color: '#333'
  },
  color: {
    background: '#FFFFFF',
    border: '#CCCCCC',
    highlight: {
      background: '#F0F7FF',
      border: '#0066FF'
    }
  },
  borderWidth: 1,
  borderWidthSelected: 2,
  shadow: false,
  margin: 12,
  widthConstraint: {
    maximum: 120
  }
})

// 边基础样式
const getEdgeOptions = () => ({
  width: 1,
  color: {
    color: '#CCCCCC',
    highlight: '#0066FF'
  },
  arrows: {
    to: {
      enabled: true,
      scaleFactor: 0.8
    }
  },
  smooth: {
    type: 'continuous'
  },
  shadow: false
})

// 构建Vis-network数据
const buildNetworkData = () => {
  const nodeData = props.nodes.map(node => {
    const state = props.nodeStates[node.id] || {}
    const label = state.label || node.label
    const stateText = state.state ? `\n[${state.state}]` : ''

    return {
      id: node.id,
      label: label + stateText,
      x: node.x,
      y: node.y,
      shape: node.shape || 'box',
      color: {
        background: state.color || '#FFFFFF',
        border: state.highlighted ? (state.highlightColor || '#0066FF') : '#CCCCCC'
      },
      borderWidth: state.highlighted ? 2 : 1,
      font: {
        color: '#333333'
      }
    }
  })

  const edgeData = props.edges.map(edge => ({
    id: edge.id,
    from: edge.from,
    to: edge.to,
    label: edge.label || ''
  }))

  return {
    nodes: nodeData,
    edges: edgeData
  }
}

// 初始化网络
const initNetwork = async () => {
  if (!networkContainer.value) return

  await nextTick()

  const data = buildNetworkData()
  const options = {
    nodes: getNodeOptions(),
    edges: getEdgeOptions(),
    physics: {
      enabled: false  // 禁用物理模拟，使用固定坐标
    },
    interaction: {
      dragNodes: false,
      dragView: true,
      zoomView: true,
      hover: true,
      selectable: true
    }
  }

  network = new Network(networkContainer.value, data, options)

  // 事件监听
  network.on('click', (params) => {
    if (params.nodes.length > 0) {
      emit('nodeClick', params.nodes[0])
    } else if (params.edges.length > 0) {
      emit('edgeClick', params.edges[0])
    }
  })

  // 监听画布拖动和缩放事件，触发视图更新
  let rafId = null
  const throttledViewChange = () => {
    if (rafId) return
    rafId = requestAnimationFrame(() => {
      emit('viewChange')
      rafId = null
    })
  }

  network.on('dragging', throttledViewChange)
  network.on('zoom', throttledViewChange)
}

// 更新网络数据
const updateNetwork = () => {
  if (!network) return

  const data = buildNetworkData()
  network.setData(data)
}

// 监听数据变化
watch(() => props.nodes, updateNetwork, { deep: true })
watch(() => props.edges, updateNetwork, { deep: true })
watch(() => props.nodeStates, updateNetwork, { deep: true })

onMounted(() => {
  initNetwork()
})

onUnmounted(() => {
  if (network) {
    network.destroy()
    network = null
  }
})

// 暴露方法
const fit = () => {
  if (network) {
    network.fit()
  }
}

defineExpose({
  fit,
  getNetwork: () => network
})
</script>

<style scoped>
.network-topology {
  width: 100%;
  height: 100%;
  min-height: 300px;
  background: #FAFAFA;
  border: 1px solid #E5E5E5;
  border-radius: var(--border-radius);
}

:deep(.vis-network) {
  outline: none;
}

:deep(.vis-label) {
  font-family: system-ui, -apple-system, sans-serif !important;
}
</style>
