const express = require('express')
const {
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
