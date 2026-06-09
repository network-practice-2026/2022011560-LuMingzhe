# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This is a Vue 3 + Vite single-page application for a computer networking internship project. The UI is a Chinese interactive learning/visualization platform for network protocol animations, comprehensive network scenario simulations, and knowledge graph displays.

The implemented scope centers on:
- protocol visualizations such as DNS, TCP handshakes/teardown, HTTP, and ARP
- comprehensive network scenarios such as Web access across hosts, switches, routers, DNS, and servers
- knowledge-system visualizations and editable custom knowledge libraries backed by SQLite

## Commands

Use the scripts defined in `package.json`:

```bash
# Install dependencies
npm install

# Start backend API server on port 3000
npm run dev:server

# Start frontend dev server on port 5173
npm run dev

# Build production assets
npm run build

# Preview production build
npm run preview
```

Windows users can run `start-web.bat` from the repository root to start the backend, open the browser, and run the frontend dev server.

There is currently no configured lint command and no real test runner. `npm test` intentionally exits with `Error: no test specified`.

## Architecture

### App shell and navigation

- `src/main.js` mounts the Vue app into `#app`.
- `src/App.vue` owns top-level page state with `currentPage` and switches between:
  - `NavigationPage.vue`
  - `ProtocolPage.vue`
  - `SimulationPage.vue`
  - `KnowledgePage.vue`
- There is no Vue Router; page transitions are local component state and emitted events.
- Global design tokens live in `src/App.vue` CSS variables. The intended style is minimal: white background, dark gray text, blue primary color `#0066FF`, system font, 24px spacing, no decorative shadows/gradients.

### Frontend/backend split

- The frontend dev server is Vite on port `5173`.
- `vite.config.js` proxies `/api` requests to `http://localhost:3000`.
- The backend API server is `server/index.js`, an Express app using `express.json()` and default port `3000`.
- `server/db.js` owns the SQLite connection, schema initialization, lightweight migrations/backfills, read queries, and custom knowledge-library writes.
- `server/knowledge.db` is the persistent SQLite database for protocol data, simulation data, knowledge libraries, layers, tabs, graph data, and topics.

### Frontend API services

- `src/services/protocolApi.js` loads protocol lists and protocol animation details from `/api/protocols`.
- `src/services/simulationApi.js` loads simulation lists and simulation animation details from `/api/simulations`.
- `src/services/knowledgeApi.js` loads knowledge libraries, tabs, layers, graph data, and exposes write calls for creating custom libraries and editing custom layer fields.

### Shared layout and animation components

The reusable visualization framework is in `src/components/` and `src/composables/`:

- `SplitLayout.vue` provides the two-pane layout used by the protocol, simulation, and knowledge sections: left sidebar list, right content slot.
- `NetworkTopology.vue` wraps `vis-network/standalone` and renders fixed-coordinate network nodes/edges. It accepts `nodes`, `edges`, and computed `nodeStates`; physics is disabled, and node dragging is currently disabled.
- `PacketAnimator.vue` overlays animated packet labels on top of topology coordinates. Packet actions are expected to have `from`, `to`, `flags`, and optional color/SEQ/ACK fields.
- `StepController.vue` renders previous/next/reset/goto controls and step progress dots.
- `InfoPanel.vue` renders the current step title/description plus optional protocol-specific detail slots.
- `useAnimationState.js` is the shared step-state engine. It tracks `currentStepIndex`, next/prev/goto/reset state, derives current packet actions, and folds previous `actions` into node state.

### Animation data contract

Protocol and simulation animation data is served by the backend and consumed by the visualization components with this shape:

```js
{
  id: 'tcp-handshake',
  title: 'TCP 三次握手',
  description: '...',
  topology: {
    nodes: [{ id, label, x, y, shape? }],
    edges: [{ id, from, to, label? }]
  },
  steps: [
    {
      id: 'step-1',
      title: '...',
      description: '...',
      actions: [
        { type: 'highlightNode', nodeId, color? },
        { type: 'updateState', nodeId, state, color?, label? },
        { type: 'sendPacket', from, to, flags, color?, seq?, ack? }
      ],
      data: { /* rendered by each visualization page */ }
    }
  ],
  initialStates: {
    nodeId: { state, color, label? }
  }
}
```

