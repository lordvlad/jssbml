const Document = require('./document')

const { entries, assign, create } = Object
const isObj = (x) => x !== null && typeof x === 'object'
const capitalize = (s) => s.charAt(0).toUpperCase() + s.substr(1)

function getConstructor (obj, key) {
  if (key === null) return Document
  if (Document[capitalize(key)]) return Document[capitalize(key)]
  return {}
}

function reviveDocument (doc) {
  return revive(doc, null)
}

function reduce (map, [key, value]) {
  map[key] = revive(value, key)
  return map
}

function revive (obj, key) {
  if (!isObj(obj)) return obj
  const proto = getConstructor(obj, key).prototype
  if (!proto) return obj
  const copy = entries(obj).reduce(reduce, create(null))
  return assign(create(proto), copy)
}

module.exports = reviveDocument
