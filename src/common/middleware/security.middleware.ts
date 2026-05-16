import type { Context, Next } from "koa";

/**
 * 安全头中间件：为所有 HTTP 响应统一添加安全相关头。
 * 参考 Helmet 最佳实践，防御常见 Web 攻击。
 *
 * Content-Security-Policy 仅在 HTML 响应上设置（对 JSON API 无实际作用且浪费带宽）。
 */
export default async function securityMiddleware(ctx: Context, next: Next) {
    await next();

    // ----- 以下安全头在所有响应上都应该设置 -----

    // 禁止浏览器进行 MIME 类型嗅探。
    ctx.set("X-Content-Type-Options", "nosniff");

    // 禁用旧版浏览器 XSS 审计器（与 CSP 共存时有副作用，现代浏览器已废弃此头）。
    ctx.set("X-XSS-Protection", "0");

    // 禁止页面被嵌入 iframe，防止点击劫持。
    ctx.set("X-Frame-Options", "DENY");

    // 严格限制 referrer 信息传递。
    ctx.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // 禁止通过 document.domain 修改源。
    ctx.set("X-DNS-Prefetch-Control", "off");

    // ----- CSP 仅 HTML 页面需要（JSON API 响应无需 CSP）-----
    const contentType = ctx.response.get("Content-Type") || "";
    const isHtml = contentType.includes("text/html") || (typeof ctx.body === "string" && !ctx.body.startsWith("{") && !ctx.body.startsWith("["));

    if (isHtml && !ctx.response.get("Content-Security-Policy")) {
        ctx.set("Content-Security-Policy", "default-src 'self'");
    }
}