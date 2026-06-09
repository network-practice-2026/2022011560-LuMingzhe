const path = require('path')
const Database = require('better-sqlite3')
const { layers, graph } = require('./seedKnowledge')
const { topics } = require('./seedKnowledgeTopics')
const { protocols } = require('./seedProtocols')
const { simulations } = require('./seedSimulations')

const dbPath = path.join(__dirname, 'knowledge.db')
const db = new Database(dbPath)

const DEFAULT_LIBRARY_ID = 'tcp-ip-knowledge'
const DEFAULT_LIBRARY = {
  id: DEFAULT_LIBRARY_ID,
  title: 'TCP/IP 五层模型',
  description: '分层学习核心概念、协议、设备、封装与协作关系',
  order: 1,
  isBuiltin: 0
}

db.pragma('journal_mode = WAL')

db.exec(`
  CREATE TABLE IF NOT EXISTS knowledge_libraries (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    item_order INTEGER NOT NULL,
    is_builtin INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS knowledge_library_tabs (
    id TEXT NOT NULL,
    library_id TEXT NOT NULL,
    title TEXT NOT NULL,
    tab_order INTEGER NOT NULL,
    PRIMARY KEY (id, library_id)
  );

  CREATE TABLE IF NOT EXISTS knowledge_layers (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    layer_order INTEGER NOT NULL,
    summary TEXT NOT NULL,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS knowledge_graph (
    id INTEGER PRIMARY KEY,
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

function hasColumn(table, column) {
  return db.prepare(`PRAGMA table_info(${table})`).all().some(info => info.name === column)
}

function addColumnIfMissing(table, column, definition) {
  if (!hasColumn(table, column)) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`)
  }
}

function rebuildKnowledgeGraphTableIfNeeded() {
  const createSql = db.prepare("SELECT sql FROM sqlite_master WHERE type = 'table' AND name = 'knowledge_graph'").get()?.sql || ''

  if (!createSql.includes('CHECK (id = 1)')) return

  db.exec(`
    CREATE TABLE knowledge_graph_new (
      id INTEGER PRIMARY KEY,
      data TEXT NOT NULL,
      library_id TEXT
    );

    INSERT INTO knowledge_graph_new (id, data, library_id)
    SELECT id, data, library_id FROM knowledge_graph;

    DROP TABLE knowledge_graph;
    ALTER TABLE knowledge_graph_new RENAME TO knowledge_graph;
  `)
}

rebuildKnowledgeGraphTableIfNeeded()

addColumnIfMissing('knowledge_layers', 'library_id', 'TEXT')
addColumnIfMissing('knowledge_graph', 'library_id', 'TEXT')
addColumnIfMissing('knowledge_topics', 'library_id', 'TEXT')

const layerCount = db.prepare('SELECT COUNT(*) AS count FROM knowledge_layers').get().count

if (layerCount === 0) {
  const insertLayer = db.prepare(`
    INSERT INTO knowledge_layers (id, title, layer_order, summary, data, library_id)
    VALUES (@id, @title, @order, @summary, @data, @libraryId)
  `)

  const insertGraph = db.prepare(`
    INSERT INTO knowledge_graph (id, data, library_id)
    VALUES (1, @data, @libraryId)
  `)

  const seed = db.transaction(() => {
    layers.forEach(layer => {
      insertLayer.run({
        id: layer.id,
        title: layer.title,
        order: layer.order,
        summary: layer.summary,
        data: JSON.stringify(layer),
        libraryId: DEFAULT_LIBRARY_ID
      })
    })

    insertGraph.run({ data: JSON.stringify(graph), libraryId: DEFAULT_LIBRARY_ID })
  })

  seed()
}

const topicCount = db.prepare('SELECT COUNT(*) AS count FROM knowledge_topics').get().count

