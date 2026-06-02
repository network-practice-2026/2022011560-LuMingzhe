<template>
  <SplitLayout
    title="协议原理可视化"
    :items="protocolItems"
    :current-id="currentProtocolId"
    @back="$emit('back')"
    @select="currentProtocolId = $event"
  >
    <!-- DNS解析 -->
    <div v-if="currentProtocolId === 'dns'" class="protocol-wrapper">
      <DnsVisualization :animation-data="dnsData" />
    </div>

    <!-- TCP三次握手 -->
    <div v-else-if="currentProtocolId === 'tcp-handshake'" class="protocol-wrapper">
      <TcpHandshakeVisualization :animation-data="tcpHandshakeData" />
    </div>

    <!-- TCP四次挥手 -->
    <div v-else-if="currentProtocolId === 'tcp-close'" class="protocol-wrapper">
      <TcpCloseVisualization :animation-data="tcpCloseData" />
    </div>

    <!-- HTTP请求响应 -->
    <div v-else-if="currentProtocolId === 'http-request'" class="protocol-wrapper">
      <HttpVisualization :animation-data="httpData" />
    </div>

    <!-- ARP地址解析 -->
    <div v-else-if="currentProtocolId === 'arp'" class="protocol-wrapper">
      <ArpVisualization :animation-data="arpData" />
    </div>

    <!-- 默认占位 -->
    <div v-else class="protocol-placeholder">
      <h3>{{ currentItem?.title }}</h3>
      <p>{{ currentItem?.description }}</p>
      <p class="placeholder-note">该协议的可视化正在开发中...</p>
    </div>
  </SplitLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import SplitLayout from '../components/SplitLayout.vue'
import DnsVisualization from './DnsVisualization.vue'
import TcpHandshakeVisualization from './TcpHandshakeVisualization.vue'
import TcpCloseVisualization from './TcpCloseVisualization.vue'
import HttpVisualization from './HttpVisualization.vue'
import ArpVisualization from './ArpVisualization.vue'

const protocolItems = [
  {
    id: 'dns',
    title: 'DNS 服务解析',
    description: '观察域名解析的完整过程，从本地缓存到根服务器查询'
  },
  {
    id: 'tcp-handshake',
    title: 'TCP 三次握手',
    description: '可视化 TCP 连接建立的三次握手过程'
  },
  {
    id: 'tcp-close',
    title: 'TCP 四次挥手',
    description: '了解 TCP 连接终止的四次挥手机制'
  },
  {
    id: 'http-request',
    title: 'HTTP 请求响应',
    description: '查看 HTTP 报文的结构和传输过程'
  },
  {
    id: 'arp',
    title: 'ARP 地址解析',
    description: 'IP 地址到 MAC 地址的解析过程'
  }
]

const currentProtocolId = ref('tcp-handshake')

const currentItem = computed(() =>
  protocolItems.find(item => item.id === currentProtocolId.value)
)

