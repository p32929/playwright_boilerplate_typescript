import { Chrome } from "./utils/chrome";
import { Constants } from "./utils/constants";
import { Question } from "./utils/question";
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

    const chr = new Chrome({
        browser: "firefox",
        mode: "sessioned",
    })
    const page = await chr.getNewPage()
    await page.goto(`https://www.youtube.com/`)
    await page.waitForTimeout(Constants.defaultWaitMs)
    // await page.close()
    
    await Question.ask("???")
    await chr.destroy()

    console.log(`Done`)
}

main()