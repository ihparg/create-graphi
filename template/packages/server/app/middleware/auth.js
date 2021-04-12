'use strict'

const jwt = require('jsonwebtoken')

module.exports = needLogin => async (ctx, next) => {
  if (needLogin) {
    const { authorization } = ctx.request.headers
    ctx.assert(authorization, 401, '用户未登录')
    const [ , token ] = authorization.split(' ')

    try {
      const user = await jwt.verify(token, ctx.app.config.keys)

      if (!user) {
        ctx.throw(401, '登录超时，请重新登录')
      }

      ctx.user = user
    } catch (e) {
      console.error(e)
      ctx.throw(401, '登录超时，请重新登录')
    }
  }
  await next()
}
