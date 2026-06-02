<template>
  <div class="graph-view">
    <div ref="chartRef" class="graph-chart"></div>

    <aside class="node-panel">
      <template v-if="selectedNode">
        <span class="node-category">{{ selectedNode.category }}</span>
        <h3>{{ selectedNode.name }}</h3>
        <p>{{ selectedNode.description || '暂无详细说明' }}</p>
        <span v-if="selectedNode.layerId" class="layer-tag">
          {{ layerTitle(selectedNode.layerId) }}
        </span>
      </template>
      <template v-else>
        <h3>知识图谱</h3>
        <p>点击图中的层级、协议、设备或封装单元查看说明。</p>
      </template>
    </aside>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  graph: {
    type: Object,
    required: true
  },
  layers: {
    type: Array,
    default: () => []
  }
})

const chartRef = ref(null)
const selectedNode = ref(null)
let chart = null

const categoryNames = computed(() => (props.graph.categories || []).map(item => item.name))

const layerTitle = (id) => {
  return props.layers.find(layer => layer.id === id)?.title || id
}

const buildOption = () => {
  const nodes = (props.graph.nodes || []).map(node => ({
    ...node,
    category: categoryNames.value.indexOf(node.category),
    symbolSize: node.category === '层级' ? 58 : 42
  }))

  const edges = (props.graph.edges || []).map(edge => ({
    source: edge.source,
    target: edge.target,
    label: {
      show: true,
      formatter: edge.relation,
      fontSize: 10,
      color: '#666'
    }
  }))

  return {
    tooltip: {
      formatter: params => {
        if (params.dataType === 'edge') return params.data.label?.formatter || ''
        return `${params.data.name}<br/>${params.data.description || ''}`
      }
    },
    legend: [{
      data: categoryNames.value,
      bottom: 0,
      textStyle: { color: '#666' }
    }],
    series: [
      {
        type: 'graph',
        layout: 'force',
        roam: true,
        draggable: true,
        categories: (props.graph.categories || []).map(item => ({
          name: item.name,
          itemStyle: {
            color: item.name === '层级' ? '#0066FF' : '#F0F7FF'
          }
        })),
        data: nodes,
        links: edges,
        force: {
          repulsion: 220,
          edgeLength: 110
        },
        label: {
          show: true,
          position: 'inside',
          color: '#333',
          fontSize: 11
        },
        edgeSymbol: ['none', 'arrow'],
        edgeSymbolSize: 8,
        lineStyle: {
          color: '#999',
          curveness: 0.08
        },
        emphasis: {
          focus: 'adjacency'
        }
      }
    ]
  }
}

const renderChart = async () => {
  await nextTick()
  if (!chartRef.value) return

  if (!chart) {
    chart = echarts.init(chartRef.value)
    chart.on('click', params => {
      if (params.dataType === 'node') {
        selectedNode.value = params.data
      }
    })
  }

  chart.setOption(buildOption(), true)
}

const resize = () => {
  chart?.resize()
}

watch(() => props.graph, renderChart, { deep: true })

onMounted(() => {
  renderChart()
  window.addEventListener('resize', resize)
})

onUnmounted(() => {
  window.removeEventListener('resize', resize)
  chart?.dispose()
  chart = null
})
</script>

<style scoped>
.graph-view {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 280px;
  gap: var(--spacing);
  min-height: 560px;
}

.graph-chart {
  min-height: 560px;
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--subtle-bg-color);
}

.node-panel {
  padding: var(--spacing);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  background: var(--bg-color);
  align-self: start;
  min-height: 180px;
}

.node-category,
.layer-tag {
  display: inline-block;
  padding: 3px 8px;
  background: var(--active-bg-color);
  color: var(--primary-color);
  border-radius: var(--border-radius);
  font-size: 12px;
  margin-bottom: 12px;
}

.node-panel h3 {
  font-size: 18px;
  color: var(--text-color);
  margin-bottom: 10px;
}

.node-panel p {
  font-size: 13px;
  color: var(--muted-text-color);
  line-height: 1.5;
  margin-bottom: 16px;
}

@media (max-width: 900px) {
  .graph-view {
    grid-template-columns: 1fr;
  }
}
</style>
