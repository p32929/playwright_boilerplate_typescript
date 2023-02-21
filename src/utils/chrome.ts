import { chromium, Page, Browser, BrowserContext } from 'playwright'
import { Constants } from './constants';

var privatePage: Page = null
var sessionedPage: Page = null

const timeout = 1000 * 60 * 10

export class Chrome {
    static async getPrivateChromePage(): Promise<Page> {
        console.log(`Chrome getPrivateChromePage`)
        if (privatePage == null) {
            console.log(`Chrome NULL`)
            const privateBrowser = await chromium.launch({
                headless: Constants.IS_HEADLESS,
                timeout: timeout
            });
            const context = await privateBrowser.newContext()

            context.setDefaultNavigationTimeout(timeout)
            context.setDefaultTimeout(timeout)
            
            privatePage = await context.newPage();
        }

        return privatePage
    }

    static async getChromePageSessioned(): Promise<Page> {
        console.log(`Chrome getChromePageSessioned`)
        if (sessionedPage == null) {
            console.log(`Chrome NULL`)
            const sessionedBrowserContext = await chromium.launchPersistentContext(`./data/sessions/`, {
                headless: Constants.IS_HEADLESS,
                timeout: timeout
            })

            sessionedBrowserContext.setDefaultNavigationTimeout(timeout)
            sessionedBrowserContext.setDefaultTimeout(timeout)

            sessionedPage = await sessionedBrowserContext.newPage();
        }
        return sessionedPage
    }

    static async downloadFile(page: Page, url: string, fileName: string, ext: string, folderName: string): Promise<boolean> {
        console.log(`Chrome downloadFile`)
        return new Promise(async (resolve, reject) => {
            // try {
            //     ext = ext.replace(".", "")
            //     page.evaluate((link) => {
            //         function download(url, filename) {
            //             fetch(url)
            //                 .then(response => response.blob())
            //                 .then(blob => {
            //                     const link = document.createElement("a");
            //                     link.href = URL.createObjectURL(blob);
            //                     link.download = filename;
            //                     link.click();
            //                 })
            //                 .catch(console.error);
            //         }

            //         console.log(`Downloading: ${link}`)
            //         download(link, "somefile.someext")
            //     }, url)

            //     const [download] = await Promise.all([
            //         page.waitForEvent('download', { timeout: Constants.defaultFileSaveWaitInMs }),
            //     ]);
            //     const saveAsStr = `${Constants.newsFolderPath}/${folderName}/${fileName}.${ext}`
            //     await download.saveAs(saveAsStr);
            //     await page.waitForTimeout(Constants.defaultWaitInMs)
            //     resolve(true)
            // } catch (e) {
            //     console.log(e) 
            //     resolve(false)
            // }

            resolve(true)
        })
    }
}