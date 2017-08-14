const assign = Object.assign

class Document {
  constructor () {
    assign(this, { level: 3, version: 1, xmlns: [Document.xmlns(3)] })
  }
}
Document.xmlns = (level) => `http://www.sbml.org/sbml/level${level}`

class Annotation { }

class List extends Array {
  toJSON () {
    return Object.keys(this)
      .reduce((o, k) => { o[k] = this[k]; return o }, {})
  }
}

class ListOfLayouts extends List {
  static fromJSON (o) { return assign(new ListOfLayouts(), o) }
}
class ListOfSpecies extends List {
  static fromJSON (o) { return assign(new ListOfSpecies(), o) }
}
class ListOfReactions extends List {
  static fromJSON (o) { return assign(new ListOfCompartments(), o) }
}
class ListOfCompartments extends List {
  static fromJSON (o) { return assign(new ListOfCompartments(), o) }
}
class ListOfSpeciesReferences extends List {
  static fromJSON (o) { return assign(new ListOfSpeciesReferences(), o) }
}

class Model {
  constructor () {
    assign(this, {
      id: '',
      name: '',
      metaid: '',
      annotation: new Annotation(),
      listOfSpecies: new ListOfSpecies(),
      listOfReactions: new ListOfReactions(),
      listOfCompartments: new ListOfCompartments(),
      listOfSpeciesReferences: new ListOfSpeciesReferences()
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

module.exports = assign(Document, {
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
  SpeciesReferenceGlyph,
  ListOfCompartments,
  ListOfReactions,
  ListOfSpecies,
  ListOfLayouts,
  List
})
