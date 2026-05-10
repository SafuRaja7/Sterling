$connections = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
if ($connections) {
    foreach ($conn in $connections) {
        $pid = $conn.OwningProcess
        if ($pid -and $pid -gt 0) {
            Write-Host "Killing PID: $pid"
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
    }
    Write-Host "Port 5000 cleared."
} else {
    Write-Host "Port 5000 is already free."
}
