const { Transform } = require('stream')
const pick = require('lodash.pick')
const isEmptyObject = require('is-empty-object')

const {CompartmentGlyph, Model, Layout, BBox,
  Reaction, Species, SpeciesReference, Compartment,
  TextGlyph, SpeciesGlyph, SpeciesReferenceGlyph,
  ReactionGlyph
} = require('./model')

const assign = Object.assign
const constOpt = { objectMode: true }

const getChild = (o, $name) => o && o.$children && o.$children.find((x) => x.$name === $name)
const listOf = (o, what) => {
  const x = o && getChild(o, `listOf${what}`)
  return (x && x.$children) || []
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
    const c = makeReactionGlyph(s, { speciesGlyphs, reactions, speciesReferences })
    layout.reactionGlyphs.set(c.id, c)
    glyphs.set(c.id, c)
  }
  for (let s of listOf(node, 'TextGlyphs')) {
    const c = makeTextGlyph(s, { glyphs, species, compartments, reactions })
    layout.textGlyphs.set(c.id, c)
  }

  return layout
}

function makeBBox (node) {
  const pos = getChild(node, 'position')
  const dim = getChild(node, 'dimensions')
  return assign(new BBox(), pick(pos, 'x', 'y'), pick(dim, 'height', 'width'))
}

function makeCompartmentGlyph (node, {compartments}) {
  return assign(new CompartmentGlyph(), {
    compartment: compartments.get(node.compartment),
    boundingBox: makeBBox(getChild(node, 'boundingBox'))
  }, pick(node, 'id'))
}

function makeSpeciesReferenceGlyph (node, {speciesReferences, speciesGlyphs}) {
  return assign(new SpeciesReferenceGlyph(), {
    speciesReference: speciesReferences.get(node.speciesReference),
    speciesGlyph: speciesGlyphs.get(node.speciesGlyph)
  }, pick(node, 'id', 'role'))
}

function makeReactionGlyph (node, {reactions, speciesReferences, speciesGlyphs}) {
  const reaction = new ReactionGlyph()
  assign(reaction, pick(node, 'id'))
  reaction.curve = null
  reaction.reaction = reactions.get(node.reaction)
  reaction.speciesReferenceGlyphs = new Set()
  for (let s of listOf(node, 'SpeciesReferenceGlyphs')) {
    const spec = makeSpeciesReferenceGlyph(s, {speciesGlyphs, speciesReferences})
    reaction.speciesReferenceGlyphs.add(spec)
  }
  return reaction
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

function makeSpeciesReference (node, {species}) {
  return assign(new SpeciesReference(), {
    species: species.get(node.species),
    annotation: makeAnnotation(node, this)
  }, pick(node, 'metaid', 'stoichiometry'))
}

function makeSpecies (node, {compartments}) {
  return assign(new Species(), pick(node, 'id', 'metaid', 'name'), {
    compartment: node.compartment && compartments.get(node.compartment),
    initialConcentration: parseFloat(node.initialConcentration),
    boundaryCondition: node.initialConcentration === 'true'
  })
}

function makeCompartment (node, {compartments}) {
  return assign(new Compartment(), pick(node, 'id', 'metaid', 'name'), {
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
