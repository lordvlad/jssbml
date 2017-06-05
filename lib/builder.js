const { Transform } = require('stream')
const pick = require('lodash.pick')
// const isEmptyObject = require('is-empty-object')

const assign = Object.assign
const constOpt = { objectMode: true }

const getChild = (o, $name) => o && o.$children && o.$children.find((x) => x.$name === $name)
const listOf = (o, what) => {
  const x = getChild(o, `listOf${what}`)
  return x ? x.$children : []
}

function mkModel (node) {
  let compartments
  let species
  return assign({
    id: node.id,
    metaid: node.metaid,
    name: node.name,
    compartments: (compartments = listOf(node, 'Compartments').reduce((compartments, node) => {
      const g = mkCompartment(node, compartments)
      return assign(compartments, {[g.id]: g})
    }, {})),
    species: (species = listOf(node, 'Species').reduce((species, node) => {
      const g = mkSpecies(node, compartments)
      return assign(species, {[g.id]: g})
    }, {}))
  }, listOf(node, 'Reactions').reduce(({reactions, speciesReferences}, node) => {
    const g = mkReaction(node, species, speciesReferences)
    return {
      reactions: assign(reactions, {[g.id]: g}),
      speciesReferences
    }
  }, {speciesReferences: {}, reactions: {}}))
}

function makeAnnotation (node, parent) {
  function mkLay (node) {
    return mkLayout(node, parent.reactions, parent.compartments, parent.species, parent.speciesReferences)
  }

  const annotationNode = getChild(node, 'annotation')
  return {
    layoutId: getChild(annotationNode, 'layoutId'),
    layouts: listOf(annotationNode, 'Layouts').map(mkLay)
  }


}

function mkLayout (node, reactions, compartments, species, speciesReferences) {
  const glyphs = {}
  let speciesGlyphs = {}
  return assign({
    id: node.id,
    compartmentGlyphs: listOf(node, 'CompartmentGlyphs')
      .map((node) => mkCompartmentGlyph(node, compartments))
      .map((glyph) => ({ [glyph.id]: glyph }))
      .reduce((o, x) => assign(glyphs, x) && assign(o, x)),
    speciesGlyphs: (speciesGlyphs = listOf(node, 'SpeciesGlyphs')
      .map((node) => mkSpeciesGlyph(node, species))
      .map((glyph) => ({ [glyph.id]: glyph }))
      .reduce((o, x) => assign(glyphs, x) && assign(o, x))),
    reactionGlyphs: listOf(node, 'ReactionGlyphs')
      .map((node) => mkReactionGlyph(node, speciesGlyphs, reactions, speciesReferences))
      .map((glyph) => ({ [glyph.id]: glyph }))
      .reduce((o, x) => assign(glyphs, x) && assign(o, x)),
    textGlyphs: listOf(node, 'TextGlyphs')
      .map((node) => mkTextGlyph(node, glyphs, species, compartments, reactions))
      .reduce((o, g) => assign(o, { [g.id]: g }), {})
  }, getChild(node, 'dimension'))
}

function mkBBox (node) {
  const bbox = getChild(node, 'boundingBox')
  const pos = getChild(bbox, 'position')
  const dim = getChild(bbox, 'dimensions')
  return assign(pos, dim)
}

function mkCompartmentGlyph (node, compartments) {
  return assign({
    id: node.id,
    compartment: compartments[node.compartment]
  }, mkBBox(node))
}

function mkSpeciesReferenceGlyph (node, speciesReferences, speciesGlyphs) {
  return {
    id: node.id,
    role: node.role,
    speciesReference: speciesReferences[node.speciesReference],
    speciesGlyph: speciesGlyphs[node.speciesGlyph]
  }
}

function mkReactionGlyph (node, reactions, speciesReferences, speciesGlyphs) {
  function mkSpecRef (node) {
    return mkSpeciesReferenceGlyph(node, speciesGlyphs, speciesReferences)
  }
  return {
    id: node.id,
    curve: null, // FIXME
    reaction: reactions[node.reaction],
    speciesReferenceGlyphs: listOf(node, 'SpeciesReferenceGlyphs').map(mkSpecRef)
  }
}

function mkTextGlyph (node, glyphs, species, reactions, compartments) {
  const k = node.originOfText
  return assign({
    id: node.id,
    originOfText: species[k] || reactions[k] || compartments[k],
    graphicalObject: glyphs[node.graphicalObject]
  }, mkBBox(node))
}

function mkSpeciesGlyph (node, species) {
  return assign({
    id: node.id,
    species: species[node.species]
  }, mkBBox(node))
}

function mkReaction (node, species, speciesReferences) {
  function mkref (node) {
    const ref = mkSpeciesReference(node, species)
    if (ref.annotation && ref.annotation.layoutId) {
      speciesReferences[ref.annotation.layoutId.id] = ref
    }
    return ref
  }

  return {
    id: node.id,
    metaid: node.metaid,
    name: node.name,
    reversible: node.reversible !== 'false',
    kineticLaw: null, // FIXME
    reactants: listOf(node, 'Reactants').map(mkref),
    products: listOf(node, 'Products').map(mkref),
    modifiers: listOf(node, 'Modifiers').map(mkref)
  }
}

function mkSpeciesReference (node, species) {
  return {
    metaid: node.metaid,
    stoichiometry: node.stoichiometry || 1,
    species: species[node.species],
    annotation: makeAnnotation(node)
  }
}

function mkSpecies (node, compartments) {
  return {
    id: node.id,
    metaid: node.metaid,
    name: node.name,
    compartment: node.compartment && compartments[node.compartment],
    initialConcentration: parseFloat(node.initialConcentration),
    boundaryCondition: node.initialConcentration === 'true'
  }
}

function mkCompartment (node, compartments) {
  return {
    id: node.id,
    metaid: node.metaid,
    size: node.size,
    outside: node.outside && compartments[node.outside]
  }
}

module.exports = class Builder extends Transform {
  constructor (opt = {}) {
    super(assign(constOpt, opt))
  }

  _transform (node, enc, cb) {
    cb(null, mkModel(node))
  }
}
