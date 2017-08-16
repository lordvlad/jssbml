const test = require('tape')
const fs = require('fs')
const isNum = require('is-number')
const isBool = require('is-boolean')
const deepdiff = require('deep-diff')

const { Document, revive, createReader, createWriter, createBuilder } = require('..')
const {
  Model, ListOfSpecies, ListOfReactions, ListOfCompartments,
  Compartment, Species, Reaction
} = Document

test('parse tca', (t) => testReader(t, 'tests/resources/tca.xml', 2, 26, 17))
test('parse gly', (t) => testReader(t, 'tests/resources/gly.xml', 2, 25, 19, true, true))
test('parser', (t) => testReader(t, 'tests/resources/example5.xml', 4, 32, 10))
// test('roundtrip tca', (t) => testRoundTrip('tests/resources/tca.xml', t))
// test('roundtrip gly', (t) => testRoundTrip('tests/resources/gly.xml', t))
// test('roundtrip layout', (t) => testRoundTrip('tests/resources/example5.xml', t))
// test('revive tca', (t) => testRevive('tests/resources/tca.xml', t, 2, 26, 17))
// test('revive gly', (t) => testRevive('tests/resources/gly.xml', t, 2, 25, 19, true, true))
// test('revive layout', (t) => testRevive('tests/resources/example5.xml', t))

function contains (a, b) { return Array.from(a).indexOf(b) > -1 }
function size (x) { return x ? (x.size || x.length || Object.keys(x).length) : 0 }
function values (x) { return x ? (x.values ? x.values() : Object.values(x)) : [] }

function testReader (t, file, nCompartments, nSpecies, nReactions,
  shouldHaveBoundaryCondition, shouldHaveInitialConcentration) {
  fs.createReadStream(file)
    .pipe(createReader())
    .pipe(createBuilder())
    .on('data', (d) => validate(t, d, nCompartments, nSpecies, nReactions,
      shouldHaveBoundaryCondition, shouldHaveInitialConcentration))
    .on('error', (e) => t.fail(e.message))
}

function validate (t, d, nCompartments, nSpecies, nReactions,
  shouldHaveBoundaryCondition, shouldHaveInitialConcentration) {
  t.ok(d, 'should be something')
  t.ok(d instanceof Document, 'should be a document')
  const m = d.model
  t.ok(m instanceof Model, 'should be a model')
  t.ok(m, 'should be something')
  t.ok(m.id, 'should have an id')

  t.ok(m.listOfCompartments, 'should have compartments')
  t.ok(m.listOfCompartments instanceof ListOfCompartments)
  t.equals(size(m.listOfCompartments), nCompartments, `should have ${nCompartments} compartments`)
  for (let c of values(m.listOfCompartments)) {
    t.ok(c instanceof Compartment)
    t.ok(c.id, 'compartment should have an id')
    t.ok(c.size, 'compartment should have a size')
  }

  t.ok(m.listOfSpecies, 'should have species')
  t.ok(m.listOfSpecies instanceof ListOfSpecies)
  t.equal(size(m.listOfSpecies), nSpecies, `should have ${nSpecies} species but has ${size(m.listOfSpecies)}`)
  for (let c of values(m.listOfSpecies)) {
    t.ok(c instanceof Species)
    t.ok(c.id, 'species should have an id')
    t.ok(c.name, 'species hould have an name')
    if (shouldHaveInitialConcentration) t.ok(isNum(c.initialConcentration), 'species should have a numerical initial concentration')
    if (shouldHaveBoundaryCondition) t.ok(isBool(c.boundaryCondition), 'species should have a boolean boundary condition')
    t.ok(c.compartment, 'species should have a compartment')
    t.ok(c.compartment instanceof Compartment)
    t.ok(contains(values(m.listOfCompartments), c.compartment), 'species\' compartment should be defined in the model')
  }

  t.ok(m.listOfReactions, 'should have reactions')
  t.ok(m.listOfReactions instanceof ListOfReactions)
  t.equal(size(m.listOfReactions), nReactions, `should have ${nReactions} reactions but has ${size(m.listOfReactions)}`)
  for (let c of values(m.listOfReactions)) {
    t.ok(c instanceof Reaction)
    t.ok(c.id)
    t.ok(isBool(c.reversible))

    t.ok(c.reactants)
    t.ok(c.products)
    t.ok(c.modifiers)
    t.not(c.reactants.size, 0)
    t.not(c.products.size, 0)

    for (let s of c.reactants) {
      t.ok(s instanceof Species)
      t.ok(contains(values(m.listOfSpecies), s.species))
    }
    for (let s of c.products) {
      t.ok(s instanceof Species)
      t.ok(contains(values(m.listOfSpecies), s.species))
    }
    for (let s of c.modifiers) {
      t.ok(s instanceof Species)
      t.ok(contains(values(m.listOfSpecies), s.species))
    }
  }

  t.end()
}

