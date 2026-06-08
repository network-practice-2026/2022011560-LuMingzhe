async function requestJson(url) {
  const response = await fetch(url)

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `请求失败：${response.status}`)
  }

  return response.json()
}

export async function fetchKnowledgeTopics() {
  const data = await requestJson('/api/knowledge/topics')
  return data.topics || []
}

export async function fetchKnowledgeLayers() {
  const data = await requestJson('/api/knowledge/layers')
  return data.layers || []
}

export async function fetchKnowledgeLayer(id) {
  const data = await requestJson(`/api/knowledge/layers/${encodeURIComponent(id)}`)
  return data.layer
}

export async function fetchKnowledgeGraph() {
  const data = await requestJson('/api/knowledge/graph')
  return data.graph || { nodes: [], edges: [], categories: [] }
}
