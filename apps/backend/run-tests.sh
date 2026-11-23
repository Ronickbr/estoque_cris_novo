#!/usr/bin/env bash
# Estoque Cris - E2E Test Runner
# Run this after: docker compose up -d && npm ci && npm run migration:run

set -euo pipefail

BASE_URL="http://localhost:3000/api/v1"
SWAGGER_URL="http://localhost:3000/api/docs"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PASS=0
FAIL=0

# Test results storage
RESULTS_FILE="test-results-$(date +%Y%m%d-%H%M%S).json"
echo '{"tests":[]}' > "$RESULTS_FILE"

log_test() {
    local test_id="$1"
    local endpoint="$2"
    local method="$3"
    local expected="$4"
    local actual="$5"
    local status="$6"
    local details="$7"

    local result="{\"test_id\":\"$test_id\",\"endpoint\":\"$endpoint\",\"method\":\"$method\",\"expected\":$expected,\"actual\":$actual,\"status\":\"$status\",\"details\":\"$details\",\"timestamp\":\"$(date -Iseconds)\"}"
    jq ".tests += [$result]" "$RESULTS_FILE" > "$RESULTS_FILE.tmp" && mv "$RESULTS_FILE.tmp" "$RESULTS_FILE"
}

assert_status() {
    local test_id="$1"
    local endpoint="$2"
    local method="$3"
    local expected_status="$4"
    local response="$5"
    local actual_status=$(echo "$response" | jq -r '.status // empty')

    if [[ "$actual_status" == "$expected_status" ]]; then
        echo -e "${GREEN}✓ PASS${NC} $test_id: $method $endpoint -> $actual_status"
        log_test "$test_id" "$endpoint" "$method" "$expected_status" "$actual_status" "PASS" ""
        ((PASS++))
    else
        echo -e "${RED}✗ FAIL${NC} $test_id: $method $endpoint -> expected $expected_status, got $actual_status"
        log_test "$test_id" "$endpoint" "$method" "$expected_status" "$actual_status" "FAIL" "$(echo "$response" | jq -c '.body // .')"
        ((FAIL++))
    fi
}

