const { Transform } = require('stream')
const pick = require('lodash.pick')
const isEmptyObject = require('is-empty-object')

const {namespaceKeys} = require('./util')
const Document = require('./document')
const {CompartmentGlyph, Layout, BBox,
  Reaction, Species, SpeciesReference, Compartment,
  TextGlyph, SpeciesGlyph, SpeciesReferenceGlyph,
  ReactionGlyph, Model
} = Document

const assign = Object.assign
const constOpt = { objectMode: true }

const capitalize = (s) => s.charAt(0).toUpperCase() + s.substr(1)
const getChild = (o, $name) => o && o.$children && o.$children.find((x) => x.$name === $name)
const listOf = (o, what) => {
  const x = o && getChild(o, `listOf${what}`)
  return (x && x.$children) || []
}

function pluralize (s) {
  return s.charAt(s.length - 1) === 's' ? s : s + 's'
}

function makeListOf2 (node, ctx, ctxKey, Ctor, factory) {
  const l = new Ctor()
  for (let n of (node && node.$children ? node.$children : [])) {
    const c = factory(n, ctx)
    ctx[ctxKey][c.id] = c
    l.push(c)
  }
  return l
}

function makeListOf (node, ctx, ctxKey) {
  const ListConstructor = eval(`Document.ListOf${capitalize(pluralize(ctxKey))}`) // eslint-disable-line no-eval
  const childFactory = eval(`make${capitalize(ctxKey)}`) // eslint-disable-line no-eval
  const listNode = getChild(node, `listOf${capitalize(pluralize(ctxKey))}`)
  const l = new ListConstructor()
  for (let n of (listNode && listNode.$children ? listNode.$children : [])) {
    const c = childFactory(n, ctx)
    ctx[`${pluralize(ctxKey)}`][c.id] = c
    l.push(c)
  }
  return l
}

function makeModel (node, ctx) {
  const listOfCompartments = makeListOf(node, ctx, 'compartment')
  const listOfSpecies = makeListOf(node, ctx, 'species')
  const listOfReactions = makeListOf(node, ctx, 'reaction')
  const annotation = makeAnnotation(node, ctx)

  return assign(new Model(), pick(node, 'id', 'metaid', 'name'), {
    listOfCompartments,
    listOfReactions,
    listOfSpecies,
    annotation
  })
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

function makeReaction (node, ctx) {
  const {species, speciesReferences} = ctx

  function mkref (node) {
    const ref = makeSpeciesReference(node, {species})
    if (ref.annotation && ref.annotation.layoutId) {
      speciesReferences[ref.annotation.layoutId.id] = ref
    }
    return ref
  }
  function mklist (a) {
    const Ctor = eval(`Document.ListOf${a}`) // eslint-disable-line no-eval
    return makeListOf2(getChild(node, a), ctx, 'speciesReferences', Ctor, mkref)
  }

  const reactants = mklist('Reactants')
  const products = mklist('Products')
  const modifiers = mklist('Modifiers')

  return assign(new Reaction(), pick(node, 'id', 'metaid', 'name'), {
    kineticLaw: null,
    reversible: node.reversible !== 'false',
    reactants,
    products,
    modifiers
  })
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

function makeDocument (node, ctx) {
  const document = new Document()
  assign(document, pick(node, 'level', 'version', ...namespaceKeys(node)))
  document.model = makeModel(getChild(node, 'model'), ctx)
  return document
}

module.exports = class Builder extends Transform {
  constructor (opt = {}) {
    super(assign(constOpt, opt))
  }

  _transform (node, enc, cb) {
    const ctx = {
      species: {},
      reactions: {},
      compartments: {},
      speciesReferences: {}
    }
    cb(null, makeDocument(node, ctx))
  }
}
