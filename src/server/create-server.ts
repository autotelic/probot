import path from "path";
import { Server } from "http";

import * as fastifyType from "fastify";
import fastify from "fastify";

import { getLoggingMiddleware } from "./logging-middleware";

import type { Logger } from "pino";

export const createServer = (options: ServerOptions) => {
  const app: fastifyType.FastifyInstance<Server> = fastify();
  app.register(require("fastify-express"));
  app.register(require("./fastify-router"));
  //@ts-ignore
  app.use(getLoggingMiddleware(options.logger));
  app.register(require("fastify-static"), {
    root: path.join(__dirname, "..", "..", "static"),
    prefix: "/probot/static/",
  });
  //@ts-ignore
  app.use(options.webhook);
  app.decorate("view engine", "hbs");
  app.decorate("views", path.join(__dirname, "..", "..", "views"));
  app.get("/ping", (req: any, res: any) => res.end("PONG"));

  return app;
};

export interface ServerOptions {
  webhook: any;
  logger: Logger;
}
