$BaseUrl = "http://localhost:3001"

function Test-Endpoint {
    param($Name, $Method, $Path, $Body = $null, $Token = $null)
    
    Write-Host "`n--- Testing: $Name ---" -ForegroundColor Cyan
    $params = @{
        Uri = "$BaseUrl$Path"
        Method = $Method
        ContentType = "application/json"
    }
    if ($Body) { $params.Body = ($Body | ConvertTo-Json) }
    if ($Token) { $params.Headers = @{ Authorization = "Bearer $Token" } }

    try {
        $resp = Invoke-RestMethod @params
        Write-Host "✅ Success!" -ForegroundColor Green
        return $resp
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "❌ Failed with Status: $statusCode" -ForegroundColor Red
        return $null
    }
}

# 1. Register a Manager
$rnd = Get-Random -Minimum 1000 -Maximum 9999
$mgrData = @{
    name = "Manager $rnd"
    email = "mgr$rnd@example.com"
    password = "password123"
    role = "MANAGER"
}
$mgrResp = Test-Endpoint "Register Manager" "Post" "/auth/register" $mgrData
$mgrToken = $mgrResp.access_token
$mgrId = $mgrResp.user.id

# 2. Register an HR
$hrData = @{
    name = "HR $rnd"
    email = "hr$rnd@example.com"
    password = "password123"
    role = "HR"
}
$hrResp = Test-Endpoint "Register HR" "Post" "/auth/register" $hrData
$hrToken = $hrResp.access_token

# 3. Test RBAC: Manager trying to Delete (Should FAIL)
Write-Host "`nVerify RBAC: Manager should NOT be able to delete users..." -ForegroundColor Yellow
$failDelete = Test-Endpoint "Manager Delete User (Should Fail 403)" "Delete" "/users/$mgrId" $null $mgrToken

# 4. Test RBAC: HR trying to Delete (Should SUCCEED)
Write-Host "`nVerify RBAC: HR SHOULD be able to delete users..." -ForegroundColor Yellow
$successDelete = Test-Endpoint "HR Delete User (Should Succeed)" "Delete" "/users/$mgrId" $null $hrToken

Write-Host "`n--- Test Suite Complete ---" -ForegroundColor Magenta
