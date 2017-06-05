const { Transform } = require('stream')
const pick = require('lodash.pick')
const isEmptyObject = require('is-empty-object')

const assign = Object.assign
const constOpt = { objectMode: true }

const getChild = (o, $name) => o && o.$children && o.$children.find((x) => x.$name === $name)
const listOf = (o, what) => {
  const x = getChild(o, `listOf${what}`)
  return x ? x.$children : []
}

class Model {
  constructor () {
    assign(this, {
      id: '',
      name: '',
      metaid: '',
      species: new Map(),
      reactions: new Map(),
      annotation: {},
      compartments: new Map(),
      speciesReferences: new Map()
    })
  }
}

function makeModel (node) {
  const model = new Model()
  assign(model, pick(node, 'id', 'metaid', 'name'))
  const {compartments, reactions, species, speciesReferences} = model

  for (let c of listOf(node, 'Compartments')) {
    const comp = makeCompartment(c, {compartments})
    compartments.set(c.id, comp)
  }

  for (let c of listOf(node, 'Species')) {
    const spec = makeSpecies(c, {compartments})
    species.set(c.id, spec)
  }

  for (let c of listOf(node, 'Reactions')) {
    const reac = makeReaction(c, {species, speciesReferences})
    reactions.set(c.id, reac)
  }

  model.annotation = makeAnnotation(node, model)
  return model
}

function makeAnnotation (node, parent) {
  const annotationNode = getChild(node, 'annotation')
  if (!annotationNode) return
  const annotation = {}
  const layoutNodes = listOf(annotationNode, 'Layouts')
  if (layoutNodes && layoutNodes.length) {
    annotation.layouts = new Set()
    for (let s of layoutNodes) annotation.layouts.add(makeLayout(s, parent))
  }

  const layoutIdNode = getChild(annotationNode, 'layoutId')
  if (!isEmptyObject(layoutIdNode)) {
    annotation.layoutId = layoutIdNode
  }

  return isEmptyObject(annotation) ? undefined : annotation
}

class Layout {
  constructor () {
    assign(this, {
      id: '',
      compartmentGlyphs: new Map(),
      reactionGlyphs: new Map(),
      textGlyphs: new Map(),
      speciesGlyphs: new Map(),
      height: 0,
      width: 0
    })
  }
}
function makeLayout (node, { reactions, compartments, species, speciesReferences }) {
  const layout = new Layout()
  const glyphs = new Map()

  layout.id = node.id
  layout.compartmentGlyphs = new Map()
  layout.reactionGlyphs = new Map()
  layout.textGlyphs = new Map()
  const speciesGlyphs = layout.speciesGlyphs = new Map()

  assign(layout, getChild(node, 'dimension'))

  for (let s of listOf(node, 'CompartmentGlyphs')) {
    const c = makeCompartmentGlyph(s, { compartments })
    layout.compartmentGlyphs.set(c.id, c)
    glyphs.set(c.id, c)
  }
  for (let s of listOf(node, 'SpeciesGlyphs')) {
    const c = makeSpeciesGlyph(s, { species })
    layout.speciesGlyphs.set(c.id, c)
    glyphs.set(c.id, c)
  }
  for (let s of listOf(node, 'ReactionGlyphs')) {
    const c = new ReactionGlyph(s, { speciesGlyphs, reactions, speciesReferences })
    layout.reactionGlyphs.set(c.id, c)
    glyphs.set(c.id, c)
  }
  for (let s of listOf(node, 'TextGlyphs')) {
    const c = makeTextGlyph(s, { glyphs, species, compartments, reactions })
    layout.textGlyphs.set(c.id, c)
  }

  return layout
}

class BBox {
  constructor () { assign(this, {x: 0, y: 0, width: 0, height: 0}) }
}

function makeBBox (node) {
  const pos = getChild(node, 'position')
  const dim = getChild(node, 'dimensions')
  return assign(new BBox(), pick(pos, 'x', 'y'), pick(dim, 'height', 'width'))
}

class CompartmentGlyph {
  constructor () {
    assign(this, {id: '', compartment: undefined, boundingBox: undefined})
  }
}
function makeCompartmentGlyph (node, {compartments}) {
  return assign(new CompartmentGlyph(), {
    compartment: compartments.get(node.compartment),
    boundingBox: makeBBox(getChild(node, 'boundingBox'))
  }, pick(node, 'id'))
}

