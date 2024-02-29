import { Page, BrowserType, BrowserContext, chromium, firefox } from "playwright";
import { Constants } from "./constants";

type BrowserTypes = "chrome" | "firefox"
interface IBrowserOptions {
    mode: "sessioned" | "private",
    sessionPath: string,
    timeout: number,
    browser: BrowserTypes,
    headless: boolean,

    /*
    In order to mute browser completely, use this:
    https://addons.mozilla.org/en-US/firefox/addon/mute-sites-by-default/
    https://chrome.google.com/webstore/detail/clever-mute/eadinjjkfelcokdlmoechclnmmmjnpdh
    */
}

const defaultValues: IBrowserOptions = {
    mode: "sessioned",
    sessionPath: `./data/sessions/`,
    timeout: Constants.defaultChromeTimeout,
    browser: "firefox",
    headless: false,
}

let openingUrl = ""
let originalViewport = null

const getRandomInt = (min: number = 0, max: number = Number.MAX_VALUE) => {
    const int = Math.floor(Math.random() * (max - min + 1) + min)
    return int
}

const delay = (ms) => new Promise((res) => setTimeout(res, ms));

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
            await delay(Constants.defaultShortWait)
        }
        console.log(`chrome.ts :: Chrome :: getNewPage :: this.isInitting -> ${this.isInitting} `)

        if (this.isInitting === false && this.context === null) {
            this.isInitting = true

            if (this.options.mode == "sessioned") {
                this.context = await this.getBrowser().launchPersistentContext(
                    this.options.sessionPath, {
                    headless: this.options.headless,
                    timeout: this.options.timeout,
                    ignoreHTTPSErrors: true,
                })

                this.context.setDefaultNavigationTimeout(this.options.timeout)
                this.context.setDefaultTimeout(this.options.timeout)
            }
            else if (this.options.mode == "private") {
                const browser = await this.getBrowser().launch({
                    headless: this.options.headless,
                    timeout: this.options.timeout,
                });
                this.context = await browser.newContext({
                    ignoreHTTPSErrors: true,
                })

                this.context.setDefaultNavigationTimeout(this.options.timeout)
                this.context.setDefaultTimeout(this.options.timeout)
            }

            await this.context.addInitScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
            this.isInitting = false
        }

        console.log(`chrome.ts :: Chrome :: getNewPage-1 :: this.tryingToOpenPages -> ${this.tryingToOpenPages} , this.openedPages -> ${this.openedPages} `)
        while (this.tryingToOpenPages !== this.openedPages) {
            await delay(Constants.defaultShortWait)
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
        return new Promise(async (resolve) => {
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
                await Chrome.waitForTimeout(page)
                resolve(true)
            } catch (e) {

                resolve(false)
            }
        })
    }

    static async downloadFileByButtonClick(page: Page, buttonSelector: string, filePath: string): Promise<boolean> {
        console.log(`chrome.ts :: Chrome :: downloadFileByButtonClick :: buttonSelector -> ${buttonSelector} , filePath -> ${filePath} `)
        return new Promise(async (resolve) => {
            try {
                const downloadPromise = page.waitForEvent('download');
                await page.click(buttonSelector)
                const download = await downloadPromise;

                await download.saveAs(filePath);
                await Chrome.waitForTimeout(page, {
                    maxTimeout: Constants.defaultDownloadWaitMs,
                })

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
            await Chrome.waitForTimeout(page),
            page.click(uploadButtonSelector),
        ]);

        await fileChooser.setFiles(fileLocations)
        await Chrome.waitForTimeout(page, {
            maxTimeout: Constants.defaultUploadWaitMs,
        })
    }

    static async uploadFilesForced(page: Page, uploadButtonSelector: string, fileLocations: string | string[]) {
        console.log(`chrome.ts :: Chrome :: uploadFiles :: uploadButtonSelector -> ${uploadButtonSelector} , fileLocations -> ${fileLocations} `)
        const [fileChooser] = await Promise.all([
            page.waitForEvent('filechooser'),
            Chrome.waitForTimeout(page),
            page.click(uploadButtonSelector),
        ]);

        // await fileChooser.setFiles(fileLocations)
        for (var i = 0; i < fileLocations.length; i++) {
            await fileChooser.setFiles(fileLocations[i])
            // await page.waitForTimeout(500)
            await Chrome.waitForTimeout(page)
        }
        await Chrome.waitForTimeout(page, {
            maxTimeout: Constants.defaultUploadWaitMs,
        })
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
        await Chrome.waitForTimeout(page)
    }

    static async gotoForce(page: Page, url: string) {
        const retryCount = Constants.maxGotoRetries
        try {
            const currentLocation = await page.evaluate(() => {
                return window.location.href
            })

            if (currentLocation === url) {
                await Chrome.waitForTimeout(page)
                return
            }

            const tryUrl = async (): Promise<boolean> => {
                try {
                    await page.goto(url, {
                        timeout: 90 * 1000,
                        waitUntil: 'load',
                    })
                    await Chrome.waitForTimeout(page)
                    return true
                }
                catch (e) {
                    console.log(`chrome.ts :: Chrome :: tryUrl :: e -> ${e} `)
                    return false
                }
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
                    console.log(`chrome.ts :: Chrome :: gotoForce= :: Retrying... :: url -> ${url} , opened -> ${opened} , i -> ${i} `)
                    await Chrome.waitForTimeout(page)
                }
            }

            console.log(`chrome.ts :: Chrome :: gotoForce= :: url -> ${url} , openingUrl -> ${openingUrl} :: Success...`)
            openingUrl = ""
        }
        catch (e) {
            console.log(`chrome.ts :: Chrome :: gotoForce= :: e -> ${e} `)
            console.log(`chrome.ts :: Chrome :: gotoForce= :: url -> ${url} , openingUrl -> ${openingUrl} :: Failed...`)

            openingUrl = ""
        }
    };

    static async scrollDown(page: Page, nTimes: number = 10, wait: number = Constants.defaultMaxWaitMs) {
        console.log(`chrome.ts :: Chrome :: scrollDown :: nTimes -> ${nTimes} , wait -> ${wait} `)
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
        console.log(`chrome.ts :: Chrome :: getCurrentPageUrl :: currentLocation :: ${currentLocation}`)
        return currentLocation
    }

    static async setIphoneViewport(page: Page) {
        console.log(`chrome.ts :: Chrome :: setIphoneViewport :: `)
        originalViewport = page.viewportSize()
        await page.setViewportSize({
            width: 390,
            height: 844,
        })

        await page.reload()
        await page.waitForTimeout(Constants.defaultMaxWaitMs * 3)
    }

    static async resetViewport(page: Page) {
        try {
            await page.setViewportSize(originalViewport)
        }
        catch (e) {
            //
        }

        await page.reload()
        await page.waitForTimeout(Constants.defaultMaxWaitMs * 3)
    }

    static async tryClick(page: Page, selector: string, options: {
        forceClick: boolean,
    }) {
        console.log(`chrome.ts :: Chrome :: tryClick :: selector -> ${selector} , forceClick -> ${options?.forceClick} `)

        try {
            const element = await page.$(selector)
            await element.click({
                timeout: Constants.defaultButtonClickTimeout,
                delay: Constants.defaultButtonClickDelay,
                trial: true
            })
            await Chrome.waitForTimeout(page)

            await element.click({
                timeout: Constants.defaultButtonClickTimeout,
                delay: Constants.defaultButtonClickDelay,
                force: options?.forceClick,
            })
            await Chrome.waitForTimeout(page)

            console.log(`chrome.ts :: Chrome :: tryClick :: Success`)
            return true
        }
        catch (e) {
            console.log(`chrome.ts :: Chrome :: tryClick :: Failed`, e)
            return false
        }
    }

    static async waitForTimeout(page: Page, options?: {
        minTimeout?: number,
        maxTimeout?: number,
    }) {
        const min = options?.minTimeout ?? Constants.defaultMinWaitMs
        const max = options?.maxTimeout ?? Constants.defaultMaxWaitMs
        const timeoutt = getRandomInt(min, max)
        console.log(`chrome.ts :: Chrome :: waitForTimeout :: timeoutt -> ${timeoutt} `)
        await page.waitForTimeout(timeoutt)
    }
}
