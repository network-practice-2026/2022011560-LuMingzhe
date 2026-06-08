const path = require('path')
const Database = require('better-sqlite3')
const { layers, graph } = require('./seedKnowledge')
const { topics } = require('./seedKnowledgeTopics')
const { protocols } = require('./seedProtocols')
const { simulations } = require('./seedSimulations')

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

  CREATE TABLE IF NOT EXISTS knowledge_topics (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    item_order INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS protocol_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    item_order INTEGER NOT NULL,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS simulation_items (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    item_order INTEGER NOT NULL,
    data TEXT
  );
`)

const layerCount = db.prepare('SELECT COUNT(*) AS count FROM knowledge_layers').get().count

if (layerCount === 0) {
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

const topicCount = db.prepare('SELECT COUNT(*) AS count FROM knowledge_topics').get().count

if (topicCount === 0) {
  const insertTopic = db.prepare(`
    INSERT INTO knowledge_topics (id, title, description, item_order)
    VALUES (@id, @title, @description, @order)
  `)

  const seed = db.transaction(() => {
    topics.forEach(topic => {
      insertTopic.run(topic)
    })
  })

  seed()
}

const protocolCount = db.prepare('SELECT COUNT(*) AS count FROM protocol_items').get().count

if (protocolCount === 0) {
  const insertProtocol = db.prepare(`
    INSERT INTO protocol_items (id, title, description, item_order, data)
    VALUES (@id, @title, @description, @order, @data)
  `)

  const seed = db.transaction(() => {
    protocols.forEach(protocol => {
      insertProtocol.run({
        id: protocol.id,
        title: protocol.title,
        description: protocol.description,
        order: protocol.order,
        data: JSON.stringify(protocol)
      })
    })
  })

  seed()
}

const simulationCount = db.prepare('SELECT COUNT(*) AS count FROM simulation_items').get().count

if (simulationCount === 0) {
  const insertSimulation = db.prepare(`
    INSERT INTO simulation_items (id, title, description, item_order, data)
    VALUES (@id, @title, @description, @order, @data)
  `)

  const seed = db.transaction(() => {
    simulations.forEach(simulation => {
      const { data: _data, ...simulationData } = simulation
      const hasAnimationData = Boolean(simulation.topology && simulation.steps)

      insertSimulation.run({
        id: simulation.id,
        title: simulation.title,
        description: simulation.description,
        order: simulation.order,
        data: hasAnimationData ? JSON.stringify(simulationData) : null
      })
    })
  })

  seed()
}

const parseLayer = row => JSON.parse(row.data)

function getKnowledgeTopics() {
  return db.prepare(`
    SELECT id, title, description, item_order AS "order"
    FROM knowledge_topics
    ORDER BY item_order ASC
  `).all()
}

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

function getProtocols() {
  return db.prepare(`
    SELECT id, title, description, item_order AS "order"
    FROM protocol_items
    ORDER BY item_order ASC
  `).all()
}

function getProtocol(id) {
  const row = db.prepare('SELECT data FROM protocol_items WHERE id = ?').get(id)
  return row ? JSON.parse(row.data) : null
}

function getSimulations() {
  return db.prepare(`
    SELECT id, title, description, item_order AS "order"
    FROM simulation_items
    ORDER BY item_order ASC
  `).all()
}

function getSimulation(id) {
  const row = db.prepare('SELECT data FROM simulation_items WHERE id = ?').get(id)
  if (!row) return undefined
  return row.data ? JSON.parse(row.data) : null
}

module.exports = {
  getKnowledgeTopics,
  getLayers,
  getLayer,
  getGraph,
  getProtocols,
  getProtocol,
  getSimulations,
  getSimulation
}
