# myMCP Project Rules and Context

## Project Overview
This is a project to rescue a lunch and learn demo from enterprise scope creep. We're building a 5-component chatbot system that demonstrates the same state accessed via multiple interfaces (CLI + Web).

## Core Architecture Principles
- **Node.js/TypeScript** across all 5 components for rapid development
- **Shared state management** through myMCP-engine API
- **Fantasy theming** with real-world skill development
- **Incremental delivery** with fallback positions at each phase

## Component Structure
```
myMCP/
├── myMCP-cli/          # Commander.js CLI with tab completion
├── myMCP-engine/       # Express.js state management + LLM integration  
├── myMCP-webapp/       # React frontend with chat + swimlanes
├── myMCP-mcpserver/    # MCP protocol server (stdio)
└── myMCP-admin/        # System monitoring dashboard
```

## Development Workflow Integration
- **Use existing TaskMaster workflow** from .windsurfrules
- **Leverage Roo modes** for specialized tasks:
  - Architect mode for technical design
  - Debug mode for troubleshooting  
  - Test mode for validation
- **Follow task-driven development** process with complexity analysis

## Key Success Metrics
- **Timeline**: Summer delivery vs 15-day enterprise cycle
- **Demo Flow**: 30-second CLI ↔ Web state sharing demonstration
- **Educational Value**: Real skills (timezone coordination, server monitoring, HMAC security)
- **Technical Innovation**: MCP protocol integration, context-aware interfaces

## Technology Constraints
- **No localStorage/sessionStorage** in artifacts (Claude limitation)
- **Fantasy theme must be skinable** for future iterations
- **Tab completion must be context-aware** based on game state
- **LLM integration must provide variety** without repetition

## Project Philosophy
"Something that actually works" over "architecturally perfect"
Focus on working prototype first, enterprise polish later
Bridge back to enterprise stack after proving concept
