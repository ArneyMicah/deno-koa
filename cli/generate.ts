#!/usr/bin/env -S deno run --allow-read --allow-write
/**
 * CRUD 模块生成器
 *
 * 用法:
 *   deno run -A cli/generate.ts <模块名>
 *
 * 示例:
 *   deno run -A cli/generate.ts post
 *   deno run -A cli/generate.ts article
 *
 * 这会在 src/modules/<模块名>/ 下生成:
 *   - entity/<模块名>.entity.ts    (实体，只放服务端内部结构)
 *   - dto/create-<模块名>.dto.ts   (创建请求参数)
 *   - dto/update-<模块名>.dto.ts   (更新请求参数)
 *   - <模块名>.service.ts          (CRUD 服务)
 *   - <模块名>.controller.ts       (RESTful 控制器，含 Zod 校验)
 *   - <模块名>.module.ts           (模块声明)
 */

const moduleName = Deno.args[0]?.toLowerCase().trim();

if (!moduleName) {
    console.error("❌ 请指定模块名，例如: deno run -A cli/generate.ts post");
    Deno.exit(1);
}

// 校验模块名格式（只允许字母）
if (!/^[a-zA-Z]+$/.test(moduleName)) {
    console.error("❌ 模块名只能包含英文字母");
    Deno.exit(1);
}

// 首字母大写（PascalCase）
const pascalName = moduleName.charAt(0).toUpperCase() + moduleName.slice(1);

// 目标目录
const moduleDir = `src/modules/${moduleName}`;
const entityDir = `${moduleDir}/entity`;
const dtoDir = `${moduleDir}/dto`;

// 检查模块是否已存在
try {
    const stat = await Deno.stat(moduleDir);
    if (stat.isDirectory) {
        console.error(`❌ 模块 "${moduleName}" 已存在: ${moduleDir}`);
        Deno.exit(1);
    }
} catch {
    // 目录不存在，可以创建
}

// ===== 模板内容 =====

const entityTemplate = `// ${pascalName} 实体：描述系统内部使用的完整${pascalName}数据结构（含服务端字段如 id）。
export interface ${pascalName}Entity {
  id: number;
  name: string;
}
`;

const createDtoTemplate = `// 创建${pascalName}时客户端允许提交的数据结构。
export interface Create${pascalName}Dto {
  name: string;
}
`;

const updateDtoTemplate = `import type { Create${pascalName}Dto } from "./create-${moduleName}.dto.ts";

// 更新${pascalName}时所有字段都可选填。
export type Update${pascalName}Dto = Partial<Create${pascalName}Dto>;
`;

const serviceTemplate = `import { logger } from "../../common/logger/logger.ts";
import type { ${pascalName}Entity } from "./entity/${moduleName}.entity.ts";
import type { Create${pascalName}Dto } from "./dto/create-${moduleName}.dto.ts";
import type { Update${pascalName}Dto } from "./dto/update-${moduleName}.dto.ts";

// ${pascalName} 服务：放业务逻辑和数据访问，controller 不直接处理数据细节。
export class ${pascalName}Service {
    // 临时内存数据，后续可以替换为数据库查询。
    private readonly items: ${pascalName}Entity[] = [];

    private nextId = 1;

    // 查询列表。
    public findAll(): ${pascalName}Entity[] {
        try {
            return this.items;
        } catch (err) {
            logger.error("${pascalName}Service.findAll failed", err);
            throw err;
        }
    }

    // 根据 ID 查询单个。
    public findById(id: number): ${pascalName}Entity | undefined {
        try {
            return this.items.find((item) => item.id === id);
        } catch (err) {
            logger.error("${pascalName}Service.findById failed", { id, error: err });
            throw err;
        }
    }

    // 创建。
    public create(dto: Create${pascalName}Dto): ${pascalName}Entity {
        try {
            const newItem: ${pascalName}Entity = {
                id: this.nextId++,
                name: dto.name,
            };
            this.items.push(newItem);
            return newItem;
        } catch (err) {
            logger.error("${pascalName}Service.create failed", { dto, error: err });
            throw err;
        }
    }

    // 更新。
    public update(id: number, dto: Update${pascalName}Dto): ${pascalName}Entity | undefined {
        try {
            const item = this.items.find((i) => i.id === id);
            if (!item) return undefined;

            if (dto.name !== undefined) item.name = dto.name;

            return item;
        } catch (err) {
            logger.error("${pascalName}Service.update failed", { id, dto, error: err });
            throw err;
        }
    }

    // 删除。
    public delete(id: number): boolean {
        try {
            const index = this.items.findIndex((item) => item.id === id);
            if (index === -1) return false;

            this.items.splice(index, 1);
            return true;
        } catch (err) {
            logger.error("${pascalName}Service.delete failed", { id, error: err });
            throw err;
        }
    }
}
`;

