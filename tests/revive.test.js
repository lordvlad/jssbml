const test = require('tape')
const fs = require('fs')

const { Document, revive, createReader, createBuilder } = require('..')
const {
  Model, ListOfSpecies, ListOfReactions, ListOfCompartments,
  Compartment, Species, Reaction
} = Document

test((t) => {
  fs.createReadStream('tests/resources/gly.xml')
    .pipe(createReader())
    .pipe(createBuilder())
    .on('data', (a) => {
      t.ok(a instanceof Document)
      const b = JSON.parse(JSON.stringify(a))
      t.not(b instanceof Document)
      const c = revive(b)
      t.ok(c instanceof Document)
      t.ok(c.model instanceof Model)
      t.ok(c.model.listOfSpecies instanceof ListOfSpecies)
      t.ok(c.model.listOfReactions instanceof ListOfReactions)
      t.ok(c.model.listOfCompartments instanceof ListOfCompartments)

      for (let x of c.model.listOfSpecies) t.ok(x instanceof Species)
      for (let x of c.model.listOfReactions) t.ok(x instanceof Reaction)
      for (let x of c.model.listOfCompartments) t.ok(x instanceof Compartment)

      t.end()
    })
    .on('error', (e) => t.fail(e.message))
})
