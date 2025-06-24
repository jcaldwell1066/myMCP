# myMCP Documentation

Welcome to the myMCP project documentation! This directory contains all documentation for the multi-interface fantasy chatbot system.

## 📚 Documentation Structure

### Getting Started
- [Main README](../README.md) - Project overview and quick start
- [Getting Started Guide](setup/QUICK_SETUP.md) - Detailed setup instructions
- [Contributing Guide](CONTRIBUTING.md) - Development guidelines

### Technical Documentation
- [API Documentation](API.md) - Complete API reference
- [Architecture Overview](ARCHITECTURE.md) - System design and components

### Task Documentation
- [tasks/](tasks/) - Individual task implementation details
- [refinement/](refinement/) - Task refinement and analysis documents
- [planning/](planning/) - Project planning and analysis documents

### Examples
- [../examples/](../examples/) - Usage examples and sample integrations

## 🚀 Quick Navigation

| Component | Description | Documentation |
|-----------|-------------|---------------|
| **CLI** | Command-line interface | [CLI Package](../packages/cli/) |
| **Engine** | Game state management API | [Engine Package](../packages/engine/) |
| **WebApp** | React frontend | [WebApp Package](../packages/webapp/) |
| **MCP Server** | MCP protocol server | [MCP Package](../packages/mcpserver/) |
| **Admin** | System monitoring | [Admin Package](../packages/admin/) |

## 🎮 Fantasy Quest System

myMCP features three real-world skill quests wrapped in fantasy themes:
- **Council of Three Realms** - Timezone coordination and meeting scheduling
- **Dungeon Keeper's Vigil** - Server monitoring and system health checks  
- **Cryptomancer's Seal** - HMAC cryptographic implementation

## 📋 Current Progress

**Phase 1 Complete (Tasks 1-5)**: ✅ Foundation and API Integration
- Multi-workspace project structure
- CLI with Commander.js and fantasy theming
- Express.js engine with game state management
- REST API with WebSocket real-time updates
- Cross-platform CLI-Engine integration

**Current Phase (Tasks 6-11)**: 🚧 Core Features and Quest Implementation
- Tab completion system
- LLM API integration for dynamic narratives
- Fantasy theme pack with assets
- Three quest implementations

**Future Phases (Tasks 12-16)**: 📅 Interface Components and Demo
- React webapp frontend
- Admin dashboard
- MCP protocol server
- Full system integration testing
- Demo preparation

## 🔧 Development Workflow

1. **Setup**: Follow [Getting Started Guide](setup/QUICK_SETUP.md)
2. **Development**: Use `npm run dev:*` scripts for component development
3. **Testing**: Run integration tests in [../tests/](../tests/)
4. **Contributing**: Follow [Contributing Guidelines](CONTRIBUTING.md)

---

*For additional help, check the component-specific README files or open an issue in the repository.*