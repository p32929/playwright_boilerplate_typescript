const readline = require("readline")

export class Question {
    static ask(questionTexts: string, callback?: (answer: string) => void): Promise<string> {
        console.log(`Question ask`)
        return new Promise((resolve) => {
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            })

            rl.question(questionTexts, (answer) => {
                if (callback) {
                    callback(answer)
                }
                resolve(answer)
            })
        })
    }
}