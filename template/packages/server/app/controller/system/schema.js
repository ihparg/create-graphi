'use strict'

const fs = require('fs/promises')
const path = require('path')
const Controller = require('egg').Controller
const { loadDir } = require('../../utils/file')
const gid = require('../../utils/gid')

class SchemaController extends Controller {
  async index() {
    const { ctx, app } = this
    const schemas = await loadDir(app.config.schemaPath)
    ctx.body = schemas
  }

  async save() {
    const { ctx, app } = this
    const { body } = ctx.request

    if (!body.id) body.id = gid()
    const filePath = path.resolve(app.config.schemaPath, body.id)

    await fs.writeFile(filePath, JSON.stringify(body, null, 2))
    let schemas = await loadDir(app.config.schemaPath)
    schemas = schemas.reduce((obj, s) => {
      obj[s.name] = s
      return obj
    }, {})

    if (body.tag === 'mongodb') {
      // genModel(filePath, body.name, schemas)
      const content = await app.database.mongoose.createModel(body, schemas)
      await fs.writeFile(path.resolve(app.baseDir, 'app/model', body.id + '.js'), content)
    }

    ctx.body = body
  }

  async remove() {
    const { ctx, app } = this
    const { body } = ctx.request
    const filePath = path.resolve(app.config.schemaPath, body.id)

    console.log(filePath)

    await fs.unlink(filePath)

    ctx.body = true
  }
}

module.exports = SchemaController
