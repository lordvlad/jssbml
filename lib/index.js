const combine = require('stream-combiner')
const Reader = require('./reader')
const Builder = require('./builder')
const Writer = require('./writer')
const SBML = require('./SBML')
const RDF = require('./RDF')
const XHTML = require('./XHTML')
const reviver = require('./reviver')

const assign = Object.assign
const defaultNamespaces = [SBML, RDF, XHTML]

class Factory {
  constructor (opt = {}) {
    this._ns = [].concat(defaultNamespaces)
    if (opt.namespaces) for (let ns of opt.namespaces) if (this._ns.indexOf(ns) === -1) this._ns.push(ns)
    this._readerOpt = assign({}, opt.reader || {})
    this._builderOpt = assign({}, opt.builder || {})
    this._writerOpt = assign({}, opt.writer || {})
    this._reviverOpt = assign({}, opt.reviver || {})
  }

  withNamespace (ns) {
    this._ns.push(ns)
    return this
  }

  createReader (opt = {}) {
    return combine(
      new Reader(assign({}, this._readerOpt, opt)),
      new Builder(assign({}, this._builderOpt, {namespaces: this._ns}, opt))
    )
  }

  createWriter (opt = {}) {
    return new Writer(assign({}, this._writerOpt, {namespaces: this._ns}, opt))
  }

  createReviver (opt = {}) {
    return reviver(assign({}, this._reviverOpt, {namespaces: this._ns}, opt))
  }
}

const defaultFactory = new Factory()

module.exports = assign(defaultFactory, { Factory })
defaultNamespaces.forEach((ns) => assign(defaultFactory, {[ns.name]: ns}))
