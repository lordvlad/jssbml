const test = require('tape')
const { factory, testLayout, testRevive, testRoundTrip } = require('./util')
const Layout = require('../extensions/layout')

factory.withNamespace(Layout)

test('roundtrip layout', (t) => testRoundTrip('tests/resources/example5.xml', t))
test('parse layout', (t) => testLayout(t, 'tests/resources/example5.xml'))
test('revive layout', (t) => testRevive('tests/resources/example5.xml', t, 4, 32, 10, false, false))
