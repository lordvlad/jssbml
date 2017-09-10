const Document = require('./document')

const { entries, assign, create } = Object
const isObj = (x) => x !== null && typeof x === 'object'
const capitalize = (s) => s.charAt(0).toUpperCase() + s.substr(1)
const firstToLower = (s) => s.charAt(0).toLowerCase() + s.substr(1)

function getConstructor (obj, key) {
  if (key === null) return Document
  if (key === 'modifiers') return Document.ModifierSpeciesReference
  if (['reactants', 'products'].indexOf(key) !== -1) {
    return Document.SpeciesReference
  }
  key = capitalize(key)
  if (Document[key]) return Document[key]
  if (key.charAt(key.length - 1) === 's') {
    key = key.substr(0, key.length - 1)
    if (Document[key]) return Document[key]
  }
}

function reviveDocument (doc) {
  const ctx = {ids: {}, metaids: {}}

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
    if (obj.metaid && ctx.metaids[obj.metaid]) return ctx.metaids[obj.metaid]
    if (obj.id && ctx.ids[obj.id]) return ctx.ids[obj.id]
    const Constr = getConstructor(obj, key)
    if (!Constr) return obj
    if (Constr.name.startsWith('ListOf')) return reviveList(Constr, obj)
    const ret = assign(new Constr(), entries(obj).reduce(reduce, create(null)))
    if (ret.metaid) ctx.metaids[ret.metaid] = ret
    if (ret.id) ctx.ids[ret.id] = ret
    return ret
  }

  return revive(doc, null, {})
}
module.exports = reviveDocument
