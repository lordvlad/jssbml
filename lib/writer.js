const { Transform } = require('stream')
const pick = require('lodash.pick')

const {namespaceKeys} = require('./util')

const {assign} = Object

const xmldef = '<?xml version="1.0" encoding="UTF-8"?>'
const layoutXmlns = 'http://projects.eml.org/bcb/sbml/level2'
const layoutXsi = 'http://www.w3.org/2001/XMLSchema-instance'

function open (name, props = {}, c = false) {
  return `<${name}${Object.entries(props).reduce((s, [k, v]) => `${s} ${k}="${v}"`, '')}${c ? '/' : ''}>`
}

function close (name) {
  return `</${name}>`
}

function values (x) { return x ? (x.values ? x.values() : Object.values(x)) : [] }

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
    if (m.annotation) this._writeAnnotation(m.annotation, 2)
    this._writeListOf('Compartments', values(m.listOfCompartments), this._writeCompartment)
    this._writeListOf('Species', values(m.listOfSpecies), this._writeSpecies)
    this._writeListOf('Reactions', values(m.listOfReactions), this._writeReaction)
    this._in(1)
    this._close('model')
  }

  _writeAnnotation (annotation, depth = 1) {
    this._in(depth)
    this._open('annotation')
    this._nl()
    if (annotation.layouts) {
      this._writeLayouts(annotation.layouts)
      this._nl()
    }
    if (annotation.layoutId) {
      this._in(depth + 1)
      this._open('layoutId', pick(annotation.layoutId, 'xmlns', 'id'), true)
      this._nl()
    }
    this._in(depth)
    this._close('annotation')
    this._nl()
  }

  _writeLayouts (layouts) {
    this._in(2)
    this._open('listOfLayouts', {xmlns: layoutXmlns, 'xmlns:xsi': layoutXsi})
    this._nl()
    for (let layout of layouts) {
      this._writeLayout(layout)
      this._nl()
    }
    this._in(2)
    this._close('listOfLayouts')
  }

  _writeLayout (layout) {
    this._in(3)
    this._open('layout', pick(layout, 'id'))
    this._nl()
    this._in(4)
    this._open('dimensions', pick(layout, 'height', 'width'), true)
    this._nl()
    this._writeListOf('CompartmentGlyphs', values(layout.compartmentGlyphs), this._writeCompartmentGlyph, 4)
    this._writeListOf('SpeciesGlyphs', values(layout.speciesGlyphs), this._writeSpeciesGlyph, 4)
    this._writeListOf('ReactionGlyphs', values(layout.reactionGlyphs), this._writeReactionGlyph, 4)
    this._writeListOf('TextGlyphs', values(layout.textGlyphs), this._writeTextGlyph, 4)
    this._in(3)
    this._close('layout')
  }

  _writeBBox (bbox, depth) {
    this._in(depth)
    this._open('boundingBox')
    this._nl()
    this._in(depth + 1)
    this._open('position', pick(bbox, 'x', 'y'), true)
    this._nl()
    this._in(depth + 1)
    this._open('dimensions', pick(bbox, 'height', 'width'), true)
    this._nl()
    this._in(depth)
    this._close('boundingBox')
    this._nl()
  }

  _writeTextGlyph (t) {
    const graphicalObject = t.graphicalObject.id
    const originOfText = t.originOfText.id
    const p = assign(pick(t, 'id'), {graphicalObject, originOfText})
    this._in(5)
    this._open('textGlyph', p)
    this._nl()
    this._writeBBox(t.boundingBox, 6)
    this._in(5)
    this._close('textGlyph')
  }

  _writeReactionGlyph (c) {
    this._in(5)
    this._open('reactionGlyph', {id: c.id, reaction: c.reaction.id})
    this._nl()
    this._in(6)
    this._open('curve')
    this._nl()
    this._in(6)
    this._close('curve')
    this._nl()
    this._writeListOf('SpeciesReferenceGlyphs', c.speciesReferenceGlyphs, this._writeSpeciesReferenceGlyph, 7)
    // this.push(JSON.stringify(Object.keys(c)))
    this._in(5)
    this._close('reactionGlyph')
  }

  _writeSpeciesReferenceGlyph (g) {
    const speciesReference = g.speciesReference.annotation.layoutId.id
    const speciesGlyph = g.speciesGlyph.id
    const p = assign(pick(g, 'id', 'role'), {speciesReference, speciesGlyph})
    this._in(7)
    this._open('SpeciesReferenceGlyph', p)
    this._nl()
    this._in(7)
    this._close('SpeciesReferenceGlyph')
  }

  _writeSpeciesGlyph (c) {
    this._in(5)
    this._open('speciesGlyph', {id: c.id, species: c.species.id})
    this._nl()
    this._writeBBox(c.boundingBox, 6)
    this._in(5)
    this._close('speciesGlyph')
  }

  _writeCompartmentGlyph (c) {
    this._in(5)
    this._open('compartmentGlyph', {id: c.id, compartment: c.compartment.id})
    this._nl()
    this._writeBBox(c.boundingBox, 6)
    this._in(5)
    this._close('compartmentGlyph')
  }

  _writeReaction (r) {
    this._in(3)
    this._open('reaction', pick(r, 'id', 'metaid', 'name', 'reversible'))
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
      species: r.species.id,
      stoichiometry: r.stoichiometry
    }
    this._in(5)
    if (!r.annotation) {
      this._open('speciesReference', p, true)
    } else {
      this._open('speciesReference', p)
      this._nl()
      this._writeAnnotation(r.annotation, 6)
      this._in(5)
      this._close('speciesReference')
    }
  }

  _writeSpecies (s) {
    const p = pick(s, 'id', 'metaid', 'name', 'initialConcentration', 'boundaryCondition')
    p.compartment = s.compartment.id
    this._in(3)
    this._open('species', p, true)
  }

  _writeCompartment (c) {
    const p = pick(c, 'id', 'name', 'metaid', 'size')
    if (c.outside) p.outside = c.outside.id
    this._in(3)
    this._open('compartment', p, true)
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

  /**
   * Print a new line
   */
  _nl () { this.push(this._newline) }
  /**
   * Print an indent
   * @param {int} n
   */
  _in (n) { this.push(this._indent.repeat(n)) }
  /**
   * Print a tag opening
   * @param {string} n - the name
   * @param {Object} p - the parameters
   * @param {boolean} c - whether the tag is self-closing
   */
  _open (n, p, c) { this.push(open(n, p, c)) }
  _close (n) { this.push(close(n)) }

  _writeSbml (document) {
    this._open('sbml', pick(document, 'level', 'version', ...namespaceKeys(document)))
    this._nl()
    this._writeModel(document.model)
    this._nl()
    this._close('sbml')
  }

  _transform (document, _, callback) {
    this.push(xmldef)
    this._nl()
    this._writeSbml(document)
    this.push(null)
    callback()
  }
}