if (topicCount === 0) {
  const insertTopic = db.prepare(`
    INSERT INTO knowledge_topics (id, title, description, item_order, library_id)
    VALUES (@id, @title, @description, @order, @id)
  `)

  const seed = db.transaction(() => {
    topics.forEach(topic => {
      insertTopic.run(topic)
    })
  })

  seed()
}

const libraryCount = db.prepare('SELECT COUNT(*) AS count FROM knowledge_libraries').get().count

if (libraryCount === 0) {
  const insertLibrary = db.prepare(`
    INSERT INTO knowledge_libraries (id, title, description, item_order, is_builtin)
    VALUES (@id, @title, @description, @order, @isBuiltin)
  `)

  const insertTab = db.prepare(`
    INSERT INTO knowledge_library_tabs (id, library_id, title, tab_order)
    VALUES (@id, @libraryId, @title, @order)
  `)

  const seed = db.transaction(() => {
    insertLibrary.run(DEFAULT_LIBRARY)
    db.prepare('UPDATE knowledge_layers SET library_id = ? WHERE library_id IS NULL').run(DEFAULT_LIBRARY_ID)
    db.prepare('UPDATE knowledge_graph SET library_id = ? WHERE library_id IS NULL').run(DEFAULT_LIBRARY_ID)
    db.prepare('UPDATE knowledge_topics SET library_id = id WHERE library_id IS NULL').run()

    layers.forEach(layer => {
      insertTab.run({
        id: layer.id,
        libraryId: DEFAULT_LIBRARY_ID,
        title: layer.title,
        order: layer.order
      })
    })
  })

  seed()
}

db.prepare('UPDATE knowledge_libraries SET is_builtin = 0 WHERE id = ? AND is_builtin = 1').run(DEFAULT_LIBRARY_ID)

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

class HttpError extends Error {
  constructor(status, message) {
    super(message)
    this.status = status
  }
}

const writableSections = new Set(['concepts', 'protocols', 'devices', 'collaboration'])

const slugify = value => {
  const slug = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return slug || `knowledge-${Date.now().toString(36)}`
}

const uniqueLibraryId = title => {
  const baseId = slugify(title)
  let id = baseId
  let index = 1

  while (db.prepare('SELECT id FROM knowledge_libraries WHERE id = ?').get(id)) {
    index += 1
    id = `${baseId}-${index}`
  }

  return id
}

const uniqueTabId = (libraryId, title) => {
  const baseId = slugify(title)
  let id = baseId
  let index = 1

  while (db.prepare('SELECT id FROM knowledge_library_tabs WHERE library_id = ? AND id = ?').get(libraryId, id)) {
    index += 1
    id = `${baseId}-${index}`
  }

  return id
}

const uniqueSectionId = (layer, title) => {
  const baseId = slugify(title)
  let id = baseId
  let index = 1
  const existingIds = new Set((layer.customSections || []).map(section => section.id))

  while (existingIds.has(id) || writableSections.has(id) || id === 'encapsulation') {
    index += 1
    id = `${baseId}-${index}`
  }

  return id
}

const assertString = (value, field) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new HttpError(400, `${field} 不能为空`)
  }

  return value.trim()
}

function normalizeGraph(graphData = {}) {
  return {
    categories: Array.isArray(graphData.categories) ? graphData.categories : [],
    nodes: Array.isArray(graphData.nodes) ? graphData.nodes : [],
    edges: Array.isArray(graphData.edges) ? graphData.edges : []
  }
}

function normalizeCustomSectionItem(item) {
  return {
    title: assertString(item?.title, '卡片标题'),
    description: assertString(item?.description, '卡片描述')
  }
}

function normalizeCustomSection(section) {
  return {
    id: assertString(section?.id, '自定义卡片 ID'),
    title: assertString(section?.title, '自定义卡片标题'),
    items: Array.isArray(section?.items) ? section.items.map(normalizeCustomSectionItem) : []
  }
}

