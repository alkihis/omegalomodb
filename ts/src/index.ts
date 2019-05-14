import { EndpointAccepters, Routes } from "couchdb-dispatcher";
import * as md5 from "md5";
import program = require('commander');

program
  .version('0.1.0')
  .option('-d, --database <databaseUrl>', 'Database URL', "http://localhost")
  .option('-p, --port <portNum>', 'Port Listening Number', parseInt, 5984)
.parse(process.argv);

const ENDPOINTS: EndpointAccepters = {
    'id_map': (key: string) => true,
    'interactors': (key: string) => true
};

const DB = `${program.database}:${program.port}`;

const route = new Routes(ENDPOINTS, DB);

route.set('GET', '/handshake', () => undefined, (_, res) => res.json({ handshake: true }));

route.set(
    'POST', '/bulk', 
    (req, res) => req.body.keys ? req.body.keys : void res.status(400).json({ error: "Unwell-formed request" }), 
    (_, res, data) => res.json({ request: data }), 
    (_, res, error) => { 
        console.log(error); 
        res.status(500).json({ error: "Database error" }); 
    }
);

route.set(
    "POST", "/bulk_couple",
    (req, _, container) => {
        if (req.body.keys) {
            const keys_tuples = req.body.keys as [string, string][];
    
            let keys_to_fetch: string[] = [];
            let keys_to_find: { [findedKey: string]: string } = {};
            for (const [key1, key2] of keys_tuples) {
                if (md5(key1) >= md5(key2)) {
                    keys_to_fetch.push(key1);
                    keys_to_find[key1] = key2;
                }
                else {
                    keys_to_fetch.push(key2);
                    keys_to_find[key2] = key1;
                }
            }

            container.to_find = keys_to_find;

            return keys_to_fetch;
        }
    }, 
    (_, res, data, container) => {
        const keys_to_find = container.to_find;

        const resp: { [key1_key2: string]: string[] } = {};

        // Recherche si chaque clé de data comprend la clé correpondante
        for (const d of data) {
            const id = d.id;
            const dta = d.data;

            const id_to_find = keys_to_find[id];
            resp[`${id}~${id_to_find}`] = (id_to_find in dta ? dta[id_to_find] : []);
        }

        res.json({ request: resp });
    },
    (_, res, error) => { 
        console.log(error); 
        res.status(500).json({ error: "Database error" }); 
    }
);

route.listen(3280, () => {
    console.log("App listening on port 3280.");
});
