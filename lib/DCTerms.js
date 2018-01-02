const assign = Object.assign
const xmlns = 'http://purl.org/dc/terms/'

class DCTermsBase {
  get xmlns () { return xmlns }
  get xmlnsPrefix () { return 'dcterms' }
}

class RDF extends DCTermsBase {}
class Created extends DCTermsBase { }
class Modified extends DCTermsBase { }
class W3CDTF extends DCTermsBase { }

module.exports = assign(RDF, {
  xmlns,
  RDF,
  Created,
  Modified,
  W3CDTF
})
