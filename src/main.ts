import { Chrome } from "./others/Chrome";
import { Utils } from "./others/utils";

require('console-stamp')(console, '[HH:MM:ss.l]');
const main = async () => {
    console.log("Started")

    const chrome = new Chrome({browser: "firefox", mode: "sessioned"})
    const page = await chrome.getNewPage()
    await Chrome.gotoForce(page, `https://www.google.com/`)
    const body = await page.innerText('body')
    console.log(`main.ts :: main :: body -> `, body  )

    console.log(`ended`)
}

main()