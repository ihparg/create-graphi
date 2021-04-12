'use strict'

const auth = require('../middleware/auth')
const resolve = require('../resolves')
const { loadDir } = require('./file')
const { filterProps } = require('./objects')
const { flattenSchemas } = require('./schema')
const graphql = require('./graphql')

const getRefType = (schemas, key) => {
  const ref = schemas[key]

  if (ref.type === 'ref') {
    return getRefType(schemas, ref.ref)
  }
  return ref.type
}

const flattenProperty = (property, schemas) => {
  const props = { ...property }

  if (props.properties) {
    props.type = 'object'
    Object.keys(props.properties).forEach(k => {
      props.properties[k] = flattenProperty(props.properties[k], schemas)
    })
  }

  if (props.items) {
    props.items[0] = flattenProperty(props.items[0], schemas)
  }

  if (props.ref) {
    const ref = schemas[props.ref]
    if (ref) {
      props.type = getRefType(schemas, props.ref)
      Object.keys(ref).forEach(k => {
        if (k === 'properties' || k === 'items') return
        if (props[k] == null) props[k] = ref[k]
      })
    } else {
      console.error(props.ref + '引用丢失')
    }
  }

  return props
}

const flattenRoute = (route, schemas) => {
  if (Array.isArray(schemas)) schemas = flattenSchemas(schemas)

  route = JSON.parse(JSON.stringify(route))
  const keys = [ 'requestHeaders', 'requestBody', 'queryString', 'responseHeaders', 'responseBody' ]
  keys.forEach(k => {
    if (route[k]) route[k] = flattenProperty(route[k], schemas)
  })

  return route
}

const registerRoutes = async ({ router, config, logger }) => {
  const schemas = await loadDir(config.schemaPath)
  const routes = await loadDir(config.routePath)

  routes.forEach(r => {
    if (!r.responseBody) {
      logger.error(`${r.name} has no response body.`)
      return
    }

    const route = flattenRoute(r, schemas)
    if (!route.resolve) {
      logger.error(`route id:${r.id} not exist`)
      return
    }

    const useGraphql = ([ 'ref', 'object' ].includes(route.responseBody.type) && route.resolve[0] !== '*')

    const execute = useGraphql
      ? graphql(route, resolve.execute)
      : (data, ctx) => resolve.execute(route.resolve, 'noWrap', { data }, ctx)
    const needLogin = route.requestHeaders && route.requestHeaders.properties.Authorization

    const inputSchemaKeys = Object.keys(Object.assign(
      {},
      (route.queryString || {}).properties,
      (route.routeParams || {}).properties,
      (route.requestBody || {}).properties
    ))

    router[route.method.toLowerCase()](route.path, auth(needLogin), async function(ctx) {
      const args = Object.assign({}, ctx.query, ctx.params, ctx.request.body)
      // 过滤掉第一层不要的数据
      filterProps(args, inputSchemaKeys)
      const res = await execute(args, ctx)

      if (useGraphql) {
        if (res.errors) {
          ctx.body = { code: 500, message: res.errors[0].message }
          ctx.logger.error(new Error(res.errors))
        } else {
          ctx.body = res.data.result
        }
      } else {
        ctx.body = res
      }
    })
  })
}

const getFullPath = route => {
  return route.method + ':' + route.path.toLowerCase()
}

module.exports = { registerRoutes, getFullPath }
