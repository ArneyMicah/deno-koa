import { getSequelize } from "../../database/sequelize.ts";
import { logger } from "../../common/logger/logger.ts";

export interface HealthStatus {
    status: "ok" | "degraded";
    uptime: number;
    timestamp: string;
    checks: {
        database: "connected" | "disconnected";
        memory: {
            rss: string;
            heapTotal: string;
            heapUsed: string;
            percent: string;
        };
    };
}

/**
 * 健康检查服务：汇总数据库、内存等关键组件运行状态。
 */
export class HealthService {
    private readonly startTime = Date.now();

    /**
     * 获取综合健康状态。
     */
    public async check(): Promise<HealthStatus> {
        const checks = await this.runChecks();

        const allOk = checks.database === "connected";

        return {
            status: allOk ? "ok" : "degraded",
            uptime: Math.floor((Date.now() - this.startTime) / 1000),
            timestamp: new Date().toISOString(),
            checks,
        };
    }

    private async runChecks() {
        const database = await this.checkDatabase();
        const memory = this.checkMemory();

        return { database, memory };
    }

    private async checkDatabase(): Promise<"connected" | "disconnected"> {
        try {
            const sequelize = getSequelize();
            await sequelize.authenticate();
            return "connected";
        } catch {
            logger.warn("Health check: database not connected");
            return "disconnected";
        }
    }

    private checkMemory() {
        const denoMemory = Deno.memoryUsage();
        const rssMB = (denoMemory.rss / 1024 / 1024).toFixed(1);
        const heapTotalMB = (denoMemory.heapTotal / 1024 / 1024).toFixed(1);
        const heapUsedMB = (denoMemory.heapUsed / 1024 / 1024).toFixed(1);
        const percent = denoMemory.heapTotal > 0
            ? ((denoMemory.heapUsed / denoMemory.heapTotal) * 100).toFixed(1)
            : "0";

        return {
            rss: `${rssMB} MB`,
            heapTotal: `${heapTotalMB} MB`,
            heapUsed: `${heapUsedMB} MB`,
            percent: `${percent}%`,
        };
    }
}