const multipipe = require('multipipe')

const Reader = require('./reader')
const Builder = require('./builder')

function createXmlReader (opt) { return new Reader(opt) }
function createModelBuilder (opt) { return new Builder(opt) }

module.exports = {
  createModelBuilder,
  createXmlReader,
  createParser (opt) { return multipipe(createXmlReader(opt), createModelBuilder(opt)) }
}
