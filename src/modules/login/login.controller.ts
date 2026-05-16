import { z } from "zod";
import type { Context } from "koa";
import { success, fail } from "../../common/utils/response.ts";
import { validate } from "../../common/utils/validate.ts";
import type { ControllerRoute } from "../../common/router/controller-loader.ts";
import { LoginService } from "./login.service.ts";

// --- Zod 校验 Schema ---

const CreateLoginSchema = z.object({
    name: z.string().min(1, "名称不能为空"),
});

const UpdateLoginSchema = z.object({
    name: z.string().min(1, "名称不能为空").optional(),
});

// Login 控制器：负责接收请求、调用 service，并组织 HTTP 响应。
export default class LoginController {
    // 路由前缀，最终接口地址会以 /login 开头。
    public static readonly prefix = "/login";

    // 当前 controller 的路由表。
    public static readonly routes: ControllerRoute<LoginController>[] = [
        {
            method: "get",
            path: "/",
            handler: "list",
            summary: "获取Login列表",
            tags: ["Login"],
            responses: {
                200: {
                    description: "Login列表",
                },
            },
        },
        {
            method: "get",
            path: "/:id",
            handler: "getById",
            summary: "根据 ID 获取Login",
            tags: ["Login"],
            responses: {
                200: {
                    description: "Login信息",
                },
                404: {
                    description: "Login不存在",
                },
            },
        },
        {
            method: "post",
            path: "/",
            handler: "create",
            summary: "创建Login",
            tags: ["Login"],
            requestBody: {
                type: "object",
                properties: {
                    name: { type: "string" },
                },
                required: ["name"],
            },
            responses: {
                201: {
                    description: "创建成功",
                },
            },
        },
        {
            method: "put",
            path: "/:id",
            handler: "update",
            summary: "更新Login",
            tags: ["Login"],
            requestBody: {
                type: "object",
                properties: {
                    name: { type: "string" },
                },
            },
            responses: {
                200: {
                    description: "更新成功",
                },
                404: {
                    description: "Login不存在",
                },
            },
        },
        {
            method: "delete",
            path: "/:id",
            handler: "delete",
            summary: "删除Login",
            tags: ["Login"],
            responses: {
                200: {
                    description: "删除成功",
                },
                404: {
                    description: "Login不存在",
                },
            },
        },
    ];

    // 这里先手动实例化 service，后续可以继续升级成依赖注入容器。
    private readonly service = new LoginService();

    // GET /login - 获取列表
    public list(ctx: Context) {
        ctx.body = success(this.service.findAll());
    }

    // GET /login/:id - 根据 ID 获取
    public getById(ctx: Context) {
        const id = parseInt(ctx.params.id, 10);
        const item = this.service.findById(id);

        if (!item) {
            ctx.status = 404;
            ctx.body = fail("Login不存在", 404);
            return;
        }

        ctx.body = success(item);
    }

    // POST /login - 创建
    public create(ctx: Context) {
        const body = validate(ctx, "body", CreateLoginSchema);
        if (!body) return; // validate 已写入 422 响应

        const item = this.service.create(body);
        ctx.status = 201;
        ctx.body = success(item, "创建成功");
    }

    // PUT /login/:id - 更新
    public update(ctx: Context) {
        const id = parseInt(ctx.params.id, 10);
        const body = validate(ctx, "body", UpdateLoginSchema);
        if (!body) return;

        const item = this.service.update(id, body);

        if (!item) {
            ctx.status = 404;
            ctx.body = fail("Login不存在", 404);
            return;
        }

        ctx.body = success(item, "更新成功");
    }

    // DELETE /login/:id - 删除
    public delete(ctx: Context) {
        const id = parseInt(ctx.params.id, 10);
        const deleted = this.service.delete(id);

        if (!deleted) {
            ctx.status = 404;
            ctx.body = fail("Login不存在", 404);
            return;
        }

        ctx.body = success(null, "删除成功");
    }
}