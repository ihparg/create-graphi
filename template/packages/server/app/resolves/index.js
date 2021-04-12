'use strict'

const example = require('./example')

const resolves = {
  example,
}

const execute = async (name, obj, args, ctx) => {
  const [ m, f ] = name.split('.')
  try {
    const data = await resolves[m][f](ctx, args.data)

    return obj === 'noWrap' ? data : { code: 200, data }
  } catch (e) {
    ctx.logger.error(e)
    return { code: e.status || 500, message: e.message }
  }
}

module.exports = {
  resolves,
  execute,
}
