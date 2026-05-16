import Router from "@koa/router";
import type Koa from "koa";
import type { Context } from "koa";
import { loadConfig } from "../../config/app.config.ts";
import { createOpenApiDocument } from "./openapi.ts";

// Swagger 页面的专用 CSP：允许 unpkg.com 的外部样式和脚本资源加载。
const SWAGGER_CSP = [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline' https://unpkg.com",
    "script-src 'self' 'unsafe-inline' https://unpkg.com",
    "img-src 'self' data: https:",
].join("; ");

// 注册 Swagger 文档接口：/docs 展示 UI，/docs/openapi.json 返回文档数据。
export function registerSwagger(app: Koa) {
    const router = new Router();
    const config = loadConfig();

    router.get("/docs/openapi.json", async (ctx: Context) => {
        ctx.body = await createOpenApiDocument({
            title: config.swagger.title,
            version: config.swagger.version,
        });
    });

    router.get("/docs", (ctx: Context) => {
        // 覆盖全局 CSP 策略，允许 Swagger UI 的外部资源。
        ctx.set("Content-Security-Policy", SWAGGER_CSP);
        ctx.type = "html";
        ctx.body = createSwaggerHtml("/docs/openapi.json");
    });

    app.use(router.routes());
    app.use(router.allowedMethods());
}

function createSwaggerHtml(openApiUrl: string) {
    return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>API Docs</title>
    <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script>
      window.ui = SwaggerUIBundle({
        url: "${openApiUrl}",
        dom_id: "#swagger-ui"
      });
    </script>
  </body>
</html>`;
}