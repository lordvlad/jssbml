const assign = Object.assign.bind(Object)
const isObj = (o) => o !== null && typeof o === 'object'
const isArr = (o) => o !== null && Array.isArray(o)
const entries = (o) => o instanceof Map ? o.entries() : Object.entries(o)
const isDefined = (x) => typeof x !== 'undefined'
const func = (fn) => (...args) => isDefined(args[0]) ? fn(...args) : 0[0]
const last = func((a) => a[a.length - 1])
const pop = func((a) => a.pop())
const push = func((a, b) => a.push(b))

module.exports = {
  entries, isArr, isObj, assign, isDefined, last, pop, push
}