// ==================== DNS解析数据 ====================
const dnsData = {
  id: 'dns',
  title: 'DNS 服务解析',
  description: '域名系统解析过程',

  topology: {
    nodes: [
      { id: 'client', label: '客户端', x: 50, y: 200 },
      { id: 'local-dns', label: '本地DNS', x: 200, y: 200 },
      { id: 'root', label: '根服务器', x: 350, y: 100 },
      { id: 'tld', label: '.com服务器', x: 350, y: 200 },
      { id: 'auth', label: '权威服务器', x: 350, y: 300 }
    ],
    edges: [
      { id: 'e1', from: 'client', to: 'local-dns' },
      { id: 'e2', from: 'local-dns', to: 'root' },
      { id: 'e3', from: 'local-dns', to: 'tld' },
      { id: 'e4', from: 'local-dns', to: 'auth' }
    ]
  },

  steps: [
    {
      id: 'step-0',
      title: '开始DNS查询',
      description: '用户在浏览器输入 www.example.com，系统首先需要解析这个域名对应的IP地址。',
      actions: [],
      data: { cacheInfo: '浏览器缓存为空，需要发起DNS查询' }
    },
    {
      id: 'step-1',
      title: '查询本地DNS服务器',
      description: '客户端向配置的本地DNS服务器发起递归查询，请求解析 www.example.com。',
      actions: [
        { type: 'highlightNode', nodeId: 'client' },
        { type: 'highlightNode', nodeId: 'local-dns' },
        {
          type: 'sendPacket',
          from: 'client',
          to: 'local-dns',
          flags: ['DNS查询'],
          color: '#0066FF'
        }
      ],
      data: {
        dnsPacket: {
          queryType: '递归查询',
          domain: 'www.example.com',
          recordType: 'A记录'
        }
      }
    },
    {
      id: 'step-2',
      title: '查询根域名服务器',
      description: '本地DNS服务器没有缓存，向根域名服务器发起迭代查询，询问.com域名的服务器地址。',
      actions: [
        { type: 'highlightNode', nodeId: 'root' },
        {
          type: 'sendPacket',
          from: 'local-dns',
          to: 'root',
          flags: ['查询.com'],
          color: '#E6A23C'
        }
      ],
      data: {
        dnsPacket: {
          queryType: '迭代查询',
          domain: 'example.com',
          recordType: 'NS记录'
        }
      }
    },
    {
      id: 'step-3',
      title: '查询顶级域名服务器',
      description: '根服务器返回.com顶级域名服务器地址，本地DNS继续向.com服务器查询。',
      actions: [
        { type: 'highlightNode', nodeId: 'tld' },
        {
          type: 'sendPacket',
          from: 'local-dns',
          to: 'tld',
          flags: ['查询example.com'],
          color: '#E6A23C'
        }
      ],
      data: {
        dnsPacket: {
          queryType: '迭代查询',
          domain: 'www.example.com',
          recordType: 'A记录'
        }
      }
    },
    {
      id: 'step-4',
      title: '查询权威域名服务器',
      description: '.com服务器返回example.com的权威DNS服务器地址，本地DNS向权威服务器查询。',
      actions: [
        { type: 'highlightNode', nodeId: 'auth' },
        {
          type: 'sendPacket',
          from: 'local-dns',
          to: 'auth',
          flags: ['查询A记录'],
          color: '#67C23A'
        }
      ],
      data: {
        dnsPacket: {
          queryType: '迭代查询',
          domain: 'www.example.com',
          recordType: 'A记录'
        }
      }
    },
    {
      id: 'step-5',
      title: '返回解析结果',
      description: '权威DNS服务器返回 www.example.com 对应的IP地址（192.0.2.1），本地DNS缓存该结果并返回给客户端。',
      actions: [
        { type: 'highlightNode', nodeId: 'client' },
        {
          type: 'sendPacket',
          from: 'local-dns',
          to: 'client',
          flags: ['返回IP'],
          color: '#67C23A'
        }
      ],
      data: {
        dnsPacket: {
          queryType: '响应',
          domain: 'www.example.com',
          recordType: 'A记录',
          response: '192.0.2.1'
        },
        cacheInfo: '本地DNS服务器将结果缓存，TTL为3600秒'
      }
    }
  ],

  initialStates: {}
}

// ==================== TCP三次握手数据 ====================
const tcpHandshakeData = {
  id: 'tcp-handshake',
  title: 'TCP 三次握手',
  description: 'TCP连接建立过程的可视化展示',

  topology: {
    nodes: [
      { id: 'client', label: '客户端', x: 100, y: 200 },
      { id: 'server', label: '服务器', x: 500, y: 200 }
    ],
    edges: [
      { id: 'link1', from: 'client', to: 'server' }
    ]
  },

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

  initialStates: {
    client: { state: 'CLOSED', color: '#999999' },
    server: { state: 'LISTEN', color: '#999999' }
  }
}

