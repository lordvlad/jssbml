const combine = require('stream-combiner')
const Reader = require('./reader')
const Builder = require('./builder')
const Writer = require('./writer')
const SBML = require('./SBML')
const RDF = require('./RDF')
const XHTML = require('./XHTML')
const MATH = require('./MATH')
const BQModel = require('./BQModel')
const BQBiol = require('./BQBiol')
const DCTerms = require('./DCTerms')
const DC = require('./DC')
const VCard = require('./VCard')
const reviver = require('./reviver')

const assign = Object.assign
const defaultNamespaces = [ SBML, RDF, XHTML, MATH, BQModel, BQBiol, DC, DCTerms, VCard ]
const defaultOpt = {
  reader: { logLevel: 'error' },
  writer: { logLevel: 'error' },
  builder: { logLevel: 'error' },
  reviver: { logLevel: 'error' }
}

class Factory {
  constructor (opt = {}) {
    this.opt = assign({}, defaultOpt, opt)
    this._ns = [].concat(defaultNamespaces)
    if (opt.namespaces) for (let ns of opt.namespaces) if (this._ns.indexOf(ns) === -1) this._ns.push(ns)
    this.createReader = this.createReader.bind(this)
    this.createWriter = this.createWriter.bind(this)
    this.createReviver = this.createReviver.bind(this)
  }

  withNamespace (ns) {
    this._ns.push(ns)
    return this
  }

  createReader (opt = {}) {
    return combine(
      new Reader(assign({}, this.opt.reader, opt)),
      new Builder(assign({}, this.opt.builder, {namespaces: this._ns}, opt))
    )
  }

  createWriter (opt = {}) {
    return new Writer(assign({}, this.opt.writer, {namespaces: this._ns}, opt))
  }

  createReviver (opt = {}) {
    return reviver(assign({}, this.opt.reviver, {namespaces: this._ns}, opt))
  }
}

const defaultFactory = new Factory()

module.exports = assign(defaultFactory, { Factory })
defaultNamespaces.forEach((ns) => assign(defaultFactory, {[ns.name]: ns}))
