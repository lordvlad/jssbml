module.exports = class Clazz {
  constructor (attr) {
    Object.assign(this, attr, { $constructor: this.constructor.name })
  }
}
