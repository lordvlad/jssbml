const pick = require('lodash.pick')
const namespaceKeys = (node) => Object.keys(node).filter((n) => n.startsWith('xmlns'))
const namespaces = (node) => pick(node, namespaceKeys(node))

module.exports = {
  namespaceKeys,
  namespaces
}
