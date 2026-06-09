const examplesFromInput = value => (value || '').split(/[，,\n]/).map(example => example.trim()).filter(Boolean)

class KnowledgeFieldModel {
  constructor({ key, placeholder, type = 'text', rows = 2, toForm = value => value || '', toPayload = value => value }) {
    this.key = key
    this.placeholder = placeholder
    this.type = type
    this.rows = rows
    this.toForm = toForm
    this.toPayload = toPayload
  }
}

class KnowledgeSectionModel {
  constructor({ id, title, fields = [], formKey = id, custom = false, renderType = 'cards', items = [] }) {
    this.id = id
    this.title = title
    this.formKey = formKey
    this.custom = custom
    this.renderType = renderType
    this.items = items
    this.fields = fields.map(field => field instanceof KnowledgeFieldModel ? field : new KnowledgeFieldModel(field))
  }

  createEmptyForm() {
    return this.fields.reduce((form, field) => {
      form[field.key] = ''
      return form
    }, {})
  }

  createFormFromItem(item) {
    return this.fields.reduce((form, field) => {
      form[field.key] = field.toForm(item?.[field.key])
      return form
    }, {})
  }

  createPayload(form) {
    return this.fields.reduce((payload, field) => {
      payload[field.key] = field.toPayload(form?.[field.key])
      return payload
    }, {})
  }

  hasContent(layer) {
    if (this.custom) return true
    if (this.id === 'encapsulation') {
      return Boolean(
        layer.encapsulation?.pdu ||
        layer.encapsulation?.nextLayer ||
        layer.encapsulation?.headerFields?.length
      )
    }
    return Boolean(layer[this.id]?.length)
  }
}

const fixedSections = [
  new KnowledgeSectionModel({
    id: 'concepts',
    title: '核心概念',
    fields: [
      { key: 'title', placeholder: '概念标题' },
      { key: 'description', type: 'textarea', placeholder: '概念描述' }
    ]
  }),
  new KnowledgeSectionModel({
    id: 'protocols',
    title: '典型协议',
    fields: [
      { key: 'name', placeholder: '协议名称' },
      { key: 'description', type: 'textarea', placeholder: '协议描述' },
      {
        key: 'examples',
        placeholder: '示例，用逗号分隔',
        toForm: value => (value || []).join('，'),
        toPayload: examplesFromInput
      }
    ]
  }),
  new KnowledgeSectionModel({
    id: 'devices',
    title: '相关设备/组件',
    fields: [
      { key: 'name', placeholder: '设备/组件名称' },
      { key: 'role', type: 'textarea', placeholder: '作用' }
    ]
  }),
  new KnowledgeSectionModel({ id: 'encapsulation', title: '数据封装', formKey: 'headerField', renderType: 'encapsulation' }),
  new KnowledgeSectionModel({
    id: 'collaboration',
    title: '层间协作关系',
    renderType: 'collaboration',
    fields: [
      { key: 'targetLayer', placeholder: '目标层级' },
      { key: 'description', type: 'textarea', placeholder: '协作描述' }
    ]
  })
]

const createCustomSectionModel = section => new KnowledgeSectionModel({
  ...section,
  custom: true,
  formKey: 'customItem',
  fields: [
    { key: 'title', placeholder: '卡片标题' },
    { key: 'description', type: 'textarea', placeholder: '卡片描述' }
  ]
})

export class KnowledgePageModel {
  constructor(layer, { isBuiltin = true } = {}) {
    this.layer = layer
    this.isBuiltin = isBuiltin
    this.sections = [
      ...fixedSections.filter(section => isBuiltin || section.hasContent(layer)),
      ...(layer.customSections || []).map(createCustomSectionModel)
    ]
  }

  static fromLayer(layer, options) {
    return new KnowledgePageModel(layer, options)
  }

  getSection(sectionId) {
    return this.sections.find(section => section.id === sectionId)
  }
}

export { KnowledgeFieldModel, KnowledgeSectionModel }
