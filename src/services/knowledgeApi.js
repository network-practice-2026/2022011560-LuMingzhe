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

function patchJson(url, body) {
  return requestJson(url, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
}

function deleteJson(url) {
  return requestJson(url, {
    method: 'DELETE'
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

export async function createKnowledgeLibraryTab(libraryId, payload) {
  return postJson(`/api/knowledge/libraries/${encodeURIComponent(libraryId)}/tabs`, payload)
}

export async function updateKnowledgeLibraryTab(libraryId, tabId, patch) {
  return patchJson(`/api/knowledge/libraries/${encodeURIComponent(libraryId)}/tabs/${encodeURIComponent(tabId)}`, patch)
}

export async function deleteKnowledgeLibraryTab(libraryId, tabId) {
  return deleteJson(`/api/knowledge/libraries/${encodeURIComponent(libraryId)}/tabs/${encodeURIComponent(tabId)}`)
}

export async function updateKnowledgeLibraryLayer(libraryId, layerId, patch) {
  const data = await patchJson(`/api/knowledge/libraries/${encodeURIComponent(libraryId)}/layers/${encodeURIComponent(layerId)}`, patch)
  return data.layer
}

export async function addKnowledgeLayerItem(libraryId, layerId, section, item) {
  const data = await postJson(`/api/knowledge/libraries/${encodeURIComponent(libraryId)}/layers/${encodeURIComponent(layerId)}/${encodeURIComponent(section)}`, item)
  return data.layer
}

export async function updateKnowledgeLayerItem(libraryId, layerId, section, itemIndex, patch) {
  const data = await patchJson(`/api/knowledge/libraries/${encodeURIComponent(libraryId)}/layers/${encodeURIComponent(layerId)}/${encodeURIComponent(section)}/${encodeURIComponent(itemIndex)}`, patch)
  return data.layer
}

export async function deleteKnowledgeLayerItem(libraryId, layerId, section, itemIndex) {
  const data = await deleteJson(`/api/knowledge/libraries/${encodeURIComponent(libraryId)}/layers/${encodeURIComponent(layerId)}/${encodeURIComponent(section)}/${encodeURIComponent(itemIndex)}`)
  return data.layer
}

export async function addKnowledgeLayerHeaderField(libraryId, layerId, field) {
  const data = await postJson(`/api/knowledge/libraries/${encodeURIComponent(libraryId)}/layers/${encodeURIComponent(layerId)}/encapsulation/header-fields`, { field })
  return data.layer
}

export async function deleteKnowledgeLayerHeaderField(libraryId, layerId, itemIndex) {
  const data = await deleteJson(`/api/knowledge/libraries/${encodeURIComponent(libraryId)}/layers/${encodeURIComponent(layerId)}/encapsulation/header-fields/${encodeURIComponent(itemIndex)}`)
  return data.layer
}

export async function createKnowledgeLayerSection(libraryId, layerId, payload) {
  const data = await postJson(`/api/knowledge/libraries/${encodeURIComponent(libraryId)}/layers/${encodeURIComponent(layerId)}/sections`, payload)
  return data.layer
}

export async function updateKnowledgeLayerSection(libraryId, layerId, sectionId, patch) {
  const data = await patchJson(`/api/knowledge/libraries/${encodeURIComponent(libraryId)}/layers/${encodeURIComponent(layerId)}/sections/${encodeURIComponent(sectionId)}`, patch)
  return data.layer
}

export async function deleteKnowledgeLayerSection(libraryId, layerId, sectionId) {
  const data = await deleteJson(`/api/knowledge/libraries/${encodeURIComponent(libraryId)}/layers/${encodeURIComponent(layerId)}/sections/${encodeURIComponent(sectionId)}`)
  return data.layer
}

export async function addKnowledgeLayerCustomSectionItem(libraryId, layerId, sectionId, item) {
  const data = await postJson(`/api/knowledge/libraries/${encodeURIComponent(libraryId)}/layers/${encodeURIComponent(layerId)}/sections/${encodeURIComponent(sectionId)}/items`, item)
  return data.layer
}

export async function updateKnowledgeLayerCustomSectionItem(libraryId, layerId, sectionId, itemIndex, patch) {
  const data = await patchJson(`/api/knowledge/libraries/${encodeURIComponent(libraryId)}/layers/${encodeURIComponent(layerId)}/sections/${encodeURIComponent(sectionId)}/items/${encodeURIComponent(itemIndex)}`, patch)
  return data.layer
}

export async function deleteKnowledgeLayerCustomSectionItem(libraryId, layerId, sectionId, itemIndex) {
  const data = await deleteJson(`/api/knowledge/libraries/${encodeURIComponent(libraryId)}/layers/${encodeURIComponent(layerId)}/sections/${encodeURIComponent(sectionId)}/items/${encodeURIComponent(itemIndex)}`)
  return data.layer
}
