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
      paths[path][route.method] = {
        tags: route.tags,
        summary: route.summary,
        description: route.description,
        requestBody: route.requestBody,
        responses: route.responses || {
          200: { description: "Success" },
        },
      };
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
