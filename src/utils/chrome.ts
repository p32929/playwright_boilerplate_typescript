import { chromium, Page, firefox, BrowserType, BrowserContext } from "playwright";
import { Constants } from "./constants";
import { Utils } from "./utils";

type BrowserTypes = "chrome" | "firefox"

interface IBrowserOptions {
    mode: "sessioned" | "private",
    sessionPath: string,
    timeout: number,
    browser: BrowserTypes,
    /*
    In order to mute browser completely, use this:
    https://addons.mozilla.org/en-US/firefox/addon/mute-sites-by-default/
    https://chrome.google.com/webstore/detail/clever-mute/eadinjjkfelcokdlmoechclnmmmjnpdh
    */
}

const defaultValues: IBrowserOptions = {
    mode: "sessioned",
    sessionPath: `./data/sessions/`,
    timeout: 1000 * 60 * 5,
    browser: "firefox",
}

let openingUrl = ""

//
export class Chrome {
    private options: IBrowserOptions = defaultValues
    private page: Page = null
    private context: BrowserContext = null
    private isInitting = false
    private openedPages: number = 0
    private tryingToOpenPages: number = 0

    constructor(options: Partial<IBrowserOptions> = defaultValues) {
        this.options = {
            ...defaultValues,
            ...options,
        }
    }

    private getBrowser(): BrowserType<{}> {
        console.log(`chrome.ts :: Chrome :: getBrowser :: `)
        if (this.options.browser === 'chrome') {
            return chromium
        }
        else if (this.options.browser === 'firefox') {
            return firefox
        }
    }

    async getNewPage() {
        console.log(`chrome.ts :: Chrome :: getNewPage :: this.openedPages -> ${this.openedPages} , this.context.pages().length -> ${this?.context?.pages().length} `)

        while (this.isInitting) {
            console.log(`chrome.ts :: Chrome :: getNewPage :: this.isInitting -> ${this.isInitting} `)
            await Utils.delay(2000)
        }
        console.log(`chrome.ts :: Chrome :: getNewPage :: this.isInitting -> ${this.isInitting} `)

        if (this.isInitting === false && this.context === null) {
            this.isInitting = true

            if (this.options.mode == "sessioned") {
                this.context = await this.getBrowser().launchPersistentContext(
                    this.options.sessionPath, {
                    headless: Constants.IS_HEADLESS,
                    timeout: this.options.timeout,
                    args: ["--mute-audio"]
                })

                this.context.setDefaultNavigationTimeout(this.options.timeout)
                this.context.setDefaultTimeout(this.options.timeout)
            }
            else if (this.options.mode == "private") {
                const browser = await this.getBrowser().launch({
                    headless: Constants.IS_HEADLESS,
                    timeout: this.options.timeout,
                    args: ["--mute-audio"]
                });
                this.context = await browser.newContext()

                this.context.setDefaultNavigationTimeout(this.options.timeout)
                this.context.setDefaultTimeout(this.options.timeout)
            }

            this.isInitting = false
        }

        console.log(`chrome.ts :: Chrome :: getNewPage-1 :: this.tryingToOpenPages -> ${this.tryingToOpenPages} , this.openedPages -> ${this.openedPages} `)
        while (this.tryingToOpenPages !== this.openedPages) {
            await Utils.delay(2000)
            console.log(`chrome.ts :: Chrome :: getNewPage-1 :: this.tryingToOpenPages -> ${this.tryingToOpenPages} , this.openedPages -> ${this.openedPages} `)
        }

        this.tryingToOpenPages++
        this.page = await this.context.newPage();
        this.openedPages++

        return this.page
    }

    async destroy() {
        try {
            const pages = this.context.pages()
            for (var i = 0; i < pages.length; i++) {
                await pages[i].close()
            }
            await this.context.close()
        }
        catch (e) {
            //
        }
    }

    // #############################
    // #############################
    // #############################

