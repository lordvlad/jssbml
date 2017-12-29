const isEmptyObject = require('is-empty-object')
const pick = require('lodash.pick')

const assign = Object.assign

module.exports = function (jssbml) {
  const {
    Document: ODocument,
    Builder: OBuilder
  } = jssbml
  const {
    List,
    Annotation: OAnnotation
  } = ODocument

  class ListOfLayouts extends List { }
  class ListOfCompartmentGlyphs extends List { }
  class ListOfReactionGlyphs extends List { }
  class ListOfSpeciesGlyphs extends List { }
  class ListOfSpeciesReferenceGlyphs extends List { }
  class ListOfTextGlyphs extends List { }

  class Annotation extends OAnnotation {
    constructor () {
      super()
      assign(this, {
        listOfLayouts: new ListOfLayouts()
      })
    }
  }

  class Layout {
    constructor () {
      assign(this, {
        id: '',
        listOfCompartmentGlyphs: new ListOfCompartmentGlyphs(),
        listOfReactionGlyphs: new ListOfReactionGlyphs(),
        listOfTextGlyphs: new ListOfTextGlyphs(),
        listOfSpeciesGlyphs: new ListOfSpeciesGlyphs(),
        height: 0,
        width: 0
      })
    }
}

  class CompartmentGlyph {
    constructor () {
      assign(this, {id: '', compartment: undefined, boundingBox: undefined})
    }
}

  class BBox {
    constructor () { assign(this, {x: 0, y: 0, width: 0, height: 0}) }
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

  class SpeciesGlyph {
    constructor () {
      assign(this, {id: '', boundingBox: undefined, species: undefined})
    }
}

  class SpeciesReferenceGlyph {
    constructor () {
      assign(this, {
        id: '',
        role: '',
        speciesReference: undefined,
        speciesGlyph: undefined
      })
    }
  }

  class ReactionGlyph {
    constructor () {
      assign(this, {
        id: '',
        curve: undefined,
        reaction: undefined,
        listOfSpeciesReferenceGlyphs: new ListOfSpeciesReferenceGlyphs()
      })
    }
  }
}
