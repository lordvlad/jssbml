const { List, Base } = require('../lib/Base')
const xmlns = 'http://projects.eml.org/bcb/sbml/level2'

const assign = Object.assign

function layoutMixin (cls) {
  return class extends cls {
    get xmlns () { return xmlns }
    get xmlnsPrefix () { return 'layout' }
  }
}

class LayoutList extends layoutMixin(List) { }
class LayoutBase extends layoutMixin(Base) { }

class ListOfLayouts extends LayoutList { }
class ListOfCompartmentGlyphs extends LayoutList { }
class ListOfReactionGlyphs extends LayoutList { }
class ListOfSpeciesGlyphs extends LayoutList { }
class ListOfSpeciesReferenceGlyphs extends LayoutList { }
class ListOfTextGlyphs extends LayoutList { }
class ListOfCurveSegments extends LayoutList { }

class Layout extends LayoutBase {
  static getDefaults () {
    return {
      id: '',
      listOfCompartmentGlyphs: null,
      listOfReactionGlyphs: null,
      listOfTextGlyphs: null,
      listOfSpeciesGlyphs: null
    }
  }
  get height () { return this.dimensions && this.dimensions.height }
  get width () { return this.dimensions && this.dimensions.width }
  set height (height) { if (!this.dimensions) this.dimensions = new Dimensions(); this.dimensions.height = height }
  set width (width) { if (!this.dimensions) this.dimensions = new Dimensions(); this.dimensions.width = width }
}

class LayoutId extends LayoutBase {
  static getDefaults () { return { id: '' } }
}

class CompartmentGlyph extends LayoutBase {
  static getDefaults () {
    return {
      id: '',
      compartment: null,
      boundingBox: null
    }
  }
}

class Position extends LayoutBase { static getDefaults () { return { x: 0, y: 0 } } }
class Dimensions extends LayoutBase { static getDefaults () { return { width: 0, height: 0 } } }
class Curve extends LayoutBase { }
class CurveSegment extends LayoutBase { static getDefaults () { return {'xsi:type': ''} } }
class Start extends Position { }
class BasePoint1 extends Position { }
class BasePoint2 extends Position { }
class End extends Position { }

class BoundingBox extends LayoutBase {
  static getDefaults () {
    return {position: null, dimensions: null}
  }
  get x () { return this.position && this.position.x }
  get y () { return this.position && this.position.y }
  set x (x) { if (!this.position) this.position = new Position(); this.position.x = x }
  set y (y) { if (!this.position) this.position = new Position(); this.position.y = y }
  get height () { return this.dimensions && this.dimensions.height }
  get width () { return this.dimensions && this.dimensions.width }
  set height (height) { if (!this.dimensions) this.dimensions = new Dimensions(); this.dimensions.height = height }
  set width (width) { if (!this.dimensions) this.dimensions = new Dimensions(); this.dimensions.width = width }
}

class TextGlyph extends LayoutBase {
  static getDefaults () {
    return {
      id: '',
      boundingBox: null,
      graphicalObject: null,
      originOfText: null
    }
  }
}

class SpeciesGlyph extends LayoutBase {
  static getDefaults () {
    return {
      id: '',
      boundingBox: null,
      species: null
    }
  }
}

class SpeciesReferenceGlyph extends LayoutBase {
  static getDefaults () {
    return {
      id: '',
      role: '',
      speciesReference: null,
      speciesGlyph: null
    }
  }
}

class ReactionGlyph extends LayoutBase {
  static getDefaults () {
    return {
      id: '',
      curve: null,
      reaction: null,
      listOfSpeciesReferenceGlyphs: null
    }
  }
}

function registerWriter (writer) {
  writer.writeCompartmentGlyph = function (glyph) {
    const props = assign({}, glyph)
    props.compartment = props.compartment.id
    this._writeTag(glyph.constructor, props)
  }

  writer.writeSpeciesGlyph = function (glyph) {
    const props = assign({}, glyph)
    props.species = props.species.id
    this._writeTag(glyph.constructor, props)
  }

  writer.writeSpeciesReferenceGlyph = function (glyph) {
    const props = assign({}, glyph)
    props.speciesGlyph = props.speciesGlyph.id
    props.speciesReference = props.speciesReference.annotation.layoutId.id
    this._writeTag(glyph.constructor, props)
  }

  writer.writeReactionGlyph = function (glyph) {
    const props = assign({}, glyph)
    props.reaction = props.reaction.id
    this._writeTag(glyph.constructor, props)
  }

  writer.writeTextGlyph = function (glyph) {
    const props = assign({}, glyph)
    props.graphicalObject = glyph.graphicalObject.id
    props.originOfText = glyph.originOfText.id
    this._writeTag(glyph.constructor, props)
  }
}

