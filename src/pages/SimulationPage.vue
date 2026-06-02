<template>
  <SplitLayout
    title="综合网络场景模拟"
    :items="simulationItems"
    :current-id="currentId"
    @back="$emit('back')"
    @select="currentId = $event"
  >
    <!-- Web访问场景 -->
    <div v-if="currentId === 'web-access'" class="simulation-wrapper">
      <WebAccessSimulation :animation-data="webAccessData" />
    </div>

    <!-- 其他场景占位 -->
    <div v-else class="content-area">
      <div class="content-header">
        <h3>{{ currentItem?.title }}</h3>
      </div>
      <div class="content-body">
        <div class="placeholder">
          <p>{{ currentItem?.description }}</p>
          <p style="color: #999; margin-top: 16px;">
            场景模拟区域 - 待填充
          </p>
        </div>
      </div>
    </div>
  </SplitLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import SplitLayout from '../components/SplitLayout.vue'
import WebAccessSimulation from './WebAccessSimulation.vue'

const simulationItems = [
  {
    id: 'web-access',
    title: 'Web访问完整过程',
    description: 'H1访问Web服务器的完整流程：ARP、DNS、TCP握手、HTTP请求'
  },
  {
    id: 'lan-communication',
    title: '局域网内通信',
    description: '同一局域网内两台主机之间的数据传输过程'
  },
  {
    id: 'cross-network',
    title: '跨网段通信',
    description: '不同子网之间的数据包路由和转发过程'
  },
  {
    id: 'nat-process',
    title: 'NAT 地址转换',
    description: '私有网络访问公网时的地址转换过程'
  },
  {
    id: 'packet-loss',
    title: '丢包与重传',
    description: '模拟网络拥塞时的丢包和TCP重传机制'
  },
  {
    id: 'dhcp-process',
    title: 'DHCP 自动配置',
    description: '主机自动获取 IP 地址的完整流程'
  }
]

const currentId = ref('web-access')

const currentItem = computed(() =>
  simulationItems.find(item => item.id === currentId.value)
)

