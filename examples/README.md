# Examples and Usage Samples

This directory contains usage examples, sample files, and demonstrations for the myMCP system.

## 📋 Contents

### Postman Collections (`/postman/`)
- **MCP_TIME_QUEST_@myapi.postman_collection.json** - Complete API testing collection

## 🚀 Using the Examples

### Postman API Testing
1. Import the collection into Postman
2. Ensure the myMCP engine is running (`npm run dev:engine`)
3. Execute requests to test API functionality

### API Endpoints Included
- Health checks and system status
- Player state management
- Quest operations
- Chat interactions
- Game actions and scoring

## 📝 CLI Usage Examples

### Basic Commands
```bash
# Check system status
npm run dev:cli -- status

# Interactive chat session
npm run dev:cli -- chat -i

# Set player score
npm run dev:cli -- set-score 250

# Start a quest
npm run dev:cli -- start-quest global-meeting
```

### Advanced Usage
```bash
# View conversation history
npm run dev:cli -- history --number 20

# Configure CLI settings
npm run dev:cli -- config show
npm run dev:cli -- config engineUrl http://localhost:3000

# Quest management
npm run dev:cli -- quests
npm run dev:cli -- start-quest
```

## 🎮 Sample Quest Flows

### Council of Three Realms (Global Meeting)
```bash
# Start the timezone coordination quest
npm run dev:cli -- start-quest global-meeting

# Check quest progress
npm run dev:cli -- quests

# Interact with quest narrative
npm run dev:cli -- chat "What do I need to coordinate this meeting?"
```

### Dungeon Keeper's Vigil (Server Health)
```bash
# Begin server monitoring quest
npm run dev:cli -- start-quest server-health

# Learn about system monitoring
npm run dev:cli -- chat "How do I check server health?"
```

## 🔧 Development Examples

### Testing API Manually
```bash
# Health check
curl http://localhost:3000/health

# Get player state
curl http://localhost:3000/api/state/example-player

# Execute game action
curl -X POST http://localhost:3000/api/actions/example-player \
  -H "Content-Type: application/json" \
  -d '{"type":"SET_SCORE","payload":{"score":100},"playerId":"example-player"}'
```

## 📈 Adding New Examples

When contributing new examples:
1. Place in appropriate subdirectory
2. Include clear documentation
3. Test examples before committing
4. Update this README with descriptions

# Enhanced Quest Step Object Model - Lodge E-Commerce Example

This directory contains a comprehensive demonstration of the enhanced quest step object model through a realistic business scenario: setting up an e-commerce platform for a mountain resort lodge.

## Files Overview

### 📋 [`lodge-ecommerce-quest.json`](./lodge-ecommerce-quest.json)
The main quest definition showcasing all enhanced quest step features:
- **7 comprehensive steps** covering the full e-commerce implementation lifecycle
- **Rich metadata** with difficulty progression, categories, and skill mapping
- **Diverse execution types** (manual, automated, hybrid)
- **Comprehensive resources** (documentation, tools, examples)
- **Advanced validation** methods (criteria, checklists, tests)
- **Progress tracking** with attempts, notes, and artifacts

### 📖 [`lodge-quest-implementation-guide.md`](./lodge-quest-implementation-guide.md)
Detailed explanation of how the quest exercises each feature of the enhanced quest step object model:
- Feature mapping and usage examples
- Implementation patterns and best practices
- Integration strategies with existing quest systems
- Business value demonstration

### 🎮 [`lodge-quest-demo.js`](./lodge-quest-demo.js)
Interactive demonstration script showing:
- Quest overview with enhanced metadata display
- Detailed step information rendering
- Execution simulation for different step types
- Progress tracking and analytics
- Skills development visualization

## Quest Highlights

### 🏔️ **Alpine Retreat E-Commerce Setup**
Transform a traditional mountain lodge into a modern e-commerce platform offering:
- Room booking and availability management
- Activity and equipment rental integration
- Retail merchandise sales
- Guest experience personalization
- Comprehensive payment processing

### 📊 **Quest Metrics**
- **Total Points:** 620 points
- **Estimated Duration:** 2-3 weeks
- **Difficulty Levels:** Easy → Medium → Hard progression
- **Categories:** Research, Development, Security, DevOps, Coordination
- **Real-World Skills:** 5+ professional competencies

