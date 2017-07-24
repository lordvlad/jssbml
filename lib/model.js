const assign = Object.assign

class Model {
  constructor () {
    assign(this, {
      id: '',
      name: '',
      metaid: '',
      species: {},
      reactions: {},
      annotation: {},
      compartments: {},
      speciesReferences: {}
    })
  }
}

class Layout {
  constructor () {
    assign(this, {
      id: '',
      compartmentGlyphs: {},
      reactionGlyphs: {},
      textGlyphs: {},
      speciesGlyphs: {},
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

class Compartment {
  constructor () {
    assign(this, {id: '', metaid: '', size: 0, outside: undefined})
  }
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

class Reaction {
  constructor () {
    assign(this, {
      id: '',
      metaid: '',
      name: '',
      reversible: true,
      reactants: [],
      products: [],
      modifiers: [],
      kineticLaw: undefined
    })
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
      speciesReferenceGlyphs: []
    })
  }
}

module.exports = assign(Model, {
  Model,
  CompartmentGlyph,
  Layout,
  BBox,
  Reaction,
  Species,
  Compartment,
  SpeciesReference,
  TextGlyph,
  ReactionGlyph,
  SpeciesGlyph,
  SpeciesReferenceGlyph
})
