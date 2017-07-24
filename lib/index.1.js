// const multipipe = require('multipipe')
//
// const Reader = require('./reader')
// const Builder = require('./builder')
//
// const {isObj, entries} = require('./util')
//
// const cons = ({}).constructor
//
// const clonable = ['ATP', 'ADP', 'NAD', 'NADH', 'NADP', 'NADPH', 'P', 'O2', 'H2O']
//
// function revive (o) {
  // const m = new WeakMap()
  // const set = (k, v) => { m.set(k, v); return v }
  // function rev (o) {
    // const x = m.get(o)
    // if (x) return x
    // if (isArr(o)) return set(o, o.map(rev))
    // if (isObj(o)) {
      // if (o.$constructor && o.constructor === cons) {
        // const v = Object.create(module.exports[o.$constructor].prototype)
        // set(o, v)
        // for (let [k, v] of entries(o)) o[k] = rev(v)
        // assign(v, o)
        // return v
      // } else {
        // for (let [k, v] of entries(o)) o[k] = rev(v)
        // set(o, o)
        // return o
      // }
    // }
    // return o
  // }
  // return rev(o)
// }
//
// function create (attributes) {
  // switch (attributes.$name) {
    // case 'model': return new Model(attributes)
    // case 'unitDefinition': return new Unit(attributes)
    // case 'compartment': return new Compartment(attributes)
    // case 'species': return new Species(attributes)
    // case 'reaction': return new Reaction(attributes)
    // case 'speciesReference': return new SpeciesReference(attributes)
    // case 'modifierSpeciesReference': return new ModifierSpeciesReference(attributes)
    // default: return attributes
  // }
// }
//
// class Clazz {
  // constructor (attr) {
    // assign(this, attr, { $constructor: this.constructor.name })
  // }
// }
//
// class Entity extends Clazz {
  // get label () { return this.id }
// }
//
// class Shape extends Clazz {
  // constructor (attr) {
    // super(assign({x: 0, y: 0, X: 0, Y: 0}, attr))
  // }
// }
//
// class Rect extends Shape {
  // constructor (attr) {
    // super(assign({shape: 'rect'}, attr))
  // }
  // get rx () { return 0 }
  // get ry () { return 0 }
// }
//
// class Group extends Rect {
  // constructor (compartment) {
    // super({ compartment, leaves: [], groups: [] })
  // }
  // get id () { return this.compartment.id }
  // get label () { return this.compartment.id }
  // get className () { return `group compartment ${this.id}` }
  // get rx () { return 8 }
  // get ry () { return 8 }
// }
//
// class Transform extends Rect {
  // constructor (reaction) { super({ reaction, leaves: [], groups: [] }) }
  // get id () { return this.reaction.id }
  // get label () { return this.reaction.id }
  // get className () { return `node reaction ${this.id}` }
  // get rx () { return 2 }
  // get ry () { return 2 }
// }
//
// class Pool extends Entity {
  // constructor (species) { super({species, refs: [], clones: []}) }
  // get id () { return this.species.id }
  // addClone () { let c = new PoolClone(this); this.clones.push(c); return c }
  // getClone () {
    // if (clonable.indexOf(this.id) !== -1) return this.addClone()
    // if (this.clones.length < 1) return this.addClone()
    // return this.clones[0]
  // }
// }
//
// class PoolClone extends Rect {
  // constructor (pool) { super({pool}) }
  // get id () { return this.pool.species.id }
  // get label () { return this.pool.species.id }
  // get className () { return `node pool ${this.id} ${this.pool.clones.length > 1 ? 'clone' : ''}` }
  // get rx () { return this.innerBounds.height() / 2 }
  // get ry () { return this.innerBounds.height() / 2 }
// }
//
// class Graph extends Entity {
  // constructor (attr) {
    // super(assign({nodes: [], links: [], groups: [], constraints: []}, attr))
  // }