# Make request and capture status + body
request() {
    local method="$1"
    local endpoint="$2"
    local data="${3:-}"
    local token="${4:-}"

    local curl_cmd=(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" -H "Content-Type: application/json")
    [[ -n "$token" ]] && curl_cmd+=(-H "Authorization: Bearer $token")
    [[ -n "$data" ]] && curl_cmd+=(-d "$data")

    local output=$("${curl_cmd[@]}")
    local body=$(echo "$output" | head -n -1)
    local status=$(echo "$output" | tail -n1)

    echo "{\"status\":$status,\"body\":$body}"
}

# ============================================
# AUTH TESTS
# ============================================
echo -e "\n${YELLOW}=== AUTH TESTS ===${NC}"

# T-AUTH-01: Valid login
response=$(request POST "/auth/login" '{"identifier":"admin@example.com","password":"Admin@123!"}')
assert_status "T-AUTH-01" "/auth/login" "POST" 200 "$response"
TOKEN=$(echo "$response" | jq -r '.body.accessToken // empty')
REFRESH_TOKEN=$(echo "$response" | jq -r '.body.refreshToken // empty')

# T-AUTH-02: Invalid password
response=$(request POST "/auth/login" '{"identifier":"admin@example.com","password":"wrong"}')
assert_status "T-AUTH-02" "/auth/login" "POST" 401 "$response"

# T-AUTH-03: Non-existent user
response=$(request POST "/auth/login" '{"identifier":"nonexistent@example.com","password":"Admin@123!"}')
assert_status "T-AUTH-03" "/auth/login" "POST" 401 "$response"

# T-AUTH-04: Register as admin
response=$(request POST "/auth/register" '{"nome":"Test Admin","email":"testadmin@example.com","senha":"Test@123!","nivel":"admin"}' "$TOKEN")
assert_status "T-AUTH-04" "/auth/register" "POST" 201 "$response"

# T-AUTH-05: Register as regular user (should fail)
response=$(request POST "/auth/register" '{"nome":"Test User","email":"testuser@example.com","senha":"Test@123!","nivel":"usuario"}')
assert_status "T-AUTH-05" "/auth/register" "POST" 401 "$response"  # No token = 401

# T-AUTH-06: Refresh token
response=$(request POST "/auth/refresh" '{}' "$TOKEN")
assert_status "T-AUTH-06" "/auth/refresh" "POST" 200 "$response"
NEW_TOKEN=$(echo "$response" | jq -r '.body.accessToken // empty')

# T-AUTH-07: Get profile
response=$(request GET "/auth/me" "" "$TOKEN")
assert_status "T-AUTH-07" "/auth/me" "GET" 200 "$response"

# T-AUTH-08: Change password
response=$(request POST "/auth/change-password" '{"senhaAtual":"Admin@123!","novaSenha":"NewPass@123","confirmarSenha":"NewPass@123"}' "$TOKEN")
assert_status "T-AUTH-08" "/auth/change-password" "POST" 200 "$response"

# T-AUTH-09: Forgot password
response=$(request POST "/auth/forgot-password" '{"email":"admin@example.com"}')
assert_status "T-AUTH-09" "/auth/forgot-password" "POST" 200 "$response"

# T-AUTH-10: Password policy
response=$(request GET "/auth/password-policy" "")
assert_status "T-AUTH-10" "/auth/password-policy" "GET" 200 "$response"

# ============================================
# USERS TESTS (admin only)
# ============================================
echo -e "\n${YELLOW}=== USERS TESTS ===${NC}"

# T-USR-01: List users
response=$(request GET "/users?page=1&perPage=10" "" "$TOKEN")
assert_status "T-USR-01" "/users" "GET" 200 "$response"

# T-USR-02: Create user
response=$(request POST "/users" '{"nome":"New User","email":"newuser@example.com","senha":"Pass@123","nivel":"usuario"}' "$TOKEN")
assert_status "T-USR-02" "/users" "POST" 201 "$response"
NEW_USER_ID=$(echo "$response" | jq -r '.body.id // empty')

# T-USR-03: Get user by ID
response=$(request GET "/users/$NEW_USER_ID" "" "$TOKEN")
assert_status "T-USR-03" "/users/$NEW_USER_ID" "GET" 200 "$response"

# T-USR-04: Update user
response=$(request PUT "/users/$NEW_USER_ID" '{"nome":"Updated User"}' "$TOKEN")
assert_status "T-USR-04" "/users/$NEW_USER_ID" "PUT" 200 "$response"

# T-USR-05: Delete user
response=$(request DELETE "/users/$NEW_USER_ID" "" "$TOKEN")
assert_status "T-USR-05" "/users/$NEW_USER_ID" "DELETE" 204 "$response"

# ============================================
# MANUFACTURERS TESTS
# ============================================
echo -e "\n${YELLOW}=== MANUFACTURERS TESTS ===${NC}"

# T-MFG-01: List manufacturers
response=$(request GET "/manufacturers?page=1&perPage=10" "" "$TOKEN")
assert_status "T-MFG-01" "/manufacturers" "GET" 200 "$response"

# T-MFG-02: Select list
response=$(request GET "/manufacturers/select" "" "$TOKEN")
assert_status "T-MFG-02" "/manufacturers/select" "GET" 200 "$response"

# T-MFG-03: Create manufacturer
response=$(request POST "/manufacturers" '{"name":"Test Manufacturer","logoUrl":"https://example.com/logo.png"}' "$TOKEN")
assert_status "T-MFG-03" "/manufacturers" "POST" 201 "$response"
MFG_ID=$(echo "$response" | jq -r '.body.id // empty')

# T-MFG-04: Get manufacturer
response=$(request GET "/manufacturers/$MFG_ID" "" "$TOKEN")
assert_status "T-MFG-04" "/manufacturers/$MFG_ID" "GET" 200 "$response"

# T-MFG-05: Update manufacturer
response=$(request PUT "/manufacturers/$MFG_ID" '{"name":"Updated Manufacturer"}' "$TOKEN")
assert_status "T-MFG-05" "/manufacturers/$MFG_ID" "PUT" 200 "$response"

# T-MFG-06: Delete manufacturer
response=$(request DELETE "/manufacturers/$MFG_ID" "" "$TOKEN")
assert_status "T-MFG-06" "/manufacturers/$MFG_ID" "DELETE" 204 "$response"

# ============================================
# PRODUCTS TESTS
# ============================================
echo -e "\n${YELLOW}=== PRODUCTS TESTS ===${NC}"

# Need a manufacturer first
response=$(request POST "/manufacturers" '{"name":"Test Mfg for Products"}' "$TOKEN")
MFG_ID=$(echo "$response" | jq -r '.body.id // empty')

# T-PRD-01: Create product
response=$(request POST "/products" "{\"name\":\"Test Product\",\"manufacturerId\":\"$MFG_ID\",\"stock\":10,\"minStock\":5}" "$TOKEN")
assert_status "T-PRD-01" "/products" "POST" 201 "$response"
PRD_ID=$(echo "$response" | jq -r '.body.id // empty')

# T-PRD-02: List products
response=$(request GET "/products?page=1&perPage=10" "" "$TOKEN")
assert_status "T-PRD-02" "/products" "GET" 200 "$response"

# T-PRD-03: Get product
response=$(request GET "/products/$PRD_ID" "" "$TOKEN")
assert_status "T-PRD-03" "/products/$PRD_ID" "GET" 200 "$response"

# T-PRD-04: Update product
response=$(request PUT "/products/$PRD_ID" '{"name":"Updated Product"}' "$TOKEN")
assert_status "T-PRD-04" "/products/$PRD_ID" "PUT" 200 "$response"

# T-PRD-05: Low stock list
response=$(request GET "/products/low-stock" "" "$TOKEN")
assert_status "T-PRD-05" "/products/low-stock" "GET" 200 "$response"

# T-PRD-06: Stock by manufacturer
response=$(request GET "/products/stock-by-manufacturer" "" "$TOKEN")
assert_status "T-PRD-06" "/products/stock-by-manufacturer" "GET" 200 "$response"

# T-PRD-07: Adjust stock (entry)
response=$(request POST "/products/adjust-stock" "{\"productId\":\"$PRD_ID\",\"quantity\":5,\"type\":\"entrada\"}" "$TOKEN")
assert_status "T-PRD-07" "/products/adjust-stock" "POST" 200 "$response"

# T-PRD-08: Adjust stock (exit)
response=$(request POST "/products/adjust-stock" "{\"productId\":\"$PRD_ID\",\"quantity\":3,\"type\":\"saida\"}" "$TOKEN")
assert_status "T-PRD-08" "/products/adjust-stock" "POST" 200 "$response"

# T-PRD-09: Adjust stock - insufficient (should fail)
response=$(request POST "/products/adjust-stock" "{\"productId\":\"$PRD_ID\",\"quantity\":1000,\"type\":\"saida\"}" "$TOKEN")
assert_status "T-PRD-09" "/products/adjust-stock" "POST" 400 "$response"

# T-PRD-10: Select list
response=$(request GET "/products/select" "" "$TOKEN")
assert_status "T-PRD-10" "/products/select" "GET" 200 "$response"

# T-PRD-11: Product movements
response=$(request GET "/products/$PRD_ID/movements?page=1&perPage=10" "" "$TOKEN")
assert_status "T-PRD-11" "/products/$PRD_ID/movements" "GET" 200 "$response"

# T-PRD-12: Delete product
response=$(request DELETE "/products/$PRD_ID" "" "$TOKEN")
assert_status "T-PRD-12" "/products/$PRD_ID" "DELETE" 204 "$response"

# ============================================
# INVENTORY MOVEMENTS TESTS
# ============================================
echo -e "\n${YELLOW}=== INVENTORY MOVEMENTS TESTS ===${NC}"

# Create product for movements
response=$(request POST "/manufacturers" '{"name":"Mfg for Movements"}' "$TOKEN")
MFG_ID=$(echo "$response" | jq -r '.body.id // empty')
response=$(request POST "/products" "{\"name\":\"Product for Movements\",\"manufacturerId\":\"$MFG_ID\",\"stock\":100,\"minStock\":10}" "$TOKEN")
PRD_ID=$(echo "$response" | jq -r '.body.id // empty')

# T-INV-01: Create entry movement
response=$(request POST "/inventory-movements" "{\"productId\":\"$PRD_ID\",\"type\":\"entrada\",\"quantity\":50,\"notes\":\"Test entry\"}" "$TOKEN")
assert_status "T-INV-01" "/inventory-movements" "POST" 201 "$response"
MOV_ID=$(echo "$response" | jq -r '.body.id // empty')

# T-INV-02: Create exit movement (sufficient stock)
response=$(request POST "/inventory-movements" "{\"productId\":\"$PRD_ID\",\"type\":\"saida\",\"quantity\":30,\"notes\":\"Test exit\"}" "$TOKEN")
assert_status "T-INV-02" "/inventory-movements" "POST" 201 "$response"

# T-INV-03: Create exit movement (insufficient stock - should fail)
response=$(request POST "/inventory-movements" "{\"productId\":\"$PRD_ID\",\"type\":\"saida\",\"quantity\":1000,\"notes\":\"Too much\"}" "$TOKEN")
assert_status "T-INV-03" "/inventory-movements" "POST" 400 "$response"

# T-INV-04: Batch movements
response=$(request POST "/inventory-movements/batch" "{\"movements\":[{\"productId\":\"$PRD_ID\",\"type\":\"entrada\",\"quantity\":10},{\"productId\":\"$PRD_ID\",\"type\":\"saida\",\"quantity\":5}]}" "$TOKEN")
assert_status "T-INV-04" "/inventory-movements/batch" "POST" 201 "$response"

# T-INV-05: List movements
response=$(request GET "/inventory-movements?page=1&perPage=10" "" "$TOKEN")
assert_status "T-INV-05" "/inventory-movements" "GET" 200 "$response"

# T-INV-06: Get movement by ID
response=$(request GET "/inventory-movements/$MOV_ID" "" "$TOKEN")
assert_status "T-INV-06" "/inventory-movements/$MOV_ID" "GET" 200 "$response"

# T-INV-07: Sales stats
response=$(request GET "/inventory-movements/stats?days=30" "" "$TOKEN")
assert_status "T-INV-07" "/inventory-movements/stats" "GET" 200 "$response"

# ============================================
# REPORTS TESTS
# ============================================
echo -e "\n${YELLOW}=== REPORTS TESTS ===${NC}"

# T-RPT-01: Stock by manufacturer report
response=$(request GET "/reports?type=stock_by_manufacturer" "" "$TOKEN")
assert_status "T-RPT-01" "/reports" "GET" 200 "$response"

# T-RPT-02: Low stock report
response=$(request GET "/reports?type=low_stock&page=1&perPage=20" "" "$TOKEN")
assert_status "T-RPT-02" "/reports" "GET" 200 "$response"

# T-RPT-03: Movements report
response=$(request GET "/reports?type=movements&page=1&perPage=20" "" "$TOKEN")
assert_status "T-RPT-03" "/reports" "GET" 200 "$response"

# T-RPT-04: Sales stats report
response=$(request GET "/reports?type=sales_stats&days=30" "" "$TOKEN")
assert_status "T-RPT-04" "/reports" "GET" 200 "$response"

# T-RPT-05: Export XLSX
response=$(request POST "/reports/export?type=stock_by_manufacturer&format=xlsx" "" "$TOKEN")
assert_status "T-RPT-05" "/reports/export" "POST" 200 "$response"

# T-RPT-06: Export CSV
response=$(request POST "/reports/export?type=movements&format=csv" "" "$TOKEN")
assert_status "T-RPT-06" "/reports/export" "POST" 200 "$response"

# T-RPT-07: Low stock endpoint
response=$(request GET "/reports/low-stock?page=1&perPage=20" "" "$TOKEN")
assert_status "T-RPT-07" "/reports/low-stock" "GET" 200 "$response"

# T-RPT-08: Stock by manufacturer endpoint
response=$(request GET "/reports/stock-by-manufacturer" "" "$TOKEN")
assert_status "T-RPT-08" "/reports/stock-by-manufacturer" "GET" 200 "$response"

# T-RPT-09: Sales stats endpoint
response=$(request GET "/reports/sales-stats?days=30" "" "$TOKEN")
assert_status "T-RPT-09" "/reports/sales-stats" "GET" 200 "$response"

# ============================================
# BACKUP TESTS
# ============================================
echo -e "\n${YELLOW}=== BACKUP TESTS ===${NC}"

# T-BAK-01: Create backup
response=$(request POST "/backup" "" "$TOKEN")
assert_status "T-BAK-01" "/backup" "POST" 201 "$response"
BACKUP_FILE=$(echo "$response" | jq -r '.body.filename // empty')

# T-BAK-02: List backups
response=$(request GET "/backup" "" "$TOKEN")
assert_status "T-BAK-02" "/backup" "GET" 200 "$response"

# T-BAK-03: Download backup (if file exists)
if [[ -n "$BACKUP_FILE" && "$BACKUP_FILE" != "null" ]]; then
    # Note: Download returns file, not JSON - this test may need adjustment
    echo -e "${YELLOW}⚠ SKIP${NC} T-BAK-03: Download backup (binary response)"
else
    echo -e "${YELLOW}⚠ SKIP${NC} T-BAK-03: No backup file to download"
fi

# T-BAK-04: Clean old backups
response=$(request POST "/backup/clean" "" "$TOKEN")
assert_status "T-BAK-04" "/backup/clean" "POST" 200 "$response"

# ============================================
# SUMMARY
# ============================================
echo -e "\n${YELLOW}=== TEST SUMMARY ===${NC}"
echo -e "Passed: ${GREEN}$PASS${NC}"
echo -e "Failed: ${RED}$FAIL${NC}"
echo -e "Total:  $((PASS + FAIL))"
echo -e "\nResults saved to: $RESULTS_FILE"

# Generate HTML report
cat > "test-report-$(date +%Y%m%d-%H%M%S).html" <<'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Estoque Cris - Test Report</title>
    <style>
        body { font-family: system-ui; margin: 2rem; }
        .pass { color: green; } .fail { color: red; } .skip { color: orange; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 0.5rem; text-align: left; }
        th { background: #f5f5f5; }
        .fail-row { background: #ffe6e6; }
    </style>
</head>
<body>
    <h1>Estoque Cris - E2E Test Report</h1>
    <p>Generated: <span id="date"></span></p>
    <div id="summary"></div>
    <table id="results"><thead><tr><th>Test ID</th><th>Endpoint</th><th>Method</th><th>Expected</th><th>Actual</th><th>Status</th><th>Details</th></tr></thead><tbody></tbody></table>
    <script>
        document.getElementById('date').textContent = new Date().toLocaleString();
        fetch('RESULTS_FILE_PLACEHOLDER')
            .then(r => r.json())
            .then(data => {
                let pass=0, fail=0;
                const tbody = document.querySelector('#results tbody');
                data.tests.forEach(t => {
                    const tr = document.createElement('tr');
                    if (t.status === 'FAIL') { tr.className = 'fail-row'; fail++; }
                    else { pass++; }
                    tr.innerHTML = `<td>${t.test_id}</td><td>${t.endpoint}</td><td>${t.method}</td><td>${t.expected}</td><td>${t.actual}</td><td class="${t.status.toLowerCase()}">${t.status}</td><td>${t.details}</td>`;
                    tbody.appendChild(tr);
                });
                document.getElementById('summary').innerHTML = `<h2>Summary: <span class="pass">${pass} passed</span>, <span class="fail">${fail} failed</span></h2>`;
            });
    </script>
</body>
</html>
EOF

# Replace placeholder
sed -i "s|RESULTS_FILE_PLACEHOLDER|$RESULTS_FILE|" "test-report-$(date +%Y%m%d-%H%M%S).html"

exit $FAIL