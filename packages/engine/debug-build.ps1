# Debug Build Script

Write-Host "🔍 Debugging TypeScript Build Issues" -ForegroundColor Yellow
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray

# Check current directory
Write-Host "📁 Current Directory:" -ForegroundColor Cyan
Get-Location

# Check if TypeScript is installed
Write-Host "`n🔧 Checking TypeScript installation:" -ForegroundColor Cyan
try {
    $tsVersion = npx tsc --version
    Write-Host "✅ TypeScript: $tsVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ TypeScript not found" -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
Write-Host "`n📦 Checking node_modules:" -ForegroundColor Cyan
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules directory exists" -ForegroundColor Green
} else {
    Write-Host "❌ node_modules directory not found" -ForegroundColor Red
    Write-Host "Running npm install..." -ForegroundColor Yellow
    npm install
}

# Check tsconfig.json
Write-Host "`n⚙️  Checking tsconfig.json:" -ForegroundColor Cyan
if (Test-Path "tsconfig.json") {
    Write-Host "✅ tsconfig.json found" -ForegroundColor Green
} else {
    Write-Host "❌ tsconfig.json not found" -ForegroundColor Red
    exit 1
}

# Check source files
Write-Host "`n📄 Checking source files:" -ForegroundColor Cyan
$srcFiles = Get-ChildItem -Path "src" -Recurse -Filter "*.ts" | Measure-Object
Write-Host "✅ Found $($srcFiles.Count) TypeScript files" -ForegroundColor Green

# Try TypeScript check without emit
Write-Host "`n🧪 Testing TypeScript compilation (dry run):" -ForegroundColor Cyan
try {
    $result = npx tsc --noEmit 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ TypeScript check passed!" -ForegroundColor Green
    } else {
        Write-Host "❌ TypeScript errors found:" -ForegroundColor Red
        Write-Host $result -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ TypeScript check failed:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

# Try actual build
Write-Host "`n🏗️  Attempting build:" -ForegroundColor Cyan
try {
    npx tsc
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Build successful!" -ForegroundColor Green
        
        # Check if dist was created
        if (Test-Path "dist") {
            $distFiles = Get-ChildItem -Path "dist" -Recurse | Measure-Object
            Write-Host "✅ Generated $($distFiles.Count) files in dist/" -ForegroundColor Green
        } else {
            Write-Host "❌ dist directory not created" -ForegroundColor Red
        }
    } else {
        Write-Host "❌ Build failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Build error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host "`n🎉 All checks passed!" -ForegroundColor Green
