const { Transform } = require('stream')
const pick = require('lodash.pick')

const { assign } = require('./util')

const constOpt = { objectMode: true }

const getChild = (o, $name) => o.$children.find((x) => x.$name === $name) || {}
const listOf = (o, what) => getChild(o, `listOf${what}`).$children || []

class Model {
  constructor (node) {
    assign(this, pick(node, 'id', 'metaid', 'name'))
    this.compartments = new Map()
    this.species = new Map()
    this.reactions = new Map()

    for (let c of listOf(node, 'Compartments')) {
      const comp = new Compartment(c)
      if (c.outside) comp.outside = this.compartments.get(c.outside)
      this.compartments.set(c.id, comp)
    }

    for (let c of listOf(node, 'Species')) {
      const spec = new Species(c)
      spec.compartment = this.compartments.get(c.compartment)
      this.species.set(spec.id, spec)
    }

    for (let c of listOf(node, 'Reactions')) {
      const reac = new Reaction(c)

      for (let s of listOf(c, 'Reactants')) reac.reactants.add(this.species.get(s.species))
      for (let s of listOf(c, 'Products')) reac.products.add(this.species.get(s.species))
      for (let s of listOf(c, 'Modifiers')) reac.modifiers.add(this.species.get(s.species))

      this.reactions.set(reac.id, reac)
    }
  }
}

class Reaction {
  constructor (node) {
    assign(this, pick(node, 'id', 'metaid', 'name'))
    if (!this.name) this.name = this.id
    this.reversible = node.reversible !== 'false'
    this.reactants = new Set()
    this.products = new Set()
    this.modifiers = new Set()
    this.kineticLaw = null // FIXME
  }
}

class Species {
  constructor (node) {
    assign(this, pick(node, 'id', 'metaid', 'name'))
    this.compartment = null
    this.initialConcentration = parseFloat(node.initialConcentration)
    this.boundaryCondition = node.initialConcentration === 'true'
  }
}

class Compartment {
  constructor (node) {
    assign(this, pick(node, 'id', 'metaid', 'size'))
    this.outside = null
  }
}

module.exports = class Builder extends Transform {
  constructor (opt = {}) {
    super(assign(constOpt, opt))
  }

  _transform (node, enc, cb) {
    cb(null, new Model(node))
    // const m = new Model(clean(o))

    // for (let c of listOf(o, 'Species')) m.addSpecies(clean(c))
    // for (let c of listOf(o, 'Reactions')) {
    //   let r = m.addReaction(clean(c))
    //   for (let s of listOf(c, 'Reactants')) r.addReactant(clean(s))
    //   for (let s of listOf(c, 'Products')) r.addProduct(clean(s))
    //   for (let s of listOf(c, 'Modifiers')) r.addModifier(clean(s))
    // }
  }
}
