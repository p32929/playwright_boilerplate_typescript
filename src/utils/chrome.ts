import { chromium, Page, firefox, BrowserType, BrowserContext, Browser } from "playwright";
import { Constants } from "./constants";
import { Utils } from "./utils";

type BrowserTypes = "chrome" | "firefox"

interface IBrowserOptions {
    mode: "sessioned" | "private",
    sessionPath: string,
    timeout: number,
    browser: BrowserTypes,
    mute: boolean
}

const defaultValues: IBrowserOptions = {
    mode: "sessioned",
    sessionPath: `./data/sessions/`,
    timeout: 1000 * 60 * 5,
    browser: "firefox",
    mute: true
}

const FIVE_SECONDS = 5000
const TEN_SECONDS = 10000
//
var sessionedcontext: BrowserContext = null
var sessionedPages: Page[] = []
//
var privateBrowser: Browser = null
var privatecontext: BrowserContext = null
var privatePages: Page[] = []
//
const creationTimes: Date[] = []
let pageNumGlobal = 0
//
let prevPageNum = 0
let samePageNumTimes = 0

//
export class Chrome {
    private options: IBrowserOptions = defaultValues
    private page: Page = null
    private context: BrowserContext = null
    private browser: Browser = null

    constructor(options: Partial<IBrowserOptions> = defaultValues) {
        this.options = {
            ...defaultValues,
            ...options,
        }

        setInterval(() => {
            if (samePageNumTimes > 3) {
                pageNumGlobal = 0
                samePageNumTimes = 0
                prevPageNum = 0
            }

            if (pageNumGlobal === prevPageNum) {
                samePageNumTimes++
            }
            else {
                samePageNumTimes = 0
                prevPageNum = pageNumGlobal
            }
            
            console.log(`chrome.ts :: Chrome :: setInterval :: samePageNumTimes -> ${samePageNumTimes} , pageNumGlobal -> ${pageNumGlobal} , prevPageNum -> ${prevPageNum} `)

        }, 1000 * 20)
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
        const pageNumber = (++pageNumGlobal)
        console.log(`chrome.ts :: Chrome :: getNewPage :: pageNumber: ${pageNumber}`)
        await Utils.delay(pageNumber * 1000)

        if (creationTimes.length === 0) {
            creationTimes.push(new Date())
        }
        else {
            const prev = creationTimes[creationTimes.length - 1]
            const nextTime = new Date(prev.getTime() + TEN_SECONDS)
            creationTimes.push(nextTime)
            const currentTime = new Date()

            // @ts-ignore
            const diff = nextTime - currentTime
            // console.log(`chrome.ts :: Chrome :: getNewPage :: diff -> ${diff} `)

            if (diff > 0) {
                console.log(`chrome.ts :: Chrome :: getNewPage :: Delaying ${Math.floor(diff / 1000)}s for page ${pageNumber}`)
                await Utils.delay(diff)
            }
        }

        console.log(`chrome.ts :: Chrome :: getNewPage :: page ${pageNumber} Opening...`)
        if (this.options.mode == "sessioned") {
            if (sessionedcontext === null) {
                this.context = sessionedcontext = await this.getBrowser().launchPersistentContext(
                    this.options.sessionPath, {
                    headless: Constants.IS_HEADLESS,
                    timeout: this.options.timeout,
                })

                this.context.setDefaultNavigationTimeout(this.options.timeout)
                this.context.setDefaultTimeout(this.options.timeout)
            }

            this.page = await sessionedcontext.newPage();
            sessionedPages.push(this.page)
            return this.page
        }
        else if (this.options.mode == "private") {
            if (privateBrowser === null || privatecontext === null) {
                this.browser = privateBrowser = await this.getBrowser().launch({
                    headless: Constants.IS_HEADLESS,
                    timeout: this.options.timeout
                });
                this.context = privatecontext = await this.browser.newContext()

                this.context.setDefaultNavigationTimeout(this.options.timeout)
                this.context.setDefaultTimeout(this.options.timeout)
            }

            this.page = await privatecontext.newPage();
            privatePages.push(this.page)
            return this.page
        }
    }

    private static async destroyPrivate() {
        console.log(`chrome.ts :: Chrome :: destroyPrivate :: `)
        try {
            for (var i = 0; i < privatePages.length; i++) {
                await privatePages[i].close()
            }

            const contexts = privateBrowser.contexts()
            for (var i = 0; i < contexts.length; i++) {
                await contexts[i].close()
            }
            await privateBrowser.close()
        }
        catch (e) {
            //
        }
    }

    private static async destroySessioned() {
        console.log(`chrome.ts :: Chrome :: destroySessioned :: `)
        try {
            for (var i = 0; i < sessionedPages.length; i++) {
                await sessionedPages[i].close()
            }
            await sessionedcontext.close()
        }
        catch (e) {
            //
        }
    }

    static async destroy(dtype: "all" | "private" | "public" = "all") {
        console.log(`chrome.ts :: Chrome :: destroy :: dtype -> ${dtype} `)
        switch (dtype) {
            case "all":
                await this.destroyPrivate()
                await this.destroySessioned()
            case "private":
                await this.destroyPrivate()
            case "public":
                await this.destroySessioned()
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

    static async gotoUrlIfNeeded(page: Page, url: string) {
        const currentLocation = await page.evaluate(() => {
            return window.location.href
        })

        if (currentLocation !== url) {
            await this.gotoForce(page, url)
        }
        await page.waitForTimeout(Constants.defaultWaitMs)
    }

    static gotoForce = async (page: Page, url: string, retryCount: number = 5) => {
        if (retryCount < 0) {
            throw new Error(`Failed to navigate to ${url} after 3 retries.`);
        }
        await Promise.all([
            page.goto(url, {
                timeout: 120 * 1000,
                waitUntil: 'load',
            }),
            page.waitForResponse((response) => response.ok(), { timeout: 8000 }),
        ]).catch(() => {
            this.gotoForce(page, url, retryCount - 1);
        });
    };
}
