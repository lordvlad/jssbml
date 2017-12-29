const { Transform } = require('stream')

const { last, pick, decapitalize } = require('./util')

const { entries, keys, assign } = Object
const constOpt = { writableObjectMode: true, readableObjectMode: true }

module.exports = class Builder extends Transform {
  /**
   *
   * @param {{cls: Map<String,Function>}} opt
   */
  constructor (opt) {
    super(assign({}, constOpt, opt))
    assign(this, {ns: [], namespaces: {}})
    for (let ns of (opt.namespaces || [])) {
      this.namespaces[ns.xmlns] = ns
      if (ns.registerReader) ns.registerReader(this)
    }
  }

  _transform (tag, enc, cb) {
    const sbml = this.makeObject(tag)
    for (let [name, method] of entries(this)) {
      if (name.startsWith('transform')) method.call(this, sbml)
    }
    cb(null, sbml)
  }

  pushNamespaces (tag) {
    const ns = {}
    this.ns.push(ns)

    if (tag.xmlns) {
      if (!this.namespaces[tag.xmlns]) {
        console.error(`WARN unregistered namespace ${tag.xmlns}`)
      } else {
        assign(ns, this.namespaces[tag.xmlns])
      }
    }
    for (let k in tag) {
      if (k.startsWith('xmlns:')) {
        const prefix = k.substr('xmlns:'.length)
        const uri = tag[k]
        const tags = this.namespaces[uri]
        if (!tags) {
          console.error(`WARN unregistered namespace ${uri} for prefix ${prefix}`)
        } else {
          assign(ns, {[prefix]: tags})
        }
      }
    }
  }

  popNamespaces () {
    this.ns.pop()
  }

  getConstructor (name) {
    if (name.includes(':')) {
      let ns
      [ns, name] = name.split(':')
      if (!ns) return
      for (let i = this.ns.length; i > 0; i--) {
        let k = keys(this.ns[i - 1][ns] || {}).find((k) => name.toLowerCase() === k.toLowerCase())
        if (!k) continue
        return this.ns[i - 1][ns][k]
      }
    }
    for (let i = this.ns.length; i > 0; i--) {
      let k = keys(this.ns[i - 1] || {}).find((k) => name.toLowerCase() === k.toLowerCase())
      if (!k) continue
      return this.ns[i - 1][k]
    }
  }

  makeObject (tag) {
    this.pushNamespaces(tag)
    const Ctor = this.getConstructor(tag.$name)
    if (typeof Ctor === 'undefined' || Ctor === null) {
      console.error(`WARN no constructor for "${tag.$name}"`)
      return null
    }

    const o = new Ctor(pick(tag, (k) => !k.startsWith('$')))

    if (tag.$children) {
      if (Array.isPrototypeOf(Ctor)) {
        for (let c of tag.$children) o.push(this.makeObject(c))
      } else {
        for (let c of tag.$children) {
          const v = this.makeObject(c)
          if (typeof v !== 'undefined' && v !== null) { o[decapitalize(v.constructor.name)] = v }
        }
      }
    }
    this.popNamespaces()
    return o
  }
}
