export type AppEnv = "development" | "production";

export interface SwaggerConfig {
  enabled: boolean;
  title: string;
  version: string;
}

export interface DatabaseConfig {
  enabled: boolean;
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  logging: boolean;
}

export interface AppConfig {
  env: AppEnv;
  isDev: boolean;
  isProd: boolean;
  port: number;
  swagger: SwaggerConfig;
  database: DatabaseConfig;
}

const DEFAULT_PORT = 3000;

// 统一读取环境配置，优先使用环境变量，再回落到默认值。
export function loadConfig(): AppConfig {
  const env = resolveEnv(Deno.env.get("APP_ENV") || Deno.env.get("DENO_ENV"));
  const port = Number(Deno.env.get("PORT")) || DEFAULT_PORT;
  const swaggerEnabled = resolveBoolean(
    Deno.env.get("SWAGGER_ENABLED"),
    env === "development",
  );
  const databaseEnabled = resolveBoolean(
    Deno.env.get("DB_ENABLED"),
    env === "production",
  );

  return {
    env,
    isDev: env === "development",
    isProd: env === "production",
    port,
    swagger: {
      enabled: swaggerEnabled,
      title: Deno.env.get("SWAGGER_TITLE") || "Koa Project API",
      version: Deno.env.get("SWAGGER_VERSION") || "1.0.0",
    },
    database: {
      enabled: databaseEnabled,
      host: Deno.env.get("DB_HOST") || "127.0.0.1",
      port: Number(Deno.env.get("DB_PORT")) || 3306,
      name: Deno.env.get("DB_NAME") || "koa_project",
      user: Deno.env.get("DB_USER") || "root",
      password: Deno.env.get("DB_PASSWORD") || "",
      logging: resolveBoolean(
        Deno.env.get("DB_LOGGING"),
        env === "development",
      ),
    },
  };
}

function resolveEnv(env?: string | null): AppEnv {
  return env === "production" ? "production" : "development";
}

function resolveBoolean(value: string | undefined, fallback: boolean) {
  if (value === undefined) {
    return fallback;
  }

  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}