// }
//
// class Model extends Entity {
  // constructor (attr) {
    // super(assign({
      // graph: new Graph(),
      // species: new Map(),
      // reactions: new Map(),
      // compartments: new Map()
    // }, attr))
  // }
//
  // addCompartment (x) {
    // let c = new Compartment(x)
    // let g = new Group(c)
    // c.group = g
    // c.model = this
//
    // this.compartments.set(c.id, c)
    // let i = g.nodeIndex = this.graph.groups.push(g) - 1
    // if (c.outside) {
      // c.outside = this.compartments.get(c.outside)
      // c.outside.group.groups.push(i)
    // }
    // return c
  // }
//
  // addSpecies (x) {
    // let s = new Species(x)
    // let p = new Pool(s)
    // s.pool = p
    // s.model = this
//
    // this.species.set(s.id, s)
    // s.compartment = this.compartments.get(s.compartment)
    // let i = p.nodeIndex = this.graph.nodes.push(p) - 1
    // s.compartment.group.leaves.push(i)
    // return s
  // }
//
  // addReaction (x) {
    // let r = new Reaction(x)
    // let t = new Transform(r)
    // r.transform = t
    // r.model = this
//
    // this.reactions.set(r.id, r)
    // t.nodeIndex = this.graph.nodes.push(t) - 1
    // return r
  // }
// }
//
// class Link extends Entity {
  // constructor (source, target, reversible = true) { super({source, target, reversible}) }
  // get className () { return 'link' + (this.reversible ? ' reversible' : '') }
// }
//
// class ModifierLink extends Link {
  // get className () { return 'link modifier' }
// }
//
// class Reaction extends Entity {
  // constructor (attr) { super(assign({reversible: true, modifiers: [], reactants: [], products: []}, attr)) }
  // get label () { return this.name }
  // get compartment () { return this._compartment }
  // set compartment (c) {
    // if (this._compartment) {
      // todo remove from old compartment
    // }
    // this._compartment = c
    // c.group.leaves.push(this.transform.nodeIndex)
  // }
//
  // _mkSpeciesRef (x) {
    // let s = new SpeciesReference(x)
    // s.species = this.model.species.get(s.species)
    // s.species.pool.refs.push(s)
    // if (!this.compartment) this.compartment = s.species.compartment
    // return s
  // }
//
  // _getClone (s) {
    // let c = s.species.pool.getClone()
    // if (this.model.graph.nodes.indexOf(c) === -1) {
      // c.nodeIndex = this.model.graph.nodes.push(c) - 1
      // this.compartment.group.leaves.push(c.nodeIndex)
    // }
    // return c
  // }
//
  // _addMod (x, arr, Cls) {
    // const s = this._mkSpeciesRef(x)
    // const c = this._getClone(s)
    // arr.push(s)
    // this.model.graph.links.push(new Cls(c, this.transform, this.reversible))
    // return s
  // }
//
  // addModifier (x) {
    // return this._addMod(x, this.modifiers, ModifierLink)
  // }
//
  // addReactant (x) {
    // return this._addMod(x, this.reactants, Link)
  // }
//
  // addProduct (x) {
    // return this._addMod(x, this.products, Link)
  // }
// }
//
// class SpeciesReference extends Entity {
  // constructor (attr) { super(assign({stoichiometry: 1}, attr)) }
// }
//
// class Unit extends Entity { }
// class Species extends Entity { }
// class Compartment extends Entity { }
// class ModifierSpeciesReference extends SpeciesReference {}
//
// module.exports = {
  // Pool,
  // PoolClone,
  // Link,
  // ModifierLink,
  // Transform,
  // Model,
  // Species,
  // Compartment,
  // Unit,
  // Reaction,
  // SpeciesReference,
  // ModifierSpeciesReference,
  // Group,
  // Graph,
  // create,
  // revive,
  // Reader,
  // createXmlReader (opt) { return new Reader(opt) },
  // createModelBuilder (opt) { return new Builder(opt) },
  // createParser (opt) { return multipipe(new Reader(opt), new Builder(opt))}
// }
//