// ==================== TCP四次挥手数据 ====================
const tcpCloseData = {
  id: 'tcp-close',
  title: 'TCP 四次挥手',
  description: 'TCP连接终止过程',

  topology: {
    nodes: [
      { id: 'active', label: '主动关闭方', x: 100, y: 200 },
      { id: 'passive', label: '被动关闭方', x: 500, y: 200 }
    ],
    edges: [
      { id: 'link1', from: 'active', to: 'passive' }
    ]
  },

  steps: [
    {
      id: 'step-0',
      title: '连接建立状态',
      description: '双方都处于ESTABLISHED状态，数据传输正常进行。现在客户端决定关闭连接。',
      actions: [
        { type: 'updateState', nodeId: 'active', state: 'ESTABLISHED', color: '#67C23A' },
        { type: 'updateState', nodeId: 'passive', state: 'ESTABLISHED', color: '#67C23A' }
      ]
    },
    {
      id: 'step-1',
      title: '第一次挥手：主动方发送FIN',
      description: '主动关闭方（客户端）发送FIN包，表示数据发送完成，希望关闭连接。',
      actions: [
        { type: 'highlightNode', nodeId: 'active' },
        { type: 'updateState', nodeId: 'active', state: 'FIN_WAIT_1', color: '#E6A23C' },
        {
          type: 'sendPacket',
          from: 'active',
          to: 'passive',
          flags: ['FIN'],
          seq: 5000,
          ack: 8000,
          color: '#E6A23C'
        }
      ],
      data: {
        packet: { seq: 5000, ack: 8000, flags: { fin: 1, ack: 1 } },
        stateChange: { from: 'ESTABLISHED', to: 'FIN_WAIT_1', reason: '发送FIN后进入此状态，等待对方的ACK' }
      }
    },
    {
      id: 'step-2',
      title: '第二次挥手：被动方回复ACK',
      description: '被动关闭方（服务器）收到FIN后，立即回复ACK确认。此时主动方到被动方的连接已关闭，但反向仍可传输数据。',
      actions: [
        { type: 'highlightNode', nodeId: 'passive' },
        { type: 'updateState', nodeId: 'active', state: 'FIN_WAIT_2', color: '#E6A23C' },
        { type: 'updateState', nodeId: 'passive', state: 'CLOSE_WAIT', color: '#E6A23C' },
        {
          type: 'sendPacket',
          from: 'passive',
          to: 'active',
          flags: ['ACK'],
          seq: 8000,
          ack: 5001,
          color: '#67C23A'
        }
      ],
      data: {
        packet: { seq: 8000, ack: 5001, flags: { fin: 0, ack: 1 } },
        stateChange: { from: 'ESTABLISHED', to: 'CLOSE_WAIT', reason: '收到FIN后进入，等待应用层关闭' }
      }
    },
    {
      id: 'step-3',
      title: '第三次挥手：被动方发送FIN',
      description: '被动关闭方数据发送完毕后，也发送FIN包，请求关闭反向连接。',
      actions: [
        { type: 'updateState', nodeId: 'passive', state: 'LAST_ACK', color: '#E6A23C' },
        {
          type: 'sendPacket',
          from: 'passive',
          to: 'active',
          flags: ['FIN'],
          seq: 8000,
          ack: 5001,
          color: '#E6A23C'
        }
      ],
      data: {
        packet: { seq: 8000, ack: 5001, flags: { fin: 1, ack: 1 } },
        stateChange: { from: 'CLOSE_WAIT', to: 'LAST_ACK', reason: '发送FIN后进入，等待最后的ACK' }
      }
    },
    {
      id: 'step-4',
      title: '第四次挥手：主动方回复ACK',
      description: '主动关闭方收到FIN后，回复ACK确认。此时主动方进入TIME_WAIT状态，等待2MSL时间后完全关闭。',
      actions: [
        { type: 'highlightNode', nodeId: 'active' },
        { type: 'updateState', nodeId: 'active', state: 'TIME_WAIT', color: '#999999' },
        { type: 'updateState', nodeId: 'passive', state: 'CLOSED', color: '#999999' },
        {
          type: 'sendPacket',
          from: 'active',
          to: 'passive',
          flags: ['ACK'],
          seq: 5001,
          ack: 8001,
          color: '#67C23A'
        }
      ],
      data: {
        packet: { seq: 5001, ack: 8001, flags: { fin: 0, ack: 1 } },
        stateChange: { from: 'FIN_WAIT_2', to: 'TIME_WAIT', reason: '等待确保对方收到ACK，防止旧连接数据包干扰' }
      }
    },
    {
      id: 'step-5',
      title: '连接完全关闭',
      description: 'TIME_WAIT结束后，主动方也进入CLOSED状态。四次挥手完成，双方连接彻底关闭。',
      actions: [
        { type: 'updateState', nodeId: 'active', state: 'CLOSED', color: '#999999' }
      ],
      data: {
        stateChange: { from: 'TIME_WAIT', to: 'CLOSED', reason: '2MSL超时（通常60秒），连接完全释放' }
      }
    }
  ],

  initialStates: {
    active: { state: 'ESTABLISHED', color: '#67C23A' },
    passive: { state: 'ESTABLISHED', color: '#67C23A' }
  }
}

