const layers = [
  {
    id: 'application',
    title: '应用层',
    order: 1,
    summary: '应用层直接面向用户和应用程序，负责定义网络应用之间交换数据的格式、语义和交互规则。',
    concepts: [
      { title: '应用进程通信', description: '不同主机上的应用进程通过应用层协议交换请求和响应。' },
      { title: '客户端/服务器模型', description: '客户端主动发起请求，服务器监听端口并提供资源或服务。' },
      { title: '应用报文', description: '应用层产生的协议数据单元，向下交给传输层封装。' }
    ],
    protocols: [
      { name: 'HTTP', description: '用于浏览器与 Web 服务器之间传输超文本资源。', examples: ['Web 页面访问', 'REST API'] },
      { name: 'DNS', description: '将域名解析为 IP 地址，为应用访问提供目标地址。', examples: ['www.example.com 查询'] },
      { name: 'SMTP/POP3/IMAP', description: '用于电子邮件发送与接收。', examples: ['邮件客户端收发邮件'] }
    ],
    devices: [
      { name: 'Web服务器', role: '提供 HTTP 服务并返回页面、图片或接口数据。' },
      { name: 'DNS服务器', role: '维护域名记录并响应解析请求。' },
      { name: '客户端主机', role: '运行浏览器、邮件客户端等网络应用。' }
    ],
    encapsulation: {
      pdu: '报文',
      headerFields: ['请求方法/响应状态', '域名或资源路径', '应用协议头部', '应用数据'],
      nextLayer: '传输层'
    },
    collaboration: [
      { targetLayer: '传输层', description: '应用层选择 TCP 或 UDP，并通过端口号定位目标应用进程。' }
    ]
  },
  {
    id: 'transport',
    title: '传输层',
    order: 2,
    summary: '传输层负责端到端进程通信，提供端口复用、可靠传输、流量控制或低开销无连接传输。',
    concepts: [
      { title: '端口号', description: '用于区分同一主机上的不同应用进程。' },
      { title: '可靠传输', description: '通过序号、确认、重传和窗口控制保证数据可靠到达。' },
      { title: '连接管理', description: 'TCP 使用三次握手建立连接，使用四次挥手释放连接。' }
    ],
    protocols: [
      { name: 'TCP', description: '面向连接、可靠、有序的传输协议。', examples: ['HTTP/1.1', 'HTTPS', '文件传输'] },
      { name: 'UDP', description: '无连接、低开销、尽力而为的传输协议。', examples: ['DNS 查询', '实时音视频'] }
    ],
    devices: [
      { name: '主机操作系统', role: '维护套接字、端口、TCP 状态和重传队列。' },
      { name: '防火墙/NAT设备', role: '可能根据端口和连接状态过滤或转换传输层流量。' }
    ],
    encapsulation: {
      pdu: '段/数据报',
      headerFields: ['源端口', '目的端口', '序号', '确认号', '标志位', '校验和'],
      nextLayer: '网络层'
    },
    collaboration: [
      { targetLayer: '应用层', description: '接收应用报文，并通过端口号交付给正确应用。' },
      { targetLayer: '网络层', description: '将传输层段交给 IP 层，由 IP 负责跨网络寻址和转发。' }
    ]
  },
  {
    id: 'network',
    title: '网络层',
    order: 3,
    summary: '网络层负责跨网络的逻辑寻址、路由选择和分组转发，使数据能够从源主机到达目标主机。',
    concepts: [
      { title: 'IP 地址', description: '用于标识网络中的主机或接口，是跨网段通信的逻辑地址。' },
      { title: '路由', description: '根据目标 IP 和路由表选择下一跳。' },
      { title: '分组转发', description: '路由器逐跳转发 IP 数据包直到目标网络。' }
    ],
    protocols: [
      { name: 'IPv4/IPv6', description: '核心网络层协议，定义地址格式和数据包结构。', examples: ['跨网段访问 Web 服务器'] },
      { name: 'ICMP', description: '用于差错报告和网络诊断。', examples: ['ping', 'traceroute'] },
      { name: 'ARP', description: '在 IPv4 局域网内解析下一跳 IP 对应的 MAC 地址。', examples: ['获取网关 MAC'] }
    ],
    devices: [
      { name: '路由器', role: '根据路由表连接不同网络并转发 IP 数据包。' },
      { name: '三层交换机', role: '在局域网内部进行高速三层转发。' }
    ],
    encapsulation: {
      pdu: '数据包',
      headerFields: ['源IP', '目的IP', 'TTL', '协议号', '首部校验和'],
      nextLayer: '数据链路层'
    },
    collaboration: [
      { targetLayer: '传输层', description: '承载 TCP/UDP 数据并使用协议号标识上层类型。' },
      { targetLayer: '数据链路层', description: '每一跳都重新封装链路层帧，交给下一跳设备。' }
    ]
  },
  {
    id: 'data-link',
    title: '数据链路层',
    order: 4,
    summary: '数据链路层负责同一链路或局域网内的帧传输、MAC 寻址、差错检测和介质访问控制。',
    concepts: [
      { title: 'MAC 地址', description: '网卡的链路层地址，用于同一局域网内的直接交付。' },
      { title: '帧', description: '数据链路层的协议数据单元，封装网络层数据包。' },
      { title: '交换表学习', description: '交换机根据源 MAC 学习端口映射，并按目的 MAC 转发。' }
    ],
    protocols: [
      { name: 'Ethernet', description: '最常见的局域网链路层协议。', examples: ['以太网帧传输'] },
      { name: 'ARP', description: '配合 IPv4 获取同一链路上下一跳 MAC 地址。', examples: ['ARP 请求/响应'] },
      { name: 'PPP', description: '点到点链路封装协议。', examples: ['广域网点到点连接'] }
    ],
    devices: [
      { name: '交换机', role: '根据 MAC 地址表在局域网内转发帧。' },
      { name: '网卡', role: '收发以太网帧并进行物理信号转换。' }
    ],
    encapsulation: {
      pdu: '帧',
      headerFields: ['源MAC', '目的MAC', '类型字段', 'FCS'],
      nextLayer: '物理层'
    },
    collaboration: [
      { targetLayer: '网络层', description: '封装 IP 数据包，并在每一跳根据下一跳 MAC 重新生成帧头。' },
      { targetLayer: '物理层', description: '将帧转换为比特流，通过传输介质发送。' }
    ]
  },
  {
    id: 'physical',
    title: '物理层',
    order: 5,
    summary: '物理层负责比特流在传输介质上的编码、发送和接收，是所有上层通信的基础。',
    concepts: [
      { title: '比特流', description: '物理层传输的 0/1 序列。' },
      { title: '信号编码', description: '将数字比特转换为电信号、光信号或无线电信号。' },
      { title: '传输介质', description: '双绞线、光纤、无线信道等承载信号的媒介。' }
    ],
    protocols: [
      { name: '以太网物理规范', description: '定义速率、线缆、接口和电气/光学特性。', examples: ['100BASE-TX', '1000BASE-T'] },
      { name: 'Wi-Fi 物理层', description: '定义无线频段、调制和信道访问基础。', examples: ['802.11n/ac/ax'] }
    ],
    devices: [
      { name: '网线/光纤', role: '承载电信号或光信号。' },
      { name: '集线器/中继器', role: '放大或转发物理信号。' },
      { name: '无线接入点', role: '在无线介质中发送和接收信号。' }
    ],
    encapsulation: {
      pdu: '比特',
      headerFields: ['前导码', '物理编码', '信号时钟'],
      nextLayer: '传输介质'
    },
    collaboration: [
      { targetLayer: '数据链路层', description: '接收链路层帧并转换为物理信号，或将收到的信号还原为帧。' }
    ]
  }
]

