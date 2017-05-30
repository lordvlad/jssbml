

  // function stoichiometricMatrix (model) {
  //   const species = model.species
  //   const reactions = model.reactions
  //   const n = model.species.size
  //   const m = model.reactions.size
  //   const s = ndarray(new Float64Array(n * m), [n, m])

  //   let i = 0
  //   for (let spec of species.values()) {
  //     let j = 0
  //     for (let react of reactions.values()) {
  //       let n = 0
  //       for (let r of react.reactants) {
  //         if (spec === r.species) { n = r.stoichiometry; break }
  //       }
  //       if (n === 0) {
  //         for (let r of react.products) {
  //           if (spec === r.species) { n = -r.stoichiometry; break }
  //         }
  //       }
  //       s.set(i, j, n)
  //       j++
  //     }
  //     i++
  //   }

  //   return s
  // }
