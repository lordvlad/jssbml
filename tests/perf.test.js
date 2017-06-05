const fs = require('fs')
const test = require('tape')
const {createParser} = require('..')

const txt = fs.readFileSync('tests/resources/example5.xml')
const nSamples = 100
const tLimit = 100 // milliseconds

test('performance', (t) => {
  function reduce (sum, i) {
    if (i <= 0) return sum
    return new Promise((resolve, reject) => {
      const start = process.hrtime()
      const p = createParser()
      p.on('data', (m) => {
        const diff = process.hrtime(start)
        const n = diff[0] * 1e9 + diff[1]
        resolve(reduce(sum + n, i - 1))
      })
      p.write(txt)
    })
  }

  reduce(0, nSamples).then((sum) => {
    if (sum > Number.MAX_SAFE_INTEGER) {
      throw new Error('Timings sum is too large, try less samples!')
    }
    sum = sum * 1e-6
    const avg = sum / nSamples
    t.ok(avg < tLimit, `on average across ${nSamples}, parsing should take less than ${tLimit} ms, took ${avg} ms `)
    t.end()
  })
})
