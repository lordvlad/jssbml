const { Transform } = require('stream')
const pick = require('lodash.pick')
const isEmptyObject = require('is-empty-object')

const Document = require('./document')
const {CompartmentGlyph, Layout, BBox,
  Reaction, Species, SpeciesReference, Compartment,
  TextGlyph, SpeciesGlyph, SpeciesReferenceGlyph,
  ReactionGlyph, Model
} = Document

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
    compartments[c.id] = makeCompartment(c, {compartments})
  }

  for (let c of listOf(node, 'Species')) {
    species[c.id] = makeSpecies(c, {compartments})
  }

  for (let c of listOf(node, 'Reactions')) {
    reactions[c.id] = makeReaction(c, {species, speciesReferences})
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
    annotation.layouts = []
    for (let s of layoutNodes) annotation.layouts.push(makeLayout(s, parent))
  }

  const layoutIdNode = getChild(annotationNode, 'layoutId')
  if (!isEmptyObject(layoutIdNode)) {
    annotation.layoutId = layoutIdNode
  }

  return isEmptyObject(annotation) ? undefined : annotation
}

function makeLayout (node, { reactions, compartments, species, speciesReferences }) {
  const layout = new Layout()
  const glyphs = {}

  layout.id = node.id
  layout.compartmentGlyphs = {}
  layout.reactionGlyphs = {}
  layout.textGlyphs = {}
  const speciesGlyphs = layout.speciesGlyphs = {}

  assign(layout, getChild(node, 'dimension'))

  for (let s of listOf(node, 'CompartmentGlyphs')) {
    const c = makeCompartmentGlyph(s, { compartments })
    layout.compartmentGlyphs[c.id] = c
    glyphs[c.id] = c
  }
  for (let s of listOf(node, 'SpeciesGlyphs')) {
    const c = makeSpeciesGlyph(s, { species })
    layout.speciesGlyphs[c.id] = c
    glyphs[c.id] = c
  }
  for (let s of listOf(node, 'ReactionGlyphs')) {
    const c = makeReactionGlyph(s, { speciesGlyphs, reactions, speciesReferences })
    layout.reactionGlyphs[c.id] = c
    glyphs[c.id] = c
  }
  for (let s of listOf(node, 'TextGlyphs')) {
    const c = makeTextGlyph(s, { glyphs, species, compartments, reactions })
    layout.textGlyphs[c.id] = c
  }

  return layout
}

function makeBBox (node) {
  const pos = getChild(node, 'position')
  const dim = getChild(node, 'dimensions')
  const bbox = new BBox()
  bbox.x = parseFloat(pos.x)
  bbox.y = parseFloat(pos.y)
  bbox.height = parseFloat(dim.height)
  bbox.width = parseFloat(dim.width)
  return bbox
}

function makeCompartmentGlyph (node, {compartments}) {
  return assign(new CompartmentGlyph(), {
    compartment: compartments[node.compartment],
    boundingBox: makeBBox(getChild(node, 'boundingBox'))
  }, pick(node, 'id'))
}

function makeSpeciesReferenceGlyph (node, {speciesReferences, speciesGlyphs}) {
  return assign(new SpeciesReferenceGlyph(), {
    speciesReference: speciesReferences[node.speciesReference],
    speciesGlyph: speciesGlyphs[node.speciesGlyph]
  }, pick(node, 'id', 'role'))
}

function makeReactionGlyph (node, {reactions, speciesReferences, speciesGlyphs}) {
  const reaction = new ReactionGlyph()
  assign(reaction, pick(node, 'id'))
  reaction.curve = null
  reaction.reaction = reactions[node.reaction]
  reaction.speciesReferenceGlyphs = []
  for (let s of listOf(node, 'SpeciesReferenceGlyphs')) {
    const spec = makeSpeciesReferenceGlyph(s, {speciesGlyphs, speciesReferences})
    reaction.speciesReferenceGlyphs.push(spec)
  }
  return reaction
}

function makeTextGlyph (node, {glyphs, species, reactions, compartments}) {
  const k = node.originOfText
  return assign(new TextGlyph(), {
    boundingBox: makeBBox(getChild(node, 'boundingBox')),
    graphicalObject: glyphs[node.graphicalObject],
    originOfText: species[k] || reactions[k] || compartments[k]
  }, pick(node, 'id'))
}

function makeSpeciesGlyph (node, {species}) {
  return assign(new SpeciesGlyph(), {
    boundingBox: makeBBox(getChild(node, 'boundingBox')),
    species: species[node.species]
  }, pick(node, 'id'))
}

function makeReaction (node, {species, speciesReferences}) {
  const reaction = new Reaction()
  assign(reaction, pick(node, 'id', 'metaid', 'name'))
  if (!reaction.name) reaction.name = reaction.id
  reaction.reversible = node.reversible !== 'false'
  const reactants = reaction.reactants = []
  const products = reaction.products = []
  const modifiers = reaction.modifiers = []
  reaction.kineticLaw = null // FIXME

  function mkref (node) {
    const ref = makeSpeciesReference(node, {species})
    if (ref.annotation && ref.annotation.layoutId) {
      speciesReferences[ref.annotation.layoutId.id] = ref
    }
    return ref
  }

  for (let s of listOf(node, 'Reactants')) reactants.push(mkref(s))
  for (let s of listOf(node, 'Products')) products.push(mkref(s))
  for (let s of listOf(node, 'Modifiers')) modifiers.push(mkref(s))

  return reaction
}

function intOr1 (x) { x = parseInt(x); return isNaN(x) ? 1 : x }

function makeSpeciesReference (node, {species}) {
  return assign(new SpeciesReference(), {
    species: species[node.species],
    annotation: makeAnnotation(node, this),
    stoichiometry: intOr1(node.stoichiometry)
  }, pick(node, 'metaid'))
}

function makeSpecies (node, {compartments}) {
  return assign(new Species(), pick(node, 'id', 'metaid', 'name'), {
    compartment: node.compartment && compartments[node.compartment],
    initialConcentration: parseFloat(node.initialConcentration),
    boundaryCondition: node.initialConcentration === 'true'
  })
}

function makeCompartment (node, {compartments}) {
  return assign(new Compartment(), pick(node, 'id', 'metaid', 'name'), {
    size: node.size ? parseFloat(node.size) : 0,
    outside: node.outside && compartments[node.outside]
  })
}

function makeDocument (node) {
  const d = new Document()
  d.model = makeModel(getChild(node, 'model'))
  return d
}

module.exports = class Builder extends Transform {
  constructor (opt = {}) {
    super(assign(constOpt, opt))
  }

  _transform (node, enc, cb) {
    cb(null, makeDocument(node))
  }
}
