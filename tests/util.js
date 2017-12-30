const fs = require('fs')
const isNum = require('is-number')
const isBool = require('is-boolean')
const deepdiff = require('deep-diff')

const { Factory, SBML, revive, createReader, createBuilder } = require('..')
const {
  Model, ListOfSpecies, ListOfReactions, ListOfCompartments,
  Compartment, Species, Reaction, ListOfProducts, ListOfReactants,
  ListOfModifiers, ModifierSpeciesReference, SpeciesReference
} = SBML

const factory = new Factory()

function contains (a, b) { return a.indexOf(b) > -1 }

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
  t.ok(d instanceof SBML, 'should be a document')
  const m = d.model
  t.ok(m instanceof Model, 'should be a model')
  t.ok(m, 'should be something')
  t.ok(m.id, 'should have an id')

  t.ok(m.listOfCompartments, 'should have compartments')
  t.ok(m.listOfCompartments instanceof ListOfCompartments)
  t.equals(m.listOfCompartments.length, nCompartments, `should have ${nCompartments} compartments`)
  for (let c of m.listOfCompartments) {
    t.ok(c instanceof Compartment)
    t.ok(c.id, 'compartment should have an id')
    t.ok(c.size, 'compartment should have a size')
  }

  t.ok(m.listOfSpecies, 'should have species')
  t.ok(m.listOfSpecies instanceof ListOfSpecies)
  t.equal(m.listOfSpecies.length, nSpecies, `should have ${nSpecies} species but has ${m.listOfSpecies.length}`)
  for (let c of m.listOfSpecies) {
    t.ok(c instanceof Species)
    t.ok(c.id, 'species should have an id')
    t.ok(c.name, 'species hould have an name')
    if (shouldHaveInitialConcentration) t.ok(isNum(c.initialConcentration), 'species should have a numerical initial concentration')
    if (shouldHaveBoundaryCondition) t.ok(isBool(c.boundaryCondition), 'species should have a boolean boundary condition')
    t.ok(c.compartment, 'species should have a compartment')
    t.ok(c.compartment instanceof Compartment)
    t.ok(contains(m.listOfCompartments, c.compartment), 'species\' compartment should be defined in the model')
  }

  t.ok(m.listOfReactions, 'should have reactions')
  t.ok(m.listOfReactions instanceof ListOfReactions)
  t.equal(m.listOfReactions.length, nReactions, `should have ${nReactions} reactions but has ${m.listOfReactions.length}`)
  for (let c of m.listOfReactions) {
    t.ok(c instanceof Reaction)
    t.ok(c.id)
    t.ok(isBool(c.reversible))

    const reactants = c.listOfReactants
    const products = c.listOfProducts
    const modifiers = c.listOfModifiers

    t.ok(reactants)
    t.ok(products)
    t.ok(modifiers)
    t.ok(reactants instanceof ListOfReactants)
    t.ok(products instanceof ListOfProducts)
    t.ok(modifiers instanceof ListOfModifiers)
    t.ok(reactants.length)

    for (let s of reactants) {
      t.ok(s instanceof SpeciesReference)
      t.ok(contains(m.listOfSpecies, s.species))
    }
    for (let s of products) {
      t.ok(s instanceof SpeciesReference)
      t.ok(contains(m.listOfSpecies, s.species))
    }
    for (let s of modifiers) {
      t.ok(s instanceof ModifierSpeciesReference)
      t.ok(contains(m.listOfSpecies, s.species))
    }
  }

  t.end()
}

function testRoundTrip (f, t) {
  fs.createReadStream(f)
    .pipe(factory.createReader())
    .on('data', (a) => {
      const w2 = factory.createWriter()
      w2.pipe(fs.createWriteStream(f + 'bla.xml'))
      w2.write(a)
      const w = factory.createWriter()
      w.pipe(factory.createReader()).on('data', (b) => {
        const d = deepdiff(b, a)
        t.ok(typeof d === 'undefined', JSON.stringify(d, null, 2))
        t.end()
      })
      w.write(a)
    })
}

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

function testLayout (t, f) {
  fs.createReadStream(f)
    .pipe(createReader())
    .pipe(createBuilder())
    .on('data', (d) => {
      const m = d.model
      t.ok(JSON.stringify(m), 'shouldn\'t be cyclic')
      t.ok(m.annotation, 'should have an annotation')
      t.ok(m.annotation.listOfLayouts, 'should have layouts')

      t.ok(m.listOfReactions, 'should have reactions')
      t.equal(m.listOfReactions.length, 10, 'should have 10 reactions')

      for (let r of m.listOfReactions) {
        t.ok(r.id, 'reaction should have an id')
        for (let s of r.listOfReactants) {
          t.ok(contains(m.listOfSpecies, s.species))
          t.ok(s.annotation)
        }
        for (let s of r.listOfProducts) t.ok(contains(m.listOfSpecies, s.species))
        for (let s of r.listOfModifiers) t.ok(contains(m.listOfSpecies, s.species))
      }

      t.equal(m.annotation.listOfLayouts.length, 1, 'should have one layout')

      let layout = m.annotation.listOfLayouts[0]

      t.ok(layout, 'layout should be present')
      t.ok(layout.id, 'layout should have an id')
      t.ok(layout.listOfCompartmentGlyphs, 'layout should have compartment glyphs')
      t.equal(layout.listOfCompartmentGlyphs.length, 5, 'layout should have 5 compartment glyphs')
      t.ok(layout.listOfSpeciesGlyphs, 'layout should have species glyphs')
      t.equal(layout.listOfSpeciesGlyphs.length, 16, 'layout should have 16 species glyphs')
      t.ok(layout.listOfReactionGlyphs, 'layout should have reaction glyphs')
      t.equal(layout.listOfReactionGlyphs.length, 6, 'layout should have 6 reaction glyphs')
      t.ok(layout.listOfTextGlyphs, 'layout should have text glyphs')
      t.equal(layout.listOfTextGlyphs.length, 27, 'layout should have 27 text glyphs')

      t.end()
    })
    .on('error', (e) => t.fail(e.message))
}

module.exports = {
  testRevive,
  testReader,
  testRoundTrip,
  testLayout
}
