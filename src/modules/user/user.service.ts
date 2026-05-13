import type { UserEntity, CreateUserDto, UpdateUserDto } from "./entity/user.entity.ts";

// 用户服务：放业务逻辑和数据访问，controller 不直接处理数据细节。
export class UserService {
    // 临时内存数据，后续可以替换为数据库查询。
    private readonly users: UserEntity[] = [
        {
            id: 1,
            name: "Alice",
            email: "alice@example.com",
        },
    ];

    private nextId = 2;

    // 查询用户列表。
    public findAll(): UserEntity[] {
        return this.users;
    }

    // 根据 ID 查询单个用户。
    public findById(id: number): UserEntity | undefined {
        return this.users.find((user) => user.id === id);
    }

    // 创建用户。
    public create(dto: CreateUserDto): UserEntity {
        const newUser: UserEntity = {
            id: this.nextId++,
            name: dto.name,
            email: dto.email,
        };
        this.users.push(newUser);
        return newUser;
    }

    // 更新用户。
    public update(id: number, dto: UpdateUserDto): UserEntity | undefined {
        const user = this.users.find((u) => u.id === id);
        if (!user) return undefined;

        if (dto.name !== undefined) user.name = dto.name;
        if (dto.email !== undefined) user.email = dto.email;

        return user;
    }

    // 删除用户。
    public delete(id: number): boolean {
        const index = this.users.findIndex((user) => user.id === id);
        if (index === -1) return false;

        this.users.splice(index, 1);
        return true;
    }
}