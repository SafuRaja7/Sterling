$body = @{
    username = "admin"
    password = "admin123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" -Method POST -ContentType "application/json" -Body $body
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "STATUS: $($_.Exception.Response.StatusCode)"
    Write-Host "ERROR: $($_.ErrorDetails.Message)"
}
