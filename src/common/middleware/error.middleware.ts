import type { Context, Next } from "koa";
import { logger } from "../logger/logger.ts";
import { fail } from "../utils/response.ts";

// 全局异常处理中间件：统一接口错误返回格式，并兜底处理 404。
export default async function errorMiddleware(ctx: Context, next: Next) {
    try {
        await next();

        if (ctx.status === 404 && !ctx.body) {
            ctx.body = fail("Not Found", 404);
        }
    } catch (err) {
        const error = err as { status?: number; message?: string };
        const status = error.status || 500;
        ctx.status = status;
        ctx.body = fail(error.message || "Internal Server Error", status);
        logger.error("Unhandled request error", {
            requestId: ctx.state.requestId as string | undefined,
            error: err,
        });
    }
}
