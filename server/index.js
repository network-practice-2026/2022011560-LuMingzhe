const express = require('express')
const {
  getKnowledgeLibraries,
  getKnowledgeLibraryTabs,
  getKnowledgeLibraryLayers,
  getKnowledgeLibraryLayer,
  getKnowledgeLibraryGraph,
  createKnowledgeLibrary,
  createKnowledgeLibraryTab,
  updateKnowledgeLibraryTab,
  deleteKnowledgeLibraryTab,
  updateKnowledgeLibraryLayer,
  addKnowledgeLayerSectionItem,
  updateKnowledgeLayerSectionItem,
  deleteKnowledgeLayerSectionItem,
  createKnowledgeLayerSection,
  updateKnowledgeLayerSection,
  deleteKnowledgeLayerSection,
  addKnowledgeLayerCustomSectionItem,
  updateKnowledgeLayerCustomSectionItem,
  deleteKnowledgeLayerCustomSectionItem,
  getKnowledgeTopics,
  getLayers,
  getLayer,
  getGraph,
  getProtocols,
  getProtocol,
  getSimulations,
  getSimulation
} = require('./db')

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())

const sendKnowledgeError = (res, error) => {
  res.status(error.status || 400).json({ error: error.message || 'Knowledge request failed' })
}

app.get('/api/protocols', (req, res) => {
  res.json({ protocols: getProtocols() })
})

app.get('/api/protocols/:id', (req, res) => {
  const protocol = getProtocol(req.params.id)

  if (!protocol) {
    res.status(404).json({ error: 'Protocol not found' })
    return
  }

  res.json({ protocol })
})

app.get('/api/simulations', (req, res) => {
  res.json({ simulations: getSimulations() })
})

app.get('/api/simulations/:id', (req, res) => {
  const simulation = getSimulation(req.params.id)

  if (simulation === undefined) {
    res.status(404).json({ error: 'Simulation not found' })
    return
  }

  res.json({ simulation })
})

app.get('/api/knowledge/libraries', (req, res) => {
  res.json({ libraries: getKnowledgeLibraries() })
})

app.post('/api/knowledge/libraries', (req, res) => {
  try {
    const library = createKnowledgeLibrary(req.body)
    res.status(201).json({ library })
  } catch (error) {
    res.status(400).json({ error: error.message || 'Knowledge library creation failed' })
  }
})

app.get('/api/knowledge/libraries/:libraryId/tabs', (req, res) => {
  res.json({ tabs: getKnowledgeLibraryTabs(req.params.libraryId) })
})

app.post('/api/knowledge/libraries/:libraryId/tabs', (req, res) => {
  try {
    const result = createKnowledgeLibraryTab(req.params.libraryId, req.body)
    res.status(201).json(result)
  } catch (error) {
    sendKnowledgeError(res, error)
  }
})

app.patch('/api/knowledge/libraries/:libraryId/tabs/:tabId', (req, res) => {
  try {
    res.json(updateKnowledgeLibraryTab(req.params.libraryId, req.params.tabId, req.body))
  } catch (error) {
    sendKnowledgeError(res, error)
  }
})

app.delete('/api/knowledge/libraries/:libraryId/tabs/:tabId', (req, res) => {
  try {
    res.json(deleteKnowledgeLibraryTab(req.params.libraryId, req.params.tabId))
  } catch (error) {
    sendKnowledgeError(res, error)
  }
})

app.get('/api/knowledge/libraries/:libraryId/layers', (req, res) => {
  res.json({ layers: getKnowledgeLibraryLayers(req.params.libraryId) })
})

app.get('/api/knowledge/libraries/:libraryId/layers/:layerId', (req, res) => {
  const layer = getKnowledgeLibraryLayer(req.params.libraryId, req.params.layerId)

  if (!layer) {
    res.status(404).json({ error: 'Knowledge layer not found' })
    return
  }

  res.json({ layer })
})

app.patch('/api/knowledge/libraries/:libraryId/layers/:layerId', (req, res) => {
  try {
    const layer = updateKnowledgeLibraryLayer(req.params.libraryId, req.params.layerId, req.body)
    res.json({ layer })
  } catch (error) {
    sendKnowledgeError(res, error)
  }
})

app.post('/api/knowledge/libraries/:libraryId/layers/:layerId/sections', (req, res) => {
  try {
    const layer = createKnowledgeLayerSection(req.params.libraryId, req.params.layerId, req.body)
    res.status(201).json({ layer })
  } catch (error) {
    sendKnowledgeError(res, error)
  }
})

