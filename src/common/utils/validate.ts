import { ZodSchema, ZodError } from "zod";
import type { Context } from "koa";
import { fail } from "./response.ts";

/**
 * DTO 校验工具：使用 Zod schema 校验请求体/查询参数/路径参数。
 *
 * 用法：
 *   const body = validate(ctx, "body", CreateUserSchema);
 *   const query = validate(ctx, "query", ListUserSchema);
 *
 * 校验失败时自动设置 422 状态码并返回错误详情。
 * 校验成功返回带类型的解析数据（strip 掉多余字段）。
 */
export type ValidateSource = "body" | "query" | "params";

export interface ValidationErrorDetail {
    field: string;
    message: string;
}

export interface ValidationError {
    success: false;
    message: string;
    code: number;
    data: {
        errors: ValidationErrorDetail[];
    };
}

/**
 * 校验请求数据，成功返回解析后的数据，失败返回 null 并自动设置 ctx 响应。
 */
export function validate<T>(
    ctx: Context,
    source: ValidateSource,
    schema: ZodSchema<T>,
): T | null {
    let raw: unknown;

    switch (source) {
        case "body":
            raw = ctx.request.body;
            break;
        case "query":
            raw = ctx.query;
            break;
        case "params":
            raw = ctx.params;
            break;
    }

    const result = schema.safeParse(raw);

    if (!result.success) {
        const zodError = result.error as ZodError;
        const errors: ValidationErrorDetail[] = zodError.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
        }));

        ctx.status = 422;
        ctx.body = fail("请求参数校验失败", 422, { errors });
        return null;
    }

    return result.data;
}

/**
 * 创建一个抛出异常的校验版本，由全局错误中间件统一捕获。
 * 适合于希望在 controller 中减少手动 null 判断的场景。
 */
export function validateOrThrow<T>(
    ctx: Context,
    source: ValidateSource,
    schema: ZodSchema<T>,
): T {
    let raw: unknown;

    switch (source) {
        case "body":
            raw = ctx.request.body;
            break;
        case "query":
            raw = ctx.query;
            break;
        case "params":
            raw = ctx.params;
            break;
    }

    const result = schema.safeParse(raw);

    if (!result.success) {
        const zodError = result.error as ZodError;
        const errors: ValidationErrorDetail[] = zodError.issues.map((issue) => ({
            field: issue.path.join("."),
            message: issue.message,
        }));

        const error = new Error("请求参数校验失败") as Error & {
            status: number;
            errors: ValidationErrorDetail[];
        };
        error.status = 422;
        error.errors = errors;
        throw error;
    }

    return result.data;
}