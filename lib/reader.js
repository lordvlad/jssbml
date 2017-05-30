const { Transform } = require('stream')
const sax = require('sax')

const { assign, last, pop, push } = require('./util')

const constOpt = { objectMode: true }

module.exports = class Reader extends Transform {
  constructor (opt = { strict: true }) {
    super(assign(constOpt, opt))
    this._sax = sax.createStream(opt.strict)
    const stack = [{}]

    this._sax.on('error', (e) => this.emit('error', e))
    this._sax.on('opentag', (n) => push(stack, assign(n.attributes, { $name: n.name })))
    this._sax.on('closetag', (n) => {
      const o = pop(stack)
      const p = last(stack)

      if (n.toLowerCase() === 'model') {
        push(this, o)
        push(this, null)
        return
      }

      if (!p.$children) p.$children = []
      push(p.$children, o)
    })
  }

  _transform (chunk, encoding, callback) {
    this._sax.write(Buffer.from(chunk))
    callback()
  }
}
