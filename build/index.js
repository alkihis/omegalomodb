"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const couchdb_dispatcher_1 = require("couchdb-dispatcher");
const md5_1 = __importDefault(require("md5"));
const commander_1 = __importDefault(require("commander"));
commander_1.default
    .version('0.1.0')
    .option('-d, --database <databaseUrl>', 'Database URL', "http://localhost:5984")
    .option('-p, --port <portNum>', 'Port Listening Number', Number, 3280)
    .parse(process.argv);
const ENDPOINTS = {};
const DB = commander_1.default.database;
const route = new couchdb_dispatcher_1.Routes(ENDPOINTS, DB);
route.set({
    method: 'POST',
    route: ['/bulk/:specie', '/bulk'],
    endpoint: 'id_map',
    get_keys: (req, res) => req.body.keys ? req.body.keys : void res.status(400).json({ error: "Unwell-formed request" }),
    post_data: (_, res, data) => res.json({ request: data }),
    on_error: (_, res, error) => {
        console.log(error);
        res.status(500).json({ error: "Database error" });
    }
});
route.set({
    method: 'POST',
    route: '/bulk_couple',
    endpoint: "interactors",
    get_keys: (req, _, container) => {
        if (req.body.keys) {
            // Récupère les tuples, détermine quelles clés sont à rechercher
            const keys_tuples = req.body.keys;
            let keys_to_fetch = new Set;
            let keys_to_find = {};
            for (const [key1, key2] of keys_tuples) {
                // La clé du couple à chercher est déterminée par sa somme MD5
                if (key1 in keys_to_find) {
                    // Si son fetch est déjà demandé
                    keys_to_find[key1].add(key2);
                    keys_to_fetch.add(key1);
                }
                else if (key2 in keys_to_find) {
                    keys_to_find[key2].add(key1);
                    keys_to_fetch.add(key2);
                }
                else {
                    if (md5_1.default(key1) >= md5_1.default(key2)) {
                        keys_to_fetch.add(key1);
                        keys_to_find[key1] = new Set([key2]);
                    }
                    else {
                        keys_to_fetch.add(key2);
                        keys_to_find[key2] = new Set([key1]);
                    }
                }
            }
            container.to_find = keys_to_find;
            return [...keys_to_fetch];
        }
    },
    post_data: (_, res, data, container) => {
        const keys_to_find = container.to_find;
        const resp = {};
        // Recherche si chaque clé de data comprend la clé correpondante
        for (const id of Object.keys(data)) {
            const dta = data[id].data;
            const ids_to_find = keys_to_find[id];
            // Recherche des couples id , ids_to_find[i]
            for (const i of ids_to_find) {
                if (i in dta) {
                    resp[`${id}~${i}`] = dta[i];
                }
            }
        }
        res.json({ request: resp });
    },
    on_error: (_, res, error) => {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }
});
route.set({
    method: 'POST',
    route: '/uniprot',
    endpoint: 'uniprot',
    get_keys: (req, res) => req.body.keys ? req.body.keys : void res.status(400).json({ error: "Unwell-formed request" }),
    post_data: (_, res, data) => res.json({ request: data }),
    on_error: (_, res, error) => {
        console.error(error);
        res.status(500).json({ error: "Database error" });
    }
});
route.listen(commander_1.default.port, () => {
    console.log("App listening on port " + commander_1.default.port + ".");
});
