const multipipe = require('multipipe')
const Typeson = require('typeson')

const Reader = require('./reader')
const Builder = require('./builder')

const typeson = new Typeson().register()

function createXmlReader (opt) { return new Reader(opt) }
function createModelBuilder (opt) { return new Builder(opt) }
function revive (json) { return typeson.revive(json) }
function wrap (obj) { return typeson.encapsulate(obj) }
function stringify (obj) { JSON.stringify(wrap(obj)) }
function parse (str) { revive(JSON.parse(str)) }

module.exports = {
  createModelBuilder,
  createXmlReader,
  wrap,
  revive,
  stringify,
  parse,
  createParser (opt) { return multipipe(createXmlReader(opt), createModelBuilder(opt)) }
}
