const { List, Base } = require('./Base')
const { assign } = Object

const xmlns = 'http://www.sbml.org/sbml/level2'

function sbmlMixin (cls) {
  return class extends cls {
    get xmlns () { return xmlns }
    get xmlnsPrefix () { return 'sbml' }
  }
}

class SBMLBase extends sbmlMixin(Base) { }
class SBMLList extends sbmlMixin(List) { }

/**
 * Base class for SBML objects
 */
class SBMLModelBase extends SBMLBase {
  static getDefaults () {
    return {
      metaid: null,
      name: null,
      id: null
    }
  }
}

class ListOfSpecies extends SBMLList { }
class ListOfReactions extends SBMLList { }
class ListOfCompartments extends SBMLList { }
class ListOfSpeciesReferences extends SBMLList { }
class ListOfReactants extends SBMLList { }
class ListOfProducts extends SBMLList { }
class ListOfModifiers extends SBMLList { }
class ListOfFunctionDefinitions extends SBMLList { }
class ListOfUnitDefinitions extends SBMLList { }
class ListOfUnits extends SBMLList { }
class ListOfParameters extends SBMLList { }
class ListOfRules extends SBMLList { }

class SBML extends SBMLModelBase {
  static getDefaults () {
    return {
      level: 3,
      version: 1,
      model: null
    }
  }
}

class Model extends SBMLModelBase {
  static getDefaults () {
    return {
      listOfSpecies: null,
      listOfReactions: null,
      listOfCompartments: null,
      listOfSpeciesReferences: null
    }
  }
}

class Compartment extends SBMLModelBase {
  static getDefaults () {
    return {size: 0, outside: null}
  }
}

class Species extends SBMLModelBase {
  static getDefaults () {
    return { initialConcentration: 0.0, compartment: null, boundaryCondition: false }
  }
}

class SpeciesReference extends SBMLModelBase {
  static getDefaults () {
    return { stoichiometry: 1, species: null }
  }
}

class ModifierSpeciesReference extends SBMLModelBase {
  static getDefaults () {
    return { stoichiometry: 1, species: null }
  }
}

class Reaction extends SBMLModelBase {
  static getDefaults () {
    return {
      reversible: true,
      listOfReactants: new ListOfReactants(),
      listOfProducts: new ListOfProducts(),
      listOfModifiers: new ListOfModifiers(),
      kineticLaw: null
    }
  }
}

function registerReader (builder) {
  const collect = (x, v) => assign(x, {[v.id]: v})
  builder.transformCompartments = function (sbml) {
    if (!sbml.model || !sbml.model.listOfCompartments) return
    const comps = sbml.model.listOfCompartments.reduce(collect, {})
    sbml.model.listOfCompartments.forEach((c) => {
      if (c.outside) c.outside = comps[c.outside]
    })
  }

  builder.transformSpecies = function (sbml) {
    if (!sbml.model || !sbml.model.listOfSpecies) return
    const comps = sbml.model.listOfCompartments.reduce(collect, {})
    sbml.model.listOfSpecies.forEach((s) => {
      if (s.compartment) s.compartment = comps[s.compartment]
      s.initialConcentration = s.initialConcentration ? parseFloat(s.initialConcentration) : 0.0
      s.boundaryCondition = s.boundaryCondition === 'true'
    })
  }

  builder.transformSpeciesReferences = function (sbml) {
    function editRef (ref) {
      ref.species = specs[ref.species]
    }
    const specs = sbml.model.listOfSpecies.reduce(collect, {})
    sbml.model.listOfReactions.forEach((r) => {
      r.listOfModifiers.forEach(editRef)
      r.listOfReactants.forEach(editRef)
      r.listOfProducts.forEach(editRef)
    })
  }
}

function registerWriter (writer) {
  writer.writeModifierSpeciesReference = function (reference) {
    const props = assign({}, reference)
    props.metaid = reference.metaid
    props.species = reference.species.id
    props.stoichiometry = reference.stoichiometry
    this._writeTag(reference.constructor, props)
  }

  writer.writeSpeciesReference = function (reference) {
    const props = assign({}, reference)
    props.metaid = reference.metaid
    props.species = reference.species.id
    props.stoichiometry = reference.stoichiometry
    this._writeTag(reference.constructor, props)
  }

  writer.writeSpecies = function (species) {
    const props = assign({}, species)
    props.compartment = species.compartment.id
    this._writeTag(species.constructor, props)
  }

  writer.writeCompartment = function (compartment) {
    const props = assign({}, compartment)
    if (compartment.outside) props.outside = compartment.outside.id
    this._writeTag(compartment.constructor, props, true)
  }
}

class Annotation extends SBMLBase { }
class Notes extends SBMLBase { }
class KineticLaw extends SBMLModelBase { }
class Parameter extends SBMLModelBase { }
class UnitDefinition extends SBMLModelBase { }
class Unit extends SBMLModelBase {
  static getDefaults () { return { kind: '', scale: 0, exponent: 1 } }
}
class FunctionDefinition extends SBMLModelBase { }
class AssignmentRule extends SBMLModelBase { }

module.exports = assign(SBML, {
  xmlns,
  SBML,
  AssignmentRule,
  UnitDefinition,
  FunctionDefinition,
  Parameter,
  Model,
  Reaction,
  Species,
  Compartment,
  SpeciesReference,
  ModifierSpeciesReference,
  ListOfCompartments,
  ListOfReactions,
  ListOfSpecies,
  SBMLList,
  Annotation,
  ListOfReactants,
  ListOfModifiers,
  ListOfProducts,
  ListOfSpeciesReferences,
  SBMLModelBase,
  Notes,
  registerReader,
  registerWriter,
  KineticLaw,
  ListOfFunctionDefinitions,
  ListOfUnitDefinitions,
  ListOfRules,
  ListOfParameters,
  ListOfUnits,
  Unit
})
