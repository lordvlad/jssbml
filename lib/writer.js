const { Transform } = require('stream')

const { isset, isPrimitive, decapitalize, userFunctions } = require('./util')

const { assign, entries } = Object

const xmldef = '<?xml version="1.0" encoding="UTF-8"?>'

module.exports = class Writer extends Transform {
  constructor (opt = {}) {
    super(assign(opt, {writableObjectMode: true}))
    this._intentString = opt.indentString || '  '
    this._newline = opt.newline || '\n'
    this._indent = 0
    this._ns = null
    this._prefixes = null
    this._defaultNSPrefix = null
    for (let ns of (opt.namespaces || [])) {
      if (ns.registerWriter) ns.registerWriter(this)
    }
  }

  /**
   * Print a new line
   */
  _nl () { this.push(this._newline) }

  /**
   * Print an indent
   */
  _tab () { this.push(this._intentString.repeat(this._indent)) }

  /**
   * @param {String} key
   */
  getWriter (key) {
    const _key = 'write' + key.toLowerCase()
    for (let k of userFunctions(this)) {
      if (k.toLowerCase() === _key) return this[k]
    }
  }

  writeTag (object) {
    const n = object.constructor.name
    const w = this.getWriter(n)
    if (w) return w.call(this, object)
    else this._writeTag(object.constructor, object)
  }

  _writeTag (constructor, props) {
    let name = this._ns.get(constructor) + decapitalize(constructor.name)
    let attr = {}
    const text = props.$text
    const children = []
    entries(props).forEach(([k, v]) => {
      if (k.startsWith('$')) return
      if (!isset(v)) return
      if (isPrimitive(v)) attr[k] = v
      else children.push(v)
    })

    if (this._firstTag) {
      this._firstTag = false
      attr.xmlns = props.xmlns

      for (let [prefix, ns] of this._prefixes) {
        if (prefix === props.xmlnsPrefix) continue
        attr[`xmlns:${prefix}`] = ns
      }
    }

    if (!children.length && !text) {
      this._open(name, attr, true)
    } else {
      this._open(name, attr, false)
      if (text) {
        this._tab()
        this.push(text)
        this._nl()
      }
      if (children.length) children.forEach(this.writeTag.bind(this))
      this._close(name)
    }
  }
  /**
   * Print a tag opening
   * @param {string} name - the name
   * @param {[{}]} props - the properties NOTE! only primitive properties will be written
   * @param {[boolean]} selfClosing - whether the tag is self-closing
   */
  _open (name, props, selfClosing = false) {
    const reducer = (s, [k, v]) => isset(v) && isPrimitive(v) ? `${s} ${k}="${v}"` : s
    this._tab()
    this.push(`<${name}${entries(props).reduce(reducer, '')}${selfClosing ? '/' : ''}>`)
    if (!selfClosing) this._indent++
    this._nl()
  }

  /**
   * Print a closing tag
   * @param {string} name
   */
  _close (name) {
    this._indent--
    this._tab()
    this.push(`</${name}>`)
    this._nl()
  }

  _transform (object, _, callback) {
    this.push(xmldef)
    this._nl()
    this.collectNamespaces(object)
    this._firstTag = true
    this.writeTag(object)
    this.resetNamespaces()
    callback()
  }

  resetNamespaces () {
    this._prefixes = null
    this._ns = null
  }

  collectNamespaces (object) {
    const prefixes = this._prefixes = new Map()
    const ns = this._ns = new Map()

    const def = object.xmlnsPrefix

    function collect (object) {
      const Ctor = object.constructor
      const prefix = object.xmlnsPrefix
      if (!ns.has(Ctor)) ns.set(Ctor, prefix === def ? '' : (prefix + ':'))
      if (!prefixes.has(prefix)) prefixes.set(prefix, object.xmlns)
      entries(object).forEach(([k, v]) => {
        if (!isset(v) || isPrimitive(v)) return
        collect(v)
      })
    }

    collect(object)
  }
}
