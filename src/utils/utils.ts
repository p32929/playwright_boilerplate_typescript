import { existsSync, statSync } from "fs";

export class Utils {
    static delay = (ms) => new Promise((res) => setTimeout(res, ms));

    static shuffleArray(array: any[]) {
        console.log(`shuffleArray :: `);
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    static getLastSplittedPart(text: string, splitBy: string) {
        const splittedParts = text.split(splitBy);
        return splittedParts[splittedParts.length - 1];
    }

    static isFileExist(path: string) {
        return existsSync(path);
    }

    static isAllKeysDefault(obj: any, defaultValue: any) {
        const keys = Object.keys(obj);
        if (keys.length === 0) {
            return false;
        }

        let okayCount = 0;
        for (var i = 0; i < keys.length; i++) {
            if (obj[keys[i]] !== defaultValue) {
                okayCount++;
            }
        }

        return okayCount === keys.length;
    }

    static getRandomInt(min: number = 0, max: number = Number.MAX_VALUE) { // min and max included 
        const int = Math.floor(Math.random() * (max - min + 1) + min)
        console.log(`Utils :: getRandomIntFromInterval :: int: ${int}`)
        return int
    }

    static getFileSizeKb(filePath: string) {
        const { size } = statSync(filePath)
        return size / 1024
    }
}