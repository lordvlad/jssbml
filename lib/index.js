const Reader = require('./reader')
const Builder = require('./builder')
const Writer = require('./writer')
const Model = require('./model')

module.exports = {
  createReader (opt) { return new Reader(opt) },
  createWriter (opt) { return new Writer(opt) },
  createBuilder (opt) { return new Builder(opt) },
  Model
}