    static async downloadFile(page: Page, url: string, filePath: string, waitTimeout: number = Constants.defaultDownloadWaitMs): Promise<boolean> {
        console.log(`chrome.ts :: Chrome :: downloadFile :: url -> ${url} , filePath -> ${filePath} `)
        return new Promise(async (resolve, reject) => {
            try {
                page.evaluate((link) => {
                    function download(url, filename) {
                        fetch(url)
                            .then(response => response.blob())
                            .then(blob => {
                                const link = document.createElement("a");
                                link.href = URL.createObjectURL(blob);
                                link.download = filename;
                                link.click();
                            })
                            .catch(console.error);
                    }

                    download(link, "somefile.someext")
                }, url)

                const [download] = await Promise.all([
                    page.waitForEvent('download', { timeout: waitTimeout }),
                ]);

                await download.saveAs(filePath)
                await page.waitForTimeout(Constants.defaultWaitMs)
                resolve(true)
            } catch (e) {

                resolve(false)
            }
        })
    }

    static async downloadFileByButtonClick(page: Page, buttonSelector: string, filePath: string): Promise<boolean> {
        console.log(`chrome.ts :: Chrome :: downloadFileByButtonClick :: buttonSelector -> ${buttonSelector} , filePath -> ${filePath} `)
        return new Promise(async (resolve, reject) => {
            try {
                const downloadPromise = page.waitForEvent('download');
                await page.click(buttonSelector)
                const download = await downloadPromise;

                await download.saveAs(filePath);
                await page.waitForTimeout(Constants.defaultDownloadWaitMs)

                resolve(true)
            } catch (e) {

                resolve(false)
            }
        })
    }

    static async uploadFiles(page: Page, uploadButtonSelector: string, fileLocations: string | string[]) {
        console.log(`chrome.ts :: Chrome :: uploadFiles :: uploadButtonSelector -> ${uploadButtonSelector} , fileLocations -> ${fileLocations} `)
        const [fileChooser] = await Promise.all([
            page.waitForEvent('filechooser'),
            await page.waitForTimeout(Constants.defaultWaitMs),
            page.click(uploadButtonSelector),
        ]);

        await fileChooser.setFiles(fileLocations)
        await page.waitForTimeout(Constants.defaultWaitMs * 3)
    }

    static async uploadFilesForced(page: Page, uploadButtonSelector: string, fileLocations: string | string[]) {
        console.log(`chrome.ts :: Chrome :: uploadFiles :: uploadButtonSelector -> ${uploadButtonSelector} , fileLocations -> ${fileLocations} `)
        const [fileChooser] = await Promise.all([
            page.waitForEvent('filechooser'),
            await page.waitForTimeout(Constants.defaultWaitMs),
            page.click(uploadButtonSelector),
        ]);

        // await fileChooser.setFiles(fileLocations)
        for (var i = 0; i < fileLocations.length; i++) {
            await fileChooser.setFiles(fileLocations[i])
            await page.waitForTimeout(500)
        }
        await page.waitForTimeout(Constants.defaultWaitMs * 3)
    }

    static async findAndClickByElementTagIfIncludes(page: Page, elementTag: string, includedText: string) {
        console.log(`chrome.ts :: Chrome :: findAndClickByElementTagIfIncludes :: elementTag -> ${elementTag} , includedText -> ${includedText} `)
        await page.evaluate((obj) => {
            try {

                var elems = document.getElementsByTagName(obj.elementTag)
                for (var i = 0; i < elems.length; i++) {
                    // @ts-ignore
                    if (elems[i].innerText.toLowerCase().includes(obj.elementText.toLowerCase())) {
                        // @ts-ignore
                        elems[i]?.focus()
                        // @ts-ignore
                        elems[i]?.click()
                        break
                    }
                }
            } catch (e) {

            }

        }, { elementTag, elementText: includedText })
        await page.waitForTimeout(Constants.defaultWaitMs)
    }

