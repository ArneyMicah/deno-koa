type LogLevel = "info" | "warn" | "error" | "debug";

const levelLabel: Record<LogLevel, string> = {
    info: "INFO",
    warn: "WARN",
    error: "ERROR",
    debug: "DEBUG",
};

interface LogMeta {
    requestId?: string;
    [key: string]: unknown;
}

// 项目统一日志工具。
export const logger = {
    info(message: string, meta?: LogMeta) {
        writeLog("info", message, meta);
    },

    warn(message: string, meta?: LogMeta) {
        writeLog("warn", message, meta);
    },

    error(message: string, meta?: unknown) {
        writeLog("error", message, meta);
    },

    debug(message: string, meta?: LogMeta) {
        writeLog("debug", message, meta);
    },

    // 创建带 requestId 的子 logger。
    forRequest(requestId: string) {
        return {
            info: (message: string, meta?: Record<string, unknown>) =>
                logger.info(message, { ...meta, requestId }),
            warn: (message: string, meta?: Record<string, unknown>) =>
                logger.warn(message, { ...meta, requestId }),
            error: (message: string, meta?: Record<string, unknown>) =>
                logger.error(message, { ...meta, requestId }),
            debug: (message: string, meta?: Record<string, unknown>) =>
                logger.debug(message, { ...meta, requestId }),
        };
    },
};

function writeLog(level: LogLevel, message: string, meta?: unknown) {
    const timestamp = new Date().toISOString();
    const requestId = (meta as LogMeta)?.requestId;
    const prefix = requestId ? `[${requestId}]` : "";
    const line = `[${timestamp}] [${levelLabel[level]}]${prefix} ${message}`;

    if (level === "error") {
        console.error(line, meta ?? "");
        return;
    }

    console.log(line, meta ?? "");
}