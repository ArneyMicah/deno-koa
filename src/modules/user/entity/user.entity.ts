// 用户实体：描述系统内部使用的用户数据结构。
export interface UserEntity {
  id: number;
  name: string;
  email?: string;
}

// 创建用户时的请求参数
export interface CreateUserDto {
  name: string;
  email?: string;
}

// 更新用户时的请求参数
export interface UpdateUserDto {
  name?: string;
  email?: string;
}