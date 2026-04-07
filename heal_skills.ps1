# Wait for backend to recompile (watch mode)
Start-Sleep -Seconds 5

$loginBody = @{
    email    = "amine69souib@gmail.com"
    password = "Admin123!@#"
} | ConvertTo-Json

try {
    $loginResp = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" `
        -Method POST -ContentType "application/json" -Body $loginBody
    $token = $loginResp.access_token

    if (-not $token) {
        Write-Host "ERROR: Login failed - no token received"
        exit 1
    }

    Write-Host "Login OK. Running skill ObjectId migration..."

    $healResp = Invoke-RestMethod -Uri "http://localhost:3001/users/heal-skill-objectids" `
        -Method POST `
        -Headers @{ Authorization = "Bearer $token" } `
        -ContentType "application/json"

    Write-Host "Migration complete:"
    Write-Host ("  Fixed skills : " + $healResp.fixed)
    Write-Host ("  Affected users: " + $healResp.users)
} catch {
    Write-Host ("ERROR: " + $_.Exception.Message)
}