function registerReader (reader) {
  const collectReaction = (x, v) => {
    v.listOfSpeciesReferenceGlyphs.reduce(collect, x)
    return assign(x, {[v.id]: v})
  }
  const collect = (x, v) => v.reaction ? collectReaction(x, v) : assign(x, {[v.id]: v})

  reader.transformTextGlyphs = function (sbml) {
    const reactions = sbml.model.listOfReactions.reduce(collect, {})
    const species = sbml.model.listOfSpecies.reduce(collect, {})
    const compartments = sbml.model.listOfCompartments.reduce(collect, {})
    for (let layout of (sbml.model.annotation.listOfLayouts || [])) {
      const glyphs = {}
      layout.listOfSpeciesGlyphs.reduce(collect, glyphs)
      layout.listOfReactionGlyphs.reduce(collect, glyphs)
      layout.listOfCompartmentGlyphs.reduce(collect, glyphs)
      for (let textGlyph of (layout.listOfTextGlyphs || [])) {
        textGlyph.graphicalObject = glyphs[textGlyph.graphicalObject]
        const k = textGlyph.originOfText
        textGlyph.originOfText = species[k] || reactions[k] || compartments[k]
      }
    }
  }

  reader.transformReactionGlyphs = function (sbml) {
    const reactions = sbml.model.listOfReactions.reduce(collect, {})
    const speciesRefs = sbml.model.listOfReactions.reduce((speciesRefs, reaction) => {
      function add (speciesRef) {
        const layoutId = speciesRef.annotation && speciesRef.annotation.layoutId
        if (layoutId) speciesRefs[layoutId.id] = speciesRef
      }
      reaction.listOfReactants.map(add)
      reaction.listOfProducts.map(add)
      reaction.listOfModifiers.map(add)
      return speciesRefs
    }, {})
    for (let layout of (sbml.model.annotation.listOfLayouts || [])) {
      const speciesGlyphs = layout.listOfSpeciesGlyphs.reduce(collect, {})
      for (let reactionGlyph of (layout.listOfReactionGlyphs || [])) {
        reactionGlyph.reaction = reactions[reactionGlyph.reaction]
        for (let refGlyph of (reactionGlyph.listOfSpeciesReferenceGlyphs || [])) {
          refGlyph.speciesGlyph = speciesGlyphs[refGlyph.speciesGlyph]
          refGlyph.speciesReference = speciesRefs[refGlyph.speciesReference]
        }
      }
    }
  }

  reader.transformSpeciesGlyphs = function (sbml) {
    const species = sbml.model.listOfSpecies.reduce(collect, {})
    for (let layout of (sbml.model.annotation.listOfLayouts || [])) {
      for (let speciesGlyph of (layout.listOfSpeciesGlyphs || [])) {
        speciesGlyph.species = species[speciesGlyph.species]
      }
    }
  }

  reader.transformCompartmentGlyphs = function (sbml) {
    const comps = sbml.model.listOfCompartments.reduce(collect, {})
    for (let layout of (sbml.model.annotation.listOfLayouts || [])) {
      for (let compGlyph of (layout.listOfCompartmentGlyphs || [])) {
        compGlyph.compartment = comps[compGlyph.compartment]
      }
    }
  }
}

module.exports = assign(Layout, {
  Layout,
  xmlns,
  ListOfLayouts,
  ListOfCompartmentGlyphs,
  ListOfReactionGlyphs,
  ListOfSpeciesGlyphs,
  ListOfSpeciesReferenceGlyphs,
  CompartmentGlyph,
  SpeciesGlyph,
  ReactionGlyph,
  SpeciesReferenceGlyph,
  ListOfTextGlyphs,
  TextGlyph,
  BoundingBox,
  LayoutId,
  Dimensions,
  Position,
  Curve,
  CurveSegment,
  ListOfCurveSegments,
  Start,
  End,
  BasePoint1,
  BasePoint2,
  registerReader,
  registerWriter
})
