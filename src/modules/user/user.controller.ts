import type { Context } from "koa";
import { success, fail } from "../../common/utils/response.ts";
import type { ControllerRoute } from "../../common/router/controller-loader.ts";
import { UserService } from "./user.service.ts";
import type { CreateUserDto, UpdateUserDto } from "./entity/user.entity.ts";

// 用户控制器：负责接收请求、调用 service，并组织 HTTP 响应。
export default class UserController {
    // 路由前缀，最终接口地址会以 /users 开头。
    public static readonly prefix = "/users";

    // 当前 controller 的路由表，后续可替换成 @Get/@Post 这类装饰器收集。
    public static readonly routes: ControllerRoute<UserController>[] = [
        {
            method: "get",
            path: "/",
            handler: "listUsers",
            summary: "获取用户列表",
            tags: ["User"],
            responses: {
                200: {
                    description: "用户列表",
                },
            },
        },
        {
            method: "get",
            path: "/:id",
            handler: "getUserById",
            summary: "根据 ID 获取用户",
            tags: ["User"],
            responses: {
                200: {
                    description: "用户信息",
                },
                404: {
                    description: "用户不存在",
                },
            },
        },
        {
            method: "post",
            path: "/",
            handler: "createUser",
            summary: "创建用户",
            tags: ["User"],
            requestBody: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    email: { type: "string" },
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
            handler: "updateUser",
            summary: "更新用户",
            tags: ["User"],
            requestBody: {
                type: "object",
                properties: {
                    name: { type: "string" },
                    email: { type: "string" },
                },
            },
            responses: {
                200: {
                    description: "更新成功",
                },
                404: {
                    description: "用户不存在",
                },
            },
        },
        {
            method: "delete",
            path: "/:id",
            handler: "deleteUser",
            summary: "删除用户",
            tags: ["User"],
            responses: {
                200: {
                    description: "删除成功",
                },
                404: {
                    description: "用户不存在",
                },
            },
        },
    ];

    // 这里先手动实例化 service，后续可以继续升级成依赖注入容器。
    private readonly userService = new UserService();

    // GET /users - 获取用户列表
    public listUsers(ctx: Context) {
        ctx.body = success(this.userService.findAll());
    }

    // GET /users/:id - 根据 ID 获取用户
    public getUserById(ctx: Context) {
        const id = parseInt(ctx.params.id, 10);
        const user = this.userService.findById(id);

        if (!user) {
            ctx.status = 404;
            ctx.body = fail("用户不存在", 404);
            return;
        }

        ctx.body = success(user);
    }

    // POST /users - 创建用户
    public createUser(ctx: Context) {
        const body = ctx.request.body as unknown as CreateUserDto;

        if (!body.name) {
            ctx.status = 400;
            ctx.body = fail("用户名不能为空", 400);
            return;
        }

        const user = this.userService.create(body);
        ctx.status = 201;
        ctx.body = success(user, "创建成功");
    }

    // PUT /users/:id - 更新用户
    public updateUser(ctx: Context) {
        const id = parseInt(ctx.params.id, 10);
        const body = ctx.request.body as unknown as UpdateUserDto;

        const user = this.userService.update(id, body);

        if (!user) {
            ctx.status = 404;
            ctx.body = fail("用户不存在", 404);
            return;
        }

        ctx.body = success(user, "更新成功");
    }

    // DELETE /users/:id - 删除用户
    public deleteUser(ctx: Context) {
        const id = parseInt(ctx.params.id, 10);
        const deleted = this.userService.delete(id);

        if (!deleted) {
            ctx.status = 404;
            ctx.body = fail("用户不存在", 404);
            return;
        }

        ctx.body = success(null, "删除成功");
    }
}