<template>
  <div class="animation-loader">
    <div v-if="loading" class="loading-state">
      <span class="loading-text">加载中...</span>
    </div>
    <div v-else-if="error" class="error-state">
      <span class="error-text">{{ error }}</span>
      <button class="retry-btn" @click="loadData">重试</button>
    </div>
    <slot v-else :data="animationData" />
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const props = defineProps({
  // 后端API URL（预留接口）
  url: {
    type: String,
    default: ''
  },
  // 动画ID（用于构建URL或选择mock数据）
  animationId: {
    type: String,
    required: true
  }
})

const loading = ref(false)
const error = ref(null)
const animationData = ref(null)

// TCP三次握手Mock数据
const tcpHandshakeMock = {
  id: 'tcp-handshake',
  title: 'TCP 三次握手',
  description: 'TCP连接建立过程的可视化展示',

  // 网络拓扑
  topology: {
    nodes: [
      { id: 'client', label: '客户端', x: 100, y: 200 },
      { id: 'server', label: '服务器', x: 500, y: 200 }
    ],
    edges: [
      { id: 'link1', from: 'client', to: 'server' }
    ]
  },

  // 步骤列表
  steps: [
    {
      id: 'step-0',
      title: '初始状态',
      description: '连接开始前，客户端处于CLOSED状态，服务器处于LISTEN状态，等待客户端连接请求。',
      actions: []
    },
    {
      id: 'step-1',
      title: '第一次握手：客户端发送SYN',
      description: '客户端向服务器发送SYN包，请求建立连接。SYN标志位设为1，序号SEQ为随机生成的初始值x（图中假设为1000）。',
      actions: [
        { type: 'highlightNode', nodeId: 'client' },
        { type: 'updateState', nodeId: 'client', state: 'SYN_SENT', color: '#0066FF' },
        {
          type: 'sendPacket',
          from: 'client',
          to: 'server',
          flags: ['SYN'],
          seq: 1000,
          ack: null,
          color: '#0066FF'
        }
      ],
      data: {
        packet: {
          srcPort: 49152,
          dstPort: 80,
          seq: 1000,
          ack: 0,
          flags: { syn: 1, ack: 0 },
          len: 0
        }
      }
    },
    {
      id: 'step-2',
      title: '第二次握手：服务器回复SYN-ACK',
      description: '服务器收到SYN后，分配连接资源，回复SYN-ACK包。SYN=1表示也请求建立连接，ACK=1001确认已收到客户端的SYN，序号SEQ为服务器随机生成的y（图中假设为2000）。',
      actions: [
        { type: 'highlightNode', nodeId: 'server' },
        { type: 'updateState', nodeId: 'server', state: 'SYN_RCVD', color: '#0066FF' },
        {
          type: 'sendPacket',
          from: 'server',
          to: 'client',
          flags: ['SYN', 'ACK'],
          seq: 2000,
          ack: 1001,
          color: '#67C23A'
        }
      ],
      data: {
        packet: {
          srcPort: 80,
          dstPort: 49152,
          seq: 2000,
          ack: 1001,
          flags: { syn: 1, ack: 1 },
          len: 0
        }
      }
    },
    {
      id: 'step-3',
      title: '第三次握手：客户端发送ACK',
      description: '客户端收到SYN-ACK后，发送ACK确认包。ACK=2001确认已收到服务器的SYN。此时双方都已确认对方可以收发数据，连接正式建立。',
      actions: [
        { type: 'updateState', nodeId: 'client', state: 'ESTABLISHED', color: '#67C23A' },
        { type: 'updateState', nodeId: 'server', state: 'ESTABLISHED', color: '#67C23A' },
        {
          type: 'sendPacket',
          from: 'client',
          to: 'server',
          flags: ['ACK'],
          seq: 1001,
          ack: 2001,
          color: '#67C23A'
        }
      ],
      data: {
        packet: {
          srcPort: 49152,
          dstPort: 80,
          seq: 1001,
          ack: 2001,
          flags: { syn: 0, ack: 1 },
          len: 0
        }
      }
    },
    {
      id: 'step-4',
      title: '连接建立完成',
      description: '三次握手完成，双方都进入ESTABLISHED状态。此时可以开始传输应用层数据。注意：第三次握手的ACK包可以携带数据。',
      actions: []
    }
  ],

  // 初始状态定义
  initialStates: {
    client: { state: 'CLOSED', color: '#999999' },
    server: { state: 'LISTEN', color: '#999999' }
  }
}

// 加载动画数据
const loadData = async () => {
  loading.value = true
  error.value = null

  try {
    // 如果有URL，优先从后端加载
    if (props.url) {
      const response = await fetch(props.url)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      animationData.value = await response.json()
    } else {
      // 使用mock数据，模拟网络延迟
      await new Promise(resolve => setTimeout(resolve, 300))

      // 根据animationId返回对应的mock数据
      switch (props.animationId) {
        case 'tcp-handshake':
          animationData.value = tcpHandshakeMock
          break
        default:
          animationData.value = tcpHandshakeMock
      }
    }
  } catch (err) {
    error.value = err.message || '加载失败'
    console.error('AnimationLoader error:', err)
  } finally {
    loading.value = false
  }
}

// 监听animationId变化，重新加载
watch(() => props.animationId, () => {
  loadData()
}, { immediate: false })

onMounted(() => {
  loadData()
})

defineExpose({
  reload: loadData
})
</script>

<style scoped>
.animation-loader {
  width: 100%;
  height: 100%;
}

.loading-state,
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #666;
}

.loading-text {
  font-size: 14px;
}

.error-text {
  font-size: 14px;
  color: #f56c6c;
  margin-bottom: 16px;
}

.retry-btn {
  padding: 8px 16px;
  border: 1px solid var(--primary-color);
  background: none;
  color: var(--primary-color);
  font-size: 14px;
  cursor: pointer;
  border-radius: var(--border-radius);
  font-family: var(--font-family);
}

.retry-btn:hover {
  background: var(--primary-color);
  color: white;
}
</style>
