async function requestJson(url, options = {}) {
  const response = await fetch(url, options)

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || `请求失败：${response.status}`)
  }

  return response.json()
}

function postJson(url, body) {
  return requestJson(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
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

export async function fetchKnowledgeLibraries() {
  const data = await requestJson('/api/knowledge/libraries')
  return data.libraries || []
}

export async function fetchKnowledgeLibraryTabs(libraryId) {
  const data = await requestJson(`/api/knowledge/libraries/${encodeURIComponent(libraryId)}/tabs`)
  return data.tabs || []
}

export async function fetchKnowledgeLibraryLayers(libraryId) {
  const data = await requestJson(`/api/knowledge/libraries/${encodeURIComponent(libraryId)}/layers`)
  return data.layers || []
}

export async function fetchKnowledgeLibraryLayer(libraryId, layerId) {
  const data = await requestJson(`/api/knowledge/libraries/${encodeURIComponent(libraryId)}/layers/${encodeURIComponent(layerId)}`)
  return data.layer
}

export async function fetchKnowledgeLibraryGraph(libraryId) {
  const data = await requestJson(`/api/knowledge/libraries/${encodeURIComponent(libraryId)}/graph`)
  return data.graph || { nodes: [], edges: [], categories: [] }
}

export async function createKnowledgeLibrary(payload) {
  const data = await postJson('/api/knowledge/libraries', payload)
  return data.library
}
