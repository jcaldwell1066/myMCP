# Build and Utility Scripts

This directory contains build scripts and utilities for the myMCP project.

## 🔧 Available Scripts

### Engine Scripts
- **build-engine.sh** - Build the myMCP engine component
- **rebuild-engine.sh** - Clean rebuild of the engine

## 🚀 Usage

### Building the Engine
```bash
# Run from project root
./scripts/build-engine.sh
```

### Rebuilding from Scratch
```bash
# Clean rebuild with dependency refresh
./scripts/rebuild-engine.sh
```

## 📋 Script Details

### build-engine.sh
- Compiles TypeScript for engine component
- Validates build output
- Checks for common build errors

### rebuild-engine.sh  
- Removes existing build artifacts
- Reinstalls dependencies if needed
- Performs complete rebuild

## 🛠️ Cross-Platform Notes

These scripts are designed for Unix-like environments (Linux/macOS/WSL). For Windows Command Prompt, use the npm scripts instead:

```cmd
REM Windows alternatives
npm run build
npm run dev:engine
```

## 📈 Adding New Scripts

When adding new build scripts:
1. Follow existing naming conventions
2. Include proper error handling
3. Make scripts executable: `chmod +x script-name.sh`
4. Update this README with usage instructions
