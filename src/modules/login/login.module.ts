import LoginController from "./login.controller.ts";
import { LoginService } from "./login.service.ts";

// 模块定义：集中声明当前模块包含的 controller 和 provider。
export default {
    controllers: [LoginController],
    providers: [LoginService],
};
