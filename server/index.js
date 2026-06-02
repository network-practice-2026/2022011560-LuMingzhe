const express = require('express')
const { getLayers, getLayer, getGraph } = require('./db')

const app = express()
const port = process.env.PORT || 3000

app.use(express.json())

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