// ==================== Web访问场景数据 ====================
const webAccessData = {
  id: 'web-access',
  title: 'H1访问Web服务器完整过程',
  description: '展示从t0到t1期间网络中的完整通信过程',

  topology: {
    nodes: [
      { id: 'h1', label: 'H1\n192.168.1.2', x: 100, y: 100 },
      { id: 'h2', label: 'H2\n192.168.1.3', x: 100, y: 300 },
      { id: 'dns', label: '本地DNS\n192.168.1.1', x: 300, y: 100 },
      { id: 'switch', label: '交换机S', x: 200, y: 200, shape: 'square' },
      { id: 'router', label: '路由器R\n192.168.1.254', x: 400, y: 200 },
      { id: 'internet', label: 'Internet', x: 550, y: 200 },
      { id: 'web', label: 'Web服务器\n203.0.113.10\nwww.abc.com', x: 700, y: 200 }
    ],
    edges: [
      { id: 'e1', from: 'h1', to: 'switch' },
      { id: 'e2', from: 'h2', to: 'switch' },
      { id: 'e3', from: 'dns', to: 'switch' },
      { id: 'e4', from: 'switch', to: 'router' },
      { id: 'e5', from: 'router', to: 'internet' },
      { id: 'e6', from: 'internet', to: 'web' }
    ]
  },

  steps: [
    {
      id: 'step-0',
      title: 't0: H1发起Web访问',
      description: '用户在H1的浏览器中输入www.abc.com。H1首先检查本地DNS缓存，未找到对应IP，需要发起DNS查询。',
      actions: [
        { type: 'highlightNode', nodeId: 'h1' },
        { type: 'updateState', nodeId: 'h1', state: '发起DNS查询', color: '#0066FF' }
      ],
      data: {
        src: 'H1 (192.168.1.2)',
        dst: '本地DNS服务器 (192.168.1.1)',
        protocol: 'DNS',
        purpose: '解析www.abc.com的IP地址',
        stateChange: 'H1需要获取本地DNS服务器的MAC地址'
      }
    },
    {
      id: 'step-1',
      title: '步骤1: H1发送ARP请求',
      description: 'H1的ARP表为空，需要获取本地DNS服务器的MAC地址。H1发送ARP广播请求，询问"谁是192.168.1.1？"',
      actions: [
        { type: 'highlightNode', nodeId: 'h1' },
        { type: 'updateState', nodeId: 'switch', state: '学习MAC', color: '#E6A23C' },
        {
          type: 'sendPacket',
          from: 'h1',
          to: 'dns',
          flags: ['ARP请求'],
          color: '#E6A23C'
        }
      ],
      data: {
        src: 'H1 (192.168.1.2)',
        dst: '广播 (FF:FF:FF:FF:FF:FF)',
        protocol: 'ARP',
        purpose: '获取本地DNS服务器的MAC地址',
        packet: {
          ethType: '0x0806 (ARP)',
          srcMac: '00:00:00:00:02:01',
          dstMac: 'FF:FF:FF:FF:FF:FF',
          srcIp: '192.168.1.2',
          dstIp: '192.168.1.1'
        },
        stateChange: '交换机S从端口1学习到H1的MAC地址，交换表更新'
      }
    },
    {
      id: 'step-2',
      title: '步骤2: DNS服务器回复ARP',
      description: '本地DNS服务器收到ARP请求，发现目标IP是自己，向H1单播发送ARP响应，告知自己的MAC地址。',
      actions: [
        { type: 'highlightNode', nodeId: 'dns' },
        { type: 'updateState', nodeId: 'switch', state: '学习MAC', color: '#E6A23C' },
        {
          type: 'sendPacket',
          from: 'dns',
          to: 'h1',
          flags: ['ARP响应'],
          color: '#67C23A'
        }
      ],
      data: {
        src: '本地DNS服务器 (192.168.1.1)',
        dst: 'H1 (192.168.1.2)',
        protocol: 'ARP',
        purpose: '回复MAC地址给H1',
        packet: {
          ethType: '0x0806 (ARP)',
          srcMac: '00:00:00:00:01:01',
          dstMac: '00:00:00:00:02:01',
          srcIp: '192.168.1.1',
          dstIp: '192.168.1.2'
        },
        stateChange: '交换机S从端口3学习到DNS服务器的MAC地址；H1的ARP表更新，记录192.168.1.1→MAC'
      }
    },
    {
      id: 'step-3',
      title: '步骤3: H1发送DNS查询',
      description: 'H1现在知道DNS服务器的MAC地址，封装DNS查询报文，请求解析www.abc.com的IP地址。',
      actions: [
        { type: 'highlightNode', nodeId: 'h1' },
        { type: 'highlightNode', nodeId: 'dns' },
        {
          type: 'sendPacket',
          from: 'h1',
          to: 'dns',
          flags: ['DNS查询'],
          color: '#0066FF'
        }
      ],
      data: {
        src: 'H1 (192.168.1.2)',
        dst: '本地DNS服务器 (192.168.1.1)',
        protocol: 'DNS (UDP)',
        purpose: '查询www.abc.com的IP地址',
        packet: {
          ethType: '0x0800 (IPv4)',
          srcMac: '00:00:00:00:02:01',
          dstMac: '00:00:00:00:01:01',
          srcIp: '192.168.1.2',
          dstIp: '192.168.1.1',
          protocol: 'UDP:53'
        },
        payload: '查询: www.abc.com A记录',
        stateChange: '交换机查询交换表，从端口3转发到DNS服务器'
      }
    },
    {
      id: 'step-4',
      title: '步骤4: DNS服务器返回响应',
      description: '本地DNS服务器查询缓存（假设已缓存），直接返回www.abc.com对应的IP地址203.0.113.10。',
      actions: [
        { type: 'highlightNode', nodeId: 'dns' },
        { type: 'highlightNode', nodeId: 'h1' },
        {
          type: 'sendPacket',
          from: 'dns',
          to: 'h1',
          flags: ['DNS响应'],
          color: '#67C23A'
        }
      ],
      data: {
        src: '本地DNS服务器 (192.168.1.1)',
        dst: 'H1 (192.168.1.2)',
        protocol: 'DNS (UDP)',
        purpose: '返回www.abc.com的IP地址',
        packet: {
          ethType: '0x0800 (IPv4)',
          srcMac: '00:00:00:00:01:01',
          dstMac: '00:00:00:00:02:01',
          srcIp: '192.168.1.1',
          dstIp: '192.168.1.2'
        },
        payload: '响应: www.abc.com → 203.0.113.10',
        stateChange: 'H1获取到Web服务器IP，准备建立TCP连接'
      }
    },
    {
      id: 'step-5',
      title: '步骤5: H1 ARP请求网关',
      description: 'Web服务器IP(203.0.113.10)与H1不在同一网段，H1需要获取默认网关(路由器R)的MAC地址。',
      actions: [
        { type: 'highlightNode', nodeId: 'h1' },
        { type: 'updateState', nodeId: 'switch', state: '学习MAC', color: '#E6A23C' },
        {
          type: 'sendPacket',
          from: 'h1',
          to: 'router',
          flags: ['ARP请求'],
          color: '#E6A23C'
        }
      ],
      data: {
        src: 'H1 (192.168.1.2)',
        dst: '广播 (FF:FF:FF:FF:FF:FF)',
        protocol: 'ARP',
        purpose: '获取默认网关(192.168.1.254)的MAC地址',
        packet: {
          ethType: '0x0806 (ARP)',
          srcMac: '00:00:00:00:02:01',
          dstMac: 'FF:FF:FF:FF:FF:FF',
          srcIp: '192.168.1.2',
          dstIp: '192.168.1.254'
        },
        stateChange: '交换机再次广播ARP请求'
      }
    },
    {
      id: 'step-6',
      title: '步骤6: 路由器回复ARP',
      description: '路由器R收到ARP请求，回复自己的MAC地址给H1。',
      actions: [
        { type: 'highlightNode', nodeId: 'router' },
        { type: 'updateState', nodeId: 'switch', state: '学习MAC', color: '#E6A23C' },
        {
          type: 'sendPacket',
          from: 'router',
          to: 'h1',
          flags: ['ARP响应'],
          color: '#67C23A'
        }
      ],
      data: {
        src: '路由器R (192.168.1.254)',
        dst: 'H1 (192.168.1.2)',
        protocol: 'ARP',
        purpose: '回复网关MAC地址',
        packet: {
          ethType: '0x0806 (ARP)',
          srcMac: '00:00:00:00:01:FE',
          dstMac: '00:00:00:00:02:01',
          srcIp: '192.168.1.254',
          dstIp: '192.168.1.2'
        },
        stateChange: '交换机从端口4学习路由器MAC；H1的ARP表添加网关条目'
      }
    },
    {
      id: 'step-7',
      title: '步骤7: TCP三次握手 - SYN',
      description: 'H1开始向Web服务器建立TCP连接。首先发送SYN包，目标IP为203.0.113.10，MAC地址为网关MAC（跨网段通信）。',
      actions: [
        { type: 'highlightNode', nodeId: 'h1' },
        { type: 'highlightNode', nodeId: 'router' },
        { type: 'updateState', nodeId: 'h1', state: 'SYN_SENT', color: '#0066FF' },
        {
          type: 'sendPacket',
          from: 'h1',
          to: 'router',
          flags: ['SYN'],
          color: '#0066FF'
        }
      ],
      data: {
        src: 'H1:49152',
        dst: 'Web服务器:80 (203.0.113.10)',
        protocol: 'TCP',
        purpose: '发起TCP连接（第一次握手）',
        packet: {
          ethType: '0x0800 (IPv4)',
          srcMac: '00:00:00:00:02:01',
          dstMac: '00:00:00:00:01:FE',
          srcIp: '192.168.1.2',
          dstIp: '203.0.113.10',
          flags: { syn: 1, ack: 0 },
          seq: 1000
        },
        stateChange: 'H1进入SYN_SENT状态；路由器R将转发到Internet'
      }
    },
    {
      id: 'step-8',
      title: '步骤8: TCP三次握手 - SYN-ACK',
      description: 'Web服务器收到SYN后，回复SYN-ACK包。经过Internet和路由器R转发回H1。',
      actions: [
        { type: 'highlightNode', nodeId: 'web' },
        { type: 'highlightNode', nodeId: 'router' },
        { type: 'highlightNode', nodeId: 'h1' },
        { type: 'updateState', nodeId: 'h1', state: 'SYN_RCVD', color: '#E6A23C' },
        {
          type: 'sendPacket',
          from: 'web',
          to: 'h1',
          flags: ['SYN-ACK'],
          color: '#67C23A'
        }
      ],
      data: {
        src: 'Web服务器:80 (203.0.113.10)',
        dst: 'H1:49152',
        protocol: 'TCP',
        purpose: '确认SYN并请求建立反向连接（第二次握手）',
        packet: {
          ethType: '0x0800 (IPv4)',
          srcMac: '00:00:00:00:01:FE',
          dstMac: '00:00:00:00:02:01',
          srcIp: '203.0.113.10',
          dstIp: '192.168.1.2',
          flags: { syn: 1, ack: 1 },
          seq: 5000,
          ack: 1001
        },
        stateChange: '路由器R根据NAT表转发给H1；H1进入SYN_RCVD状态'
      }
    },
    {
      id: 'step-9',
      title: '步骤9: TCP三次握手 - ACK',
      description: 'H1收到SYN-ACK后，发送ACK确认包。TCP连接建立完成。',
      actions: [
        { type: 'highlightNode', nodeId: 'h1' },
        { type: 'highlightNode', nodeId: 'router' },
        { type: 'updateState', nodeId: 'h1', state: 'ESTABLISHED', color: '#67C23A' },
        {
          type: 'sendPacket',
          from: 'h1',
          to: 'router',
          flags: ['ACK'],
          color: '#67C23A'
        }
      ],
      data: {
        src: 'H1:49152',
        dst: 'Web服务器:80 (203.0.113.10)',
        protocol: 'TCP',
        purpose: '确认连接建立（第三次握手）',
        packet: {
          ethType: '0x0800 (IPv4)',
          srcMac: '00:00:00:00:02:01',
          dstMac: '00:00:00:00:01:FE',
          srcIp: '192.168.1.2',
          dstIp: '203.0.113.10',
          flags: { syn: 0, ack: 1 },
          seq: 1001,
          ack: 5001
        },
        stateChange: 'TCP连接建立完成，H1进入ESTABLISHED状态'
      }
    },
    {
      id: 'step-10',
      title: 't1: 发送HTTP请求',
      description: 'TCP连接建立后，H1封装HTTP GET请求报文，通过已建立的TCP连接发送给Web服务器。这是交换机S第一次收到HTTP请求报文的时刻。',
      actions: [
        { type: 'highlightNode', nodeId: 'h1' },
        { type: 'highlightNode', nodeId: 'router' },
        { type: 'updateState', nodeId: 'switch', state: '转发HTTP', color: '#0066FF' },
        {
          type: 'sendPacket',
          from: 'h1',
          to: 'router',
          flags: ['HTTP请求'],
          color: '#0066FF'
        }
      ],
      data: {
        src: 'H1 (192.168.1.2)',
        dst: 'Web服务器 (203.0.113.10)',
        protocol: 'HTTP (TCP:80)',
        purpose: '请求www.abc.com的网页内容',
        packet: {
          ethType: '0x0800 (IPv4)',
          srcMac: '00:00:00:00:02:01',
          dstMac: '00:00:00:00:01:FE',
          srcIp: '192.168.1.2',
          dstIp: '203.0.113.10',
          protocol: 'TCP:80'
        },
        payload: 'GET / HTTP/1.1\r\nHost: www.abc.com\r\nUser-Agent: Mozilla/5.0\r\nAccept: text/html\r\n\r\n',
        stateChange: 't1时刻：交换机S第一次收到HTTP请求报文的以太网帧；交换机从端口1接收，从端口4转发给路由器R'
      }
    },
    {
      id: 'step-11',
      title: '总结：网络状态变化',
      description: '从t0到t1期间，网络中依次发生了11个通信步骤：2次ARP请求/响应（DNS服务器）、2次DNS查询/响应、2次ARP请求/响应（网关）、3次TCP握手、1次HTTP请求。此时H1的ARP表和交换机S的交换表均已更新。',
      actions: [],
      data: {
        stateChange: '最终状态：H1 ARP表包含DNS服务器和网关的MAC；交换机S交换表包含H1、DNS服务器和路由器的MAC地址'
      }
    }
  ],

  initialStates: {
    h1: { state: '初始', color: '#999999' },
    switch: { state: '表为空', color: '#999999' },
    router: { state: '转发', color: '#999999' }
  }
}

defineEmits(['back'])
</script>

<style scoped>
.simulation-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.content-area {
  height: 100%;
}

.content-header {
  padding-bottom: 16px;
  border-bottom: 1px solid #E5E5E5;
  margin-bottom: var(--spacing);
}

.content-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
}

.content-body {
  min-height: 400px;
}

.placeholder {
  padding: 48px;
  text-align: center;
  color: #666;
  border: 1px dashed #E5E5E5;
  border-radius: var(--border-radius);
}
</style>
