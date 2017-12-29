const assign = Object.assign
const xmlns = 'http://www.w3.org/1999/xhtml'

class XHTML {
  get xmlns () { return xmlns }
  get xmlnsPrefix () { return 'xhtml' }
}

class BODY extends XHTML {}
class B extends XHTML {}
class P extends XHTML {}
class EM extends XHTML {}
class BR extends XHTML {}
class I extends XHTML {}
class SUP extends XHTML {}
class TABLE extends XHTML {}
class THEAD extends XHTML {}
class TBODY extends XHTML {}
class OL extends XHTML {}
class LI extends XHTML {}
class TR extends XHTML {}
class TD extends XHTML {}
class A extends XHTML {}
class SUB extends XHTML {}
class TH extends XHTML {}

module.exports = assign(XHTML, {
  XHTML,
  xmlns,
  BODY,
  EM,
  P,
  B,
  BR,
  A,
  TABLE,
  THEAD,
  TBODY,
  TH,
  SUB,
  TR,
  TD,
  OL,
  LI,
  I,
  SUP
})
