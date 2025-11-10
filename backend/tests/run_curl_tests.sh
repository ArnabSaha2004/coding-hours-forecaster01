#!/usr/bin/env bash
# Simple curl-based smoke test for the backend API
# Usage: PORT=4000 ./run_curl_tests.sh

HOST="http://localhost"
PORT=${PORT:-4000}
BASE="$HOST:$PORT"

echo "Running curl smoke tests against $BASE"

# Helper: perform a request and print status + body
do_req() {
  method=$1; path=$2; data=$3; hdr=$4; desc=$5
  url="$BASE$path"
  echo "--- $desc ($method $path) ---"
  if [ "$method" = "GET" ] || [ "$method" = "DELETE" ]; then
    http_code=$(curl -s -w "%{http_code}" -X $method $hdr "$url" -o /tmp/curl_resp.txt)
  else
    http_code=$(curl -s -w "%{http_code}" -X $method $hdr -H "Content-Type: application/json" -d "$data" "$url" -o /tmp/curl_resp.txt)
  fi
  echo "Status: $http_code"
  echo "Body:"; cat /tmp/curl_resp.txt || true
  echo
}

# 1) Health
do_req GET /health "" "" "health check"

# 2) Register (random email)
RAND=$(head -c 8 /dev/urandom | od -An -tx1 | tr -d ' \n')
EMAIL="test+$RAND@example.com"
PW='Password123!'
DATA=$(jq -n --arg e "$EMAIL" --arg p "$PW" '{email:$e, password:$p}') 2>/dev/null || DATA="{\"email\":\"$EMAIL\",\"password\":\"$PW\"}"

do_req POST /api/auth/register "$DATA" "" "register"

# Try to parse token from response (requires jq); fall back to empty
TOKEN="$(cat /tmp/curl_resp.txt | jq -r '.token' 2>/dev/null || echo '')"

if [ -z "$TOKEN" ]; then
  # Try login
  DATA_LOGIN=$(jq -n --arg e "$EMAIL" --arg p "$PW" '{email:$e, password:$p}') 2>/dev/null || DATA_LOGIN="$DATA"
  do_req POST /api/auth/login "$DATA_LOGIN" "" "login"
  TOKEN="$(cat /tmp/curl_resp.txt | jq -r '.token' 2>/dev/null || echo '')"
fi

if [ -n "$TOKEN" ]; then
  HDR="-H \"Authorization: Bearer $TOKEN\""
  # Create log
  TODAY=$(date +%F)
  LOGDATA="{\"date\":\"$TODAY\",\"hours\":2.5,\"project\":\"CLI Test\",\"notes\":\"Created by curl test\"}"
  do_req POST /api/logs "$LOGDATA" "$HDR" "create log"

  # Save created id if returned
  CREATED_ID="$(cat /tmp/curl_resp.txt | jq -r '.id' 2>/dev/null || echo '')"

  # Get logs
  do_req GET "/api/logs" "" "-H \"Authorization: Bearer $TOKEN\"" "get logs"

  if [ -n "$CREATED_ID" ] && [ "$CREATED_ID" != "null" ]; then
    UPD='{"hours":3.0, "notes":"updated by test"}'
    do_req PUT "/api/logs/$CREATED_ID" "$UPD" "-H \"Authorization: Bearer $TOKEN\"" "update log"
    do_req DELETE "/api/logs/$CREATED_ID" "" "-H \"Authorization: Bearer $TOKEN\"" "delete log"
  fi

  # Forecast
  FC='{"horizon":7}'
  do_req POST /api/forecast "$FC" "-H \"Authorization: Bearer $TOKEN\"" "forecast"
else
  echo "No token available. Skipping protected endpoints. Check register/login output or DATABASE_URL in .env"
fi

echo "Done"
