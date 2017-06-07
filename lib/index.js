const multipipe = require('multipipe')

const Reader = require('./reader')
const Builder = require('./builder')
const Writer = require('./writer')

module.exports = {
  createReader (opt) { return multipipe(new Reader(opt), new Builder(opt)) },
  createWriter (opt) { return new Writer(opt) }
}
