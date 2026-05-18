import Router from "@koa/router";
import type Koa from "koa";
import type { Context } from "koa";
import { loadConfig } from "../../config/app.config.ts";
import { createOpenApiDocument } from "./openapi.ts";

// ---------- Swagger UI CDN ----------

const SWAGGER_UI_CSS =
    "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css";
const SWAGGER_UI_BUNDLE =
    "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js";
const SWAGGER_UI_STANDALONE =
    "https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js";

const DOCS_CSP = [
    "default-src 'self'",
    "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
    "img-src 'self' data: https:",
    "connect-src 'self' *",
    "font-src 'self' data: https://cdn.jsdelivr.net",
].join("; ");

/** 缓存 OpenAPI 文档，避免每次请求都扫描文件系统重新生成。 */
let cachedOpenApiDoc: object | null = null;

export function registerSwagger(app: Koa) {
    const router = new Router();
    const config = loadConfig();

    router.get("/docs/openapi.json", async (ctx: Context) => {
        if (!cachedOpenApiDoc) {
            cachedOpenApiDoc = await createOpenApiDocument({
                title: config.swagger.title,
                version: config.swagger.version,
            });
        }
        ctx.body = cachedOpenApiDoc;
    });

    router.get("/docs", (ctx: Context) => {
        ctx.set("Content-Security-Policy", DOCS_CSP);
        ctx.type = "html";
        ctx.body = renderSwaggerPage({
            title: config.swagger.title,
            specUrl: "/docs/openapi.json",
        });
    });

    app.use(router.routes());
    app.use(router.allowedMethods());
}

// ---------- Swagger UI 页面 ----------

interface SwaggerPageOptions {
    title: string;
    specUrl: string;
}

function renderSwaggerPage(opts: SwaggerPageOptions): string {
    const { title, specUrl } = opts;
    const safeTitle = title.replace(/"/g, "'").replace(/</g, "<");

    return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>${safeTitle} — API 文档</title>
<link rel="stylesheet" href="${SWAGGER_UI_CSS}"/>
<style>
  html { box-sizing: border-box; overflow-y: scroll; }
  *, *:before, *:after { box-sizing: inherit; }
  body { margin: 0; }
  .topbar { display: none; }
  .swagger-ui .topbar .wrapper { padding: 8px 0; }
  .swagger-ui .topbar a { max-width: none; }
</style>
</head>
<body>
<div id="swagger-ui"></div>
<script src="${SWAGGER_UI_BUNDLE}"></script>
<script src="${SWAGGER_UI_STANDALONE}"></script>
<script>
  SwaggerUIBundle({
    url: "${specUrl}",
    dom_id: "#swagger-ui",
    deepLinking: true,
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    plugins: [SwaggerUIBundle.plugins.DownloadUrl],
    layout: "StandaloneLayout",
    defaultModelsExpandDepth: -1,
    docExpansion: "list",
    filter: true,
    tryItOutEnabled: true,
    displayRequestDuration: true,
  });
</script>
</body>
</html>`;
}
