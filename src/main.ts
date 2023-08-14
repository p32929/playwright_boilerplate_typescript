import { Database } from "./utils/database";
import { Utils } from "./utils/utils";

require('console-stamp')(console, '[HH:MM:ss.l]');
const main = async () => {
    console.log("Started")

    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const item = Utils.getValueAtIndex(arr, -1)
    console.log(`main.ts :: main :: item -> ${item} `)

    const ff = Utils.getFileListFromFolder(`./node_modules`, {
        // includePath: false,
        // shuffle: true,
    })
    console.log(`main.ts :: main :: ff -> ${ff} `)

    console.log(`Done`)
}

main()