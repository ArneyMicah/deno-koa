type LogLevel = "info" | "warn" | "error" | "debug";

const levelLabel: Record<LogLevel, string> = {
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
  debug: "DEBUG",
};

// 项目统一日志工具，先保持轻量，后续可以替换成 pino/winston。
export const logger = {
  info(message: string, meta?: unknown) {
    writeLog("info", message, meta);
  },

  warn(message: string, meta?: unknown) {
    writeLog("warn", message, meta);
  },

  error(message: string, meta?: unknown) {
    writeLog("error", message, meta);
  },

  debug(message: string, meta?: unknown) {
    writeLog("debug", message, meta);
  },
};

function writeLog(level: LogLevel, message: string, meta?: unknown) {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] [${levelLabel[level]}] ${message}`;

  if (level === "error") {
    console.error(line, meta ?? "");
    return;
  }

  console.log(line, meta ?? "");
}