const graph = {
  categories: [
    { name: '层级' },
    { name: '协议' },
    { name: '设备' },
    { name: '封装单元' },
    { name: '概念' }
  ],
  nodes: [
    { id: 'application', name: '应用层', category: '层级', layerId: 'application', description: '定义应用进程之间交换数据的规则。' },
    { id: 'transport', name: '传输层', category: '层级', layerId: 'transport', description: '提供端到端进程通信。' },
    { id: 'network', name: '网络层', category: '层级', layerId: 'network', description: '负责 IP 寻址、路由和转发。' },
    { id: 'data-link', name: '数据链路层', category: '层级', layerId: 'data-link', description: '负责局域网内帧传输。' },
    { id: 'physical', name: '物理层', category: '层级', layerId: 'physical', description: '负责比特信号传输。' },
    { id: 'http', name: 'HTTP', category: '协议', layerId: 'application', description: 'Web 请求响应协议。' },
    { id: 'dns', name: 'DNS', category: '协议', layerId: 'application', description: '域名解析协议。' },
    { id: 'tcp', name: 'TCP', category: '协议', layerId: 'transport', description: '可靠面向连接传输协议。' },
    { id: 'udp', name: 'UDP', category: '协议', layerId: 'transport', description: '低开销无连接传输协议。' },
    { id: 'ip', name: 'IP', category: '协议', layerId: 'network', description: '网络层核心协议。' },
    { id: 'arp', name: 'ARP', category: '协议', layerId: 'data-link', description: '解析 IP 到 MAC 地址。' },
    { id: 'ethernet', name: 'Ethernet', category: '协议', layerId: 'data-link', description: '常用局域网链路层协议。' },
    { id: 'router', name: '路由器', category: '设备', layerId: 'network', description: '连接不同网络并转发 IP 包。' },
    { id: 'switch', name: '交换机', category: '设备', layerId: 'data-link', description: '根据 MAC 表转发以太网帧。' },
    { id: 'server', name: '服务器', category: '设备', layerId: 'application', description: '提供应用层服务。' },
    { id: 'message', name: '报文', category: '封装单元', layerId: 'application', description: '应用层数据单元。' },
    { id: 'segment', name: '段/数据报', category: '封装单元', layerId: 'transport', description: '传输层数据单元。' },
    { id: 'packet', name: '数据包', category: '封装单元', layerId: 'network', description: '网络层数据单元。' },
    { id: 'frame', name: '帧', category: '封装单元', layerId: 'data-link', description: '数据链路层数据单元。' },
    { id: 'bit', name: '比特', category: '封装单元', layerId: 'physical', description: '物理层传输单位。' }
  ],
  edges: [
    { source: 'application', target: 'transport', relation: '向下交付报文' },
    { source: 'transport', target: 'network', relation: '封装端口与可靠性信息' },
    { source: 'network', target: 'data-link', relation: '选择下一跳并交付帧封装' },
    { source: 'data-link', target: 'physical', relation: '转换为比特信号' },
    { source: 'http', target: 'application', relation: '属于' },
    { source: 'dns', target: 'application', relation: '属于' },
    { source: 'tcp', target: 'transport', relation: '属于' },
    { source: 'udp', target: 'transport', relation: '属于' },
    { source: 'ip', target: 'network', relation: '属于' },
    { source: 'arp', target: 'data-link', relation: '辅助寻址' },
    { source: 'ethernet', target: 'data-link', relation: '属于' },
    { source: 'router', target: 'network', relation: '工作于' },
    { source: 'switch', target: 'data-link', relation: '工作于' },
    { source: 'server', target: 'application', relation: '提供服务' },
    { source: 'application', target: 'message', relation: '产生' },
    { source: 'transport', target: 'segment', relation: '封装为' },
    { source: 'network', target: 'packet', relation: '封装为' },
    { source: 'data-link', target: 'frame', relation: '封装为' },
    { source: 'physical', target: 'bit', relation: '传输' },
    { source: 'dns', target: 'udp', relation: '通常使用' },
    { source: 'http', target: 'tcp', relation: '通常使用' },
    { source: 'tcp', target: 'ip', relation: '承载于' },
    { source: 'udp', target: 'ip', relation: '承载于' },
    { source: 'ip', target: 'ethernet', relation: '封装到' }
  ]
}

module.exports = { layers, graph }
