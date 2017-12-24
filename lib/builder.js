const { Transform } = require('stream')
const pick = require('lodash.pick')
const memoize = require('lodash.memoize')
const isEmptyObject = require('is-empty-object')

const {namespaceKeys} = require('./util')

const assign = Object.assign
const constOpt = { objectMode: true }
const deepProps = x => x && x !== Object.prototype && Object.getOwnPropertyNames(x).concat(deepProps(Object.getPrototypeOf(x)) || [])
const deepFunctions = x => deepProps(x).filter(name => typeof x[ name ] === 'function')
const userFunctions = x => new Set(deepFunctions(x).filter(name => name !== 'constructor' && !~name.indexOf('__')))

function createContext () {
  const ctx = {}
  const guard = (o, k) => {
    if (!o[k]) {
      o[k] = {}
    }
  }
  const handler = {
    get (o, k) {
      guard(o, k)
      return o[k]
    }
  }
  return new Proxy(ctx, handler)
}

module.exports = class Builder extends Transform {
  constructor (opt = {}) {
    super(assign(constOpt, opt))
    this.Document = opt.Document
    this.getListConstructor = memoize(this.getListConstructor)
    this.getElementFactory = memoize(this.getElementFactory)
  }

  _transform (node, enc, cb) {
    this.ctx = createContext()
    const doc = this.makeDocument(node)
    this.ctx = {}
    cb(null, doc)
  }

  getListConstructor (key) {
    return this.getConstructor('listOf' + this.pluralize(key))
  }

  getConstructor (key) {
    const _key = key.toLowerCase()
    for (let k of deepProps(this.Document)) {
      if (k.toLowerCase() === _key) return this.Document[k]
    }
  }

  getElementFactory (key) {
    const _key = 'make' + key.toLowerCase()
    for (let k of userFunctions(this)) {
      if (k.toLowerCase() === _key) return this[k].bind(this)
    }
  }

  makeListOf (node, ctxKey) {
    const _ctxKey = this.pluralize(ctxKey)
    const ListConstructor = this.getListConstructor(ctxKey)
    const elementFactory = this.getElementFactory(ctxKey)
    const list = this.getChildListOf(node, ctxKey)
    const l = new ListConstructor()
    for (let n of list) {
      const c = elementFactory(n, this.ctx)
      this.ctx[_ctxKey][c.id] = c
      l.push(c)
    }
    return l
  }

  makeDocument (node) {
    const document = new this.Document()
    const model = this.makeModel(this.getChild(node, 'model'))
    return assign(document, pick(node, 'level', 'version', ...namespaceKeys(node)), {model})
  }

  makeModel (node) {
    const listOfCompartments = this.makeListOf(node, 'compartment')
    const listOfSpecies = this.makeListOf(node, 'species')
    const listOfReactions = this.makeListOf(node, 'reaction')
    const annotation = this.makeAnnotation(node)

    return assign(new this.Document.Model(), pick(node, 'id', 'metaid', 'name'), {
      listOfCompartments,
      listOfReactions,
      listOfSpecies,
      annotation
    })
  }

  makeAnnotation (node, parent) {
    const annotationNode = this.getChild(node, 'annotation')
    if (!annotationNode) return
    const annotation = {}
    const layoutNodes = this.getChildListOf(annotationNode, 'Layouts')
    if (layoutNodes && layoutNodes.length) {
      annotation.listOfLayouts = new this.Document.ListOfLayouts()
      for (let s of layoutNodes) annotation.listOfLayouts.push(this.makeLayout(s, parent))
    }

    const layoutIdNode = this.getChild(annotationNode, 'layoutId')
    if (!isEmptyObject(layoutIdNode)) {
      annotation.layoutId = layoutIdNode
    }

    return isEmptyObject(annotation) ? undefined : assign(new this.Document.Annotation(), annotation)
  }

  makeCompartment (node) {
    const {compartments} = this.ctx
    return assign(new this.Document.Compartment(), pick(node, 'id', 'metaid', 'name'), {
      size: node.size ? parseFloat(node.size) : 0,
      outside: node.outside && compartments[node.outside]
    })
  }
  makeSpecies (node) {
    const {compartments} = this.ctx
    return assign(new this.Document.Species(), pick(node, 'id', 'metaid', 'name'), {
      compartment: node.compartment && compartments[node.compartment],
      initialConcentration: parseFloat(node.initialconcentration),
      boundaryCondition: node.boundarycondition === 'true'
    })
  }
  makeSpeciesReference (node) {
    const {species} = this.ctx
    const x = node.$name === 'speciesreference' ? new this.Document.SpeciesReference() : new this.Document.ModifierSpeciesReference()
    return assign(x, pick(node, 'metaid'), {
      species: species[node.species],
      annotation: this.makeAnnotation(node, this),
      stoichiometry: this.intOr1(node.stoichiometry)
    })
  }
  makeTextGlyph (node) {
    const {glyphs, species, reactions, compartments} = this.ctx
    const k = node.originoftext
    return assign(new this.Document.TextGlyph(), pick(node, 'id'), {
      boundingBox: this.makeBBox(this.getChild(node, 'boundingBox')),
      graphicalObject: glyphs[node.graphicalobject],
      originOfText: species[k] || reactions[k] || compartments[k]
    })
  }

  makeSpeciesGlyph (node) {
    const {species} = this.ctx
    return assign(new this.Document.SpeciesGlyph(), pick(node, 'id'), {
      boundingBox: this.makeBBox(this.getChild(node, 'boundingBox')),
      species: species[node.species]
    })
  }

  makeBBox (node) {
    const pos = this.getChild(node, 'position')
    const dim = this.getChild(node, 'dimensions')
    const bbox = new this.Document.BBox()
    bbox.x = parseFloat(pos.x)
    bbox.y = parseFloat(pos.y)
    bbox.height = parseFloat(dim.height)
    bbox.width = parseFloat(dim.width)
    return bbox
  }
  makeCompartmentGlyph (node) {
    const {compartments} = this.ctx
    return assign(new this.Document.CompartmentGlyph(), pick(node, 'id'), {
      compartment: compartments[node.compartment],
      boundingBox: this.makeBBox(this.getChild(node, 'boundingBox'))
    })
  }

  makeSpeciesReferenceGlyph (node) {
    const {speciesReferences, glyphs} = this.ctx
    return assign(new this.Document.SpeciesReferenceGlyph(), pick(node, 'id', 'role'), {
      speciesReference: speciesReferences[node.speciesreference],
      speciesGlyph: glyphs[node.speciesglyph]
    })
  }

  makeLayout (node) {
    const { glyphs } = this.ctx
    const layout = new this.Document.Layout()

    layout.id = node.id

    assign(layout, this.getChild(node, 'dimension'))

    for (let s of this.getChildListOf(node, 'CompartmentGlyphs')) {
      const c = this.makeCompartmentGlyph(s)
      layout.listOfCompartmentGlyphs.push(c)
      glyphs[c.id] = c
    }
    for (let s of this.getChildListOf(node, 'SpeciesGlyphs')) {
      const c = this.makeSpeciesGlyph(s)
      layout.listOfSpeciesGlyphs.push(c)
      glyphs[c.id] = c
    }
    for (let s of this.getChildListOf(node, 'ReactionGlyphs')) {
      const c = this.makeReactionGlyph(s)
      layout.listOfReactionGlyphs.push(c)
      glyphs[c.id] = c
    }
    for (let s of this.getChildListOf(node, 'TextGlyphs')) {
      const c = this.makeTextGlyph(s)
      layout.listOfTextGlyphs.push(c)
      glyphs[c.id] = c
    }

    return layout
  }

  makeReactionGlyph (node) {
    const {reactions} = this.ctx
    const reactionGlyph = new this.Document.ReactionGlyph()
    assign(reactionGlyph, pick(node, 'id'))
    reactionGlyph.curve = null
    reactionGlyph.reaction = reactions[node.reaction]
    for (let s of this.getChildListOf(node, 'SpeciesReferenceGlyphs')) {
      const spec = this.makeSpeciesReferenceGlyph(s)
      reactionGlyph.listOfSpeciesReferenceGlyphs.push(spec)
    }
    return reactionGlyph
  }

  makeReaction (node) {
    const {speciesReferences} = this.ctx

    const mkref = (node) => {
      const ref = this.makeSpeciesReference(node)
      if (ref.annotation && ref.annotation.layoutId) {
        speciesReferences[ref.annotation.layoutId.id] = ref
      }
      return ref
    }

    const mklist = (a) => {
      const Ctor = this.getListConstructor(a)
      const l = new Ctor()
      for (let n of this.getChildListOf(node, this.pluralize(a))) {
        const c = mkref(n, this.ctx)
        this.ctx['speciesReferences'][c.id] = c
        l.push(c)
      }
      return l
    }

    const listOfReactants = mklist('Reactant')
    const listOfProducts = mklist('Product')
    const listOfModifiers = mklist('Modifier')

    return assign(new this.Document.Reaction(), pick(node, 'id', 'metaid', 'name'), {
      kineticLaw: null,
      reversible: node.reversible !== 'false',
      listOfReactants,
      listOfProducts,
      listOfModifiers
    })
  }

  /**
   * @param {{}} o the object in which to look
   * @param {String} k the key to look for
   * @param {*any} d the default value
   */
  getValueOrDefault (o, k, d) { return (o && o[k]) ? o[k] : d }
  getChildListOf (n, what) { return this.getValueOrDefault(this.getChild(n, `listOf${this.pluralize(what)}`), '$children', []) }
  getChild (n, $name) { return n && n.$children && n.$children.find((x) => x.$name.toLowerCase() === $name.toLowerCase()) }
  /**
   * @param {String} s
   */
  capitalize (s) { return s.charAt(0).toUpperCase() + s.substr(1) }
  /**
   * @param {String} s
   */
  pluralize (s) { return s.charAt(s.length - 1) === 's' ? s : s + 's' }
  /**
   * @param {String} s
   */
  intOr1 (s) { s = parseInt(s); return isNaN(s) ? 1 : s }
}
