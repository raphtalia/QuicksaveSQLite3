local HttpService = game:GetService("HttpService")

local SQL = require(script.SQL)

local METHOD_RESOURCE_MAP = {
	UpdateAsync = "_updateAsync",
	GetAsync = "_getAsync",
	SetAsync = "_setAsync",
}

local BackupLayer = {
    SQL = SQL,
}

function BackupLayer._updateAsync(collectionName, documentName, callback)
	local data = SQL.getDocument(collectionName, documentName)

	if data then
		data = HttpService:JSONDecode(data)
	end
	data = callback(data)

	if data then
		return SQL.postDocument(collectionName, documentName, data)
	end
end

function BackupLayer._getAsync(collectionName, documentName)
	return SQL.getDocument(collectionName, documentName)
end

function BackupLayer._setAsync(collectionName, documentName, data)
	return SQL.postDocument(collectionName, documentName, HttpService:JSONEncode(data))
end

function BackupLayer.perform(methodName, ...)
	return BackupLayer[METHOD_RESOURCE_MAP[methodName]](...)
end

return BackupLayer