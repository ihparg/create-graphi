'use strict'

const fs = require('fs/promises')
const path = require('path')
const Controller = require('egg').Controller
const { loadDir } = require('../../utils/file')
const { getFullPath } = require('../../utils/route')
const gid = require('../../utils/gid')

module.exports = class extends Controller {
  async index() {
    const { ctx, app } = this
    const routes = await loadDir(app.config.routePath)
    ctx.body = routes
  }

  async save() {
    const { ctx, app } = this
    const { body } = ctx.request

    if (!body.id) body.id = gid()
    body.fullPath = getFullPath(body)

    const routePath = path.resolve(app.config.routePath, body.id)
    await fs.writeFile(routePath, JSON.stringify(body, null, 2))

    ctx.body = body
  }

  async remove() {
    const { ctx, app } = this
    const { body } = ctx.request
    const routePath = path.resolve(app.config.routePath, body.id)
    await fs.unlink(routePath)

    ctx.body = true
  }
}