// ==================== HTTP请求响应数据 ====================
const httpData = {
  id: 'http',
  title: 'HTTP 请求响应',
  description: 'HTTP报文传输过程',

  topology: {
    nodes: [
      { id: 'browser', label: '浏览器', x: 100, y: 200 },
      { id: 'server', label: 'Web服务器', x: 500, y: 200 }
    ],
    edges: [
      { id: 'link1', from: 'browser', to: 'server' }
    ]
  },

  steps: [
    {
      id: 'step-0',
      title: 'TCP连接已建立',
      description: '浏览器与Web服务器之间已通过三次握手建立TCP连接，准备进行HTTP通信。',
      actions: [],
      data: { connected: true }
    },
    {
      id: 'step-1',
      title: '浏览器发送HTTP请求',
      description: '浏览器构造HTTP请求报文，包含请求行、请求头和可选的消息体，通过TCP连接发送给服务器。',
      actions: [
        { type: 'highlightNode', nodeId: 'browser' },
        {
          type: 'sendPacket',
          from: 'browser',
          to: 'server',
          flags: ['HTTP请求'],
          color: '#0066FF'
        }
      ],
      data: {
        connected: true,
        httpPacket: {
          type: '请求',
          startLine: 'GET /index.html HTTP/1.1',
          headers: {
            'Host': 'www.example.com',
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'text/html',
            'Connection': 'keep-alive'
          },
          body: null
        }
      }
    },
    {
      id: 'step-2',
      title: '服务器处理请求',
      description: 'Web服务器接收并解析HTTP请求，根据请求路径查找资源，生成响应内容。',
      actions: [
        { type: 'highlightNode', nodeId: 'server' }
      ],
      data: {
        connected: true,
        timing: '服务器处理时间取决于资源复杂度，可能涉及数据库查询、模板渲染等'
      }
    },
    {
      id: 'step-3',
      title: '服务器返回HTTP响应',
      description: '服务器构造HTTP响应报文，包含状态行、响应头和响应体（HTML页面内容），发送给浏览器。',
      actions: [
        {
          type: 'sendPacket',
          from: 'server',
          to: 'browser',
          flags: ['HTTP响应'],
          color: '#67C23A'
        }
      ],
      data: {
        connected: true,
        httpPacket: {
          type: '响应',
          startLine: 'HTTP/1.1 200 OK',
          headers: {
            'Content-Type': 'text/html; charset=UTF-8',
            'Content-Length': '1024',
            'Server': 'Apache/2.4',
            'Date': 'Mon, 01 Jun 2026 10:00:00 GMT'
          },
          body: '<!DOCTYPE html>\n<html>\n<head>\n  <title>Example</title>\n</head>\n<body>\n  <h1>Hello World</h1>\n</body>\n</html>'
        }
      }
    },
    {
      id: 'step-4',
      title: '浏览器渲染页面',
      description: '浏览器接收响应，解析HTML内容，加载CSS和JavaScript，渲染页面展示给用户。',
      actions: [
        { type: 'highlightNode', nodeId: 'browser' }
      ],
      data: {
        connected: true,
        timing: '现代浏览器会并行请求页面中的其他资源（图片、CSS、JS等）'
      }
    },
    {
      id: 'step-5',
      title: '连接复用或关闭',
      description: '根据Connection头决定：keep-alive则保持连接复用，close则四次挥手关闭TCP连接。',
      actions: [],
      data: {
        connected: true,
        timing: 'HTTP/1.1默认使用持久连接（keep-alive），减少重复建立TCP连接的开销'
      }
    }
  ],

  initialStates: {}
}

