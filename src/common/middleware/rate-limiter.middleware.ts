import type { Context, Next } from "koa";
import { fail } from "../utils/response.ts";
import { logger } from "../logger/logger.ts";

/**
 * 滑动窗口限流配置。
 */
export interface RateLimiterOptions {
    /** 时间窗口（秒），默认 60 秒 */
    windowSeconds?: number;
    /** 窗口内最大请求数 */
    maxRequests: number;
    /** 限流键生成器（默认使用客户端 IP） */
    keyGenerator?: (ctx: Context) => string;
}

interface WindowEntry {
    timestamps: number[];
}

/**
 * 基于内存滑动窗口的请求频率限制中间件。
 *
 * 未使用外部存储（如 Redis），适合单实例部署。
 * 分布式环境应替换为 Redis 实现。
 */
export function rateLimiterMiddleware(options: RateLimiterOptions) {
    const windowSeconds = options.windowSeconds ?? 60;
    const maxRequests = options.maxRequests;
    const keyGenerator = options.keyGenerator ?? defaultKeyGenerator;

    // 每个 key 对应的请求时间戳列表（毫秒）。
    const store = new Map<string, WindowEntry>();

    // 定期清理过期 key，防止内存泄漏。
    const cleanInterval = setInterval(() => {
        const now = Date.now();
        const expireThreshold = now - windowSeconds * 1000 - 60_000; // 容忍 1 分钟
        for (const [key, entry] of store) {
            entry.timestamps = entry.timestamps.filter((t) => t > now - windowSeconds * 1000);
            if (entry.timestamps.length === 0 && now - Math.max(...(entry.timestamps.length ? entry.timestamps : [now])) > expireThreshold) {
                store.delete(key);
            }
        }
    }, 60_000);

    return async (ctx: Context, next: Next) => {
        const key = keyGenerator(ctx);
        const now = Date.now();

        let entry = store.get(key);
        if (!entry) {
            entry = { timestamps: [] };
            store.set(key, entry);
        }

        // 滑动窗口：移除窗口外的记录。
        const windowStart = now - windowSeconds * 1000;
        entry.timestamps = entry.timestamps.filter((t) => t > windowStart);

        if (entry.timestamps.length >= maxRequests) {
            const retryAfter = Math.ceil(
                (entry.timestamps[0] + windowSeconds * 1000 - now) / 1000,
            );

            ctx.set("Retry-After", String(retryAfter));
            ctx.set("X-RateLimit-Limit", String(maxRequests));
            ctx.set("X-RateLimit-Remaining", "0");
            ctx.set("X-RateLimit-Reset", String(Math.ceil((entry.timestamps[0] + windowSeconds * 1000) / 1000)));

            ctx.status = 429;
            ctx.body = fail("请求过于频繁，请稍后再试", 429);

            logger.warn("Rate limit exceeded", {
                requestId: ctx.state.requestId as string | undefined,
                ip: ctx.ip,
                key,
            });

            return;
        }

        entry.timestamps.push(now);

        const remaining = maxRequests - entry.timestamps.length;
        ctx.set("X-RateLimit-Limit", String(maxRequests));
        ctx.set("X-RateLimit-Remaining", String(remaining));
        ctx.set("X-RateLimit-Reset", String(Math.ceil((entry.timestamps[0] + windowSeconds * 1000) / 1000)));

        await next();
    };
}

function defaultKeyGenerator(ctx: Context): string {
    return ctx.ip;
}

/**
 * 根据不同场景预设的限流配置。
 */
export const RateLimitPresets = {
    /** 全局默认：每分钟 120 个请求 */
    global: { maxRequests: 120, windowSeconds: 60 },

    /** 登录等认证接口：每分钟 10 个请求 */
    auth: { maxRequests: 10, windowSeconds: 60 },

    /** API 接口：每分钟 60 个请求 */
    api: { maxRequests: 60, windowSeconds: 60 },
} as const;