const controllerTemplate = `import { z } from "zod";
import type { Context } from "koa";
import { success, fail } from "../../common/utils/response.ts";
import { validate } from "../../common/utils/validate.ts";
import type { ControllerRoute } from "../../common/router/controller-loader.ts";
import { ${pascalName}Service } from "./${moduleName}.service.ts";

// --- Zod 校验 Schema ---

const Create${pascalName}Schema = z.object({
    name: z.string().min(1, "名称不能为空"),
});

const Update${pascalName}Schema = z.object({
    name: z.string().min(1, "名称不能为空").optional(),
});

// ${pascalName} 控制器：负责接收请求、调用 service，并组织 HTTP 响应。
export default class ${pascalName}Controller {
    // 路由前缀，最终接口地址会以 /${moduleName} 开头。
    public static readonly prefix = "/${moduleName}";

    // 当前 controller 的路由表。
    public static readonly routes: ControllerRoute<${pascalName}Controller>[] = [
        {
            method: "get",
            path: "/",
            handler: "list",
            summary: "获取${pascalName}列表",
            tags: ["${pascalName}"],
            responses: {
                "200": {
                    description: "${pascalName}列表",
                },
            },
        },
        {
            method: "get",
            path: "/:id",
            handler: "getById",
            summary: "根据 ID 获取${pascalName}",
            tags: ["${pascalName}"],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    description: "${pascalName} ID",
                    schema: { type: "integer" },
                },
            ],
            responses: {
                "200": {
                    description: "${pascalName}信息",
                },
                "404": {
                    description: "${pascalName}不存在",
                },
            },
        },
        {
            method: "post",
            path: "/",
            handler: "create",
            summary: "创建${pascalName}",
            tags: ["${pascalName}"],
            requestBody: {
                type: "object",
                properties: {
                    name: { type: "string" },
                },
                required: ["name"],
            },
            responses: {
                "201": {
                    description: "创建成功",
                },
            },
        },
        {
            method: "put",
            path: "/:id",
            handler: "update",
            summary: "更新${pascalName}",
            tags: ["${pascalName}"],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    description: "${pascalName} ID",
                    schema: { type: "integer" },
                },
            ],
            requestBody: {
                type: "object",
                properties: {
                    name: { type: "string" },
                },
            },
            responses: {
                "200": {
                    description: "更新成功",
                },
                "404": {
                    description: "${pascalName}不存在",
                },
            },
        },
        {
            method: "delete",
            path: "/:id",
            handler: "delete",
            summary: "删除${pascalName}",
            tags: ["${pascalName}"],
            parameters: [
                {
                    name: "id",
                    in: "path",
                    required: true,
                    description: "${pascalName} ID",
                    schema: { type: "integer" },
                },
            ],
            responses: {
                "200": {
                    description: "删除成功",
                },
                "404": {
                    description: "${pascalName}不存在",
                },
            },
        },
    ];

    // 这里先手动实例化 service，后续可以继续升级成依赖注入容器。
    private readonly service = new ${pascalName}Service();

    // GET /${moduleName} - 获取列表
    public list(ctx: Context) {
        ctx.body = success(this.service.findAll());
    }

    // GET /${moduleName}/:id - 根据 ID 获取
    public getById(ctx: Context) {
        const id = parseInt(ctx.params.id, 10);
        const item = this.service.findById(id);

        if (!item) {
            ctx.status = 404;
            ctx.body = fail("${pascalName}不存在", 404);
            return;
        }

        ctx.body = success(item);
    }

    // POST /${moduleName} - 创建
    public create(ctx: Context) {
        const body = validate(ctx, "body", Create${pascalName}Schema);
        if (!body) return; // validate 已写入 422 响应

        const item = this.service.create(body);
        ctx.status = 201;
        ctx.body = success(item, "创建成功");
    }

    // PUT /${moduleName}/:id - 更新
    public update(ctx: Context) {
        const id = parseInt(ctx.params.id, 10);
        const body = validate(ctx, "body", Update${pascalName}Schema);
        if (!body) return;

        const item = this.service.update(id, body);

        if (!item) {
            ctx.status = 404;
            ctx.body = fail("${pascalName}不存在", 404);
            return;
        }

        ctx.body = success(item, "更新成功");
    }

    // DELETE /${moduleName}/:id - 删除
    public delete(ctx: Context) {
        const id = parseInt(ctx.params.id, 10);
        const deleted = this.service.delete(id);

        if (!deleted) {
            ctx.status = 404;
            ctx.body = fail("${pascalName}不存在", 404);
            return;
        }

        ctx.body = success(null, "删除成功");
    }
}
`;