// ==================== ARP地址解析数据 ====================
const arpData = {
  id: 'arp',
  title: 'ARP 地址解析',
  description: 'IP地址到MAC地址的解析过程',

  topology: {
    nodes: [
      { id: 'hostA', label: '主机A\n192.168.1.1', x: 100, y: 200 },
      { id: 'hostB', label: '主机B\n192.168.1.2', x: 500, y: 200 }
    ],
    edges: [
      { id: 'link1', from: 'hostA', to: 'hostB' }
    ]
  },

  steps: [
    {
      id: 'step-0',
      title: '准备发送数据',
      description: '主机A（192.168.1.1）需要与主机B（192.168.1.2）通信，但不知道对方的MAC地址，需要发起ARP查询。',
      actions: [],
      data: { cacheInfo: '主机A的ARP缓存表为空' }
    },
    {
      id: 'step-1',
      title: '发送ARP请求（广播）',
      description: '主机A发送ARP请求广播包，询问"谁是192.168.1.2？请告诉我你的MAC地址"。目标MAC地址为广播地址FF:FF:FF:FF:FF:FF。',
      actions: [
        { type: 'highlightNode', nodeId: 'hostA' },
        {
          type: 'sendPacket',
          from: 'hostA',
          to: 'hostB',
          flags: ['ARP请求'],
          color: '#E6A23C'
        }
      ],
      data: {
        arpPacket: {
          opType: 'request',
          senderMac: '00:1A:2B:3C:4D:5E',
          senderIp: '192.168.1.1',
          targetMac: null,
          targetIp: '192.168.1.2'
        },
        transmission: {
          type: '广播',
          desc: 'ARP请求以广播形式发送，局域网内所有主机都会收到'
        }
      }
    },
    {
      id: 'step-2',
      title: '主机B接收请求',
      description: '主机B收到ARP请求，发现目标IP是自己的IP地址（192.168.1.2），准备回复。其他主机发现不是自己的IP，忽略该请求。',
      actions: [
        { type: 'highlightNode', nodeId: 'hostB' }
      ]
    },
    {
      id: 'step-3',
      title: '发送ARP响应（单播）',
      description: '主机B向主机A单播发送ARP响应包，告知自己的MAC地址（00:1B:44:11:3A:B7）。',
      actions: [
        {
          type: 'sendPacket',
          from: 'hostB',
          to: 'hostA',
          flags: ['ARP响应'],
          color: '#67C23A'
        }
      ],
      data: {
        arpPacket: {
          opType: 'response',
          senderMac: '00:1B:44:11:3A:B7',
          senderIp: '192.168.1.2',
          targetMac: '00:1A:2B:3C:4D:5E',
          targetIp: '192.168.1.1'
        },
        transmission: {
          type: '单播',
          desc: 'ARP响应以单播形式直接回复给请求方'
        }
      }
    },
    {
      id: 'step-4',
      title: '更新ARP缓存表',
      description: '主机A收到ARP响应后，将主机B的IP-MAC映射存入ARP缓存表，有效期通常为20分钟。',
      actions: [
        { type: 'highlightNode', nodeId: 'hostA' }
      ],
      data: {
        cacheInfo: 'ARP缓存表已更新：192.168.1.2 → 00:1B:44:11:3A:B7'
      }
    },
    {
      id: 'step-5',
      title: '开始正常通信',
      description: '现在主机A知道了主机B的MAC地址，可以封装以太网帧，通过数据链路层直接通信了。',
      actions: [
        {
          type: 'sendPacket',
          from: 'hostA',
          to: 'hostB',
          flags: ['数据帧'],
          color: '#0066FF'
        }
      ],
      data: {
        cacheInfo: '后续通信直接使用缓存的MAC地址，无需再次ARP查询'
      }
    }
  ],

  initialStates: {}
}

defineEmits(['back'])
</script>

<style scoped>
.protocol-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.protocol-placeholder {
  padding: 48px;
  text-align: center;
}

.protocol-placeholder h3 {
  font-size: 20px;
  color: var(--text-color);
  margin-bottom: 16px;
}

.protocol-placeholder p {
  color: #666;
  margin-bottom: 24px;
  line-height: 1.6;
}

.placeholder-note {
  color: #999;
  font-size: 14px;
  padding: 24px;
  border: 1px dashed #E5E5E5;
  border-radius: var(--border-radius);
}
</style>
