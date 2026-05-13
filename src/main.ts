import { BootStrap } from "./app.module.ts";
import { loadConfig } from "./config/app.config.ts";

async function bootstrap() {
    const config = loadConfig();
    const app = new BootStrap(config);

    await app.start();
}

await bootstrap();
