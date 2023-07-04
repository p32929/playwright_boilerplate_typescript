import { chromium, Page, firefox, BrowserType, BrowserContext, Browser } from "playwright";
import { Constants } from "./constants";
import { Utils } from "./utils";

type BrowserTypes = "chrome" | "firefox"

interface IBrowserOptions {
    mode: "sessioned" | "private",
    sessionPath: string,
    timeout: number,
    browser: BrowserTypes
}

const defaultValues: IBrowserOptions = {
    mode: "sessioned",
    sessionPath: `./data/sessions/`,
    timeout: 1000 * 60 * 5,
    browser: "firefox"
}

//
var sessionedcontext: BrowserContext = null
var sessionedPages: Page[] = []
var isCreatingSessionedContext = false
//
var privateBrowser: Browser = null
var privatecontext: BrowserContext = null
var privatePages: Page[] = []
var isCreatingPrivateContext = false

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
    }

    private getBrowser(): BrowserType<{}> {
        if (this.options.browser === 'chrome') {
            return chromium
        }
        else if (this.options.browser === 'firefox') {
            return firefox
        }
    }

    async getNewPage() {
        if (isCreatingSessionedContext || isCreatingPrivateContext) {
            await Utils.delay(5000)
        }

        if (this.options.mode == "sessioned") {
            if (sessionedcontext === null) {
                isCreatingSessionedContext = true
                this.context = sessionedcontext = await this.getBrowser().launchPersistentContext(
                    this.options.sessionPath, {
                    headless: Constants.IS_HEADLESS,
                    timeout: this.options.timeout
                })

                this.context.setDefaultNavigationTimeout(this.options.timeout)
                this.context.setDefaultTimeout(this.options.timeout)
                isCreatingSessionedContext = false
            }

            this.page = await sessionedcontext.newPage();
            sessionedPages.push(this.page)
            return this.page
        }
        else if (this.options.mode == "private") {
            if (privateBrowser === null || privatecontext === null) {
                isCreatingPrivateContext = true
                this.browser = privateBrowser = await this.getBrowser().launch({
                    headless: Constants.IS_HEADLESS,
                    timeout: this.options.timeout
                });
                this.context = privatecontext = await this.browser.newContext()

                this.context.setDefaultNavigationTimeout(this.options.timeout)
                this.context.setDefaultTimeout(this.options.timeout)
                isCreatingPrivateContext = false
            }

            this.page = await privatecontext.newPage();
            privatePages.push(this.page)
            return this.page
        }
    }

    private static async destroyPrivate() {
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
        console.log(`Chrome :: downloadFile :: url: ${url} :: fileLocation: ${filePath}`)

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
                console.log(`Chrome :: downloadFile :: e: ${e}`)
                resolve(false)
            }
        })
    }

    static async downloadFileByButtonClick(page: Page, buttonSelector: string, filePath: string): Promise<boolean> {
        console.log(`Chrome :: downloadFileByButtonClick :: buttonSelector: ${buttonSelector}`)
        return new Promise(async (resolve, reject) => {
            try {
                const downloadPromise = page.waitForEvent('download');
                await page.click(buttonSelector)
                const download = await downloadPromise;

                await download.saveAs(filePath);
                await page.waitForTimeout(Constants.defaultDownloadWaitMs)

                resolve(true)
            } catch (e) {
                console.log(`Chrome :: downloadFileByButtonClick :: e: ${e}`)
                resolve(false)
            }
        })
    }

    static async uploadFiles(page: Page, uploadButtonSelector: string, fileLocations: string | string[]) {
        console.log(`Chrome :: uploadFiles :: uploadButtonSelector: ${uploadButtonSelector} :: fileLocations: ${fileLocations}`)

        const [fileChooser] = await Promise.all([
            page.waitForEvent('filechooser'),
            page.click(uploadButtonSelector),
        ]);

        await fileChooser.setFiles(fileLocations)
        await page.waitForTimeout(Constants.defaultWaitMs * 3)
    }

    static async findAndClickByElementTagIfIncludes(page: Page, elementTag: string, includedText: string, waitModifier: number = 1) {
        console.log(`Chrome :: findAndClickByElementTagIfIncludes :: elementTag: ${elementTag} :: includedText: ${includedText}`)
        await page.evaluate((obj) => {
            try {

                var elems = document.getElementsByTagName(obj.elementTag)
                for (var i = 0; i < elems.length; i++) {
                    // @ts-ignore
                    if (elems[i].innerText.includes(obj.elementText)) {
                        // @ts-ignore
                        elems[i].click()

                        break
                    }
                }
            } catch (e) {
                console.log(`Chrome :: findAndClickByElementTagIfIncludes :: e: ${e}`)
            }

        }, { elementTag, elementText: includedText })
        await page.waitForTimeout(Constants.defaultWaitMs * waitModifier)
    }

    static async findAndClickByElementTag(page: Page, elementTag: string, elementText: string, waitModifier: number = 1) {
        console.log(`Chrome :: findAndClickByElementTag :: elementTag: ${elementTag} :: elementText: ${elementText}`)
        const clicked = await page.evaluate((obj) => {
            try {
                var elems = document.getElementsByTagName(obj.elementTag)
                for (var i = 0; i < elems.length; i++) {
                    // @ts-ignore
                    if (elems[i].innerText === obj.elementText) {
                        // @ts-ignore
                        elems[i].focus()
                        // @ts-ignore
                        elems[i].click()
                        return true
                    }
                }
            } catch (e) {
                console.log(`Chrome :: findAndClickByElementTagIfIncludes :: e: ${e}`)
                return false
            }

        }, { elementTag, elementText })
        await page.waitForTimeout(Constants.defaultWaitMs * waitModifier)
        return clicked
    }

    static async findAndClickByClassName(page: Page, className: string, elementText: string) {
        console.log(`Chrome :: findAndClickByElementTag :: className: ${className} :: elementText: ${elementText}`)
        await page.evaluate((obj) => {
            try {
                var elems = document.getElementsByClassName(obj.elementTag)
                for (var i = 0; i < elems.length; i++) {
                    // @ts-ignore
                    if (elems[i].innerText === obj.elementText) {
                        // @ts-ignore
                        elems[i].click()
                        break
                    }
                }
            } catch (e) {
                console.log(`Chrome :: findAndClickByClassName :: e: ${e}`)
            }

        }, { elementTag: className, elementText })
        await page.waitForTimeout(Constants.defaultWaitMs)
    }

    static async getCurrentHeightWidth(page: Page): Promise<{
        height: number;
        width: number;
    }> {
        console.log(`Chrome :: getCurrentHeightWidth :: `)
        const obj = await page.evaluate(() => {
            return {
                height: window.outerHeight,
                width: window.outerWidth,
            }
        })

        console.log(`Chrome :: getCurrentHeightWidth :: obj: ${JSON.stringify(obj)}`)
        return obj
    }

    static async copyTextToClipboard(page: Page, text: string) {
        console.log(`Chrome :: copyTextToClipboard :: text: ${text}`)
        await page.evaluate((text) => {
            navigator.clipboard.writeText(text)
        }, text)
        await page.waitForTimeout(Constants.defaultWaitMs)
    }

    static async mutePage(page: Page) {
        await page.evaluate(() => {
            // @ts-ignore
            Array.from(document.querySelectorAll('audio, video')).forEach(el => el.muted = true)
        })
    }
}
