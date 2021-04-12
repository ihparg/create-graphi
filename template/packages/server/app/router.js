'use strict'

const { registerRoutes } = require('./utils/route')

const jsonWrapper = async (ctx, next) => {
  await next()
  ctx.body = {
    code: 200,
    data: ctx.body,
  }
}

module.exports = app => {
  const { controller } = app

  const router = app.router.namespace('/dev', jsonWrapper)

  if (app.config.env === 'local') {
    router.get('/schema/list', controller.system.schema.index)
    router.get('/route', controller.system.route.index)
    router.get('/resolve/list', controller.system.resolve.list)
    router.post('/route/save', controller.system.route.save)
    router.post('/schema/save', controller.system.schema.save)
    router.delete('/route', controller.system.route.remove)
    router.delete('/schema', controller.system.schema.remove)
  }

  registerRoutes(app)

  app.router.get(/^(?!\/api\/)/, controller.home.index)
}
