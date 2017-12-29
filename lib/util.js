const {keys, assign, entries, prototype, getOwnPropertyNames, getPrototypeOf} = Object

const isDef = (v) => typeof v !== 'undefined'
const either = (...vs) => vs.find(isDef)
const last = (a) => a && a.length ? a[a.length - 1] : undefined
const contains = (a, k) => a.indexOf(k) !== -1
const namespaceKeys = (node) => keys(node).filter((n) => n.startsWith('xmlns'))
const namespaces = (node) => pick(node, namespaceKeys(node))
const deepProps = x => x && x !== prototype && getOwnPropertyNames(x).concat(deepProps(getPrototypeOf(x)) || [])
const deepFunctions = x => deepProps(x).filter(name => typeof x[ name ] === 'function')
const userFunctions = x => new Set(deepFunctions(x).filter(name => name !== 'constructor' && !~name.indexOf('__')))
  /**
   * @param {String} s
   */
const capitalize = (s) => s.charAt(0).toUpperCase() + s.substr(1)

/**
 * @param {String} s
 */
const decapitalize = (s) => s.charAt(0).toLowerCase() + s.substr(1)

  /**
   * @param {String} s
   */
const pluralize = (s) => s.charAt(s.length - 1) === 's' ? s : s + 's'
const has = (o, k) => o.hasOwnProperty(k)

/**
 * Pick all values from object `x` which are listed in `ks` and are actually set on the object:
 * ```js
 * pick({a: 1, b: 2}, 'a', 'c')
 * {a: 1}
 * ```
 * @param {{}} x
 * @param {String[]} ks
 * @returns {{}}
 */
const pick = (x, ...ks) => {
  if (typeof ks[0] === 'function') return pickByTest(x, ks[0])
  return ks.reduce((o, k) => has(x, k) ? assign(o, {[k]: x[k]}) : o, {})
}

const pickByTest = (x, test) => {
  return entries(x).reduce((o, [k, v]) => test(k, v) ? assign(o, {[k]: v}) : o, {})
}

/**
 * Returns a generator which iterates through all constructors of all superclasses of `p`.
 * ```js
 * for (let x of superClassIterator(true)) console.log(x)
 * ƒ Boolean() { [native code] }
 * ƒ Object() { [native code] }
 * ```
 * @param {any} p
 * @returns {Iterator<Function>}
 */
function * superClassIterator (p) {
  while ((p = Object.getPrototypeOf(p)) != null) yield p.constructor
}

function isset (x) { return typeof x !== 'undefined' && x !== null }

function isPrimitive (x) {
  switch (typeof x) {
    case 'string':
    case 'boolean':
    case 'number':
    case 'undefined':
    case 'symbol':
      return true
    default:
      return false
  }
}

module.exports = {
  capitalize,
  decapitalize,
  pluralize,
  namespaceKeys,
  namespaces,
  deepProps,
  deepFunctions,
  userFunctions,
  has,
  superClassIterator,
  pick,
  contains,
  last,
  either,
  isset,
  isPrimitive
}
