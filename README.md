# deno-koa

一个基于 Deno + Koa 的后端项目模板，采用接近 NestJS
的模块组织方式，支持自动路由注册、Swagger 文档、环境配置、统一日志，以及
mysql2 + Sequelize 数据库连接。

## 技术栈

- Deno
- Koa
- @koa/router
- Swagger / OpenAPI
- Sequelize
- mysql2

## 项目结构

```text
src/
  app.module.ts
  main.ts
  common/
    logger/
    middleware/
    router/
    swagger/
    utils/
  config/
    app.config.ts
  database/
    sequelize.ts
  modules/
    user/
      user.module.ts
      user.controller.ts
      user.service.ts
      entity/
        user.entity.ts
```

## 快速生成 CRUD 模块

项目内置了类似 NestJS `nest g resource` 的代码生成器，可以一键生成完整的 CRUD 模块。

### 使用方式

```bash
# 通过 deno task（推荐）
deno run generate <模块名>

# 或直接运行脚本
deno run -A cli/generate.ts <模块名>
```

### 示例

```bash
deno run generate article
```

执行后自动生成以下文件：

```text
src/modules/article/
├── entity/
│   └── article.entity.ts    # 实体 + CreateDto + UpdateDto
├── article.service.ts       # CRUD 服务
├── article.controller.ts    # RESTful 控制器
└── article.module.ts        # 模块声明
```

### 生成的 API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/{模块名}` | 获取列表 |
| GET | `/{模块名}/:id` | 获取详情 |
| POST | `/{模块名}` | 创建 |
| PUT | `/{模块名}/:id` | 更新 |
| DELETE | `/{模块名}/:id` | 删除 |

### 生成器特性

- ✅ 自动校验模块名格式（仅允许英文字母）
- ✅ 自动检测模块是否已存在，避免覆盖
- ✅ 遵循项目现有代码风格和目录结构
- ✅ 包含完整的参数校验和错误处理
- ✅ 自动生成 Swagger 路由元数据

## 启动项目

复制环境变量示例：

```powershell
Copy-Item .env.example .env.development
Copy-Item .env.example .env.production
```

开发环境：

```powershell
deno task dev
```

生产环境：

```powershell
deno task start
```

默认服务地址：

```text
http://localhost:3000
```

## Swagger

开发环境默认开启 Swagger：

```text
http://localhost:3000/docs
```

OpenAPI JSON：

```text
http://localhost:3000/docs/openapi.json
```

生产环境默认关闭 Swagger，可以通过环境变量开启：

```env
SWAGGER_ENABLED=true
```

## 数据库配置

项目已接入 `mysql2` 和 `sequelize`。默认开发环境不连接数据库，避免本地没有 MySQL
时启动失败。

```env
DB_ENABLED=false
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=koa_project
DB_USER=root
DB_PASSWORD=
DB_LOGGING=true
```

需要连接 MySQL 时，将 `DB_ENABLED` 改为：

```env
DB_ENABLED=true
```

## 路由与 Swagger 元数据

Controller 使用静态 `routes` 描述路由和 Swagger 信息：

```ts
public static readonly routes = [
  {
    method: "get",
    path: "/",
    handler: "listUsers",
    summary: "获取用户列表",
    tags: ["User"],
    responses: {
      200: {
        description: "用户列表",
      },
    },
  },
];
```

框架会自动扫描：

```text
src/modules/**/*.controller.ts
```

并完成 Koa 路由注册和 OpenAPI 文档生成。

## 构建与打包

项目支持通过 `deno compile` 将应用编译为独立的可执行文件（无需 Deno 运行时）。

### 本地编译

```powershell
# 编译当前平台（输出到 dist/ 目录）
deno task build

# 指定目标平台
deno task build:win      # Windows
deno task build:linux    # Linux
deno task build:macos    # macOS

# 清理编译产物
deno task clean
```

编译产物在 `dist/` 目录下，可直接运行：

```powershell
# Windows
.\dist\server.exe

# Linux / macOS
./dist/server
```

### Docker 部署

```powershell
# 构建镜像
docker build -t deno-koa .

# 运行容器
docker run -p 3000:3000 --env-file .env.production deno-koa
```

## 常用命令

```powershell
deno task dev           # 启动开发服务器（热重载）
deno task start         # 启动生产服务器
deno task build         # 编译为独立可执行文件
deno run generate       # 生成 CRUD 模块
deno task fmt           # 格式化代码
deno task lint          # 代码检查
deno task check         # 类型检查
deno task cache         # 缓存依赖
deno task clean         # 清理编译产物
