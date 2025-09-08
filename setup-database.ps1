# Setup Database Script for Product Service
# This script will automatically create tables and seed data

Write-Host "Starting database setup..." -ForegroundColor Green

# Database connection parameters
$DB_HOST = "localhost"
$DB_PORT = "5431"
$DB_NAME = "product_db"
$DB_USER = "postgres"
$DB_PASSWORD = "password"

# Check if psql is available
try {
    $psqlVersion = psql --version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "PostgreSQL client (psql) found" -ForegroundColor Green
    } else {
        throw "psql not found"
    }
} catch {
    Write-Host "PostgreSQL client (psql) not found. Please install PostgreSQL client tools." -ForegroundColor Red
    Write-Host "You can download from: https://www.postgresql.org/download/" -ForegroundColor Yellow
    exit 1
}

# Test database connection
Write-Host "Testing database connection..." -ForegroundColor Yellow
try {
    $testConnection = echo "SELECT 1;" | psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database connection successful" -ForegroundColor Green
    } else {
        throw "Connection failed"
    }
} catch {
    Write-Host "Cannot connect to database. Please check:" -ForegroundColor Red
    Write-Host "   - Docker containers are running" -ForegroundColor Yellow
    Write-Host "   - Database credentials are correct" -ForegroundColor Yellow
    Write-Host "   - Port $DB_PORT is accessible" -ForegroundColor Yellow
    exit 1
}

# Step 1: Start the product service to create tables automatically
Write-Host "Starting product service to create tables..." -ForegroundColor Yellow
Write-Host "This will use TypeORM synchronize to create tables automatically" -ForegroundColor Cyan

# Step 2: Wait a moment for tables to be created, then run seeder
Write-Host "Waiting for tables to be created..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Step 3: Run the seed data
Write-Host "Running seed data..." -ForegroundColor Yellow
try {
    $seedResult = Get-Content "seed-data.sql" | psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Database seeding completed successfully!" -ForegroundColor Green
        Write-Host "Data summary:" -ForegroundColor Cyan
        Write-Host "   - Categories: 12 (including subcategories)" -ForegroundColor White
        Write-Host "   - Brands: 8" -ForegroundColor White
        Write-Host "   - Attributes: 5" -ForegroundColor White
        Write-Host "   - Attribute Options: 25" -ForegroundColor White
        Write-Host "   - Products: 8" -ForegroundColor White
        Write-Host "   - SKUs: 16" -ForegroundColor White
        Write-Host "   - SKU Attribute Options: 25" -ForegroundColor White
    } else {
        Write-Host "Error during seeding:" -ForegroundColor Red
        Write-Host $seedResult -ForegroundColor Red
    }
} catch {
    Write-Host "Error running seed script: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "Database setup completed!" -ForegroundColor Green
Write-Host "You can now use the product service with sample data." -ForegroundColor Cyan
Write-Host "" -ForegroundColor White
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start the product service: nx serve product-service" -ForegroundColor White
Write-Host "2. The service will automatically create tables on startup" -ForegroundColor White
Write-Host "3. Run this script again to seed data: .\setup-database.ps1" -ForegroundColor White
