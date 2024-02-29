require('console-stamp')(console, '[HH:MM:ss.l]');
const main = async () => {
    console.log("Started")

    const arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
    const item = arr[arr.length - 1]
    console.log(`main.ts :: main :: item -> ${item} `)
}

main()