class SpeciesReferenceGlyph {
  constructor (node, {speciesReferences, speciesGlyphs}) {
    assign(this, {
      speciesReference: speciesReferences.get(node.speciesReference),
      speciesGlyph: speciesGlyphs.get(node.speciesGlyph)
    }, pick(node, 'id', 'role'))
  }
}

class ReactionGlyph {
  constructor (node, {reactions, speciesReferences, speciesGlyphs}) {
    assign(this, pick(node, 'id'))
    this.curve = null
    this.reaction = reactions.get(node.reaction)
    this.speciesReferenceGlyphs = new Set()
    for (let s of listOf(node, 'SpeciesReferenceGlyphs')) {
      const spec = new SpeciesReferenceGlyph(s, {speciesGlyphs, speciesReferences})
      this.speciesReferenceGlyphs.add(spec)
    }
  }
}

class TextGlyph {
  constructor () {
    assign(this, {
      id: '',
      boundingBox: undefined,
      graphicalObject: undefined,
      originOfText: undefined
    })
  }
}

function makeTextGlyph (node, {glyphs, species, reactions, compartments}) {
  const k = node.originOfText
  return assign(new TextGlyph(), {
    boundingBox: makeBBox(getChild(node, 'boundingBox')),
    graphicalObject: glyphs.get(node.graphicalObject),
    originOfText: species.get(k) || reactions.get(k) || compartments.get(k)
  }, pick(node, 'id'))
}

function makeSpeciesGlyph (node, {species}) {
  return assign(new SpeciesGlyph(), {
    boundingBox: makeBBox(getChild(node, 'boundingBox')),
    species: species.get(node.species)
  }, pick(node, 'id'))
}

class SpeciesGlyph {
  constructor () {
    assign(this, {id: '', boundingBox: undefined, species: undefined})
  }
}

class Reaction {
  constructor () {
    assign(this, {
      id: '',
      metaid: '',
      name: '',
      reversible: true,
      reactants: new Set(),
      products: new Set(),
      modifiers: new Set(),
      kineticLaw: undefined
    })
  }
}

function makeReaction (node, {species, speciesReferences}) {
  const reaction = new Reaction()
  assign(reaction, pick(node, 'id', 'metaid', 'name'))
  if (!reaction.name) reaction.name = reaction.id
  reaction.reversible = node.reversible !== 'false'
  const reactants = reaction.reactants = new Set()
  const products = reaction.products = new Set()
  const modifiers = reaction.modifiers = new Set()
  reaction.kineticLaw = null // FIXME

  function mkref (node) {
    const ref = makeSpeciesReference(node, {species})
    if (ref.annotation && ref.annotation.layoutId) {
      speciesReferences.set(ref.annotation.layoutId.id, ref)
    }
    return ref
  }

  for (let s of listOf(node, 'Reactants')) reactants.add(mkref(s))
  for (let s of listOf(node, 'Products')) products.add(mkref(s))
  for (let s of listOf(node, 'Modifiers')) modifiers.add(mkref(s))

  return reaction
}

class SpeciesReference {
  constructor () {
    assign(this, {
      metaid: '',
      stoichiometry: 1,
      species: undefined,
      annotation: undefined
    })
  }
}

function makeSpeciesReference (node, {species}) {
  return assign(new SpeciesReference(), {
    species: species.get(node.species),
    annotation: makeAnnotation(node, this)
  }, pick(node, 'metaid', 'stoichiometry'))
}

class Species {
  constructor () {
    assign(this, {
      id: '',
      metaid: '',
      name: '',
      initialConcentration: 0.0,
      compartment: undefined,
      boundaryCondition: false
    })
  }
}

function makeSpecies (node, {compartments}) {
  return assign(new Species(), pick(node, 'id', 'metaid', 'name'), {
    compartment: node.compartment && compartments.get(node.compartment),
    initialConcentration: parseFloat(node.initialConcentration),
    boundaryCondition: node.initialConcentration === 'true'
  })
}

class Compartment {
  constructor () {
    assign(this, {id: '', metaid: '', size: 0, outside: undefined})
  }
}

function makeCompartment (node, {compartments}) {
  return assign(new Compartment(), pick(node, 'id', 'metaid'), {
    size: node.size ? parseFloat(node.size) : 0,
    outside: node.outside && compartments.get(node.outside)
  })
}

module.exports = class Builder extends Transform {
  constructor (opt = {}) {
    super(assign(constOpt, opt))
  }

  _transform (node, enc, cb) {
    cb(null, makeModel(node))
  }
}
