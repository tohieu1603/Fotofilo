# Script để generate TypeScript types từ proto files
Write-Host "🚀 Generating TypeScript types from proto files..." -ForegroundColor Green

# Kiểm tra xem protoc đã được cài đặt chưa
if (-not (Get-Command "protoc" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Protocol Buffers compiler (protoc) not found!" -ForegroundColor Red
    Write-Host "Please install Protocol Buffers compiler first:" -ForegroundColor Yellow
    Write-Host "  - Windows: Download from https://github.com/protocolbuffers/protobuf/releases" -ForegroundColor Yellow
    Write-Host "  - Or use: choco install protobuf" -ForegroundColor Yellow
    Write-Host "  - Or use: winget install Google.Protobuf" -ForegroundColor Yellow
    exit 1
}

# Kiểm tra xem các plugin cần thiết đã được cài đặt chưa
if (-not (Test-Path "node_modules/.bin/protoc-gen-ts_proto")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Tạo thư mục generated nếu chưa có
if (-not (Test-Path "src/generated")) {
    New-Item -ItemType Directory -Path "src/generated" -Force
    Write-Host "📁 Created generated directory" -ForegroundColor Cyan
}

# Clean generated files
Write-Host "🧹 Cleaning generated files..." -ForegroundColor Cyan
if (Test-Path "src/generated") {
    Remove-Item "src/generated\*" -Recurse -Force
}

# Generate TypeScript types
Write-Host "🔧 Generating TypeScript types..." -ForegroundColor Cyan
npm run proto:generate

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ TypeScript types generated successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Failed to generate TypeScript types" -ForegroundColor Red
    exit 1
}

# Generate JavaScript files (optional)
Write-Host "🔧 Generating JavaScript files..." -ForegroundColor Cyan
npm run proto:generate:js

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ JavaScript files generated successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Failed to generate JavaScript files (this is optional)" -ForegroundColor Yellow
}

# Generate gRPC files (optional)
Write-Host "🔧 Generating gRPC files..." -ForegroundColor Cyan
npm run proto:generate:grpc

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ gRPC files generated successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Failed to generate gRPC files (this is optional)" -ForegroundColor Yellow
}

Write-Host "🎉 Proto generation completed!" -ForegroundColor Green
Write-Host "📁 Generated files are in: src/generated/" -ForegroundColor White
