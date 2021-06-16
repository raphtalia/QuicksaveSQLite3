local HttpService = game:GetService("HttpService")

local SQL = {
    URL = "https://quicksave.glitch.me",
    API_TOKEN = "",
}

local function requestAsync(method, params, requestBody)
    if SQL.API_TOKEN == "" then
        error("Please configure an API Token", 3)
    end

    local request = {
        Url = SQL.URL.. params,
        Method = method,
        Headers = {
            apitoken = SQL.API_TOKEN,
        },
    }
    if requestBody then
        request.Body = HttpService:JSONEncode(requestBody)
        request.Headers["content-type"] = "application/json"
    end

    local responseBody = HttpService:JSONDecode(HttpService:RequestAsync(request).Body)
    if responseBody.Success then
        return responseBody
    else
        error(responseBody.Message, 3)
    end
end

function SQL.getCollectionNames()
    return requestAsync(
        "GET",
        "/collections"
    ).Names
end

function SQL.getDocumentNames(collectionName)
    return requestAsync(
        "GET",
        "/collections/".. collectionName
    ).Names
end

function SQL.postDocuments(documents)
    return requestAsync(
        "POST",
        "/postBatch",
        documents
    )
end

function SQL.postDocument(collectionName, documentName, data)
    return requestAsync(
        "POST",
        ("/collections/%s/%s"):format(collectionName, documentName),
        {
            Data = data,
        }
    )
end

function SQL.getDocuments(documentNames)
    return requestAsync(
        "POST",
        "/getBatch",
        documentNames
    ).Collections
end

function SQL.getDocument(collectionName, documentName)
    return requestAsync(
        "GET",
        ("/collections/%s/%s"):format(collectionName, documentName)
    ).Document
end

return SQL