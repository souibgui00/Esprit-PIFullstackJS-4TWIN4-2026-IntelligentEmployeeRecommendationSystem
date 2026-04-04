$port = 3001
Write-Host "Clearing port $port..." -ForegroundColor Yellow
$procs = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
foreach ($procId in $procs) {
    if ($procId) {
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
        Write-Host "Killed process $procId on port $port" -ForegroundColor Green
    }
}
