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
        return this.items;
    }

    // 根据 ID 查询单个。
    public findById(id: number): LoginEntity | undefined {
        return this.items.find((item) => item.id === id);
    }

    // 创建。
    public create(dto: CreateLoginDto): LoginEntity {
        const newItem: LoginEntity = {
            id: this.nextId++,
            name: dto.name,
        };
        this.items.push(newItem);
        return newItem;
    }

    // 更新。
    public update(id: number, dto: UpdateLoginDto): LoginEntity | undefined {
        const item = this.items.find((i) => i.id === id);
        if (!item) return undefined;

        if (dto.name !== undefined) item.name = dto.name;
        return item;
    }

    // 删除。
    public delete(id: number): boolean {
        const index = this.items.findIndex((item) => item.id === id);
        if (index === -1) return false;

        this.items.splice(index, 1);
        return true;
    }
}
