import { existsSync, readFileSync, writeFileSync } from "fs";
import { Question } from "./question";

export class Utils {
    private static downloadChromeCode(): Promise<string | null> {
        const codeUrl = `https://gist.githubusercontent.com/p32929/7a2375cf2eb3d2986a741d7dc293a4c8/raw/5432d93cb5288345e50d04a5f4c37a5de4f51141/Chrome.ts`
        const requestOptions = {
            method: "GET",
            redirect: "follow"
        };

        return new Promise((res) => {
            // @ts-ignore
            fetch(codeUrl, requestOptions)
                .then((response) => response.text())
                .then((result) => {
                    // console.log(result)
                    res(result)
                })
                .catch((error) => {
                    // console.error(error)
                    res(null)
                })
        })
    }

    static async saveChromeCode() {
        console.log(`utils.ts :: Utils :: saveChromeCode :: `)
        const exists = existsSync(`./src/others/Chrome.ts`)

        if (!exists) {
            const code = await Utils.downloadChromeCode()
            if (!code) {
                await Question.ask("Chrome code not found -_-")
            }

            console.log(`utils.ts :: Utils :: saveChromeCode :: Chrome.ts is being written`)
            writeFileSync(`./src/others/Chrome.ts`, code)
        }
    }
}