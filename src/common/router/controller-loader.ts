import { join, relative, toFileUrl } from "@std/path";

export type HttpMethod = "get" | "post" | "put" | "patch" | "delete";
export type RouteHandler<T> = keyof T & string;

export interface SwaggerResponse {
    description: string;
    content?: Record<string, unknown>;
}

/**
 * OpenAPI 参数定义（query / path / header / cookie）。
 */
export interface SwaggerParameter {
    name: string;
    in: "query" | "path" | "header" | "cookie";
    required?: boolean;
    description?: string;
    schema?: Record<string, unknown>;
}

// Controller 暴露的路由元数据，同时用于 Koa 路由注册和 Swagger 文档生成。
export interface ControllerRoute<T = Record<string, unknown>> {
    method: HttpMethod;
    path: string;
    handler: RouteHandler<T>;
    summary?: string;
    description?: string;
    tags?: string[];
    parameters?: SwaggerParameter[];
    requestBody?: Record<string, unknown>;
    responses?: Record<number, SwaggerResponse>;
}

export interface ControllerConstructor<T = Record<string, unknown>> {
    new(): T;
    prefix?: string;
    routes?: ControllerRoute<T>[];
}

export interface LoadedController<T = Record<string, unknown>> {
    Controller: ControllerConstructor<T>;
    controllerFile: string;
}

// 扫描 src/modules/**/*.controller.ts，读取默认导出的 controller。
export async function loadControllers() {
    const modulesDir = join(Deno.cwd(), "src", "modules");
    const controllerFiles = await findControllerFiles(modulesDir);
    const controllers: LoadedController[] = [];

    for (const controllerFile of controllerFiles) {
        // Deno 动态导入本地文件时需要 file:// URL。
        const moduleUrl = toFileUrl(controllerFile).href;
        const module = await import(moduleUrl);
        const Controller = module.default as ControllerConstructor | undefined;

        if (Controller?.routes?.length) {
            controllers.push({ Controller, controllerFile });
        }
    }

    return controllers;
}

// 递归查找模块目录下所有 controller 文件。
async function findControllerFiles(dir: string): Promise<string[]> {
    const files: string[] = [];

    for await (const entry of Deno.readDir(dir)) {
        const fullPath = join(dir, entry.name);
        if (entry.isDirectory) {
            files.push(...await findControllerFiles(fullPath));
            continue;
        }

        if (entry.isFile && entry.name.endsWith(".controller.ts")) {
            files.push(fullPath);
        }
    }

    return files.sort((a, b) => relative(dir, a).localeCompare(relative(dir, b)));
}