const moduleTemplate = `import ${pascalName}Controller from "./${moduleName}.controller.ts";
import { ${pascalName}Service } from "./${moduleName}.service.ts";

// 模块定义：集中声明当前模块包含的 controller 和 provider。
export default {
    controllers: [${pascalName}Controller],
    providers: [${pascalName}Service],
};
`;

// ===== 写入文件 =====

try {
    // 创建目录
    await Deno.mkdir(entityDir, { recursive: true });
    await Deno.mkdir(dtoDir, { recursive: true });

    // 写入 entity 文件
    await Deno.writeTextFile(`${entityDir}/${moduleName}.entity.ts`, entityTemplate);
    console.log(`  ✅ 创建: ${entityDir}/${moduleName}.entity.ts`);

    // 写入 dto 文件
    await Deno.writeTextFile(`${dtoDir}/create-${moduleName}.dto.ts`, createDtoTemplate);
    console.log(`  ✅ 创建: ${dtoDir}/create-${moduleName}.dto.ts`);

    await Deno.writeTextFile(`${dtoDir}/update-${moduleName}.dto.ts`, updateDtoTemplate);
    console.log(`  ✅ 创建: ${dtoDir}/update-${moduleName}.dto.ts`);

    // 写入 service / controller / module 文件
    await Deno.writeTextFile(`${moduleDir}/${moduleName}.service.ts`, serviceTemplate);
    console.log(`  ✅ 创建: ${moduleDir}/${moduleName}.service.ts`);

    await Deno.writeTextFile(`${moduleDir}/${moduleName}.controller.ts`, controllerTemplate);
    console.log(`  ✅ 创建: ${moduleDir}/${moduleName}.controller.ts`);

    await Deno.writeTextFile(`${moduleDir}/${moduleName}.module.ts`, moduleTemplate);
    console.log(`  ✅ 创建: ${moduleDir}/${moduleName}.module.ts`);

    console.log(`\n🎉 模块 "${moduleName}" 创建成功！`);
    console.log(`\n📁 生成结构:`);
    console.log(`  src/modules/${moduleName}/`);
    console.log(`  ├── dto/`);
    console.log(`  │   ├── create-${moduleName}.dto.ts`);
    console.log(`  │   └── update-${moduleName}.dto.ts`);
    console.log(`  ├── entity/`);
    console.log(`  │   └── ${moduleName}.entity.ts`);
    console.log(`  ├── ${moduleName}.service.ts`);
    console.log(`  ├── ${moduleName}.controller.ts`);
    console.log(`  └── ${moduleName}.module.ts`);
    console.log(`\n📋 API 接口:`);
    console.log(`  GET    /${moduleName}        - 获取列表`);
    console.log(`  GET    /${moduleName}/:id     - 获取详情`);
    console.log(`  POST   /${moduleName}        - 创建`);
    console.log(`  PUT    /${moduleName}/:id     - 更新`);
    console.log(`  DELETE /${moduleName}/:id     - 删除`);
} catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`❌ 创建模块失败:`, message);
    Deno.exit(1);
}