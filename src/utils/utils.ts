import { existsSync, readdirSync, statSync } from "fs";

interface FolderOptions {
    includePath?: boolean;
    shuffle?: boolean;
}


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

    static getRandomInt(min: number = 0, max: number = Number.MAX_VALUE) { // min and max included 
        const int = Math.floor(Math.random() * (max - min + 1) + min)
        console.log(`Utils :: getRandomIntFromInterval :: int: ${int}`)
        return int
    }

    static getFileSizeKb(filePath: string) {
        const { size } = statSync(filePath)
        return size / 1024
    }

    static getValueAtIndex(arr: any[], index: number): any | undefined {
        const length = arr.length;

        // Normalize negative indices
        if (index < 0) {
            index += length;
        }

        // Check if the index is within bounds
        if (index >= 0 && index < length) {
            return arr[index];
        } else {
            return undefined; // Out of bounds
        }
    }

    static getFileListFromFolder(folderLocation: string, options?: FolderOptions): string[] {
        const { includePath = true, shuffle = false } = options || {};

        try {
            const files = readdirSync(folderLocation, { withFileTypes: true });
            let finalFileNameList: string[] = files.map(file => file.name);

            if (includePath) {
                const normalizedFolderLocation = folderLocation.replaceAll("\\", "/");
                finalFileNameList = finalFileNameList.map(item => `${normalizedFolderLocation}/${item}`);
            }

            if (shuffle) {
                this.shuffleArray(finalFileNameList);
            }

            return finalFileNameList;
        } catch (error) {
            console.error(`utils.ts :: Utils :: Error -> ${error}`);
            return [];
        }
    }
}