/**
 * 扩展 Koa 类型声明，补齐项目中 ctx.state 的字段。
 */
import "koa";

declare module "koa" {
    interface DefaultState {
        auth?: {
            userId: number;
            username: string;
            role?: string;
        };
        requestId?: string;
    }
}