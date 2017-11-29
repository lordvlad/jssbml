const test = require('tape')
const isNum = require('is-number')
const isBool = require('is-boolean')
const isStr = require('is-string')

test((t) => {
  const fbc = require('../extensions/fbc')
  const ODocument = require('../lib/document')
  const XDocument = fbc(ODocument)

  const ListOfObjectives = XDocument.ListOfObjectives

  const OModel = ODocument.Model
  const XModel = XDocument.Model
  const OSpecies = ODocument.Species
  const XSpecies = XDocument.Species

  const omodel = new OModel()
  const xmodel = new XModel()
  const ospecies = new OSpecies()
  const xspecies = new XSpecies()

  t.not(omodel.listOfObjectives instanceof ListOfObjectives)
  t.ok(xmodel.listOfObjectives instanceof ListOfObjectives)

  t.not(isNum(ospecies.charge))
  t.ok(isNum(xspecies.charge))
  t.not(isStr(ospecies.chemicalFormula))
  t.ok(isStr(xspecies.chemicalFormula))

  t.end()
})
