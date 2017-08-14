const Document = require('./document')

const {
  Annotation, Model
} = Document

const isObj = (x) => x !== null && typeof x === 'object'
const isArr = (x) => Array.isArray(x)

function getConstructor (obj, key) {
  if (key === null) return Document
  if (key === 'model') return Model
  if (key === 'annotation') return Annotation
}

function reviveDocument (doc) {
  return revive(doc, null)
}

function revive (obj, key) {
  if (isArr(obj)) return reviveArr(obj, key)
  if (!isObj(obj)) return obj
  const proto = getConstructor(obj, key).proto
  return proto ? Object.create(proto, obj) : obj
}

module.exports = reviveDocument
