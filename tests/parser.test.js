const test = require('tape')
const fs = require('fs')
const isNum = require('is-number')
const isBool = require('is-boolean')

const { createXmlReader, createParser } = require('..')

function contains (a, b) { return [...a].indexOf(b) > -1 }

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
      t.ok(m, 'should be something')
      t.ok(m.id, 'should have an id')
      t.ok(m.metaid, 'should have an metaid')
      t.ok(m.name, 'should have an name')

      t.ok(m.compartments, 'should have compartments')
      t.equals(m.compartments.size, 2, 'should have 2 compartments')
      for (let c of m.compartments.values()) {
        t.ok(c.id, 'comparmtment should have an id')
        t.ok(c.metaid, 'compartment should have an meta id')
        t.ok(c.size, 'compartment should have a size')
      }

      t.ok(m.species, 'should have species')
      t.equal(m.species.size, 25, 'should have 25 species')
      for (let c of m.species.values()) {
        t.ok(c.id, 'species should have an id')
        t.ok(c.metaid, 'species should have an metaid')
        t.ok(c.name, 'species hould have an name')
        t.ok(isNum(c.initialConcentration), 'species should have a numerical initial concentration')
        t.ok(isBool(c.boundaryCondition), 'species should have a boolean boundary condition')
        t.ok(c.compartment, 'species should have a compartment')
        t.ok(contains(m.compartments.values(), c.compartment), 'species\' compartment should be defined in the model')
      }

      t.ok(m.reactions, 'should have reactions')
      t.equal(m.reactions.size, 19, 'should have 19 reactions')

      for (let c of m.speciesReferences.values()) {
        t.ok(c.species, 'species reference should have a species')
        t.ok(contains(m.species.values(), c.species), 'species reference\' species should be defined in the model')
      }

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

        for (let s of c.reactants) t.ok(contains(m.species.values(), s.species))
        for (let s of c.products) t.ok(contains(m.species.values(), s.species))
        for (let s of c.modifiers) t.ok(contains(m.species.values(), s.species))
      }

      t.end()
    })
    .on('error', (e) => t.fail(e.message))
})

test('layout', (t) => {
  fs.createReadStream('tests/resources/example5.xml')
    .pipe(createParser())
    .on('data', (m) => {
      t.ok(JSON.stringify(m), 'shouldn\'t be cyclic')
      t.ok(m.annotation, 'should have an annotation')
      t.ok(m.annotation.layouts, 'should have layouts')

      t.ok(m.reactions, 'should have reactions')
      t.equal(m.reactions.size, 10, 'should have 10 reactions')

      for (let r of m.reactions.values()) {
        t.ok(r.id, 'reaction should have an id')
        for (let s of r.reactants) {
          t.ok(contains(m.species.values(), s.species))
          t.ok(s.annotation)
        }
        for (let s of r.products) t.ok(contains(m.species.values(), s.species))
        for (let s of r.modifiers) t.ok(contains(m.species.values(), s.species))
      }

      t.equal(m.annotation.layouts.size, 1, 'should have one layout')

      let layout = m.annotation.layouts.values().next().value

      t.ok(layout, 'layout should be present')
      t.ok(layout.id, 'layout should have an id')
      t.ok(layout.compartmentGlyphs, 'layout should have compartment glyphs')
      t.equal(layout.compartmentGlyphs.size, 5, 'layout should have 5 compartment glyphs')
      t.ok(layout.speciesGlyphs, 'layout should have species glyphs')
      t.equal(layout.speciesGlyphs.size, 16, 'layout should have 16 species glyphs')
      t.ok(layout.reactionGlyphs, 'layout should have reaction glyphs')
      t.equal(layout.reactionGlyphs.size, 6, 'layout should have 6 reaction glyphs')
      t.ok(layout.textGlyphs, 'layout should have text glyphs')
      t.equal(layout.textGlyphs.size, 27, 'layout should have 27 text glyphs')

      t.end()
    })
    .on('error', (e) => t.fail(e.message))
})
