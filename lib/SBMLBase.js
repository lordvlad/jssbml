const { keys, assign } = Object
const { pick, superClassIterator } = require('./util')
const Base = require('./Base')

const xmlns = 'http://www.sbml.org/sbml/level2'

class SBMLBase extends Base {
  get xmlns () { return xmlns }
  get xmlnsPrefix () { return 'sbml' }
}

/**
 * Base class for SBML objects
 */
class SBMLModelBase extends SBMLBase {
  static getDefaults () {
    return {
      annotation: null,
      metaid: null,
      notes: null,
      name: null,
      id: null
    }
  }
}

class SBMLList extends Array {
  get xmlns () { return xmlns }
  get xmlnsPrefix () { return 'sbml' }

  constructor (props = {}, elements = []) {
    super()
    if (this.constructor === SBMLModelBase) {
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

assign(SBMLBase, {xmlns})
assign(SBMLList, {xmlns})

module.exports = {Base, SBMLBase, SBMLModelBase, SBMLList}
