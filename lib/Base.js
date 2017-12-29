const { assign } = Object
const { either, superClassIterator } = require('./util')

function cast (to, from) {
  switch (typeof to) {
    case 'boolean': return from !== 'false'
    case 'number': return parseFloat(from)
    case 'string': return '' + from
    default: return from
  }
}

class Base {
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

module.exports = Base