## Enhanced Features Demonstrated

### 1. **Rich Metadata System**
```json
{
  "metadata": {
    "difficulty": "hard",
    "category": "development",
    "tags": ["architecture", "microservices", "scalability"],
    "points": 100,
    "estimatedDuration": "3-4 days",
    "prerequisites": ["lodge-requirements-analysis"],
    "realWorldSkill": "System Architecture Design"
  }
}
```

### 2. **Comprehensive Resource Management**
```json
{
  "resources": {
    "docs": [/* Industry guides, compliance docs, templates */],
    "tools": [/* Design tools, databases, APIs */],
    "examples": [/* Case studies, implementations */]
  }
}
```

### 3. **Flexible Execution Types**
- **Manual:** Creative/strategic work requiring human judgment
- **Automated:** Testing and validation with measurable outcomes
- **Hybrid:** Guided workflows combining both approaches

### 4. **Advanced Validation Methods**
- **Criteria-based:** Specific deliverables and quality standards
- **Checklist:** Step-by-step verification processes
- **Test-driven:** Automated quality assurance and benchmarks

### 5. **Progress Tracking**
- Attempt counting for difficulty analysis
- Note-taking for learning capture
- Artifact collection for portfolio building

## Business Value

### 🎯 **Professional Skill Development**
Each step maps to real-world professional competencies:
- **Technical:** System design, API integration, testing
- **Business:** Requirements analysis, stakeholder management
- **Operational:** Monitoring, incident response, documentation

### 🏆 **Portfolio Building**
Quest completion generates tangible career assets:
- Architecture diagrams and technical documentation
- Tested code implementations and integrations
- Compliance assessments and security reviews
- Launch preparation and operational runbooks

### 🌐 **Industry Relevance**
The hospitality e-commerce scenario provides:
- Real-world complexity and constraints
- Industry-specific challenges and solutions
- Scalable patterns applicable to similar businesses
- Integration with existing systems and workflows

## Running the Demo

### Prerequisites
```bash
npm install chalk  # For colored console output
```

### Interactive Demo
```bash
node lodge-quest-demo.js
```

### Quest Analysis
```javascript
const LodgeQuestDemo = require('./lodge-quest-demo');
const demo = new LodgeQuestDemo();

// Show quest overview
demo.showQuestOverview();

// Analyze specific step
demo.showStepDetails(0);

// Show progress
demo.showProgressSummary();
```

## Integration with Existing System

### Loading the Quest
```javascript
// Load quest into the existing system
const questData = require('./lodge-ecommerce-quest.json');
await apiClient.createQuest(questData);
```

### Step Execution
```javascript
// Execute enhanced steps using existing launcher
const stepLauncher = new StepLauncher(apiClient);
await stepLauncher.launchStep(step, playerId);
```

### Progress Tracking
```javascript
// Enhanced progress analytics
const analyzer = new QuestProgressAnalyzer();
const metrics = analyzer.calculateLearningMetrics(quest);
```

## Key Innovations

### 🔄 **Backward Compatibility**
Enhanced steps work alongside legacy steps without breaking existing functionality.

### 📈 **Progressive Enhancement**
Teams can gradually adopt enhanced features without major system changes.

### 🎨 **Flexible Customization**
Resource types, execution methods, and validation criteria can be customized per organization.

### 📊 **Analytics Integration**
Rich metadata enables sophisticated learning analytics and skill tracking.

## Future Extensions

### 🤖 **AI Integration**
- Automated hint generation based on progress patterns
- Personalized resource recommendations
- Dynamic difficulty adjustment

### 🌍 **Multi-Language Support**
- Localized quest content and resources
- Cultural adaptation of business scenarios
- Region-specific compliance requirements

### 🔗 **External Integrations**
- Learning management system connectors
- Professional certification tracking
- Project management tool synchronization

---

## Conclusion

The Lodge E-Commerce quest demonstrates how the enhanced quest step object model transforms simple task lists into rich, educational experiences that bridge the gap between gamified learning and professional development. By combining realistic business scenarios with comprehensive learning support, the system creates engaging experiences that deliver genuine value to both individuals and organizations.

The enhanced model's flexibility allows organizations to create quests that match their specific needs while maintaining consistency in structure and user experience. This approach scales from simple training exercises to complex professional development programs, making it suitable for diverse applications across industries and skill levels.
