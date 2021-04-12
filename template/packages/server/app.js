'use strict'

const dayjs = require('dayjs')
const datetime = require('./app/utils/type/datetime')
const createCache = require('./app/utils/cache')

module.exports = class App {
  constructor(app) {
    this.app = app

    datetime.serialize = date => dayjs(date).format('YYYY-MM-DD HH:mm:ss')
  }

  async willReady() {
    this.app.cache = createCache(this.app.redis)
    if (this.app.mongoose) this.app.mongoose.set('useFindAndModify', false)
  }
}
