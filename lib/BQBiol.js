const assign = Object.assign
const xmlns = 'http://biomodels.net/biology-qualifiers/'

class BQBase {
  get xmlns () { return xmlns }
  get xmlnsPrefix () { return 'bqbiol' }
}

class BQModel extends BQBase { }
class Is extends BQBase { }
class IsDescribedBy extends BQBase { }
class Encodes extends BQBase { }
class HasPart extends BQBase { }
class HasProperty extends BQBase { }
class HasVersion extends BQBase { }
class IsEncodedBy extends BQBase { }
class IsHomologTo extends BQBase { }
class IsPartOf extends BQBase { }
class IsPropertyOf extends BQBase { }
class IsVersionOf extends BQBase { }
class OccursIn extends BQBase { }
class HasTaxon extends BQBase { }

module.exports = assign(BQModel, {
  xmlns,
  Is,
  IsDescribedBy,
  HasPart,
  HasProperty,
  HasVersion,
  IsEncodedBy,
  IsHomologTo,
  IsPartOf,
  IsPropertyOf,
  IsVersionOf,
  OccursIn,
  HasTaxon,
  Encodes
})
