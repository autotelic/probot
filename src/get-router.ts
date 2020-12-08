import { Router } from "express";
import fastify from "fastify";

/**
 * Get an {@link http://expressjs.com|express} router that can be used to
 * expose HTTP endpoints
 *
 * @param path - the prefix for the routes
 * @returns an [express.Router](http://expressjs.com/en/4x/api.html#router)
 */
export function getRouter(router: Router, path?: string): Router {
  if (path) {
    const app = fastify();
    app.register(require("./server/fastify-router"));

    //@ts-ignore
    const newRouter = app.Router;
    router.use(path, newRouter);
    return newRouter;
  }

  return router;
}