function normalizeLayer(layer, order) {
  const id = assertString(layer?.id, '层级 ID')
  const title = assertString(layer?.title, '层级标题')

  return {
    ...layer,
    id,
    title,
    order: Number.isFinite(Number(layer.order)) ? Number(layer.order) : order,
    summary: typeof layer.summary === 'string' ? layer.summary : '',
    concepts: Array.isArray(layer.concepts) ? layer.concepts : [],
    protocols: Array.isArray(layer.protocols) ? layer.protocols : [],
    devices: Array.isArray(layer.devices) ? layer.devices : [],
    encapsulation: layer.encapsulation || { pdu: '', headerFields: [], nextLayer: '' },
    collaboration: Array.isArray(layer.collaboration) ? layer.collaboration : [],
    customSections: Array.isArray(layer.customSections) ? layer.customSections.map(normalizeCustomSection) : []
  }
}

function normalizeTabs(tabs, normalizedLayers) {
  if (Array.isArray(tabs) && tabs.length > 0) {
    return tabs.map((tab, index) => ({
      id: assertString(tab?.id, 'Tab ID'),
      title: assertString(tab?.title, 'Tab 标题'),
      order: Number.isFinite(Number(tab.order)) ? Number(tab.order) : index + 1
    }))
  }

  return normalizedLayers.map(layer => ({ id: layer.id, title: layer.title, order: layer.order }))
}

function assertLibraryWritable(libraryId) {
  const library = db.prepare('SELECT id, is_builtin AS "isBuiltin" FROM knowledge_libraries WHERE id = ?').get(libraryId)

  if (!library) {
    throw new HttpError(404, '知识库不存在')
  }

  if (library.isBuiltin) {
    throw new HttpError(403, '内置知识库不可编辑')
  }

  return library
}

function getKnowledgeLayerRow(libraryId, id) {
  return db.prepare(`
    SELECT id, data
    FROM knowledge_layers
    WHERE library_id = ? AND (id = ? OR id = ?)
  `).get(libraryId, id, `${libraryId}:${id}`)
}

function assertLayerWritable(libraryId, layerId) {
  assertLibraryWritable(libraryId)
  const row = getKnowledgeLayerRow(libraryId, layerId)

  if (!row) {
    throw new HttpError(404, '知识层级不存在')
  }

  return {
    row,
    layer: parseLayer(row)
  }
}

function assertItemIndex(items, itemIndex) {
  const index = Number(itemIndex)

  if (!Number.isInteger(index) || index < 0 || index >= items.length) {
    throw new HttpError(404, '知识卡片不存在')
  }

  return index
}

function findCustomSection(layer, sectionId) {
  const sections = layer.customSections || []
  const index = sections.findIndex(section => section.id === sectionId)

  if (index === -1) {
    throw new HttpError(404, '自定义卡片不存在')
  }

  return { sections, section: sections[index], index }
}

function normalizeExamples(examples) {
  if (examples === undefined) return []

  if (!Array.isArray(examples)) {
    throw new HttpError(400, '示例必须是数组')
  }

  return examples
    .filter(example => typeof example === 'string')
    .map(example => example.trim())
    .filter(Boolean)
}

function normalizeSectionItem(section, item) {
  if (section === 'concepts') {
    return {
      title: assertString(item?.title, '概念标题'),
      description: assertString(item?.description, '概念描述')
    }
  }

  if (section === 'protocols') {
    return {
      name: assertString(item?.name, '协议名称'),
      description: assertString(item?.description, '协议描述'),
      examples: normalizeExamples(item?.examples)
    }
  }

  if (section === 'devices') {
    return {
      name: assertString(item?.name, '设备/组件名称'),
      role: assertString(item?.role, '设备/组件作用')
    }
  }

  if (section === 'collaboration') {
    return {
      targetLayer: assertString(item?.targetLayer, '目标层级'),
      description: assertString(item?.description, '协作描述')
    }
  }

  throw new HttpError(400, '不支持的知识字段')
}

