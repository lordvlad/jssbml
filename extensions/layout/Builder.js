
  makeTextGlyph (node) {
    const {glyphs, species, reactions, compartments} = this.ctx
    const k = node.originoftext
    return assign(new this.Document.TextGlyph(), pick(node, 'id'), {
      boundingBox: this.makeBBox(this.getChild(node, 'boundingBox')),
      graphicalObject: glyphs[node.graphicalobject],
      originOfText: species[k] || reactions[k] || compartments[k]
    })
  }

  makeSpeciesGlyph (node) {
    const {species} = this.ctx
    return assign(new this.Document.SpeciesGlyph(), pick(node, 'id'), {
      boundingBox: this.makeBBox(this.getChild(node, 'boundingBox')),
      species: species[node.species]
    })
  }

  makeBBox (node) {
    const pos = this.getChild(node, 'position')
    const dim = this.getChild(node, 'dimensions')
    const bbox = new this.Document.BBox()
    bbox.x = parseFloat(pos.x)
    bbox.y = parseFloat(pos.y)
    bbox.height = parseFloat(dim.height)
    bbox.width = parseFloat(dim.width)
    return bbox
  }
  makeCompartmentGlyph (node) {
    const {compartments} = this.ctx
    return assign(new this.Document.CompartmentGlyph(), pick(node, 'id'), {
      compartment: compartments[node.compartment],
      boundingBox: this.makeBBox(this.getChild(node, 'boundingBox'))
    })
  }

  makeSpeciesReferenceGlyph (node) {
    const {speciesReferences, glyphs} = this.ctx
    return assign(new this.Document.SpeciesReferenceGlyph(), pick(node, 'id', 'role'), {
      speciesReference: speciesReferences[node.speciesreference],
      speciesGlyph: glyphs[node.speciesglyph]
    })
  }
    makeAnnotation (node) {
      const annotation = super.makeAnnotation(node)
      if (!annotation) return
      const layoutNodes = this.getChildListOf(node, 'Layouts')
      if (layoutNodes && layoutNodes.length) {
        annotation.listOfLayouts = new this.Document.ListOfLayouts()
        for (let s of layoutNodes) annotation.listOfLayouts.push(this.makeLayout(s))
      }

      const layoutIdNode = this.getChild(node, 'layoutId')
      if (!isEmptyObject(layoutIdNode)) {
        annotation.layoutId = layoutIdNode
      }

      return assign(new this.Document.Annotation(), annotation)
    }
    makeLayout (node) {
      const { glyphs } = this.ctx
      const layout = new this.Document.Layout()

      layout.id = node.id

      assign(layout, this.getChild(node, 'dimension'))

      for (let s of this.getChildListOf(node, 'CompartmentGlyphs')) {
        const c = this.makeCompartmentGlyph(s)
        layout.listOfCompartmentGlyphs.push(c)
        glyphs[c.id] = c
      }
      for (let s of this.getChildListOf(node, 'SpeciesGlyphs')) {
        const c = this.makeSpeciesGlyph(s)
        layout.listOfSpeciesGlyphs.push(c)
        glyphs[c.id] = c
      }
      for (let s of this.getChildListOf(node, 'ReactionGlyphs')) {
        const c = this.makeReactionGlyph(s)
        layout.listOfReactionGlyphs.push(c)
        glyphs[c.id] = c
      }
      for (let s of this.getChildListOf(node, 'TextGlyphs')) {
        const c = this.makeTextGlyph(s)
        layout.listOfTextGlyphs.push(c)
        glyphs[c.id] = c
      }

      return layout
    }

    makeReactionGlyph (node) {
      const {reactions} = this.ctx
      const reactionGlyph = new this.Document.ReactionGlyph()
      assign(reactionGlyph, pick(node, 'id'))
      reactionGlyph.curve = null
      reactionGlyph.reaction = reactions[node.reaction]
      for (let s of this.getChildListOf(node, 'SpeciesReferenceGlyphs')) {
        const spec = this.makeSpeciesReferenceGlyph(s)
        reactionGlyph.listOfSpeciesReferenceGlyphs.push(spec)
      }
      return reactionGlyph
    }
    makeTextGlyph (node) {
      const {glyphs, species, reactions, compartments} = this.ctx
      const k = node.originoftext
      return assign(new this.Document.TextGlyph(), pick(node, 'id'), {
        boundingBox: this.makeBBox(this.getChild(node, 'boundingBox')),
        graphicalObject: glyphs[node.graphicalobject],
        originOfText: species[k] || reactions[k] || compartments[k]
      })
    }

    makeSpeciesGlyph (node) {
      const {species} = this.ctx
      return assign(new this.Document.SpeciesGlyph(), pick(node, 'id'), {
        boundingBox: this.makeBBox(this.getChild(node, 'boundingBox')),
        species: species[node.species]
      })
    }

    makeBBox (node) {
      const pos = this.getChild(node, 'position')
      const dim = this.getChild(node, 'dimensions')
      const bbox = new this.Document.BBox()
      bbox.x = parseFloat(pos.x)
      bbox.y = parseFloat(pos.y)
      bbox.height = parseFloat(dim.height)
      bbox.width = parseFloat(dim.width)
      return bbox
    }
    makeCompartmentGlyph (node) {
      const {compartments} = this.ctx
      return assign(new this.Document.CompartmentGlyph(), pick(node, 'id'), {
        compartment: compartments[node.compartment],
        boundingBox: this.makeBBox(this.getChild(node, 'boundingBox'))
      })
    }

    makeSpeciesReferenceGlyph (node) {
      const {speciesReferences, glyphs} = this.ctx
      return assign(new this.Document.SpeciesReferenceGlyph(), pick(node, 'id', 'role'), {
        speciesReference: speciesReferences[node.speciesreference],
        speciesGlyph: glyphs[node.speciesglyph]
      })
    }
}
