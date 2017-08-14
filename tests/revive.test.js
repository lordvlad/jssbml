const test = require('tape')
const fs = require('fs')

const { Document, revive, createReader, createBuilder } = require('..')

test((t) => {
  fs.createReadStream('tests/resources/gly.xml')
    .pipe(createReader())
    .pipe(createBuilder())
    .on('data', (a) => {
      t.ok(a instanceof Document)
      const b = JSON.parse(JSON.stringify(a))
      t.not(b instanceof Document)
      const c = revive(a)
      t.ok(c instanceof Document)
      t.deepEqual(c, a)
      t.ok(c.model instanceof Document.Model)
      console.log(JSON.stringify(a, null, 2))
      t.end()
    })
    .on('error', (e) => t.fail(e.message))
})
