import { Server } from "http";

import * as fastify from "fastify";

const fastifyPlugin = require("fastify-plugin");

function fastifyRouter(
  fastify: fastify.FastifyInstance<Server>,
  opts: any,
  next: any
) {
  fastify.decorate("Router", Router(fastify));
  next();
}

const Router = (fastify: fastify.FastifyInstance<Server>) => ({
  route: (routers: any, prefix = "") =>
    routers.forEach((router: any) => {
      if (router.routers instanceof Array) {
        Router(fastify).route(router.routers, router.prefix);
      }

      if (router.routes instanceof Function) {
        fastify.register(router.routes, {
          prefix: _normalizePath(prefix, router.prefix),
        });
      }

      if (router.routes instanceof Array) {
        fastify.register(
          (fastify: fastify.FastifyInstance<Server>, opts: any, next: any) =>
            router.routes.forEach((route: any) => {
              route.url = _normalizePath(prefix, router.prefix, route.url);
              fastify.route(route);
              next();
            })
        );
      }
    }),
});

function _normalizePath(previousPrefix = "", currentPrefix = "", path = "") {
  const previousPrefixPaths = previousPrefix.split("/");
  const currentPrefixPaths = currentPrefix.split("/");
  const currentPaths = path.split("/");

  const result = previousPrefixPaths
    .concat(currentPrefixPaths)
    .concat(currentPaths)
    .filter((path) => path !== "")
    .join("/");

  return `/${result}`;
}

module.exports = fastifyPlugin(fastifyRouter, {
  name: "fastify-router",
});