function saveKnowledgeLayer(rowId, layer) {
  db.prepare(`
    UPDATE knowledge_layers
    SET title = @title, summary = @summary, data = @data
    WHERE id = @id
  `).run({
    id: rowId,
    title: layer.title,
    summary: layer.summary,
    data: JSON.stringify(layer)
  })
}

function syncKnowledgeLayerTitle(libraryId, layerId, title) {
  db.prepare(`
    UPDATE knowledge_library_tabs
    SET title = ?
    WHERE library_id = ? AND id = ?
  `).run(title, libraryId, layerId)
}

function getKnowledgeLibraries() {
  return db.prepare(`
    SELECT id, title, description, item_order AS "order", is_builtin AS "isBuiltin"
    FROM knowledge_libraries
    ORDER BY item_order ASC
  `).all()
}

function getKnowledgeLibraryTabs(libraryId) {
  return db.prepare(`
    SELECT id, title, tab_order AS "order"
    FROM knowledge_library_tabs
    WHERE library_id = ?
    ORDER BY tab_order ASC
  `).all(libraryId)
}

function getKnowledgeLibraryLayers(libraryId) {
  return db.prepare(`
    SELECT id, title, layer_order AS "order", summary
    FROM knowledge_layers
    WHERE library_id = ?
    ORDER BY layer_order ASC
  `).all(libraryId)
}

function getKnowledgeLibraryLayer(libraryId, id) {
  const row = getKnowledgeLayerRow(libraryId, id)
  return row ? parseLayer(row) : null
}

function createKnowledgeLibraryTab(libraryId, payload) {
  assertLibraryWritable(libraryId)
  const title = assertString(payload?.title, '页面标题')
  const summary = typeof payload?.summary === 'string' ? payload.summary : ''
  const id = uniqueTabId(libraryId, title)
  const nextOrder = db.prepare('SELECT COALESCE(MAX(tab_order), 0) + 1 AS nextOrder FROM knowledge_library_tabs WHERE library_id = ?').get(libraryId).nextOrder
  const layer = normalizeLayer({
    id,
    title,
    order: nextOrder,
    summary,
    concepts: [],
    protocols: [],
    devices: [],
    encapsulation: { pdu: '', headerFields: [], nextLayer: '' },
    collaboration: [],
    customSections: []
  }, nextOrder)

  const create = db.transaction(() => {
    db.prepare(`
      INSERT INTO knowledge_library_tabs (id, library_id, title, tab_order)
      VALUES (@id, @libraryId, @title, @order)
    `).run({ id, libraryId, title, order: nextOrder })
    db.prepare(`
      INSERT INTO knowledge_layers (id, title, layer_order, summary, data, library_id)
      VALUES (@rowId, @title, @order, @summary, @data, @libraryId)
    `).run({
      rowId: `${libraryId}:${id}`,
      title,
      order: nextOrder,
      summary,
      data: JSON.stringify(layer),
      libraryId
    })
  })

  create()
  return { tab: { id, title, order: nextOrder }, layer }
}

function updateKnowledgeLibraryTab(libraryId, tabId, patch) {
  assertLibraryWritable(libraryId)
  const title = assertString(patch?.title, '页面标题')
  const { row, layer: currentLayer } = assertLayerWritable(libraryId, tabId)
  const nextLayer = normalizeLayer({ ...currentLayer, title }, currentLayer.order)

  const update = db.transaction(() => {
    db.prepare(`
      UPDATE knowledge_library_tabs
      SET title = ?
      WHERE library_id = ? AND id = ?
    `).run(title, libraryId, tabId)
    saveKnowledgeLayer(row.id, nextLayer)
  })

  update()
  return { tab: { id: tabId, title, order: nextLayer.order }, layer: nextLayer }
}

function deleteKnowledgeLibraryTab(libraryId, tabId) {
  assertLibraryWritable(libraryId)

  if (tabId === 'graph') {
    throw new HttpError(400, '知识图谱页面不可删除')
  }

  const row = getKnowledgeLayerRow(libraryId, tabId)

  if (!row) {
    throw new HttpError(404, '知识层级不存在')
  }

  const remove = db.transaction(() => {
    db.prepare('DELETE FROM knowledge_library_tabs WHERE library_id = ? AND id = ?').run(libraryId, tabId)
    db.prepare('DELETE FROM knowledge_layers WHERE id = ?').run(row.id)
  })

  remove()
  return { id: tabId }
}

