# Task 04: Build myMCP-engine with Express.js API for State Management

**Status**: Pending  
**Priority**: Medium  
**Dependencies**: Task 2

## Description
Develop the myMCP-engine component using Express.js to implement game state management with persistence, transition rules, and REST API endpoints for state operations and context queries.

## Core Game States (~24 states)
```
Player: idle, chatting, in-quest, completed-quest
Quest: available, active, completed, failed
Sub-quest: locked, available, active, completed  
Inventory: empty, has-item, full
Location: town, forest, cave, shop
NPC: available, busy, questgiver, merchant
Score: novice, apprentice, expert, master
```

## Transition Rules (~5-8 rules)
1. `start-quest` → idle → in-quest (if quest available)
2. `complete-task` → active → completed (if requirements met)
3. `unlock-subquest` → locked → available (if parent quest active)
4. `gain-item` → empty → has-item
5. `level-up` → novice → apprentice (if score threshold)

## API Endpoints
```
GET /state → full current state
PUT /state/player → update player state
POST /transition/start-quest → attempt transition  
GET /context/quest → hierarchical quest context
```

## Success Criteria
- Express server running with all endpoints
- JSON file persistence for MVP
- State transitions working correctly
- Ready for CLI integration
- Foundation for LLM and tab completion features
