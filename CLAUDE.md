# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

This is a Vue 3 + Vite single-page application for a computer networking internship project. The UI is a Chinese interactive learning/visualization platform for network protocol animations, comprehensive network scenario simulations, and knowledge graph displays.

The planned scope in `网络实习计划书.txt` centers on:
- protocol visualizations such as DNS, TCP handshakes/teardown, HTTP, and ARP
- comprehensive network scenarios such as Web access across hosts, switches, routers, DNS, and servers
- knowledge-system visualizations using ECharts and Mermaid

## Commands

Current `package.json` only defines a placeholder `test` script. Use Vite directly for development/build commands:

```bash
# Install dependencies
npm install

# Start dev server (Vite config uses port 5173)
npx vite --host 0.0.0.0

# Build production assets
npx vite build

# Preview production build
npx vite preview --host 0.0.0.0
```

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

### Shared layout and animation components

The reusable visualization framework is in `src/components/` and `src/composables/`:

- `SplitLayout.vue` provides the two-pane layout used by the protocol, simulation, and knowledge sections: left sidebar list, right content slot.
- `NetworkTopology.vue` wraps `vis-network/standalone` and renders fixed-coordinate network nodes/edges. It accepts `nodes`, `edges`, and computed `nodeStates`; physics is disabled, and node dragging is currently disabled.
- `PacketAnimator.vue` overlays animated packet labels on top of topology coordinates. Packet actions are expected to have `from`, `to`, `flags`, and optional color/SEQ/ACK fields.
- `StepController.vue` renders previous/next/reset/goto controls and step progress dots.
- `InfoPanel.vue` renders the current step title/description plus optional protocol-specific detail slots.
- `useAnimationState.js` is the shared step-state engine. It tracks `currentStepIndex`, next/prev/goto/reset state, derives current packet actions, and folds previous `actions` into node state.

### Animation data contract

Protocol and simulation pages embed animation data objects rather than loading from a backend. Most visualization components expect this shape:

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

- `src/pages/ProtocolPage.vue` defines the protocol list and inline animation datasets for DNS, TCP three-way handshake, TCP four-way close, HTTP request/response, and ARP. It selects the corresponding visualization component by `currentProtocolId`.
- `src/pages/SimulationPage.vue` defines scenario choices and contains the inline `webAccessData` scenario for H1 accessing a Web server through ARP, DNS, TCP, and HTTP steps.
- `src/pages/KnowledgePage.vue` currently provides sidebar entries and placeholder content for knowledge-graph views.
- `AnimationLoader.vue` contains a mock TCP handshake data loader and optional fetch-based loading path, but current protocol/simulation pages pass inline data directly.

### Visualization component pattern

Files such as `TcpHandshakeVisualization.vue`, `DnsVisualization.vue`, and `WebAccessSimulation.vue` follow the same pattern:

1. Receive `animationData` as a required prop.
2. Wrap it in a computed ref and pass it into `useAnimationState`.
3. Compute `nodeStates` via `computeNodeStates()`.
4. Render `NetworkTopology`, overlay `PacketAnimator`, render protocol-specific details in `InfoPanel`, then show `StepController`.
5. Compute packet overlay coordinates from topology node `x/y` values and the current wrapper size.

When adding a new protocol or simulation, prefer reusing this pattern and only customize the extra detail panel and derived tables/state needed for that scenario.

## Dependencies to be aware of

- Runtime: Vue 3, Element Plus, ECharts, Mermaid, vis-network, Express, better-sqlite3.
- Dev/build: Vite and `@vitejs/plugin-vue`.
- Express and better-sqlite3 are installed but no backend source files are currently present in the repository root or `src/`.
