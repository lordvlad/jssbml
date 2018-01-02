const assign = Object.assign
const xmlns = 'http://biomodels.net/model-qualifiers/'

class BQModelBase {
  get xmlns () { return xmlns }
  get xmlnsPrefix () { return 'bqmodel' }
}

class BQModel extends BQModelBase { }
class Is extends BQModelBase { }
class IsDescribedBy extends BQModelBase { }
class IsInstanceOf extends BQModelBase { }
class IsDerivedFrom extends BQModelBase { }
class HasInstance extends BQModelBase { }

module.exports = assign(BQModel, {
  xmlns,
  Is,
  IsDescribedBy,
  IsDerivedFrom,
  HasInstance,
  IsInstanceOf
})
