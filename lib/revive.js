const Document = require('./document')

const { entries, assign, create } = Object
const isObj = (x) => x !== null && typeof x === 'object'
const capitalize = (s) => s.charAt(0).toUpperCase() + s.substr(1)
const firstToLower = (s) => s.charAt(0).toLowerCase() + s.substr(1)

function getConstructor (obj, key) {
  if (key === null) return Document
  if (Document[capitalize(key)]) return Document[capitalize(key)]
  if (key.charAt(key.length - 1) === 's') key = key.substr(0, key.length - 1)
  if (Document[capitalize(key)]) return Document[capitalize(key)]
}

function reviveDocument (doc) {
  return revive(doc, null)
}

function map (listKey) {
  const key = firstToLower(listKey.substr(6))
  return function (map, [i, value]) {
    map[i] = revive(value, key)
    return map
  }
}

function reduce (map, [key, value]) {
  map[key] = revive(value, key)
  return map
}

function reviveList (Constr, obj) {
  const copy = entries(obj).reduce(map(Constr.name), create(null))
  return assign(new Constr(), copy)
}

function revive (obj, key) {
  if (!isObj(obj)) return obj
  const Constr = getConstructor(obj, key)
  if (!Constr) return obj
  if (Constr.name.startsWith('ListOf')) return reviveList(Constr, obj)
  return assign(new Constr(), entries(obj).reduce(reduce, create(null)))
}

module.exports = reviveDocument
