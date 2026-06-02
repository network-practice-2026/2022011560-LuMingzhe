const path = require('path')
const Database = require('better-sqlite3')
const { layers, graph } = require('./seedKnowledge')

const dbPath = path.join(__dirname, 'knowledge.db')
const db = new Database(dbPath)

db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS knowledge_layers (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    layer_order INTEGER NOT NULL,
    summary TEXT NOT NULL,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS knowledge_graph (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    data TEXT NOT NULL
  );
`)

const count = db.prepare('SELECT COUNT(*) AS count FROM knowledge_layers').get().count

if (count === 0) {
  const insertLayer = db.prepare(`
    INSERT INTO knowledge_layers (id, title, layer_order, summary, data)
    VALUES (@id, @title, @order, @summary, @data)
  `)

  const insertGraph = db.prepare(`
    INSERT INTO knowledge_graph (id, data)
    VALUES (1, @data)
  `)

  const seed = db.transaction(() => {
    layers.forEach(layer => {
      insertLayer.run({
        id: layer.id,
        title: layer.title,
        order: layer.order,
        summary: layer.summary,
        data: JSON.stringify(layer)
      })
    })

    insertGraph.run({ data: JSON.stringify(graph) })
  })

  seed()
}

const parseLayer = row => JSON.parse(row.data)

function getLayers() {
  return db.prepare(`
    SELECT id, title, layer_order AS "order", summary
    FROM knowledge_layers
    ORDER BY layer_order ASC
  `).all()
}

function getLayer(id) {
  const row = db.prepare('SELECT data FROM knowledge_layers WHERE id = ?').get(id)
  return row ? parseLayer(row) : null
}

function getGraph() {
  const row = db.prepare('SELECT data FROM knowledge_graph WHERE id = 1').get()
  return row ? JSON.parse(row.data) : { nodes: [], edges: [], categories: [] }
}

module.exports = {
  getLayers,
  getLayer,
  getGraph
}
