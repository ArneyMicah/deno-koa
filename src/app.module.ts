import Koa from "koa";
import errorMiddleware from "./common/middleware/error.middleware.ts";
import { registerRoutes } from "./common/router/register-routes.ts";
import { registerSwagger } from "./common/swagger/swagger.middleware.ts";
import { logger } from "./common/logger/logger.ts";
import type { AppConfig } from "./config/app.config.ts";
import { initializeDatabase } from "./database/sequelize.ts";

export class BootStrap {
  private app: Koa;
  private config: AppConfig;

  constructor(config: AppConfig) {
    this.app = new Koa();
    this.config = config;
  }

  public async start() {
    logger.info("Application bootstrap started");

    await initializeDatabase(this.config.database);

    // 全局错误处理中间件需要先注册，才能捕获后续路由里的异常。
    this.app.use(errorMiddleware);

    // 自动扫描 src/modules 下的 controller，并注册到 Koa Router。
    await registerRoutes(this.app);

    if (this.config.swagger.enabled) {
      // 根据 controller routes 元数据生成 Swagger 文档。
      registerSwagger(this.app);
    }

    this.app.listen(this.config.port, () => {
      logger.info(
        `🚀 Server running on http://localhost:${this.config.port}`,
      );
      logger.info(`🌱 Environment: ${this.config.env}`);

      if (this.config.swagger.enabled) {
        logger.info(
          `📚 Swagger docs: http://localhost:${this.config.port}/docs`,
        );
      }
    });
  }
}
