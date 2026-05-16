import type { Context, Next } from "koa";

/**
 * 安全头中间件：为所有 HTTP 响应统一添加安全相关头。
 * 参考 Helmet 最佳实践，防御常见 Web 攻击。
 */
export default async function securityMiddleware(ctx: Context, next: Next) {
    // 禁止浏览器进行 MIME 类型嗅探。
    ctx.set("X-Content-Type-Options", "nosniff");

    // 启用浏览器 XSS 过滤。
    ctx.set("X-XSS-Protection", "0");

    // 禁止页面被嵌入 iframe，防止点击劫持。
    ctx.set("X-Frame-Options", "DENY");

    // 严格限制 referrer 信息传递。
    ctx.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // 默认内容安全策略（可在具体路由中覆盖）。
    ctx.set("Content-Security-Policy", "default-src 'self'");

    // 禁止通过 document.domain 修改源。
    ctx.set("X-DNS-Prefetch-Control", "off");

    await next();
}