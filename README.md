# omegalomodb

> CouchDB request agregator. Uses couchdb-dispatcher to make requests.
> 
> This micro-service is an REST JSON API, responding ONLY to JSON formatted requests.

## Installation

```bash
git clone https://github.com/alkihis/omegalomodb.git
cd omega-topology-uniprot
npm i
```

## Starting the service
```bash
Usage: node build/index.js [options]

Options:
  -p, --port [portNumber]              Server port number (default: 3280)
  -d, --databaseUrl [couchUrl]         Couch DB URL (default: "http://localhost:5984")
```

```bash
# Run the service
node build/index.js
```

## Available endpoints

All endpoints are NOT CORS-authorized.
Only local requests is accepted.

All endpoints use JSON-formatted body in request. In order to use JSON in body, **don't forget to add header `Content-Type: application/json`** in your request !

### POST /bulk
Fetch partners of given IDs

- `@url` POST http://<µ-service-url>/bulk
- `@body` `{"keys": ["id1", "id2", ...]}`
- `@returns`
```json
{
    "request": {
        "givenId": {
            "partners": ["interactorId", "interactor2Id", ...]
        };
        ...
    }
}
```

### POST /bulk_couple
Fetch MI Tab lines of desired couples.

Returns an array inside a JSON-formatted body, containing `UniprotProtein` objects.

- `@url` POST http://<µ-service-url>/bulk_couple
- `@body` `{"keys":[ ["id1couple1", "id2couple1"], ["id1couple2", "id2couple2"], ... ]}`
- `@returns`
```json
{
    "request": {
        "id1Couple~id2Couple": ["mitabLine1", "mitabLine2", ...],
        ...
    }
}
```
Order of ids in response are not guaranteed.

### POST /uniprot
Fetch the full UniProt API JSON object according to accession numbers.

- `@url` POST http://<µ-service-url>/uniprot
- `@body` `{"keys":[ "accessionNumber1", "accessionNumber2", ... ]}`
- `@returns`
```json
{
    "request": {
        "uniprotId": { uniprotObject },
        ...
    }
}
```

**Warning**: The UniProt ID is **NOT** the accession number !
The accession number is *INSIDE* the UniProt object.