function updateKnowledgeLibraryLayer(libraryId, layerId, patch) {
  const { row, layer: currentLayer } = assertLayerWritable(libraryId, layerId)

  const nextEncapsulation = patch?.encapsulation
    ? {
        ...currentLayer.encapsulation,
        ...patch.encapsulation,
        headerFields: Array.isArray(patch.encapsulation.headerFields)
          ? patch.encapsulation.headerFields
          : currentLayer.encapsulation?.headerFields
      }
    : currentLayer.encapsulation
  const nextLayer = normalizeLayer({
    ...currentLayer,
    title: patch?.title === undefined ? currentLayer.title : assertString(patch.title, '层级标题'),
    summary: patch?.summary === undefined ? currentLayer.summary : assertString(patch.summary, '层级摘要'),
    encapsulation: nextEncapsulation
  }, currentLayer.order)

  const update = db.transaction(() => {
    saveKnowledgeLayer(row.id, nextLayer)
    if (nextLayer.title !== currentLayer.title) {
      syncKnowledgeLayerTitle(libraryId, layerId, nextLayer.title)
    }
  })

  update()
  return nextLayer
}

function addKnowledgeLayerSectionItem(libraryId, layerId, section, item) {
  const { row, layer: currentLayer } = assertLayerWritable(libraryId, layerId)

  if (section === 'encapsulation/header-fields') {
    const field = assertString(item?.field, '封装字段')
    const nextLayer = normalizeLayer({
      ...currentLayer,
      encapsulation: {
        ...currentLayer.encapsulation,
        headerFields: [...(currentLayer.encapsulation?.headerFields || []), field]
      }
    }, currentLayer.order)

    saveKnowledgeLayer(row.id, nextLayer)
    return nextLayer
  }

  if (!writableSections.has(section)) {
    throw new HttpError(400, '不支持的知识字段')
  }

  const sectionItem = normalizeSectionItem(section, item)
  const nextLayer = normalizeLayer({
    ...currentLayer,
    [section]: [...(currentLayer[section] || []), sectionItem]
  }, currentLayer.order)

  saveKnowledgeLayer(row.id, nextLayer)
  return nextLayer
}

function updateKnowledgeLayerSectionItem(libraryId, layerId, section, itemIndex, patch) {
  if (!writableSections.has(section)) {
    throw new HttpError(400, '不支持的知识字段')
  }

  const { row, layer: currentLayer } = assertLayerWritable(libraryId, layerId)
  const items = currentLayer[section] || []
  const index = assertItemIndex(items, itemIndex)
  const sectionItem = normalizeSectionItem(section, { ...items[index], ...patch })
  const nextLayer = normalizeLayer({
    ...currentLayer,
    [section]: items.map((item, itemIndex) => itemIndex === index ? sectionItem : item)
  }, currentLayer.order)

  saveKnowledgeLayer(row.id, nextLayer)
  return nextLayer
}

function deleteKnowledgeLayerSectionItem(libraryId, layerId, section, itemIndex) {
  const { row, layer: currentLayer } = assertLayerWritable(libraryId, layerId)

  if (section === 'encapsulation/header-fields') {
    const fields = currentLayer.encapsulation?.headerFields || []
    const index = assertItemIndex(fields, itemIndex)
    const nextLayer = normalizeLayer({
      ...currentLayer,
      encapsulation: {
        ...currentLayer.encapsulation,
        headerFields: fields.filter((_, fieldIndex) => fieldIndex !== index)
      }
    }, currentLayer.order)

    saveKnowledgeLayer(row.id, nextLayer)
    return nextLayer
  }

  if (!writableSections.has(section)) {
    throw new HttpError(400, '不支持的知识字段')
  }

  const items = currentLayer[section] || []
  const index = assertItemIndex(items, itemIndex)
  const nextLayer = normalizeLayer({
    ...currentLayer,
    [section]: items.filter((_, currentIndex) => currentIndex !== index)
  }, currentLayer.order)

  saveKnowledgeLayer(row.id, nextLayer)
  return nextLayer
}

