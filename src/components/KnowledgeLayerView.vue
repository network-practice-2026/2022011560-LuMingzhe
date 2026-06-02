<template>
  <div class="layer-view">
    <section class="summary-card">
      <div class="layer-order">TCP/IP 五层模型 · 第 {{ layer.order }} 层</div>
      <h3>{{ layer.title }}</h3>
      <p>{{ layer.summary }}</p>
    </section>

    <section
      v-for="section in sections"
      :key="section.id"
      class="section-card"
    >
      <button class="section-header" @click="toggle(section.id)">
        <span>{{ section.title }}</span>
        <span class="toggle-mark">{{ expanded[section.id] ? '−' : '+' }}</span>
      </button>

      <div v-if="expanded[section.id]" class="section-body">
        <div v-if="section.id === 'concepts'" class="item-grid">
          <article v-for="item in layer.concepts" :key="item.title" class="info-item">
            <h4>{{ item.title }}</h4>
            <p>{{ item.description }}</p>
          </article>
        </div>

        <div v-else-if="section.id === 'protocols'" class="item-grid">
          <article v-for="protocol in layer.protocols" :key="protocol.name" class="info-item">
            <h4>{{ protocol.name }}</h4>
            <p>{{ protocol.description }}</p>
            <div v-if="protocol.examples?.length" class="tags">
              <span v-for="example in protocol.examples" :key="example" class="tag">
                {{ example }}
              </span>
            </div>
          </article>
        </div>

        <div v-else-if="section.id === 'devices'" class="item-grid">
          <article v-for="device in layer.devices" :key="device.name" class="info-item">
            <h4>{{ device.name }}</h4>
            <p>{{ device.role }}</p>
          </article>
        </div>

        <div v-else-if="section.id === 'encapsulation'" class="encapsulation">
          <div class="pdu-card">
            <span class="pdu-label">PDU</span>
            <strong>{{ layer.encapsulation.pdu }}</strong>
          </div>
          <div class="field-list">
            <span
              v-for="field in layer.encapsulation.headerFields"
              :key="field"
              class="field-chip"
            >
              {{ field }}
            </span>
          </div>
          <p class="next-layer">向下交付：{{ layer.encapsulation.nextLayer }}</p>
        </div>

        <div v-else-if="section.id === 'collaboration'" class="collaboration-list">
          <div v-for="item in layer.collaboration" :key="item.targetLayer" class="collaboration-item">
            <strong>{{ item.targetLayer }}</strong>
            <p>{{ item.description }}</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'

const props = defineProps({
  layer: {
    type: Object,
    required: true
  }
})

const sections = [
  { id: 'concepts', title: '核心概念' },
  { id: 'protocols', title: '典型协议' },
  { id: 'devices', title: '相关设备/组件' },
  { id: 'encapsulation', title: '数据封装' },
  { id: 'collaboration', title: '层间协作关系' }
]

const expanded = reactive({
  concepts: true,
  protocols: true,
  devices: true,
  encapsulation: true,
  collaboration: true
})

const toggle = (id) => {
  expanded[id] = !expanded[id]
}

watch(() => props.layer.id, () => {
  sections.forEach(section => {
    expanded[section.id] = true
  })
})
</script>

<style scoped>
.layer-view {
  display: flex;
  flex-direction: column;
  gap: var(--spacing);
}

.summary-card,
.section-card {
  background: var(--bg-color);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
}

.summary-card {
  padding: var(--spacing);
}

.layer-order {
  font-size: 12px;
  color: var(--primary-color);
  margin-bottom: 8px;
  font-weight: 500;
}

.summary-card h3 {
  font-size: 22px;
  font-weight: 600;
  color: var(--text-color);
  margin-bottom: 12px;
}

.summary-card p {
  color: var(--muted-text-color);
  line-height: 1.5;
}

.section-header {
  width: 100%;
  padding: 16px var(--spacing);
  border: none;
  background: var(--subtle-bg-color);
  color: var(--text-color);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  font-family: var(--font-family);
  line-height: 1.5;
}

.toggle-mark {
  color: var(--primary-color);
  font-size: 20px;
  line-height: 1;
}

.section-body {
  padding: var(--spacing);
  border-top: 1px solid var(--border-color);
}

.item-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.info-item {
  padding: 16px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-color);
}

.info-item h4 {
  font-size: 15px;
  color: var(--text-color);
  margin-bottom: 8px;
}

.info-item p,
.collaboration-item p,
.next-layer {
  font-size: 13px;
  color: var(--muted-text-color);
  line-height: 1.5;
}

.tags,
.field-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 12px;
}

.tag,
.field-chip {
  padding: 3px 8px;
  background: var(--active-bg-color);
  color: var(--primary-color);
  border-radius: var(--border-radius);
  font-size: 12px;
}

.encapsulation {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.pdu-card {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.pdu-label {
  font-size: 12px;
  color: var(--muted-text-color);
}

.pdu-card strong {
  color: var(--primary-color);
  font-size: 18px;
}

.collaboration-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.collaboration-item {
  padding: 14px 16px;
  background: var(--subtle-bg-color);
  border-left: 2px solid var(--primary-color);
  border-radius: var(--border-radius);
}

.collaboration-item strong {
  display: block;
  margin-bottom: 6px;
  color: var(--text-color);
}
</style>
