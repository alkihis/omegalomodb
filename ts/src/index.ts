import { EndpointAccepters, Routes } from "couchdb-dispatcher";
import md5 from "md5";
import program from 'commander';

program
  .version('0.1.0')
  .option('-d, --database <databaseUrl>', 'Database URL', "http://localhost:5984")
  .option('-p, --port <portNum>', 'Port Listening Number', Number, 3280)
.parse(process.argv);

const ENDPOINTS: EndpointAccepters = {};

const DB = program.database;

const route = new Routes(ENDPOINTS, DB);

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
            const keys_tuples = req.body.keys as [string, string][];
    
            let keys_to_fetch: Set<string> = new Set;
            let keys_to_find: { [findedKey: string]: Set<string> } = {};
            for (const [key1, key2] of keys_tuples) {
                // La clé du couple à chercher est déterminée par sa somme MD5
                if (key1 in keys_to_find) {
                    // Si son fetch est déjà demandé
                    keys_to_fetch[key1].add(key2);
                }
                else if (key2 in keys_to_find) {
                    keys_to_fetch[key2].add(key1);
                }
                else {
                    if (md5(key1) >= md5(key2)) {
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
    post_data: (_, res, data: { [id: string]: { data: { [linkedId: string]: string[] } } }, container) => {
        const keys_to_find = container.to_find as { [findedKey: string]: Set<string> };

        const resp: { [key1_key2: string]: string[] } = {};

        // Recherche si chaque clé de data comprend la clé correpondante
        for (const id of Object.keys(data)) {
            const dta = data[id].data as { [id2: string]: string[] };

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

route.listen(program.port, () => {
    console.log("App listening on port "+ program.port +".");
});
