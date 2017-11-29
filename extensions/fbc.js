const assign = Object.assign

module.exports = function (ODocument) {
  const {
    Model: OModel,
    Species: OSpecies,
    List
  } = ODocument

  class Document extends ODocument { }

  class ListOfFluxObjectives extends List {}

  class Objective {
    constructor () {
      assign(this, {
        type: 'maximize',
        listOfObjectives: new ListOfFluxObjectives()
      })
    }
  }

  class FluxObjective {
    constructor () {
      assign(this, {
        id: '',
        name: '',
        reaction: '',
        coefficient: 0.0
      })
    }
  }

  class ListOfObjectives extends List {
    constructor (len) {
      super(len)
      assign(this, {activeObjective: null})
    }
  }

  class Model extends OModel {
    constructor () {
      super()
      assign(this, {
        strict: true,
        listOfObjectives: new ListOfObjectives()
      })
    }
  }

  class Species extends OSpecies {
    constructor () {
      super()
      assign(this, {charge: 0, chemicalFormula: ''})
    }
  }

  return assign(Document, ODocument, {
    Model,
    Species,
    ListOfObjectives,
    ListOfFluxObjectives,
    Objective,
    FluxObjective
  })
}
