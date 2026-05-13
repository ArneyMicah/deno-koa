import { Sequelize } from "sequelize";
import * as mysql2 from "mysql2";
import { logger } from "../common/logger/logger.ts";

interface DatabaseOptions {
  enabled: boolean;
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
  logging: boolean;
}

let sequelize: Sequelize | null = null;

// 创建 Sequelize 实例，显式指定 mysql2 作为 MySQL 驱动。
export function createSequelize(config: DatabaseOptions) {
  if (sequelize) {
    return sequelize;
  }

  sequelize = new Sequelize(
    config.name,
    config.user,
    config.password,
    {
      host: config.host,
      port: config.port,
      dialect: "mysql",
      dialectModule: mysql2,
      logging: config.logging ? (message) => logger.debug(message) : false,
      timezone: "+08:00",
    },
  );

  return sequelize;
}

// 启动时检查数据库连接，连接失败时抛出错误，避免服务带病启动。
export async function initializeDatabase(config: DatabaseOptions) {
  if (!config.enabled) {
    logger.warn("Database connection skipped because DB_ENABLED=false");
    return null;
  }

  const connection = createSequelize(config);
  await connection.authenticate();
  logger.info(
    `Database connected: mysql://${config.host}:${config.port}/${config.name}`,
  );

  return connection;
}

export function getSequelize() {
  if (!sequelize) {
    throw new Error("Sequelize has not been initialized");
  }

  return sequelize;
}
