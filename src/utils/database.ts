import { Constants } from "./constants";

let db = null

export class Database {
    static init() {
        const Fjsondb = require('fjsondb');
        db = new Fjsondb(Constants.dbPath);
    }

    static set(key: string, value: any) {
        console.log(`Database set`)
        return db.set(key, value);
    }

    static get(key: string): any {
        console.log(`Database get`)
        return db.get(key);
    }

    static has(key: string): boolean {
        console.log(`Database has`)
        return db.has(key);
    }

    static delete(key: string) {
        console.log(`Database delete`)
        return db.delete(key);
    }
}