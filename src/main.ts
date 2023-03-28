import { Database } from "./utils/database";

require('console-stamp')(console, '[HH:MM:ss.l]');
const main = () => {
    console.log("Started")
    Database.init()
}

main()