# Script để chạy tất cả services trong NestCM monorepo
Write-Host "🚀 Starting all NestCM services..." -ForegroundColor Green

# Kiểm tra xem NX đã được cài đặt chưa
if (-not (Get-Command "npx" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ NX not found. Please install Node.js and npm first." -ForegroundColor Red
    exit 1
}

# Cài đặt dependencies nếu cần
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Chạy tất cả services
Write-Host "🔥 Starting all services..." -ForegroundColor Cyan
npx nx run-many --target=serve --all

Write-Host "✅ All services started successfully!" -ForegroundColor Green
Write-Host "📱 Services available at:" -ForegroundColor White
Write-Host "   - API Gateway: http://localhost:3000" -ForegroundColor White
Write-Host "   - Product Service: http://localhost:3001" -ForegroundColor White
Write-Host "   - Cart Service: http://localhost:3002" -ForegroundColor White
Write-Host "   - Inventories Service: http://localhost:3003" -ForegroundColor White
Write-Host "   - Notification Service: http://localhost:3004" -ForegroundColor White
Write-Host "   - Order Service: http://localhost:3005" -ForegroundColor White
