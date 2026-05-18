import { loadControllers } from "../router/controller-loader.ts";
import { combinePaths } from "../router/path.ts";

export interface OpenApiOptions {
    title?: string;
    version?: string;
    description?: string;
}

// 从路由路径中提取 :paramName 模式的参数名列表。
function extractPathParams(path: string): string[] {
    const re = /:(\w+)/g;
    const params: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = re.exec(path)) !== null) {
        params.push(match[1]);
    }
    return params;
}

// 根据 controller routes 元数据生成 OpenAPI JSON。
export async function createOpenApiDocument(options: OpenApiOptions = {}) {
    const controllers = await loadControllers();
    const paths: Record<string, Record<string, unknown>> = {};
    const tagSet = new Set<string>();

    for (const { Controller } of controllers) {
        const prefix = Controller.prefix || "";

        for (const route of Controller.routes || []) {
            const path = combinePaths(prefix, route.path);
            paths[path] ??= {};

            // 收集 tags
            if (route.tags?.length) {
                for (const t of route.tags) tagSet.add(t);
            }

            const operation: Record<string, unknown> = {
                tags: route.tags,
                summary: route.summary,
                description: route.description,
                responses: route.responses || {
                    "200": { description: "Success" },
                },
            };

            // 自动从路径模式中生成 path 参数定义（包含 prefix 中的参数）
            const autoPathParams = extractPathParams(path);
            const explicitParams = route.parameters ?? [];
            const explicitParamNames = new Set(explicitParams.map((p) => p.name));

            const mergedParams = [
                // 用户显式定义的参数（优先级最高，保持不变）
                ...explicitParams.map((p) => ({
                    name: p.name,
                    in: p.in,
                    required: p.required ?? false,
                    description: p.description,
                    schema: p.schema || { type: "string" },
                })),
                // 自动补全 :paramName 路径参数（如果未被显式定义）
                ...autoPathParams
                    .filter((name) => !explicitParamNames.has(name))
                    .map((name) => ({
                        name,
                        in: "path" as const,
                        required: true,
                        description: name,
                        schema: { type: "string" },
                    })),
            ];

            if (mergedParams.length) {
                operation.parameters = mergedParams;
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

    // 生成顶层 tags 数组
    const tags = [...tagSet].map((name) => ({ name }));

    return {
        openapi: "3.0.3",
        info: {
            title: options.title || "Koa Project API",
            version: options.version || "1.0.0",
            description: options.description,
        },
        tags: tags.length ? tags : undefined,
        paths,
    };
}
