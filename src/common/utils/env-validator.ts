/**
 * 环境变量启动校验工具：在应用启动阶段检查必需的环境变量是否存在。
 * 防止服务启动后因缺少关键配置而 crash。
 */

export interface EnvVarDef {
    /** 环境变量名 */
    key: string;
    /** 报错信息 */
    label: string;
    /** 默认值（可选），设置了默认值则不要求必填 */
    default?: string;
    /** 是否必填（默认不填就不要求） */
    required?: boolean;
    /** 允许的值列表 */
    allowed?: string[];
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
}

/**
 * 校验多个环境变量，返回所有错误信息。
 * 调用方根据 valid 字段决定是否终止启动。
 */
export function validateEnv(defs: EnvVarDef[]): ValidationResult {
    const errors: string[] = [];

    for (const def of defs) {
        const val = Deno.env.get(def.key);

        // 有默认值或非必填且未设置 → 跳过
        if ((val === undefined || val === "") && (def.default !== undefined || !def.required)) {
            continue;
        }

        // 必填但未设置
        if ((val === undefined || val === "") && def.required) {
            errors.push(`缺少必需的环境变量: ${def.key} (${def.label})`);
            continue;
        }

        // 允许值校验
        if (def.allowed && val && !def.allowed.includes(val)) {
            errors.push(
                `环境变量 ${def.key} 的值 "${val}" 无效，允许的值: ${def.allowed.join(", ")}`,
            );
        }
    }

    return {
        valid: errors.length === 0,
        errors,
    };
}

/**
 * 获取环境变量，带默认值。
 */
export function getEnv(key: string, defaultValue: string): string {
    return Deno.env.get(key) || defaultValue;
}

/**
 * 获取布尔型环境变量。
 * "true", "1", "yes" → true; 其他 → false。
 */
export function getEnvBool(key: string, defaultValue = false): boolean {
    const val = Deno.env.get(key);
    if (val === undefined) return defaultValue;
    return ["true", "1", "yes"].includes(val.toLowerCase());
}