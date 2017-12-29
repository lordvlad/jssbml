// const layoutXmlns = 'http://projects.eml.org/bcb/sbml/level2'
// const layoutXsi = 'http://www.w3.org/2001/XMLSchema-instance'

  // _writeLayouts (layouts) {
  //   this._tab(2)
  //   this._open('listOfLayouts', {xmlns: layoutXmlns, 'xmlns:xsi': layoutXsi})
  //   this._nl()
  //   for (let layout of layouts) {
  //     this._writeLayout(layout)
  //     this._nl()
  //   }
  //   this._tab(2)
  //   this._close('listOfLayouts')
  // }

  // _writeLayout (layout) {
  //   this._tab(3)
  //   this._open('layout', 'id')
  //   this._nl()
  //   this._tab(4)
  //   this._open('dimensions', layout, true)
  //   this._nl()
  //   this._writeListOf('CompartmentGlyphs', values(layout.listOfCompartmentGlyphs), this._writeCompartmentGlyph, 4)
  //   this._writeListOf('SpeciesGlyphs', values(layout.listOfSpeciesGlyphs), this._writeSpeciesGlyph, 4)
  //   this._writeListOf('ReactionGlyphs', values(layout.listOfReactionGlyphs), this._writeReactionGlyph, 4)
  //   this._writeListOf('TextGlyphs', values(layout.listOfTextGlyphs), this._writeTextGlyph, 4)
  //   this._tab(3)
  //   this._close('layout')
  // }

  // _writeBBox (bbox, depth) {
  //   this._tab(depth)
  //   this._open('boundingBox')
  //   this._nl()
  //   this._tab(depth + 1)
  //   this._open('position', pick(bbox, 'x', 'y'), true)
  //   this._nl()
  //   this._tab(depth + 1)
  //   this._open('dimensions', pick(bbox, 'height', 'width'), true)
  //   this._nl()
  //   this._tab(depth)
  //   this._close('boundingBox')
  //   this._nl()
  // }

  // _writeTextGlyph (t) {
  //   const graphicalObject = t.graphicalObject.id
  //   const originOfText = t.originOfText.id
  //   const p = assign(pick(t, 'id'), {graphicalObject, originOfText})
  //   this._tab(5)
  //   this._open('textGlyph', p)
  //   this._nl()
  //   this._writeBBox(t.boundingBox, 6)
  //   this._tab(5)
  //   this._close('textGlyph')
  // }

  // _writeReactionGlyph (c) {
  //   this._tab(5)
  //   this._open('reactionGlyph', {id: c.id, reaction: c.reaction.id})
  //   this._nl()
  //   this._tab(6)
  //   this._open('curve')
  //   this._nl()
  //   this._tab(6)
  //   this.push('<!-- TODO -->')
  //   this._nl()
  //   this._tab(6)
  //   this._close('curve')
  //   this._nl()
  //   this._writeListOf('SpeciesReferenceGlyphs', c.listOfSpeciesReferenceGlyphs, this._writeSpeciesReferenceGlyph, 6)
  //   this._tab(5)
  //   this._close('reactionGlyph')
  // }

  // _writeSpeciesReferenceGlyph (g) {
  //   const speciesReference = g.speciesReference.annotation.layoutId.id
  //   const speciesGlyph = g.speciesGlyph.id
  //   const p = assign(pick(g, 'id', 'role'), {speciesReference, speciesGlyph})
  //   this._tab(7)
  //   this._open('SpeciesReferenceGlyph', p)
  //   this._nl()
  //   this._tab(7)
  //   this.push('<!-- TODO -->')
  //   this._nl()
  //   this._tab(7)
  //   this._close('SpeciesReferenceGlyph')
  // }

  // _writeSpeciesGlyph (c) {
  //   this._tab(5)
  //   this._open('speciesGlyph', {id: c.id, species: c.species.id})
  //   this._nl()
  //   this._writeBBox(c.boundingBox, 6)
  //   this._tab(5)
  //   this._close('speciesGlyph')
  // }

  // _writeCompartmentGlyph (c) {
  //   this._tab(5)
  //   this._open('compartmentGlyph', {id: c.id, compartment: c.compartment.id})
  //   this._nl()
  //   this._writeBBox(c.boundingBox, 6)
  //   this._tab(5)
  //   this._close('compartmentGlyph')
  // }
