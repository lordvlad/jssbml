const assign = Object.assign
const xmlns = 'http://www.w3.org/1998/Math/MathML'

class MathBase {
  get xmlns () { return xmlns }
  get xmlnsPrefix () { return 'math' }
}

class MATH extends MathBase {}
class Apply extends MathBase {}
class Times extends MathBase {}
class Divide extends MathBase {}
class Minus extends MathBase {}
class Plus extends MathBase {}
class Power extends MathBase {}
class Lambda extends MathBase {}
class BVar extends MathBase {}
class CI extends MathBase {
  constructor (props = {}) {
    super(props)
    if (props.$text) this.value = props.$text
  }
}

class CN extends MathBase {
  static getDefaults () { return {type: ''} }
  constructor (props = {}) {
    super(props)
    if (props.$text) this.value = props.$text
  }
}

function registerWriter (writer) {
  writer.writeCI = function (ci) {
    const props = assign({}, ci)
    if (props.value) {
      props.$text = props.value
      delete props.value
    }
    this._writeTag(ci.constructor, props)
  }
  writer.writeCN = function (cn) {
    const props = assign({}, cn)
    if (props.value) {
      props.$text = props.value
      delete props.value
    }
    this._writeTag(cn.constructor, props)
  }
}

module.exports = assign(MATH, {
  xmlns,
  MATH,
  Apply,
  Times,
  Plus,
  Minus,
  Power,
  Divide,
  CI,
  CN,
  Lambda,
  BVar,
  registerWriter
})
