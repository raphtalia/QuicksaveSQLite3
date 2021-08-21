const DATABASE_FILE_PATH = "./Databases/Quicksave.db";

const API_TOKEN = process.env.SECRET;

const TABLE_KEY_LENGTH = 150;
const TABLE_VALUE_LENGTH = 3500;

var $stmt;

const Sqlite3 = require("better-sqlite3");

const Database = new Sqlite3(DATABASE_FILE_PATH);

const jsonEncode = JSON.stringify;
const jsonDecode = JSON.parse;

var express = require("express");
var bodyParser = require("body-parser");
var app = express();
app.use(bodyParser.json());

function isJSON(str) {
  try {
    jsonDecode(str);
  } catch (e) {
    return false;
  }
  return true;
}

function isEmpty(object) {
  return Object.entries(object).length === 0;
}

function getTableNames() {
  var collectionNames = [];

  for (const table of Database.prepare(
    "SELECT name FROM sqlite_master WHERE type ='table' AND name NOT LIKE 'sqlite_%'"
  ).all()) {
    collectionNames.push(table.name);
  }

  return collectionNames;
}

function getDocumentNames(tableName) {
  var documentNames = [];

  for (const document of Database.prepare(
    `SELECT key FROM ${tableName}`
  ).all()) {
    documentNames.push(document.key);
  }

  return documentNames;
}

function tableExists(tableName) {
  return (
    Database.prepare(
      `SELECT name FROM sqlite_master WHERE type ='table' AND name ='${tableName}'`
    ).get() != undefined
  );
}

function documentExists(tableName, documentName) {
  return (
    Database.prepare(`SELECT * FROM ${tableName} WHERE "key"=?`).get(
      documentName
    ) != undefined
  );
}

function prepareTable(tableName) {
  Database.prepare(
    `CREATE TABLE IF NOT EXISTS ${tableName} (key VARCHAR(${TABLE_KEY_LENGTH}) PRIMARY KEY, value VARCHAR(${TABLE_VALUE_LENGTH}) NOT NULL)`
  ).run();
}

function reply(res, code, body) {
  res.status(code);
  res.send(jsonEncode(body));
}

function verifyToken(apiToken, res) {
  if (apiToken == API_TOKEN) {
    return true;
  } else {
    reply(res, 403, {
      Success: false,
      Message: "Unauthorized access"
    });

    return false;
  }
}

function write(tableName, key, value) {
  prepareTable(tableName);

  // Create value if not exist, change value if exist.
  $stmt = Database.prepare(
    `REPLACE INTO ${tableName} (key, value) VALUES (?, ?)`
  ).run(key, value);
}

function read(tableName, key) {
  $stmt = Database.prepare(`SELECT * FROM ${tableName} WHERE "key"=?`);
  return jsonDecode($stmt.get(key).value);
}

app.post("/postBatch", function(req, res) {
  if (verifyToken(req.headers["apitoken"], res)) {
    const body = req.body;

    if (isEmpty(body)) {
      return reply(res, 400, {
        Success: false,
        Message: "Body has 0 collections"
      });
    } else {
      for (const [collectionName, collection] of Object.entries(body)) {
        if (isEmpty(collection)) {
          return reply(res, 400, {
            Success: false,
            Message: `Collection ${collectionName} has 0 documents`
          });
        } else {
          for (const [documentName, data] of Object.entries(collection)) {
            if (typeof data != "string") {
              return reply(res, 400, {
                Success: false,
                Message: `Document ${documentName} from collection ${collectionName} had data which was not a string`
              });
            }
            if (!isJSON(data)) {
              return reply(res, 400, {
                Success: false,
                Message: `Document ${documentName} from collection ${collectionName} had data which was not a valid JSON format`
              });
            }
          }
        }
      }
    }

    for (const [collectionName, collection] of Object.entries(body)) {
      for (const [documentName, data] of Object.entries(collection)) {
        write(collectionName, documentName, data);
      }
    }

    reply(res, 200, {
      Success: true
    });
  }
});

