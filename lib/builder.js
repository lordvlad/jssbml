const { Transform } = require('stream')
const pick = require('lodash.pick')
const isEmptyObject = require('is-empty-object')

const { assign } = require('./util')

const constOpt = { objectMode: true }

const getChild = (o, $name) => o && o.$children && o.$children.find((x) => x.$name === $name)
const listOf = (o, what) => {
  const x = getChild(o, `listOf${what}`)
  return x ? x.$children : []
}

class Model {
  constructor (node) {
    assign(this, pick(node, 'id', 'metaid', 'name'))
    const compartments = this.compartments = new Map()
    const species = this.species = new Map()
    this.reactions = new Map()
    const speciesReferences = this.speciesReferences = new Map()

    for (let c of listOf(node, 'Compartments')) {
      const comp = new Compartment(c, {compartments})
      this.compartments.set(c.id, comp)
    }

    for (let c of listOf(node, 'Species')) {
      const spec = new Species(c, {compartments})
      this.species.set(spec.id, spec)
    }

    for (let c of listOf(node, 'Reactions')) {
      const reac = new Reaction(c, {species, speciesReferences})
      this.reactions.set(reac.id, reac)
    }

    makeAnnotation(node, this)
  }
}


function makeAnnotation (node, parent) {
  const annotationNode = getChild(node, 'annotation')
  if (!annotationNode) return
  const annotation = {}
  const layoutNodes = listOf(annotationNode, 'Layouts')
  if (layoutNodes && layoutNodes.length) {
    annotation.layouts = new Set()
    for (let s of layoutNodes) annotation.layouts.add(new Layout(s, parent))
  }

  const layoutIdNode = getChild(annotationNode, 'layoutId')
  if (!isEmptyObject(layoutIdNode)) {
    annotation.layoutId = layoutIdNode
  }

  if (!isEmptyObject(annotation)) parent.annotation = annotation
}

class Layout {
  constructor (node, {reactions, compartments, species, speciesReferences}) {
    const glyphs = new Map()

    this.id = node.id
    this.compartmentGlyphs = new Map()
    this.reactionGlyphs = new Map()
    this.textGlyphs = new Map()
    const speciesGlyphs = this.speciesGlyphs = new Map()

    const dim = getChild(node, 'dimension')
    if (dim) assign(this, dim)

    for (let s of listOf(node, 'CompartmentGlyphs')) {
      const c = new CompartmentGlyph(s, {compartments})
      this.compartmentGlyphs.set(c.id, c)
      glyphs.set(c.id, c)
    }
    for (let s of listOf(node, 'SpeciesGlyphs')) {
      const c = new SpeciesGlyph(s, {species})
      this.speciesGlyphs.set(c.id, c)
      glyphs.set(c.id, c)
    }
    for (let s of listOf(node, 'ReactionGlyphs')) {
      const c = new ReactionGlyph(s, {speciesGlyphs, reactions, speciesReferences})
      this.reactionGlyphs.set(c.id, c)
      glyphs.set(c.id, c)
    }
    for (let s of listOf(node, 'TextGlyphs')) {
      const c = new TextGlyph(s, {glyphs, species, compartments, reactions})
      this.textGlyphs.set(c.id, c)
    }
  }
}

class BBox {
  constructor (node) {
    const pos = getChild(node, 'position')
    const dim = getChild(node, 'dimensions')
    assign(this, pick(pos, 'x', 'y'), pick(dim, 'height', 'width'))
  }
}

class CompartmentGlyph {
  constructor (node, {compartments}) {
    assign(this, {
      compartment: compartments.get(node.compartment)
    }, pick(node, 'id'), new BBox(getChild(node, 'boundingBox')))
  }
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
  constructor (node, {glyphs, species, reactions, compartments}) {
    assign(this, pick(node, 'id'))
    assign(this, new BBox(getChild(node, 'boundingBox')))
    this.graphicalObject = glyphs.get(node.graphicalObject)
    const k = node.originOfText
    this.originOfText = species.get(k) || reactions.get(k) || compartments.get(k)
  }
}

class SpeciesGlyph {
  constructor (node, {species}) {
    assign(this, pick(node, 'id'))
    assign(this, new BBox(getChild(node, 'boundingBox')))
    this.species = species.get(node.species)
  }
}

class Reaction {
  constructor (node, {species, speciesReferences}) {
    assign(this, pick(node, 'id', 'metaid', 'name'))
    if (!this.name) this.name = this.id
    this.reversible = node.reversible !== 'false'
    const reactants = this.reactants = new Set()
    const products = this.products = new Set()
    const modifiers = this.modifiers = new Set()
    this.kineticLaw = null // FIXME

    function mkref (node) {
      const ref = new SpeciesReference(node, {species})
      if (ref.annotation && ref.annotation.layoutId) {
        speciesReferences.set(ref.annotation.layoutId.id, ref)
      }
      return ref
    }

    for (let s of listOf(node, 'Reactants')) reactants.add(mkref(s))
    for (let s of listOf(node, 'Products')) products.add(mkref(s))
    for (let s of listOf(node, 'Modifiers')) modifiers.add(mkref(s))
  }
}

class SpeciesReference {
  constructor (node, {species}) {
    assign(this, {
      stoichiometry: 1,
      species: species.get(node.species)
    }, pick(node, 'metaid', 'stoichiometry'))
    makeAnnotation(this)
  }
}

class Species {
  constructor (node, {compartments}) {
    assign(this, pick(node, 'id', 'metaid', 'name'))
    this.compartment = node.compartment && compartments.get(node.compartment)
    this.initialConcentration = parseFloat(node.initialConcentration)
    this.boundaryCondition = node.initialConcentration === 'true'
  }
}

class Compartment {
  constructor (node, {compartments}) {
    assign(this, {
      outside: node.outside && compartments.get(node.outside)
    }, pick(node, 'id', 'metaid', 'size'))
  }
}

module.exports = class Builder extends Transform {
  constructor (opt = {}) {
    super(assign(constOpt, opt))
  }

  _transform (node, enc, cb) {
    cb(null, new Model(node))
  }
}
