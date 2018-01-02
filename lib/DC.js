const assign = Object.assign
const xmlns = 'http://purl.org/dc/elements/1.1/'

class DCBase {
  get xmlns () { return xmlns }
  get xmlnsPrefix () { return 'dc' }
}

class DC extends DCBase {}
class Creator extends DCBase { }

module.exports = assign(DC, {
  xmlns,
  DC,
  Creator
})
