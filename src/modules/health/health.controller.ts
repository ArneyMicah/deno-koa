import type { Context } from "koa";
import type { ControllerRoute } from "../../common/router/controller-loader.ts";
import { HealthService } from "./health.service.ts";
import { success } from "../../common/utils/response.ts";

/**
 * 健康检查控制器：提供 /healthz 和 /readyz 端点。
 *
 * 不需要鉴权，供负载均衡器和容器编排系统（K8s/K3s）探测。
 */
export default class HealthController {
    public static readonly prefix = "/healthz";

    public static readonly routes: ControllerRoute<HealthController>[] = [
        {
            method: "get",
            path: "/",
            handler: "getHealth",
            summary: "活性检查",
            description: "返回服务总体健康状态（liveness probe）",
            tags: ["Health"],
            responses: {
                200: { description: "服务正常" },
            },
        },
        {
            method: "get",
            path: "/ready",
            handler: "getReadiness",
            summary: "就绪检查",
            description: "返回服务就绪状态，包含数据库连接（readiness probe）",
            tags: ["Health"],
            responses: {
                200: { description: "服务就绪" },
                503: { description: "服务未就绪" },
            },
        },
    ];

    private readonly service = new HealthService();

    /**
     * GET /healthz - 活性检查，返回 200 表示进程存活。
     */
    public getHealth(ctx: Context) {
        ctx.body = success({ status: "ok" });
    }

    /**
     * GET /healthz/ready - 就绪检查，包含数据库连通性验证。
     */
    public async getReadiness(ctx: Context) {
        const status = await this.service.check();

        if (status.status === "degraded") {
            ctx.status = 503;
        }

        ctx.body = status;
    }
}