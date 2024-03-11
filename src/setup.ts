import { Utils } from "./others/utils";

require('console-stamp')(console, '[HH:MM:ss.l]');
const main = async () => {
    console.log("Started")
    await Utils.saveChromeCode()
    console.log(`ended`)
}

main()