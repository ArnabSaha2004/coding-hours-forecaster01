param(
  [string]$Host = "http://localhost",
  [int]$Port = 4000
)

$base = "$Host`:$Port"
Write-Host "Running API smoke tests against $base ...`n"

function Print-Result($name, $status, $body) {
  Write-Host "[$name] Status: $status" -ForegroundColor Cyan
  if ($body) { Write-Host "Body:`n$body`n" }
}

# Helper to call endpoint and return status/body
function Call-Api($method, $path, $bodyJson = $null, $headers = @{}) {
  $url = "$base$path"
  try {
    if ($method -eq 'GET' -or $method -eq 'DELETE') {
      $resp = Invoke-WebRequest -Uri $url -Method $method -Headers $headers -UseBasicParsing -ErrorAction Stop
      return @{ status = $resp.StatusCode; body = $resp.Content }
    } else {
      $resp = Invoke-WebRequest -Uri $url -Method $method -Body $bodyJson -ContentType 'application/json' -Headers $headers -UseBasicParsing -ErrorAction Stop
      return @{ status = $resp.StatusCode; body = $resp.Content }
    }
  } catch {
    # If Invoke-WebRequest throws, capture response if available
    if ($_.Exception.Response) {
      $stream = $_.Exception.Response.GetResponseStream()
      $reader = New-Object System.IO.StreamReader($stream)
      $text = $reader.ReadToEnd()
      $code = $_.Exception.Response.StatusCode.value__
      return @{ status = $code; body = $text }
    }
    return @{ status = 'ERR'; body = $_.Exception.Message }
  }
}

# 1) Health
$r = Call-Api 'GET' '/health'
Print-Result 'GET /health' $r.status $r.body

# 2) Register new user (randomized email)
$rand = [guid]::NewGuid().ToString().Substring(0,8)
$email = "test+$rand@example.com"
$pw = 'Password123!'
$body = @{ email = $email; password = $pw } | ConvertTo-Json
$r = Call-Api 'POST' '/api/auth/register' $body
Print-Result 'POST /api/auth/register' $r.status $r.body

$token = $null
if ($r.body -and $r.status -eq 200) {
  try { $j = $r.body | ConvertFrom-Json; $token = $j.token } catch { }
}

# 3) Login (if registration failed because user exists, try login)
if (-not $token) {
  $body = @{ email = $email; password = $pw } | ConvertTo-Json
  $r = Call-Api 'POST' '/api/auth/login' $body
  Print-Result 'POST /api/auth/login' $r.status $r.body
  if ($r.body -and $r.status -eq 200) {
    try { $j = $r.body | ConvertFrom-Json; $token = $j.token } catch { }
  }
}

# 4) Get /api/me
if ($token) {
  $hdrs = @{ Authorization = "Bearer $token" }
  $r = Call-Api 'GET' '/api/me' $null $hdrs
  Print-Result 'GET /api/me' $r.status $r.body

  # 5) Create a log
  $logBody = @{ date = (Get-Date -Format yyyy-MM-dd); hours = 2.5; project = 'CLI Test'; notes = 'Created by curl test' } | ConvertTo-Json
  $r = Call-Api 'POST' '/api/logs' $logBody $hdrs
  Print-Result 'POST /api/logs' $r.status $r.body

  $createdId = $null
  if ($r.body -and ($r.status -in 201,200)) {
    try { $cj = $r.body | ConvertFrom-Json; $createdId = $cj.id } catch { }
  }

  # 6) Get logs
  $r = Call-Api 'GET' '/api/logs' $null $hdrs
  Print-Result 'GET /api/logs' $r.status $r.body

  # 7) Update the created log (if exists)
  if ($createdId) {
    $upd = @{ hours = 3.0; notes = 'Updated by test' } | ConvertTo-Json
    $r = Call-Api 'PUT' "/api/logs/$createdId" $upd $hdrs
    Print-Result "PUT /api/logs/$createdId" $r.status $r.body

    # 8) Delete it
    $r = Call-Api 'DELETE' "/api/logs/$createdId" $null $hdrs
    Print-Result "DELETE /api/logs/$createdId" $r.status $r.body
  }

  # 9) Forecast
  $fcBody = @{ horizon = 7 } | ConvertTo-Json
  $r = Call-Api 'POST' '/api/forecast' $fcBody $hdrs
  Print-Result 'POST /api/forecast' $r.status $r.body
} else {
  # Use a plain hyphen instead of an em-dash to avoid any parsing issues in older PowerShell
  Write-Host "No token available - skipping protected endpoint tests. Check register/login responses and DATABASE_URL." -ForegroundColor Yellow
}

Write-Host "Tests completed." -ForegroundColor Green
