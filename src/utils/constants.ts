export class Constants {
    static SHOULD_CRASH_AFTER_URL_RETRY = true
    static dbPath = "./data/database.json"

    static defaultChromeTimeout = 1000 * 60 * 5
    static defaultMaxWaitMs = 1000 * 10
    static defaultMinWaitMs = 5 * 1000
    static defaultShortWait = 2000
    static defaultDownloadWaitMs = 1000 * 10
    static defaultButtonClickTimeout = 1000 * 15
    static defaultButtonClickDelay = 500
    static defaultUploadWaitMs = 1000 * 30

    static maxGotoRetries = 30
}