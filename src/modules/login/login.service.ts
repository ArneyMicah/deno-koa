import { logger } from "../../common/logger/logger.ts";
import type { LoginEntity } from "./entity/login.entity.ts";
import type { CreateLoginDto } from "./dto/create-login.dto.ts";
import type { UpdateLoginDto } from "./dto/update-login.dto.ts";

// Login 服务：放业务逻辑和数据访问，controller 不直接处理数据细节。
export class LoginService {
    // 临时内存数据，后续可以替换为数据库查询。
    private readonly items: LoginEntity[] = [];

    private nextId = 1;

    // 查询列表。
    public findAll(): LoginEntity[] {
        try {
            return this.items;
        } catch (err) {
            logger.error("LoginService.findAll failed", err);
            throw err;
        }
    }

    // 根据 ID 查询单个。
    public findById(id: number): LoginEntity | undefined {
        try {
            return this.items.find((item) => item.id === id);
        } catch (err) {
            logger.error("LoginService.findById failed", { id, error: err });
            throw err;
        }
    }

    // 创建。
    public create(dto: CreateLoginDto): LoginEntity {
        try {
            const newItem: LoginEntity = {
                id: this.nextId++,
                name: dto.name,
            };
            this.items.push(newItem);
            return newItem;
        } catch (err) {
            logger.error("LoginService.create failed", { dto, error: err });
            throw err;
        }
    }

    // 更新。
    public update(id: number, dto: UpdateLoginDto): LoginEntity | undefined {
        try {
            const item = this.items.find((i) => i.id === id);
            if (!item) return undefined;

            if (dto.name !== undefined) item.name = dto.name;

            return item;
        } catch (err) {
            logger.error("LoginService.update failed", { id, dto, error: err });
            throw err;
        }
    }

    // 删除。
    public delete(id: number): boolean {
        try {
            const index = this.items.findIndex((item) => item.id === id);
            if (index === -1) return false;

            this.items.splice(index, 1);
            return true;
        } catch (err) {
            logger.error("LoginService.delete failed", { id, error: err });
            throw err;
        }
    }
}
