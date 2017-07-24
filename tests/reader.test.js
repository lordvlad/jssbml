const test = require('tape')
const fs = require('fs')
const isNum = require('is-number')
const isBool = require('is-boolean')

const { createReader, createWriter, createBuilder } = require('..')

function contains (a, b) { return Array.from(a).indexOf(b) > -1 }
function size (x) { return x ? (x.size || x.length || Object.keys(x).length) : 0 }
function values (x) { return x ? (x.values ? x.values() : Object.values(x)) : [] }

test('parser', (t) => {
  fs.createReadStream('tests/resources/gly.xml')
    .pipe(createReader())
    .pipe(createBuilder())
    .on('data', (m) => {
      t.ok(m, 'should be something')
      t.ok(m.id, 'should have an id')
      t.ok(m.metaid, 'should have an metaid')
      t.ok(m.name, 'should have an name')

      t.ok(m.compartments, 'should have compartments')
      t.equals(size(m.compartments), 2, 'should have 2 compartments')
      for (let c of values(m.compartments)) {
        t.ok(c.id, 'comparmtment should have an id')
        t.ok(c.metaid, 'compartment should have an meta id')
        t.ok(c.size, 'compartment should have a size')
      }

      t.ok(m.species, 'should have species')
      t.equal(size(m.species), 25, 'should have 25 species')
      for (let c of values(m.species)) {
        t.ok(c.id, 'species should have an id')
        t.ok(c.metaid, 'species should have an metaid')
        t.ok(c.name, 'species hould have an name')
        t.ok(isNum(c.initialConcentration), 'species should have a numerical initial concentration')
        t.ok(isBool(c.boundaryCondition), 'species should have a boolean boundary condition')
        t.ok(c.compartment, 'species should have a compartment')
        t.ok(contains(values(m.compartments), c.compartment), 'species\' compartment should be defined in the model')
      }

      t.ok(m.reactions, 'should have reactions')
      t.equal(size(m.reactions), 19, 'should have 19 reactions')

      for (let c of values(m.speciesReferences)) {
        t.ok(c.species, 'species reference should have a species')
        t.ok(contains(values(m.species), c.species), 'species reference\' species should be defined in the model')
      }

      for (let c of values(m.reactions)) {
        t.ok(c.id)
        t.ok(c.metaid)
        t.ok(c.name)
        t.ok(isBool(c.reversible))

        t.ok(c.reactants)
        t.ok(c.products)
        t.ok(c.modifiers)
        t.not(c.reactants.size, 0)
        t.not(c.products.size, 0)

        for (let s of c.reactants) t.ok(contains(values(m.species), s.species))
        for (let s of c.products) t.ok(contains(values(m.species), s.species))
        for (let s of c.modifiers) t.ok(contains(values(m.species), s.species))
      }

      t.end()
    })
    .on('error', (e) => t.fail(e.message))
})

test('writer2', (t) => testRoundTrip('tests/resources/example5.xml', t))
test('writer', (t) => testRoundTrip('tests/resources/gly.xml', t))

function testRoundTrip (f, t) {
  fs.createReadStream(f)
    .pipe(createReader())
    .pipe(createBuilder())
    .on('data', (a) => {
      fs.writeFileSync('a.json', JSON.stringify(a, null, 2))
      const w = createWriter()
      // const v = createWriter()
      // v.pipe(fs.createWriteStream('a.xml')).on('end', () => t.end())
      w.pipe(createReader()).pipe(createBuilder()).on('data', (b) => {
        fs.writeFileSync('b.json', JSON.stringify(b, null, 2))
        t.deepEqual(b, a)
        t.end()
      })
      // v.write(a)
      w.write(a)
    })
}

test('layout', (t) => {
  fs.createReadStream('tests/resources/example5.xml')
    .pipe(createReader())
    .pipe(createBuilder())
    .on('data', (m) => {
      t.ok(JSON.stringify(m), 'shouldn\'t be cyclic')
      t.ok(m.annotation, 'should have an annotation')
      t.ok(m.annotation.layouts, 'should have layouts')

      t.ok(m.reactions, 'should have reactions')
      t.equal(size(m.reactions), 10, 'should have 10 reactions')

      for (let r of values(m.reactions)) {
        t.ok(r.id, 'reaction should have an id')
        for (let s of r.reactants) {
          t.ok(contains(values(m.species), s.species))
          t.ok(s.annotation)
        }
        for (let s of r.products) t.ok(contains(values(m.species), s.species))
        for (let s of r.modifiers) t.ok(contains(values(m.species), s.species))
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