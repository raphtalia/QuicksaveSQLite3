# QuicksaveSQLite3

SQLite3 server made as an example for [Quicksave](https://github.com/raphtalia/Quicksave)
backups. The server side is based off this
[project](https://github.com/Fireboltofdeath/node-rbx-sqlite3-server). Follow the
**Glitch Tutorial** part of the project's README to setup the server. Then
continue here to setup the Roblox side.

## Setup

```lua
local Quicksave = require("Quicksave")
local BackupLayer = require(script.BackupLayer)

BackupLayer.SQL.URL = "https://quicksave.glitch.me"
BackupLayer.SQL.API_TOKEN = "API_TOKEN"

Quicksave.Constants.EXTERNAL_DATABASE_HANDLER = BackupLayer.perform

--[[
    Include this line if you wish to use the SQL Database as your primary
    database and DataStores as your secondary.
]]
Quicksave.Constants.USE_EXTERNAL_DATABASE_AS_PRIMARY = true
```
