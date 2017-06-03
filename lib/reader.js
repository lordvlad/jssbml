const { Transform } = require('stream')

const sax = require('sax')
const last = require('array-last')

const assign = Object.assign
const constOpt = { objectMode: true }

module.exports = class Reader extends Transform {
  constructor (opt = { strict: true }) {
    super(assign(constOpt, opt))
    this._sax = sax.createStream(opt.strict)
    const stack = [{}]

    this._sax.on('error', (e) => this.emit('error', e))
    this._sax.on('opentag', (n) => stack.push(assign(n.attributes, { $name: n.name })))
    this._sax.on('closetag', (n) => {
      const o = stack.pop()
      const p = last(stack)

      if (n.toLowerCase() === 'model') {
        this.push(o)
        this.push(null)
        return
      }

      if (!p.$children) p.$children = []
      p.$children.push(o)
    })
  }

  _transform (chunk, encoding, callback) {
    this._sax.write(Buffer.from(chunk))
    callback()
  }
}
