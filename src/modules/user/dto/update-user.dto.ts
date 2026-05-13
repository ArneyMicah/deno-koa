import type { CreateUserDto } from "./create-user.dto.ts";

// 更新用户时字段都可以选填。
export type UpdateUserDto = Partial<CreateUserDto>;
