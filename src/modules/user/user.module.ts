import UserController from "./user.controller.ts";
import { UserService } from "./user.service.ts";

// 模块定义：集中声明当前模块包含的 controller 和 provider。
export default {
    controllers: [UserController],
    providers: [UserService],
};
