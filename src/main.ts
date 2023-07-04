import { chromeTest } from "./dummy/chrome_test";
import { Database } from "./utils/database";

require('console-stamp')(console, '[HH:MM:ss.l]');
const main = async () => {
    console.log("Started")
    // Database.init()

    await chromeTest()
    console.log(`Done`)
}

main()