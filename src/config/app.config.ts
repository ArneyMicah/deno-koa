import { validateEnv, type EnvVarDef } from "../common/utils/env-validator.ts";
import { logger } from "../common/logger/logger.ts";

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

export interface CorsConfig {
    origin: string | string[];
    allowMethods: string[];
    allowHeaders: string[];
    maxAge: number;
    credentials: boolean;
}

export interface JwtConfig {
    secret: string;
    expiresIn: string;
}

export interface AppConfig {
    env: AppEnv;
    isDev: boolean;
    isProd: boolean;
    port: number;
    cors: CorsConfig;
    swagger: SwaggerConfig;
    database: DatabaseConfig;
    jwt: JwtConfig;
}

const DEFAULT_PORT = 3000;

let cachedConfig: AppConfig | null = null;

/**
 * 统一读取环境配置，优先使用环境变量，再回落到默认值。
 * 使用单例模式缓存，避免多处调用时重复解析环境变量。
 */
export function loadConfig(): AppConfig {
    if (cachedConfig) return cachedConfig;

    cachedConfig = buildConfig();
    return cachedConfig;
}

/** 仅用于测试：清除缓存的配置。 */
export function clearConfigCache(): void {
    cachedConfig = null;
}

function buildConfig(): AppConfig {
    const env = resolveEnv(Deno.env.get("APP_ENV") || Deno.env.get("DENO_ENV"));

    // 启动时校验关键环境变量。
    const envDefs: EnvVarDef[] = [
        { key: "JWT_SECRET", label: "JWT 签名密钥", required: true, default: "dev-secret-change-me" },
    ];

    // 生产环境下对数据库密码做更严格检查。
    if (env === "production") {
        envDefs.push({ key: "DB_PASSWORD", label: "数据库密码", required: false });
    }

    const result = validateEnv(envDefs);
    if (!result.valid) {
        for (const err of result.errors) {
            logger.error(err);
        }
        // 生产环境下环境变量缺失视为致命错误。
        if (env === "production") {
            throw new Error(`环境变量校验失败:\n${result.errors.join("\n")}`);
        }
    }

    const port = Number(Deno.env.get("PORT")) || DEFAULT_PORT;
    const swaggerEnabled = resolveBoolean(Deno.env.get("SWAGGER_ENABLED"), env === "development");
    const databaseEnabled = resolveBoolean(Deno.env.get("DB_ENABLED"), env === "production");

    const corsOrigin = Deno.env.get("CORS_ORIGIN") || "*";

    const config: AppConfig = {
        env,
        isDev: env === "development",
        isProd: env === "production",
        port,
        cors: {
            origin: corsOrigin.includes(",")
                ? corsOrigin.split(",").map((s) => s.trim())
                : corsOrigin,
            allowMethods: (Deno.env.get("CORS_METHODS") || "GET,POST,PUT,PATCH,DELETE,OPTIONS")
                .split(",")
                .map((s) => s.trim()),
            allowHeaders: (Deno.env.get("CORS_HEADERS") ||
                "Content-Type,Authorization,X-Requested-With").split(",").map((s) => s.trim()),
            maxAge: Number(Deno.env.get("CORS_MAX_AGE")) || 86400,
            credentials: resolveBoolean(Deno.env.get("CORS_CREDENTIALS"), true),
        },
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
            logging: resolveBoolean(Deno.env.get("DB_LOGGING"), env === "development"),
        },
        jwt: {
            secret: Deno.env.get("JWT_SECRET") || "dev-secret-change-me",
            expiresIn: Deno.env.get("JWT_EXPIRES_IN") || "7d",
        },
    };

    logger.info(`Config loaded: env=${config.env} port=${config.port} db=${config.database.enabled} swagger=${config.swagger.enabled}`);
    return config;
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