function createKnowledgeLayerSection(libraryId, layerId, payload) {
  const { row, layer: currentLayer } = assertLayerWritable(libraryId, layerId)
  const title = assertString(payload?.title, '卡片标题')
  const section = normalizeCustomSection({
    id: uniqueSectionId(currentLayer, title),
    title,
    items: []
  })
  const nextLayer = normalizeLayer({
    ...currentLayer,
    customSections: [...(currentLayer.customSections || []), section]
  }, currentLayer.order)

  saveKnowledgeLayer(row.id, nextLayer)
  return nextLayer
}

function updateKnowledgeLayerSection(libraryId, layerId, sectionId, patch) {
  const { row, layer: currentLayer } = assertLayerWritable(libraryId, layerId)
  const { sections, index } = findCustomSection(currentLayer, sectionId)
  const nextSection = normalizeCustomSection({
    ...sections[index],
    title: patch?.title === undefined ? sections[index].title : patch.title
  })
  const nextLayer = normalizeLayer({
    ...currentLayer,
    customSections: sections.map((section, sectionIndex) => sectionIndex === index ? nextSection : section)
  }, currentLayer.order)

  saveKnowledgeLayer(row.id, nextLayer)
  return nextLayer
}

function deleteKnowledgeLayerSection(libraryId, layerId, sectionId) {
  const { row, layer: currentLayer } = assertLayerWritable(libraryId, layerId)
  const { sections, index } = findCustomSection(currentLayer, sectionId)
  const nextLayer = normalizeLayer({
    ...currentLayer,
    customSections: sections.filter((_, sectionIndex) => sectionIndex !== index)
  }, currentLayer.order)

  saveKnowledgeLayer(row.id, nextLayer)
  return nextLayer
}

function addKnowledgeLayerCustomSectionItem(libraryId, layerId, sectionId, item) {
  const { row, layer: currentLayer } = assertLayerWritable(libraryId, layerId)
  const { sections, section, index } = findCustomSection(currentLayer, sectionId)
  const sectionItem = normalizeCustomSectionItem(item)
  const nextSection = normalizeCustomSection({
    ...section,
    items: [...section.items, sectionItem]
  })
  const nextLayer = normalizeLayer({
    ...currentLayer,
    customSections: sections.map((section, sectionIndex) => sectionIndex === index ? nextSection : section)
  }, currentLayer.order)

  saveKnowledgeLayer(row.id, nextLayer)
  return nextLayer
}

function updateKnowledgeLayerCustomSectionItem(libraryId, layerId, sectionId, itemIndex, patch) {
  const { row, layer: currentLayer } = assertLayerWritable(libraryId, layerId)
  const { sections, section, index } = findCustomSection(currentLayer, sectionId)
  const itemPosition = assertItemIndex(section.items, itemIndex)
  const sectionItem = normalizeCustomSectionItem({ ...section.items[itemPosition], ...patch })
  const nextSection = normalizeCustomSection({
    ...section,
    items: section.items.map((item, itemIndex) => itemIndex === itemPosition ? sectionItem : item)
  })
  const nextLayer = normalizeLayer({
    ...currentLayer,
    customSections: sections.map((section, sectionIndex) => sectionIndex === index ? nextSection : section)
  }, currentLayer.order)

  saveKnowledgeLayer(row.id, nextLayer)
  return nextLayer
}