app.post("/getBatch", function(req, res) {
  if (verifyToken(req.headers["apitoken"], res)) {
    const body = req.body;
    var collections = {};

    if (isEmpty(body)) {
      return reply(res, 400, {
        Success: false,
        Message: "Body has 0 collections"
      });
    } else {
      for (const [collectionName, collection] of Object.entries(body)) {
        if (!tableExists(collectionName)) {
          return reply(res, 404, {
            Success: false,
            Message: `Collection ${collectionName} does not exist in database`
          });
        }
        if (isEmpty(collection)) {
          return reply(res, 400, {
            Success: false,
            Message: `Collection ${collectionName} has 0 documents`
          });
        } else {
          for (const documentName of collection) {
            if (typeof documentName != "string") {
              return reply(res, 400, {
                Success: false,
                Message: `Collection ${collectionName} contained an entry which was not a string`
              });
            }
          }
        }
      }
    }

    for (const [collectionName, collection] of Object.entries(body)) {
      collections[collectionName] = {};

      for (const documentName of Object.values(collection)) {
        collections[collectionName][documentName] = read(
          collectionName,
          documentName
        );
      }
    }

    reply(res, 200, {
      Success: true,
      Collections: collections
    });
  }
});

app.post("/collections/:collectionName/:documentName", function(req, res) {
  if (verifyToken(req.headers["apitoken"], res)) {
    const body = req.body;
    const params = req.params;

    const collectionName = params.collectionName;
    const documentName = params.documentName;

    if (isEmpty(body)) {
      return reply(res, 400, {
        Success: false,
        Message: "Body is empty"
      });
    } else {
      if (typeof body.Data != "string") {
        return reply(res, 400, {
          Success: false,
          Message: `Document ${documentName} had data which was not a string`
        });
      }
      if (!isJSON(body.Data)) {
        return reply(res, 400, {
          Success: false,
          Message: `Document ${documentName} had data which was not a valid JSON format`
        });
      }
    }

    write(collectionName, documentName, body.Data);

    reply(res, 200, {
      Success: true
    });
  }
});

app.get("/collections/:collectionName/:documentName", function(req, res) {
  if (verifyToken(req.headers["apitoken"], res)) {
    const params = req.params;

    const collectionName = params.collectionName;
    const documentName = params.documentName;

    if (!tableExists(collectionName)) {
      return reply(res, 404, {
        Success: false,
        Message: `Collection ${collectionName} does not exist in database`
      });
    }
    if (!documentExists(collectionName, documentName)) {
      return reply(res, 404, {
        Success: false,
        Message: `Document ${documentName} does not exist in collection ${collectionName}`
      });
    }

    reply(res, 200, {
      Success: true,
      Document: read(params.collectionName, params.documentName)
    });
  }
});

app.get("/collections/:collectionName", function(req, res) {
  if (verifyToken(req.headers["apitoken"], res)) {
    const params = req.params;

    const collectionName = params.collectionName;

    if (!tableExists(collectionName)) {
      return reply(res, 404, {
        Success: false,
        Message: `Collection ${collectionName} does not exist in database`
      });
    }

    reply(res, 200, {
      Success: true,
      Names: getDocumentNames(collectionName)
    });
  }
});

app.get("/collections", function(req, res) {
  if (verifyToken(req.headers["apitoken"], res)) {
    reply(res, 200, {
      Success: true,
      Names: getTableNames()
    });
  }
});

/*
For database debugging use this link to download the database.
https://quicksave.glitch.me/download?apitoken=API_TOKEN
*/
app.get("/download", function(req, res) {
  if (verifyToken(req.query.apitoken, res)) {
    res.download(DATABASE_FILE_PATH, "Quicksave.db");
  }
});

app.listen(process.env.PORT);
