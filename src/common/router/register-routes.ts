import Router from "@koa/router";
import type Koa from "koa";
import type { Context, Next } from "koa";
import { logger } from "../logger/logger.ts";
import { loadControllers } from "./controller-loader.ts";
import { combinePaths, normalizePath } from "./path.ts";

// 扫描 src/modules/**/*.controller.ts，读取默认导出的 controller 并挂载路由。
export async function registerRoutes(app: Koa) {
  const router = new Router();
  const controllers = await loadControllers();

  for (const { Controller } of controllers) {
    const instance = new Controller();
    const prefix = normalizePath(Controller.prefix || "");
    const routes = Controller.routes || [];

    for (const route of routes) {
      // 根据 routes 里的 handler 名称，找到 controller 实例上的真实方法。
      const handler = instance[route.handler];
      if (typeof handler !== "function") {
        throw new Error(
          `${Controller.name}.${route.handler} is not a route handler`,
        );
      }

      const routePath = combinePaths(prefix, route.path);

      // 绑定 this，保证 handler 内可以访问 controller 实例属性和 service。
      router[route.method](routePath, (ctx: Context, next: Next) => {
        return handler.call(instance, ctx, next);
      });

      logger.info(
        `route registered: ${route.method.toUpperCase()} ${routePath}`,
      );
    }
  }

  app.use(router.routes());
  app.use(router.allowedMethods());
}
