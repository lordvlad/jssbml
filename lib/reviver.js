const { entries, assign, create } = Object
const isObj = (x) => x !== null && typeof x === 'object'
const capitalize = (s) => s.charAt(0).toUpperCase() + s.substr(1)
const firstToLower = (s) => s.charAt(0).toLowerCase() + s.substr(1)

/**
 * Creates a Reviver for the given JSBML document class. The reviver in
 * turn revives a jsbml document from json to full-fledged objects with
 * proper types and methods
 */
module.exports = function reviver (opt = {}) {
  const constructors = opt.namespaces.reduce(assign, {})
  constructors['default'] = opt.namespaces[0]
  return reviveDocument

  function getConstructor (obj, key) {
    if (key === null) return constructors['default']
    if (key === 'modifiers') return constructors.ModifierSpeciesReference
    if (['reactants', 'products'].indexOf(key) !== -1) {
      return constructors.SpeciesReference
    }
    key = capitalize(key)
    if (constructors[key]) return constructors[key]
    if (key.charAt(key.length - 1) === 's') {
      key = key.substr(0, key.length - 1)
      if (constructors[key]) return constructors[key]
    }
  }

  /**
   * Revives a document form json to a full fledged object
   * with proper types and methods.
   * @param {Document} doc
   */
  function reviveDocument (doc) {
    const ctx = { ids: {}, metaids: {} }

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
      if (!Constr) {
        return obj
      }
      if (Constr.name.startsWith('ListOf')) return reviveList(Constr, obj)
      const ret = assign(new Constr(), entries(obj).reduce(reduce, create(null)))
      if (ret.metaid) ctx.metaids[ret.metaid] = ret
      if (ret.id) ctx.ids[ret.id] = ret
      return ret
    }

    return revive(doc, null, {})
  }
}