function deleteKnowledgeLayerCustomSectionItem(libraryId, layerId, sectionId, itemIndex) {
  const { row, layer: currentLayer } = assertLayerWritable(libraryId, layerId)
  const { sections, section, index } = findCustomSection(currentLayer, sectionId)
  const itemPosition = assertItemIndex(section.items, itemIndex)
  const nextSection = normalizeCustomSection({
    ...section,
    items: section.items.filter((_, itemIndex) => itemIndex !== itemPosition)
  })
  const nextLayer = normalizeLayer({
    ...currentLayer,
    customSections: sections.map((section, sectionIndex) => sectionIndex === index ? nextSection : section)
  }, currentLayer.order)

  saveKnowledgeLayer(row.id, nextLayer)
  return nextLayer
}

function getKnowledgeLibraryGraph(libraryId) {
  const row = db.prepare('SELECT data FROM knowledge_graph WHERE library_id = ?').get(libraryId)
  return row ? JSON.parse(row.data) : { nodes: [], edges: [], categories: [] }
}

function createKnowledgeLibrary(payload) {
  const title = assertString(payload?.title, '知识库标题')
  const description = assertString(payload?.description, '知识库描述')
  const normalizedLayers = Array.isArray(payload.layers)
    ? payload.layers.map((layer, index) => normalizeLayer(layer, index + 1))
    : []
  const normalizedTabs = normalizeTabs(payload.tabs, normalizedLayers)
  const normalizedGraph = normalizeGraph(payload.graph)
  const nextOrder = db.prepare('SELECT COALESCE(MAX(item_order), 0) + 1 AS nextOrder FROM knowledge_libraries').get().nextOrder
  const library = {
    id: uniqueLibraryId(title),
    title,
    description,
    order: nextOrder,
    isBuiltin: 0
  }

  const insertLibrary = db.prepare(`
    INSERT INTO knowledge_libraries (id, title, description, item_order, is_builtin)
    VALUES (@id, @title, @description, @order, @isBuiltin)
  `)
  const insertTab = db.prepare(`
    INSERT INTO knowledge_library_tabs (id, library_id, title, tab_order)
    VALUES (@id, @libraryId, @title, @order)
  `)
  const insertLayer = db.prepare(`
    INSERT INTO knowledge_layers (id, title, layer_order, summary, data, library_id)
    VALUES (@id, @title, @order, @summary, @data, @libraryId)
  `)
  const insertGraph = db.prepare(`
    INSERT INTO knowledge_graph (id, data, library_id)
    VALUES (@id, @data, @libraryId)
  `)

  const create = db.transaction(() => {
    insertLibrary.run(library)

    normalizedTabs.forEach(tab => {
      insertTab.run({ ...tab, libraryId: library.id })
    })

    normalizedLayers.forEach(layer => {
      insertLayer.run({
        id: `${library.id}:${layer.id}`,
        title: layer.title,
        order: layer.order,
        summary: layer.summary,
        data: JSON.stringify(layer),
        libraryId: library.id
      })
    })

    insertGraph.run({
      id: nextOrder,
      data: JSON.stringify(normalizedGraph),
      libraryId: library.id
    })
  })

  create()
  return library
}

function getKnowledgeTopics() {
  return db.prepare(`
    SELECT id, title, description, item_order AS "order"
    FROM knowledge_topics
    ORDER BY item_order ASC
  `).all()
}

function getLayers() {
  return db.prepare(`
    SELECT data
    FROM knowledge_layers
    WHERE library_id = ?
    ORDER BY layer_order ASC
  `).all(DEFAULT_LIBRARY_ID).map(parseLayer).map(layer => ({
    id: layer.id,
    title: layer.title,
    order: layer.order,
    summary: layer.summary
  }))
}

function getLayer(id) {
  const row = db.prepare('SELECT data FROM knowledge_layers WHERE library_id = ? AND id = ?').get(DEFAULT_LIBRARY_ID, id)
  return row ? parseLayer(row) : null
}

function getGraph() {
  const row = db.prepare('SELECT data FROM knowledge_graph WHERE library_id = ?').get(DEFAULT_LIBRARY_ID)
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
}
