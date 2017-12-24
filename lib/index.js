const Reader = require('./reader')
const Builder = require('./builder')
const Writer = require('./writer')
const Document = require('./document')
const reviver = require('./reviver')

const assign = Object.assign

module.exports = {
  createReader (opt = {}) { return new Reader(opt) },
  createWriter (opt = {}) { return new Writer(opt) },
  createBuilder (opt = {}) { return new Builder(assign(opt, {Document})) },
  revive: reviver(Document),
  reviver,
  Document
}
