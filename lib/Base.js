const { keys, assign } = Object
const { pick, either, superClassIterator } = require('./util')

function cast (to, from) {
  switch (typeof to) {
    case 'boolean': return from !== 'false'
    case 'number': return parseFloat(from)
    case 'string': return '' + from
    default: return from
  }
}

class Base {
  static getDefaults () { return { annotation: null, notes: null } }

  constructor (props = {}) {
    if (this.constructor === Base) throw new Error('This is an abstract class')

    const defaults = []
    for (let cls of superClassIterator(this)) {
      if (cls.getDefaults) defaults.push(cls.getDefaults())
    }

    defaults.push({})
    defaults.reverse()

    const defaultProps = assign(...defaults)

    for (let p in defaultProps) {
      this[p] = cast(defaultProps[p], either(props[p], props[p.toLowerCase()], defaultProps[p]))
    }
  }
}

class List extends Array {
  static getDefaults () { return { annotation: null, notes: null } }

  constructor (props = {}, elements = []) {
    super()
    if (this.constructor === List) {
      throw new Error('This is an abstract class')
    }
    const d = {}
    for (let cls of superClassIterator(this)) {
      if (cls.getDefaults) assign(d, cls.getDefaults())
    }
    assign(this, d, pick(props, ...keys(d)))
    for (let e of elements) this.push(e)
  }

  toJSON () {
    return keys(this).reduce((o, k) => { o[k] = this[k]; return o }, {})
  }
}

module.exports = { Base, List }
