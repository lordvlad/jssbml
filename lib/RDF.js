const assign = Object.assign
const xmlns = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'

class RDF {
  get xmlns () { return xmlns }
  get xmlnsPrefix () { return 'rdf' }
}

class Description extends RDF {

}

module.exports = assign(RDF, {
  xmlns,
  RDF,
  Description
})
