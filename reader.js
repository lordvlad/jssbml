const sax = require('sax')
const { Transform } = require('stream')

const last = func((a) => a[a.length - 1])
const pop = func((a) => a.pop())
const push = func((a, b) => a.push(b))
const constOpt = {objectMode: true}

class Reader extends Transform {
    constructor (opt = {strict: true}) {
        super(Object.assign(constOpt, opt))
        this._options = opt
        this._sax = sax.createStream(opt.strict)
        this._stack = [{}]

        this._sax.on('error', (e) => this.emit('error', e))
        this._sax.on('opentag', (n) => {
            this._stack.push(Object.assign(n.attributes, {$name: n.name}))
        })
        this._sax.on('closetag', (n) => {
            const o = pop(this._stack)
            const p = last(this._stack) 

            if (n.toLowerCase() === 'model') {
                push(this, o)
                push(this, null)
                return
            }

            if (!p.$children) p.children = []
            push(p.$children, o)
        })
    }

    _transform (chunk, encoding, callback) { 
        this._sax.write(chunk, encoding, callback)
    }
}

Reader.create = function (opt) {
    return new Reader(opt)
}

module.exports = Reader
