
import { Fjsondb } from "fjsondb";
import { Constants } from "./constants";

export class Database {
    static db: Fjsondb = null;

    static init() {
        const Fjsondb = require('fjsondb');
        this.db = new Fjsondb(Constants.dbPath);
    }

    static set(key: string, value: any) {
        console.log(`Database set`)
        return this.db.set(key, value);
    }

    static get(key: string): any {
        console.log(`Database get`)
        return this.db.get(key);
    }

    static has(key: string): boolean {
        console.log(`Database has`)
        return this.db.has(key);
    }

    static delete(key: string) {
        console.log(`Database delete`)
        return this.db.delete(key);
    }
}