function testRoundTrip (f, t) {
  fs.createReadStream(f)
    .pipe(createReader())
    .pipe(createBuilder())
    .on('data', (a) => {
      const w = createWriter()
      w.pipe(createReader()).pipe(createBuilder()).on('data', (b) => {
        const d = deepdiff(b, a)
        if (d) t.fail(JSON.stringify(d, null, 2))
        t.end()
      })
      w.write(a)
    })
}

test('layout', (t) => {
  fs.createReadStream('tests/resources/example5.xml')
    .pipe(createReader())
    .pipe(createBuilder())
    .on('data', (d) => {
      const m = d.model
      t.ok(JSON.stringify(m), 'shouldn\'t be cyclic')
      t.ok(m.annotation, 'should have an annotation')
      t.ok(m.annotation.layouts, 'should have layouts')

      t.ok(m.listOfReactions, 'should have reactions')
      t.equal(size(m.listOfReactions), 10, 'should have 10 reactions')

      for (let r of values(m.listOfReactions)) {
        t.ok(r.id, 'reaction should have an id')
        for (let s of r.reactants) {
          t.ok(contains(values(m.listOfSpecies), s.species))
          t.ok(s.annotation)
        }
        for (let s of r.products) t.ok(contains(values(m.listOfSpecies), s.species))
        for (let s of r.modifiers) t.ok(contains(values(m.listOfSpecies), s.species))
      }

      t.equal(size(m.annotation.layouts), 1, 'should have one layout')

      let layout = m.annotation.layouts[0]

      t.ok(layout, 'layout should be present')
      t.ok(layout.id, 'layout should have an id')
      t.ok(layout.compartmentGlyphs, 'layout should have compartment glyphs')
      t.equal(size(layout.compartmentGlyphs), 5, 'layout should have 5 compartment glyphs')
      t.ok(layout.speciesGlyphs, 'layout should have species glyphs')
      t.equal(size(layout.speciesGlyphs), 16, 'layout should have 16 species glyphs')
      t.ok(layout.reactionGlyphs, 'layout should have reaction glyphs')
      t.equal(size(layout.reactionGlyphs), 6, 'layout should have 6 reaction glyphs')
      t.ok(layout.textGlyphs, 'layout should have text glyphs')
      t.equal(size(layout.textGlyphs), 27, 'layout should have 27 text glyphs')

      t.end()
    })
    .on('error', (e) => t.fail(e.message))
})

function testRevive (file, t, nCompartments, nSpecies, nReactions,
  shouldHaveBoundaryCondition, shouldHaveInitialConcentration) {
  fs.createReadStream(file)
    .pipe(createReader())
    .pipe(createBuilder())
    .on('data', (a) => {
      const c = revive(JSON.parse(JSON.stringify(a)))
      validate(t, c, nCompartments, nSpecies, nReactions, shouldHaveBoundaryCondition, shouldHaveInitialConcentration)
    })
    .on('error', (e) => t.fail(e.message))
}
