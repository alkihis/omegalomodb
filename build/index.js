"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const couchdb_dispatcher_1 = require("couchdb-dispatcher");
const md5 = require("md5");
const program = require("commander");
program
    .version('0.1.0')
    .option('-d, --database <databaseUrl>', 'Database URL', "http://localhost:5984")
    .option('-p, --port <portNum>', 'Port Listening Number', parseInt, 3280)
    .parse(process.argv);
const ENDPOINTS = {};
const DB = `${program.database}`;
const route = new couchdb_dispatcher_1.Routes(ENDPOINTS, DB);
route.set('GET', '/handshake', () => undefined, (_, res) => res.json({ handshake: true }));
////// FOR COMPATIBILITY
route.set('POST', '/bulk', (req, res) => req.body.keys ? req.body.keys : void res.status(400).json({ error: "Unwell-formed request" }), (_, res, data) => res.json({ request: data }), (_, res, error) => {
    console.log(error);
    res.status(500).json({ error: "Database error" });
}, "id_map");
route.set('POST', '/bulk/:specie', (req, res) => req.body.keys ? req.body.keys : void res.status(400).json({ error: "Unwell-formed request" }), (_, res, data) => res.json({ request: data }), (_, res, error) => {
    console.log(error);
    res.status(500).json({ error: "Database error" });
}, "id_map");
route.set("POST", "/bulk_couple/:specie", (req, _, container) => {
    if (req.body.keys) {
        const keys_tuples = req.body.keys;
        let keys_to_fetch = new Set;
        let keys_to_find = {};
        for (const [key1, key2] of keys_tuples) {
            if (md5(key1) >= md5(key2)) {
                keys_to_fetch.add(key1);
                if (key1 in keys_to_find) {
                    keys_to_find[key1].add(key2);
                }
                else {
                    keys_to_find[key1] = new Set([key2]);
                }
            }
            else {
                keys_to_fetch.add(key2);
                if (key2 in keys_to_find) {
                    keys_to_find[key2].add(key1);
                }
                else {
                    keys_to_find[key2] = new Set([key1]);
                }
            }
        }
        container.to_find = keys_to_find;
        return [...keys_to_fetch];
    }
}, (_, res, data, container) => {
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
}, (_, res, error) => {
    console.log(error);
    res.status(500).json({ error: "Database error" });
}, "interactors");
route.set('POST', '/uniprot', (req, res) => req.body.keys ? req.body.keys : void res.status(400).json({ error: "Unwell-formed request" }), (_, res, data) => res.json({ request: data }), (_, res, error) => {
    console.log(error);
    res.status(500).json({ error: "Database error" });
}, 'uniprot');
route.listen(program.port, () => {
    console.log("App listening on port 3280.");
});
