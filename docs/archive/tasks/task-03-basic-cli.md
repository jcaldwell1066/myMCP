# Task 03: Create Basic myMCP-cli with Commander.js

**Status**: Pending  
**Priority**: Medium  
**Dependencies**: Task 2

## Description
Develop a basic command-line interface (CLI) for myMCP using Commander.js with hard-coded responses for demo commands: chat, set-score, and get-score to demonstrate the interaction model.

## Initial Commands
```bash
./mycli chat "what's my score?"        # → "You have 0 points"
./mycli set-score 100                  # → "Score updated to 100"  
./mycli get-score                      # → "Current score: 100"
./mycli chat "give me a quest"         # → "Your quest: Find the golden widget"
```

## Hard-coded Response Table
- "what's my score" → current score value
- "give me a quest" → "Your quest: Find the golden widget in the northern caves"
- Default chat → "I don't understand that yet, but I'm learning!"

## Implementation Details
- Use commander.js for CLI framework
- Store score in simple JSON file (`~/.mycli-state.json`)
- Basic error handling and help system
- Foundation for proving interaction model

## Success Criteria
- CLI responds to all demo commands
- State persists across CLI sessions  
- Clean, user-friendly interface
- Ready to swap file storage for HTTP calls to engine