    static async findAndClickByElementTag(page: Page, elementTag: string, elementText: string) {
        console.log(`chrome.ts :: Chrome :: findAndClickByElementTag :: elementTag -> ${elementTag} , elementText -> ${elementText} `)
        const clicked = await page.evaluate((obj) => {
            try {
                var elems = document.getElementsByTagName(obj.elementTag)
                for (var i = 0; i < elems.length; i++) {
                    // @ts-ignore
                    if (elems[i].innerText.toLowerCase() === obj.elementText.toLowerCase()) {
                        // @ts-ignore
                        elems[i]?.focus()
                        // @ts-ignore
                        elems[i]?.click()
                        return true
                    }
                }
            } catch (e) {

                return false
            }

        }, { elementTag, elementText })
        await page.waitForTimeout(Constants.defaultWaitMs)
        return clicked
    }

    static async findAndClickByClassName(page: Page, className: string, elementText: string) {
        console.log(`chrome.ts :: Chrome :: findAndClickByClassName :: className -> ${className} , elementText -> ${elementText} `)
        await page.evaluate((obj) => {
            try {
                var elems = document.getElementsByClassName(obj.elementTag)
                for (var i = 0; i < elems.length; i++) {
                    // @ts-ignore
                    if (elems[i].innerText.toLowerCase() === obj.elementText.toLowerCase()) {
                        // @ts-ignore
                        elems[i]?.focus()
                        // @ts-ignore
                        elems[i]?.click()
                        break
                    }
                }
            } catch (e) {

            }

        }, { elementTag: className, elementText })
        await page.waitForTimeout(Constants.defaultWaitMs)
    }

    static async getCurrentHeightWidth(page: Page): Promise<{
        height: number;
        width: number;
    }> {
        console.log(`chrome.ts :: Chrome :: getCurrentHeightWidth :: `)
        const obj = await page.evaluate(() => {
            return {
                height: window.outerHeight,
                width: window.outerWidth,
            }
        })
        return obj
    }

    static async copyTextToClipboard(page: Page, text: string) {
        console.log(`chrome.ts :: Chrome :: copyTextToClipboard :: text -> ${text} `)
        await page.evaluate((text) => {
            navigator.clipboard.writeText(text)
        }, text)
        await page.waitForTimeout(Constants.defaultWaitMs)
    }

    static async gotoForce(page: Page, url: string, retryCount: number = 20) {
        try {
            const currentLocation = await page.evaluate(() => {
                return window.location.href
            })

            if (currentLocation === url) {
                await page.waitForTimeout(Constants.defaultWaitMs)
                return
            }

            while (openingUrl !== "") {
                console.log(`chrome.ts :: Chrome :: gotoForce= :: url -> ${url} , openingUrl -> ${openingUrl} :: Delaying...`)
                await Utils.delay(2500)
            }

            const tryUrl = (): Promise<boolean> => {
                return new Promise((resolve) => {
                    Promise.all([
                        page.goto(url, {
                            timeout: 120 * 1000,
                            waitUntil: 'load',
                        }),
                        page.waitForResponse((response) => response.ok(), { timeout: 8000 }),
                    ])
                        .then(() => {
                            resolve(true)
                        })
                        .catch(async () => {
                            resolve(false)
                        })

                })
            }

            openingUrl = url
            for (var i = 0; i < retryCount; i++) {
                const opened = await tryUrl()
                console.log(`chrome.ts :: Chrome :: gotoForce= :: url -> ${url} , opened -> ${opened} , i -> ${i} `)

                if (opened) {
                    openingUrl = ""
                    break
                }
                else {
                    // await page.waitForTimeout(Constants.defaultWaitMs)
                    console.log(`chrome.ts :: Chrome :: gotoForce= :: Retrying... :: url -> ${url} , opened -> ${opened} , i -> ${i} `)
                    await Utils.delay(2500)
                }
            }
        }
        catch (e) {
            console.log(`chrome.ts :: Chrome :: gotoForce= :: e -> ${e} `)
            openingUrl = ""
        }
    };

    static async scrollDown(page: Page, nTimes: number = 10, wait: number = Constants.defaultWaitMs) {
        for (var i = 0; i < nTimes; i++) {
            await page.evaluate(() => {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
            })
            await page.waitForTimeout(wait)
        }
    }

    static async getCurrentPageUrl(page: Page) {
        const currentLocation = await page.evaluate(() => {
            return window.location.href
        })
        return currentLocation
    }
}
