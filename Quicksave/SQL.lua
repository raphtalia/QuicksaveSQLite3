local HttpService = game:GetService("HttpService")

local SQL = {
    URL = "https://quicksave.glitch.me",
    API_TOKEN = "",
}

local function requestAsync(method, params, body)
    local request = {
        Url = SQL.URL.. params,
        Method = method,
        Headers = {
            apitoken = SQL.API_TOKEN,
        },
    }
    if body then
        request.Body = HttpService:JSONEncode(body)
        request.Headers["content-type"] = "application/json"
    end

    return HttpService:JSONDecode(HttpService:RequestAsync(request).Body)
end

function SQL.getCollectionNames()
    local response = requestAsync(
        "GET",
        "/collections"
    )

    if response.Success then
        return response.Names
    else
        error(response.Message, 2)
    end
end

function SQL.getDocumentNames(collectionName)
    local response = requestAsync(
        "GET",
        "/collections/".. collectionName
    )

    if response.Success then
        return response.Names
    else
        error(response.Message, 2)
    end
end

function SQL.postDocuments(documents)
    local response = requestAsync(
        "POST",
        "/postBatch",
        documents
    )

    if response.Success then
        return response
    else
        error(response.Message, 2)
    end
end

function SQL.postDocument(collectionName, documentName, data)
    local response = requestAsync(
        "POST",
        ("/collections/%s/%s"):format(collectionName, documentName),
        {
            Data = data,
        }
    )

    if response.Success then
        return response
    else
        error(response.Message, 2)
    end
end

function SQL.getDocuments(documentNames)
    local response = requestAsync(
        "POST",
        "/getBatch",
        documentNames
    )

    if response.Success then
        return response.Collections
    else
        error(response.Message, 2)
    end
end

function SQL.getDocument(collectionName, documentName)
    local response = requestAsync(
        "GET",
        ("/collections/%s/%s"):format(collectionName, documentName)
    )

    if response.Success then
        return response.Document
    else
        error(response.Message, 2)
    end
end

return SQL