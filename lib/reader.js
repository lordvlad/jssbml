const { Transform } = require('stream')

const sax = require('sax')
const last = require('array-last')

const assign = Object.assign
const constOpt = { objectMode: true }

/**
 * @param {{}} o
 * @returns {{}}
 */
function toLowerCase (o) {
  return Object.entries(o).reduce((x, [k, v]) => {
    x[k.toLowerCase()] = v
    return x
  }, {})
}

module.exports = class Reader extends Transform {
  onerror (e) {
    this.emit('error', e)
  }

  /**
   * @param {Tag | QualifiedTag} tag
   */
  onopentag (tag) {
    this._stack.push(assign({}, toLowerCase(tag.attributes), { $name: tag.name.toLowerCase() }))
  }
  onclosetag (name) {
    const o = this._stack.pop()
    const p = last(this._stack)

    if (name.toLowerCase() === 'sbml') {
      this.push(o)
    } else {
      if (!p.$children) p.$children = []
      p.$children.push(o)
    }
  }
  constructor (opt = { strict: true }) {
    super(assign({}, constOpt, opt))
    this._sax = sax.createStream(opt.strict)
    this._stack = [{}]

    this._sax.onerror = this.onerror.bind(this)
    this._sax.onopentag = this.onopentag.bind(this)
    this._sax.onclosetag = this.onclosetag.bind(this)
  }

  _transform (chunk, encoding, callback) {
    this._sax.write(Buffer.from(chunk))
    callback()
  }
}
