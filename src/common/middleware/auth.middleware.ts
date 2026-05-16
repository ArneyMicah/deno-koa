import type { Context, Next } from "koa";
import { jwtVerify } from "jose";
import { logger } from "../logger/logger.ts";
import { fail } from "../utils/response.ts";

/**
 * JWT Payload 映射：对应认证后附加到 ctx.state 的内容。
 */
export interface AuthUser {
    userId: number;
    username: string;
    role?: string;
}

/**
 * JWT 认证中间件。
 *
 * 从 Authorization: Bearer <token> 头中提取 JWT 并验证。
 * 认证成功后，用户信息挂载到 ctx.state.auth。
 * 认证失败返回 401 Unauthorized。
 */
export default function authMiddleware(options: { secret: string }) {
    const secret = new TextEncoder().encode(options.secret);

    return async (ctx: Context, next: Next) => {
        const authHeader = ctx.get("Authorization");

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            ctx.status = 401;
            ctx.body = fail("未提供认证令牌", 401);
            return;
        }

        const token = authHeader.slice(7);

        if (!token) {
            ctx.status = 401;
            ctx.body = fail("认证令牌为空", 401);
            return;
        }

        try {
            const result = await jwtVerify(token, secret, {
                algorithms: ["HS256", "HS384", "HS512"],
            });
            const payload = result.payload;

            // 校验必需字段。
            if (!payload.sub || !payload.username) {
                ctx.status = 401;
                ctx.body = fail("认证令牌格式无效", 401);
                return;
            }

            const auth: AuthUser = {
                userId: Number(payload.sub),
                username: payload.username as string,
                role: payload.role as string | undefined,
            };

            ctx.state.auth = auth;

            logger.debug("JWT authenticated", {
                requestId: ctx.state.requestId as string | undefined,
                userId: auth.userId,
            });

            await next();
        } catch (err) {
            logger.warn("JWT verification failed", {
                requestId: ctx.state.requestId as string | undefined,
                error: err,
            });

            ctx.status = 401;
            ctx.body = fail("认证失败", 401);
        }
    };
}

/**
 * 可选的认证中间件：如果提供了有效令牌则解析用户，否则当作匿名用户继续处理。
 * 适用于需要同时支持登录和匿名访问的接口。
 */
export function optionalAuthMiddleware(options: { secret: string }) {
    const secret = new TextEncoder().encode(options.secret);

    return async (ctx: Context, next: Next) => {
        const authHeader = ctx.get("Authorization");

        if (authHeader?.startsWith("Bearer ")) {
            const token = authHeader.slice(7);

            if (token) {
                try {
                    const result = await jwtVerify(token, secret, {
                        algorithms: ["HS256", "HS384", "HS512"],
                    });
                    const payload = result.payload;

                    if (payload.sub && payload.username) {
                        ctx.state.auth = {
                            userId: Number(payload.sub),
                            username: payload.username as string,
                            role: payload.role as string | undefined,
                        };
                    }
                } catch {
                    // token 无效时当作未登录，静默忽略。
                }
            }
        }

        await next();
    };
}