const test = require('tape')
const fs = require('fs')
const isNum = require('is-number')
const isBool = require('is-boolean')

const { createXmlReader, createParser } = require('..')

function contains (a, b) {
  return [...a].indexOf(b) > -1
}

test('reader', (t) => {
  t.plan(1)

  fs.createReadStream('tests/resources/gly.xml')
    .pipe(createXmlReader())
    .on('data', (m) => t.ok(m))
    .on('error', (e) => t.fail(e.message))
})

test('parser', (t) => {
  fs.createReadStream('tests/resources/gly.xml')
    .pipe(createParser())
    .on('data', (m) => {
      t.ok(m)
      t.ok(m.id)
      t.ok(m.metaid)
      t.ok(m.name)
      t.same(m.id, m.name)

      t.ok(m.compartments)
      t.equals(2, m.compartments.size)
      for (let c of m.compartments.values()) {
        t.ok(c.id)
        t.ok(c.metaid)
        t.ok(c.size)
      }

      t.ok(m.species)
      t.not(m.species.size, 0)
      for (let c of m.species.values()) {
        t.ok(c.id)
        t.ok(c.metaid)
        t.ok(c.name)
        t.ok(isNum(c.initialConcentration))
        t.ok(isBool(c.boundaryCondition))
        t.ok(c.compartment)
        t.ok(contains(m.compartments.values(), c.compartment))
      }

      t.ok(m.reactions)
      t.not(m.reactions.size, 0)
      for (let c of m.reactions.values()) {
        t.ok(c.id)
        t.ok(c.metaid)
        t.ok(c.name)
        t.ok(isBool(c.reversible))

        t.ok(c.reactants)
        t.ok(c.products)
        t.ok(c.modifiers)
        t.not(c.reactants.size, 0)
        t.not(c.products.size, 0)

        for (let s of c.reactants) t.ok(contains(m.species.values(), s))
        for (let s of c.products) t.ok(contains(m.species.values(), s))
        for (let s of c.modifiers) t.ok(contains(m.species.values(), s))
      }

      t.end()
    })
    .on('error', (e) => t.fail(e.message))
})
