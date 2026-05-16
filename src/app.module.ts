import Koa from "koa";
import cors from "@koa/cors";
import bodyParser from "koa-bodyparser";
import errorMiddleware from "./common/middleware/error.middleware.ts";
import requestLoggerMiddleware from "./common/middleware/request-logger.middleware.ts";
import securityMiddleware from "./common/middleware/security.middleware.ts";
import { registerRoutes } from "./common/router/register-routes.ts";
import { registerSwagger } from "./common/swagger/swagger.middleware.ts";
import { logger } from "./common/logger/logger.ts";
import type { AppConfig } from "./config/app.config.ts";
import { initializeDatabase, getSequelize } from "./database/sequelize.ts";

export class BootStrap {
    private app: Koa;
    private config: AppConfig;
    private server: ReturnType<Koa["listen"]> | null = null;

    constructor(config: AppConfig) {
        this.app = new Koa();
        this.config = config;

        // 设置 app.keys，用于 cookie 签名等场景。
        this.app.keys = [config.env === "production" ? crypto.randomUUID() : "koa-project-dev-key"];
    }

    public async start() {
        try {
            logger.info("Application bootstrap started");

            // 1. 初始化数据库。
            await initializeDatabase(this.config.database);

            // 2. 安全头中间件（最早处理，确保所有响应都带安全头）。
            this.app.use(securityMiddleware);

            // 3. 错误处理中间件（最外层，捕获下游所有异常）。
            this.app.use(errorMiddleware);

            // 4. 请求日志中间件（记录每个请求）。
            this.app.use(requestLoggerMiddleware);

            // 5. CORS 跨域中间件。
            this.app.use(
                cors({
                    origin: this.config.cors.origin,
                    allowMethods: this.config.cors.allowMethods,
                    allowHeaders: this.config.cors.allowHeaders,
                    maxAge: this.config.cors.maxAge,
                    credentials: this.config.cors.credentials,
                }),
            );

            // 6. Body 解析中间件（限制大小，仅解析 JSON）。
            this.app.use(
                bodyParser({
                    enableTypes: ["json", "form"],
                    jsonLimit: "10mb",
                    formLimit: "10mb",
                }),
            );

            // 7. 路由注册。
            await registerRoutes(this.app);

            // 8. Swagger 文档（仅在启用时）。
            if (this.config.swagger.enabled) {
                registerSwagger(this.app);
            }

            // 9. 启动服务器。
            this.server = this.app.listen(this.config.port, () => {
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

            // 10. 优雅关闭。
            this.registerGracefulShutdown();
        } catch (err) {
            logger.error("Application bootstrap failed", err);
            Deno.exit(1);
        }
    }

    // 注册进程信号监听，实现优雅关闭。
    private registerGracefulShutdown() {
        const shutdown = async (signal: string) => {
            logger.info(`Received ${signal}, shutting down gracefully...`);

            // 关闭 HTTP 服务器，不再接收新请求。
            if (this.server) {
                this.server.close(() => {
                    logger.info("HTTP server closed");
                });
            }

            // 关闭数据库连接。
            try {
                const sequelize = getSequelize();
                await sequelize.close();
                logger.info("Database connection closed");
            } catch {
                // 数据库可能未初始化。
            }

            logger.info("Graceful shutdown complete");
            Deno.exit(0);
        };

        // 监听 SIGINT (Ctrl+C) 和 SIGTERM。
        Deno.addSignalListener("SIGINT", () => shutdown("SIGINT"));
        Deno.addSignalListener("SIGTERM", () => shutdown("SIGTERM"));
    }
}