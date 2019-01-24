/* eslint-env mocha */
/* @flow */

const should = require('should')

const Builders = require('../support/builders')
const configHelpers = require('../support/helpers/config')
const pouchHelpers = require('../support/helpers/pouch')

describe('PouchDB', () => {
  before('instanciate config', configHelpers.createConfig)
  beforeEach('instanciate pouch', pouchHelpers.createDatabase)
  afterEach('clean pouch', pouchHelpers.cleanDatabase)
  after('clean config directory', configHelpers.cleanConfig)

  it('assigns _rev to new doc depending on previously deleted ones', async function () {
    const builders = new Builders({pouch: this.pouch})

    const doc1 = await builders.metafile().create()
    should(doc1._rev).startWith('1-')

    const doc2 = await builders.metafile(doc1).whateverChange().create()
    should(doc2._rev).startWith('2-')

    await this.pouch.db.remove(doc2)

    const doc3 = await builders.metafile().path(doc1.path).create()
    should(doc3._rev).startWith('4-')

    // await this.pouch.db.remove(doc3)

    const doc4 = await builders.metafile().path(doc1.path).rev('0').create({force: true})
    should(doc4._rev).startWith('1-')
  })
})