app.patch('/api/knowledge/libraries/:libraryId/layers/:layerId/sections/:sectionId', (req, res) => {
  try {
    const layer = updateKnowledgeLayerSection(req.params.libraryId, req.params.layerId, req.params.sectionId, req.body)
    res.json({ layer })
  } catch (error) {
    sendKnowledgeError(res, error)
  }
})

app.delete('/api/knowledge/libraries/:libraryId/layers/:layerId/sections/:sectionId', (req, res) => {
  try {
    const layer = deleteKnowledgeLayerSection(req.params.libraryId, req.params.layerId, req.params.sectionId)
    res.json({ layer })
  } catch (error) {
    sendKnowledgeError(res, error)
  }
})

app.post('/api/knowledge/libraries/:libraryId/layers/:layerId/sections/:sectionId/items', (req, res) => {
  try {
    const layer = addKnowledgeLayerCustomSectionItem(req.params.libraryId, req.params.layerId, req.params.sectionId, req.body)
    res.status(201).json({ layer })
  } catch (error) {
    sendKnowledgeError(res, error)
  }
})

app.patch('/api/knowledge/libraries/:libraryId/layers/:layerId/sections/:sectionId/items/:itemIndex', (req, res) => {
  try {
    const layer = updateKnowledgeLayerCustomSectionItem(req.params.libraryId, req.params.layerId, req.params.sectionId, req.params.itemIndex, req.body)
    res.json({ layer })
  } catch (error) {
    sendKnowledgeError(res, error)
  }
})

app.delete('/api/knowledge/libraries/:libraryId/layers/:layerId/sections/:sectionId/items/:itemIndex', (req, res) => {
  try {
    const layer = deleteKnowledgeLayerCustomSectionItem(req.params.libraryId, req.params.layerId, req.params.sectionId, req.params.itemIndex)
    res.json({ layer })
  } catch (error) {
    sendKnowledgeError(res, error)
  }
})

app.post('/api/knowledge/libraries/:libraryId/layers/:layerId/encapsulation/header-fields', (req, res) => {
  try {
    const layer = addKnowledgeLayerSectionItem(
      req.params.libraryId,
      req.params.layerId,
      'encapsulation/header-fields',
      req.body
    )
    res.status(201).json({ layer })
  } catch (error) {
    sendKnowledgeError(res, error)
  }
})

app.delete('/api/knowledge/libraries/:libraryId/layers/:layerId/encapsulation/header-fields/:itemIndex', (req, res) => {
  try {
    const layer = deleteKnowledgeLayerSectionItem(
      req.params.libraryId,
      req.params.layerId,
      'encapsulation/header-fields',
      req.params.itemIndex
    )
    res.json({ layer })
  } catch (error) {
    sendKnowledgeError(res, error)
  }
})

app.post('/api/knowledge/libraries/:libraryId/layers/:layerId/:section', (req, res) => {
  try {
    const layer = addKnowledgeLayerSectionItem(req.params.libraryId, req.params.layerId, req.params.section, req.body)
    res.status(201).json({ layer })
  } catch (error) {
    sendKnowledgeError(res, error)
  }
})

app.patch('/api/knowledge/libraries/:libraryId/layers/:layerId/:section/:itemIndex', (req, res) => {
  try {
    const layer = updateKnowledgeLayerSectionItem(req.params.libraryId, req.params.layerId, req.params.section, req.params.itemIndex, req.body)
    res.json({ layer })
  } catch (error) {
    sendKnowledgeError(res, error)
  }
})

app.delete('/api/knowledge/libraries/:libraryId/layers/:layerId/:section/:itemIndex', (req, res) => {
  try {
    const layer = deleteKnowledgeLayerSectionItem(req.params.libraryId, req.params.layerId, req.params.section, req.params.itemIndex)
    res.json({ layer })
  } catch (error) {
    sendKnowledgeError(res, error)
  }
})

app.get('/api/knowledge/libraries/:libraryId/graph', (req, res) => {
  res.json({ graph: getKnowledgeLibraryGraph(req.params.libraryId) })
})

app.get('/api/knowledge/topics', (req, res) => {
  res.json({ topics: getKnowledgeTopics() })
})

app.get('/api/knowledge/layers', (req, res) => {
  res.json({ layers: getLayers() })
})

app.get('/api/knowledge/layers/:id', (req, res) => {
  const layer = getLayer(req.params.id)

  if (!layer) {
    res.status(404).json({ error: 'Knowledge layer not found' })
    return
  }

  res.json({ layer })
})

app.get('/api/knowledge/graph', (req, res) => {
  res.json({ graph: getGraph() })
})

app.listen(port, () => {
  console.log(`Knowledge API server listening on http://localhost:${port}`)
})
