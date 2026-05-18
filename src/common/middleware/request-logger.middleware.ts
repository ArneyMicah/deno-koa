import type { Context, Next } from "koa";
import { logger } from "../logger/logger.ts";

// 请求日志中间件：记录每个请求的方法、路径、状态码和耗时。
export default async function requestLoggerMiddleware(ctx: Context, next: Next) {
    const start = Date.now();
    const requestId = generateRequestId();

    // 挂载 requestId 到 ctx.state，同时通过响应头返回给客户端。
    ctx.state.requestId = requestId;
    ctx.set("X-Request-Id", requestId);

    await next();

    const duration = Date.now() - start;
    const status = ctx.status;

    if (status >= 400) {
        logger.warn(
            `${ctx.method} ${ctx.url} ${status} ${duration}ms`,
            { requestId },
        );
    } else {
        logger.info(
            `${ctx.method} ${ctx.url} ${status} ${duration}ms`,
            { requestId },
        );
    }
}

function generateRequestId(): string {
    return crypto.randomUUID();
}