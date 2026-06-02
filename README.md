# 计算机网络实习项目

这是一个基于 Vue 3 + Vite 的计算机网络交互式学习平台，面向协议原理学习、综合网络场景模拟和 TCP/IP 五层模型知识库展示。项目通过动画、拓扑图、步骤说明和知识图谱帮助用户理解 DNS、TCP、HTTP、ARP 等网络协议的工作过程。

## 功能概览

- **协议原理可视化**：展示 DNS 解析、TCP 三次握手、TCP 四次挥手、HTTP 请求响应、ARP 地址解析等过程。
- **综合网络场景模拟**：以 Web 访问为主线，串联 ARP、DNS、TCP、HTTP 等协议步骤。
- **计算机网络知识库**：围绕 TCP/IP 五层模型展示应用层、传输层、网络层、数据链路层、物理层和知识图谱。
- **交互式步骤控制**：支持上一步、下一步、重置和步骤跳转。
- **知识图谱展示**：使用 ECharts graph 展示层级、协议、设备、封装单元和核心概念之间的关系。

## 技术栈

- 前端框架：Vue 3
- 构建工具：Vite
- 后端服务：Express
- 数据存储：SQLite（better-sqlite3）
- 图谱/拓扑可视化：ECharts、vis-network

## 三方库列表

### 运行依赖

| 库 | 版本 | 用途 |
| --- | --- | --- |
| `vue` | `^3.5.35` | 前端组件化开发与响应式状态管理 |
| `vite` | `^8.0.16` | 前端开发服务器、构建和预览 |
| `@vitejs/plugin-vue` | `^6.0.7` | Vite 的 Vue 单文件组件支持 |
| `express` | `^5.2.1` | 后端 API 服务 |
| `better-sqlite3` | `^12.10.0` | SQLite 数据库读写 |
| `echarts` | `^6.1.0` | 知识图谱可视化 |
| `vis-network` | `^10.1.0` | 网络拓扑图渲染 |
| `element-plus` | `^2.14.1` | UI 组件库依赖 |
| `mermaid` | `^11.15.0` | 图表绘制依赖 |

## 图形素材来源

本项目未使用外部图片、图标包、插画或第三方下载的图形素材。

项目中的图形内容均由代码实时生成：

- 网络拓扑节点与链路由 `vis-network` 根据项目内置数据绘制。
- 数据包动画由项目组件通过 HTML/CSS 和 Vue 状态生成。
- 知识图谱由 `ECharts graph` 根据后端知识库数据绘制。
- 页面中的编号、标签、按钮和状态标识均为文字或 CSS 样式生成。

因此不存在需要额外标注版权来源的外部图形素材。

## 项目结构

```text
.
├── server/                 # Express API 与 SQLite 知识库数据
│   ├── index.js            # 后端服务入口
│   ├── db.js               # 数据库初始化与查询
│   └── seedKnowledge.js    # TCP/IP 五层模型知识库种子数据
├── src/
│   ├── components/         # 通用布局、动画、图谱和信息展示组件
│   ├── composables/        # 动画步骤状态逻辑
│   ├── pages/              # 页面级模块
│   ├── services/           # 前端 API 请求封装
│   ├── App.vue             # 应用入口与页面切换
│   └── main.js             # Vue 挂载入口
├── index.html
├── package.json
└── vite.config.js
```

## 安装与运行

安装依赖：

```bash
npm install
```

启动前端开发服务器：

```bash
npm run dev
```

启动后端知识库 API：

```bash
npm run dev:server
```

构建生产版本：

```bash
npm run build
```

预览生产构建：

```bash
npm run preview
```

## 后端 API

后端默认运行在 `http://localhost:3000`，前端开发服务器通过 Vite 代理访问 `/api`。

| 接口 | 说明 |
| --- | --- |
| `GET /api/knowledge/layers` | 获取 TCP/IP 五层模型层级列表 |
| `GET /api/knowledge/layers/:id` | 获取指定层级的详细知识内容 |
| `GET /api/knowledge/graph` | 获取知识图谱节点、边和分类数据 |

## 页面模块说明

### 协议原理可视化

包含 DNS、TCP 三次握手、TCP 四次挥手、HTTP、ARP 等协议动画。每个协议页面由拓扑图、数据包动画、步骤说明和控制器组成。

### 综合网络场景模拟

以主机访问 Web 服务器为场景，按步骤展示 ARP 获取 MAC 地址、DNS 查询、TCP 建连、HTTP 请求和响应等完整链路。

### 计算机网络知识库

围绕 TCP/IP 五层模型组织知识内容。每个层级包含层级概览、核心概念、典型协议、相关设备/组件、数据封装和层间协作关系；知识图谱页展示各知识点之间的关联。

## 设计风格

项目采用极简主义风格：白色背景、深灰文字、蓝色主色，无阴影、无渐变，统一使用 `system-ui` 字体和 24px 组件间距。