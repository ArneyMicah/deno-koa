import type { CreateLoginDto } from "./create-login.dto.ts";

// 更新Login时所有字段都可选填。
export type UpdateLoginDto = Partial<CreateLoginDto>;
