const { Transform } = require('stream')
const pick = require('lodash.pick')

const {assign} = Object

const xmldef = '<?xml version="1.0" encoding="UTF-8"?>'
const xmlns = 'http://www.sbml.org/sbml/level2'


function open (name, props = {}) {
  return `<${name}${Object.entries(props).reduce((s, [k, v]) => `${s} ${k}="${v}"`, '')}>`
}

function close (name) {
  return `</${name}>`
}

module.exports = class Writer extends Transform {
  constructor (opt = {}) {
    super(assign(opt, {objectMode: true}))
    this._indent = opt.indet || '  '
    this._newline = opt.newline || '\n'
  }

  _writeModel (m) {
    this._in(1)
    this._open('model', pick(m, 'id', 'name', 'metaid'))
    this._nl()
    if (m.annotation) this._writeAnnotation(m.annotation)
    this._writeListOf('Compartments', m.compartments.values(), this._writeCompartment)
    this._writeListOf('Species', m.species.values(), this._writeSpecies)
    this._writeListOf('Reactions', m.reactions.values(), this._writeReaction)
    this._in(1)
    this._close('model')
  }

  _writeAnnotation (annotation) {
    this._in(1)
    this._open('annotation')
    this._nl()
    if (annotation.layouts) {
      for (let layout of annotation.layouts) {
        this._writeLayout(layout)
        this._nl()
      }
    }
    this._in(1)
    this._close('annotation')
  }

  _writeReaction (r) {
    const p = pick(r, 'id', 'metaid', 'name')
    this._in(3)
    this._open('reaction', p)
    this._nl()
    this._writeListOf('Reactants', r.reactants, this._writeSpeciesReference, 4)
    this._writeListOf('Products', r.products, this._writeSpeciesReference, 4)
    this._writeListOf('Modifiers', r.modifiers, this._writeSpeciesReference, 4)
    this._in(3)
    this._close('reaction')
  }

  _writeSpeciesReference (r) {
    const p = {
      metaid: r.metaid,
      species: r.species.id
    }
    this._in(5)
    this._open('speciesReference', p)
    this._nl()
    this._in(5)
    this._close('speciesReference')
  }

  _writeSpecies (s) {
    const p = pick(s, 'id', 'metaid', 'name', 'initialConcentration', 'boundaryCondition')
    p.compartment = s.compartment.id
    this._in(3)
    this._open('species', p)
    this._nl()
    this._in(3)
    this._close('species')
  }

  _writeCompartment (c) {
    this._in(3)
    this._open('compartment', pick(c, 'id', 'name', 'metaid', 'size'))
    this._nl()
    this._in(3)
    this._close('compartment')
  }

  _writeListOf (what, it, single, depth = 2) {
    if (('size' in it && it.size === 0) && ('length' in it && it.length === 0)) {
      return
    }
    this._in(depth)
    this._open(`listOf${what}`)
    this._nl()
    for (let c of it) {
      single.call(this, c)
      this._nl()
    }
    this._in(depth)
    this._close(`listOf${what}`)
    this._nl()
  }

  _nl () { this.push(this._newline) }
  _in (n) { this.push(this._indent.repeat(n)) }
  _open (n, p) { this.push(open(n, p)) }
  _close (n) { this.push(close(n)) }

  _writeSbml (m) {
    this._open('sbml', {xmlns, level: 2, version: 1})
    this._nl()
    this._writeModel(m)
    this._nl()
    this._close('sbml')
  }

  _transform (m, _, callback) {
    this.push(xmldef)
    this._nl()
    this._writeSbml(m)
    this.push(null)
    callback()
  }
}
