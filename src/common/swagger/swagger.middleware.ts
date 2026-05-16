import Router from "@koa/router";
import type Koa from "koa";
import type { Context } from "koa";
import { loadConfig } from "../../config/app.config.ts";
import { createOpenApiDocument } from "./openapi.ts";

/**
 * Scalar 是一款现代化的 API 文档 UI，界面风格接近 Knife4j。
 * 优点：中文支持好、暗色/亮色主题、易于自定义、比 Swagger UI 美观。
 */
const SCALAR_CDN_JS =
    "https://cdn.jsdelivr.net/npm/@scalar/api-reference@1";

// Scalar 页面专用 CSP：允许 jsdelivr CDN 资源加载。
const SCALAR_CSP = [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "img-src 'self' data: https:",
    "connect-src 'self'",
    "font-src https://cdn.jsdelivr.net",
].join("; ");

/**
 * 注册 API 文档路由：
 * - GET /docs           → Scalar UI（默认，推荐）
 * - GET /docs/openapi.json → OpenAPI 3.0 规范 JSON
 */
export function registerSwagger(app: Koa) {
    const router = new Router();
    const config = loadConfig();

    // OpenAPI JSON 端点。
    router.get("/docs/openapi.json", async (ctx: Context) => {
        ctx.body = await createOpenApiDocument({
            title: config.swagger.title,
            version: config.swagger.version,
        });
    });

    // Scalar UI 页面。
    router.get("/docs", (ctx: Context) => {
        ctx.set("Content-Security-Policy", SCALAR_CSP);
        ctx.type = "html";
        ctx.body = renderScalarPage({
            title: config.swagger.title,
            specUrl: "/docs/openapi.json",
        });
    });

    app.use(router.routes());
    app.use(router.allowedMethods());
}

// ---------- Scalar 页面模板 ----------

interface ScalarPageOptions {
    title: string;
    specUrl: string;
}

function renderScalarPage(opts: ScalarPageOptions): string {
    const { title, specUrl } = opts;

    // Scalar API Reference Web Component 方式嵌入。
    // 配置参考：https://github.com/scalar/scalar
    return `<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title} — API Docs</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
    </style>
  </head>
  <body>
    <script id="api-reference" type="application/json">
      ${JSON.stringify({ spec: { url: specUrl } })}
    </script>
    <script src="${SCALAR_CDN_JS}"></script>
  </body>
</html>`;
}