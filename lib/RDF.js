const assign = Object.assign
const xmlns = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'

class RDFBase {
  get xmlns () { return xmlns }
  get xmlnsPrefix () { return 'rdf' }
}

class RDF extends RDFBase {}
class Description extends RDFBase { }
class Bag extends RDFBase { }
class Li extends RDFBase { }

module.exports = assign(RDF, {
  xmlns,
  RDF,
  Description,
  Bag,
  Li
})
