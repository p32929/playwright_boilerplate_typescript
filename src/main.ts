import { Chrome } from "./utils/chrome";

require('console-stamp')(console, '[HH:MM:ss.l]');
const main = async () => {
    console.log("Started")

    Chrome.waitForTimeout(null)
}

main()