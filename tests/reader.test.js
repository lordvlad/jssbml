const test = require('tape')
const {testReader, testRevive, testRoundTrip} = require('./util')

test('parse tca', (t) => testReader(t, 'tests/resources/tca.xml', 2, 26, 17))
test('parse gly', (t) => testReader(t, 'tests/resources/gly.xml', 2, 25, 19, true, true))
test('roundtrip tca', (t) => testRoundTrip('tests/resources/tca.xml', t))
test('roundtrip gly', (t) => testRoundTrip('tests/resources/gly.xml', t))
test('revive tca', (t) => testRevive('tests/resources/tca.xml', t, 2, 26, 17))
test('revive gly', (t) => testRevive('tests/resources/gly.xml', t, 2, 25, 19, true, true))