`useAnimationState.js` currently interprets these action types:
- `updateState`: updates a node's displayed state/color/label
- `highlightNode`: marks a node highlighted
- `sendPacket`: exposed via `currentPackets` for `PacketAnimator`

### Page-specific structure

- `src/pages/ProtocolPage.vue` fetches protocol list/detail data through `protocolApi.js`, caches loaded animation data, and selects the matching visualization component by protocol id.
- `src/pages/SimulationPage.vue` fetches simulation list/detail data through `simulationApi.js`, caches loaded animation data, and renders the matching simulation visualization.
- `src/pages/KnowledgePage.vue` fetches knowledge libraries, tabs, layers, and graph data through `knowledgeApi.js`. It also opens the custom-library creation modal and syncs updated layer data returned by edit forms.
- `AnimationLoader.vue` contains an older mock TCP handshake loader and optional fetch-based loading path; current protocol/simulation pages use the dedicated API services instead.

### Visualization component pattern

Files such as `TcpHandshakeVisualization.vue`, `DnsVisualization.vue`, and `WebAccessSimulation.vue` follow the same pattern:

1. Receive `animationData` as a required prop.
2. Wrap it in a computed ref and pass it into `useAnimationState`.
3. Compute `nodeStates` via `computeNodeStates()`.
4. Render `NetworkTopology`, overlay `PacketAnimator`, render protocol-specific details in `InfoPanel`, then show `StepController`.
5. Compute packet overlay coordinates from topology node `x/y` values and the current wrapper size.

When adding a new protocol or simulation, prefer reusing this pattern and only customize the extra detail panel and derived tables/state needed for that scenario. Add or seed backend data rather than embedding new long animation datasets in page components.

### Knowledge library model

The knowledge module is backend-driven and persisted in SQLite:

- `knowledge_libraries` stores built-in and custom library metadata. The built-in TCP/IP library uses `id = 'tcp-ip-knowledge'` and `is_builtin = 1`.
- `knowledge_library_tabs` stores the layer tabs shown in `KnowledgeTabs.vue`.
- `knowledge_layers` stores each layer summary plus a JSON `data` blob.
- `knowledge_graph` stores graph visualization data per library.
- Built-in libraries are read-only for mutation APIs; custom libraries are writable.
- Custom layer database row ids are namespaced as `${library.id}:${layer.id}`, while built-in layer ids may be plain ids such as `application`.

A normalized knowledge layer JSON object has this shape:

```js
{
  id: 'application',
  title: '应用层',
  order: 1,
  summary: '...',
  concepts: [{ title, description }],
  protocols: [{ name, description, examples: string[] }],
  devices: [{ name, role }],
  encapsulation: {
    pdu: '报文',
    headerFields: ['请求方法/响应状态'],
    nextLayer: '传输层'
  },
  collaboration: [{ targetLayer, description }]
}
```

### Knowledge library UI and editing

- `KnowledgeTabs.vue` renders layer tabs plus the graph tab.
- `KnowledgeLayerView.vue` renders layer sections and contains inline edit forms for custom libraries only.
- `KnowledgeGraphView.vue` renders ECharts graph data and selected-node details.
- `CreateKnowledgeLibraryModal.vue` supports manual custom-library creation and JSON import.
- `KnowledgeLayerView.vue` gates editing with `isBuiltin`; built-in libraries should not show add/update forms.
- Field-level editing uses `knowledgeApi.js` wrappers:
  - `updateKnowledgeLibraryLayer(libraryId, layerId, patch)` updates layer fields such as encapsulation metadata.
  - `addKnowledgeLayerItem(libraryId, layerId, section, item)` appends `concepts`, `protocols`, `devices`, or `collaboration` entries.
  - `addKnowledgeLayerHeaderField(libraryId, layerId, field)` appends `encapsulation.headerFields` entries.
- After a successful layer edit, `KnowledgePage.vue` handles `layer-updated` and updates its layer cache and sidebar layer summaries.

## Dependencies to be aware of

- Runtime: Vue 3, Element Plus, ECharts, Mermaid, vis-network, Express, better-sqlite3.
- Dev/build: Vite and `@vitejs/plugin-vue`.
- Backend source lives in `server/`; do not treat Express/better-sqlite3 as unused dependencies.
