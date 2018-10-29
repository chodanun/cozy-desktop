/* @flow */

const fse = require('fs-extra')

const checksumer = require('./checksumer')
const logger = require('../logger')
const LinuxSource = require('./layers/linux')
const Dispatcher = require('./layers/dispatcher')

/*::
import type Pouch from '../pouch'
import type Prep from '../prep'
import type EventEmitter from 'events'
import type { Checksumer } from './checksumer'
import type { ChokidarEvent } from './chokidar_event'
*/

const log = logger({
  component: 'AtomWatcher'
})

module.exports = class AtomWatcher {
  /*::
  syncPath: string
  prep: Prep
  pouch: Pouch
  events: EventEmitter
  checksumer: Checksumer
  ensureDirInterval: *
  running: Promise<void>
  _runningResolve: ?Function
  _runningReject: ?Function
  source: LinuxSource
  */

  constructor (syncPath /*: string */, prep /*: Prep */, pouch /*: Pouch */, events /*: EventEmitter */) {
    this.syncPath = syncPath
    this.prep = prep
    this.pouch = pouch
    this.events = events
    this.checksumer = checksumer.init()

    const dispatcher = new Dispatcher(prep, pouch, events)
    // const checksum = new ChecksumLayer(dispatcher, this.checksumer)
    // const assignId = new IdLayer(checksum)
    // this.source = new LinuxSource(syncPath, assignID)
    this.source = new LinuxSource(syncPath, dispatcher)
  }

  ensureDirSync () {
    // This code is duplicated in local/index#start
    if (!fse.existsSync(this.syncPath)) {
      this.events.emit('syncdir-unlinked')
      throw new Error('Syncdir has been unlinked')
    }
  }

  start () {
    log.debug('starting...')
    this.ensureDirInterval = setInterval(this.ensureDirSync.bind(this), 5000)
    this.running = new Promise((resolve, reject) => {
      this._runningResolve = resolve
      this._runningReject = reject
    })
    this.source.start()
  }

  stop (force /*: ? bool */) {
    if (this._runningResolve) {
      this._runningResolve()
      this._runningResolve = null
    }
    clearInterval(this.ensureDirInterval)
    this.source.stop()
  }

  onFlush (rawEvents /*: ChokidarEvent[] */) {
    log.debug('onFlush', rawEvents)
  }
}
