import { loadControllers } from "../router/controller-loader.ts";
import { combinePaths } from "../router/path.ts";

export interface OpenApiOptions {
    title?: string;
    version?: string;
    description?: string;
}

// 根据 controller routes 元数据生成 OpenAPI JSON。
export async function createOpenApiDocument(options: OpenApiOptions = {}) {
    const controllers = await loadControllers();
    const paths: Record<string, Record<string, unknown>> = {};

    for (const { Controller } of controllers) {
        const prefix = Controller.prefix || "";

        for (const route of Controller.routes || []) {
            const path = combinePaths(prefix, route.path);
            paths[path] ??= {};
            const operation: Record<string, unknown> = {
                tags: route.tags,
                summary: route.summary,
                description: route.description,
                responses: route.responses || {
                    200: { description: "Success" },
                },
            };

            // 输出请求参数（query / path / header / cookie）。
            if (route.parameters?.length) {
                operation.parameters = route.parameters.map((p) => ({
                    name: p.name,
                    in: p.in,
                    required: p.required ?? false,
                    description: p.description,
                    schema: p.schema || { type: "string" },
                }));
            }

            // 将 requestBody 包装成 OpenAPI 3.0 规范的 content 格式。
            if (route.requestBody) {
                operation.requestBody = {
                    content: {
                        "application/json": {
                            schema: route.requestBody,
                        },
                    },
                };
            }

            paths[path][route.method] = operation;
        }
    }

    return {
        openapi: "3.0.3",
        info: {
            title: options.title || "Koa Project API",
            version: options.version || "1.0.0",
            description: options.description,
        },
        paths,
    };
}