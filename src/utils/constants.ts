export class Constants {
    static IS_HEADLESS = false
    static SHOULD_CRASH_AFTER_URL_RETRY = true
    static dbPath = "./data/database.json"

    static defaultWaitMs = 1000 * 1 // 1 seconds
    static defaultInteractionWaitMs = 1000 * 15 // 20 seconds
    static defaultDownloadWaitMs = 1000 * 10 // 10 seconds
    static defaultUploadWaitMs = 1000 * 30 // 30 seconds
    static defaultTypingWaitMs = 250 // 0.25 seconds
    static waitInfinite = 1000 * 60 * 60 * 24 // 0.25 seconds

    static interactionDefaultOptions = {
        force: true,
        timeout: 15 * 1000
    }
}