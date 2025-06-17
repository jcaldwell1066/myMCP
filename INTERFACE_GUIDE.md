# Finding the EnhancedQuestStep Interface

## 📁 Location and Files

The `EnhancedQuestStep` interface is defined in multiple places:

### 1. **TypeScript Definition** (Original)
📄 `packages/engine/src/types/QuestStep.ts`
- Complete TypeScript interfaces with full type safety
- Needs to be compiled to JavaScript to use

### 2. **JavaScript Version** (Ready to Use)
📄 `packages/cli/src/questStepTypes.js`
- JavaScript version for immediate use
- Includes utility functions and sample data
- No compilation needed

### 3. **Test Script**
📄 `test-interface.js`
- Demonstrates how to use the interface
- Shows all available functions and properties

## 🚀 How to Use

### Option 1: Use JavaScript Version (Recommended for Testing)
```javascript
const { 
  isEnhancedQuestStep, 
  getStepPoints, 
  getStepDifficulty, 
  createSampleEnhancedStep,
  SAMPLE_ENHANCED_STEP 
} = require('./packages/cli/src/questStepTypes');

// Test if a step is enhanced
if (isEnhancedQuestStep(step)) {
  console.log(`Step "${step.title}" has ${step.metadata.points} points`);
}
```

### Option 2: Build TypeScript and Use Compiled Version
```bash
cd packages/engine
npm run build
```
Then import from `packages/engine/dist/types/QuestStep.js`

## 🧪 Test the Interface

Run the test script to verify everything works:
```bash
node test-interface.js
```

This will show you:
- ✅ Interface is accessible
- ✅ Type detection works
- ✅ Legacy compatibility maintained
- ✅ Enhanced features available
- ✅ Sample data structure complete

## 📋 Enhanced Step Structure

An enhanced quest step includes:

```javascript
{
  // Legacy compatibility
  id: "step-id",
  description: "Step description", 
  completed: false,
  
  // Enhanced features
  title: "Human-readable title",
  metadata: {
    difficulty: "easy" | "medium" | "hard",
    estimatedDuration: "15 minutes",
    category: "development" | "coordination" | etc,
    tags: ["javascript", "api"],
    points: 25,
    prerequisites: ["other-step-id"],
    realWorldSkill: "What you'll learn"
  },
  resources: {
    documentation: [{title, url, type, description}],
    tools: [{name, url, command, description, platform}],
    templates: [{name, filename, content, description}],
    codeExamples: [{language, filename, code, description}]
  },
  execution: {
    type: "manual" | "guided" | "automated" | "verification",
    launcher: {
      type: "url" | "command" | "file" | "checklist" | "editor",
      target: "what to launch",
      items: ["checklist items"],
      workingDirectory: "/path/to/work"
    },
    validation: {
      type: "checklist" | "test" | "output" | "confirmation",
      criteria: ["validation requirements"],
      automatedCheck: {command, expectedOutput, exitCode}
    },
    hints: ["helpful tips"]
  },
  progress: {
    startedAt: Date,
    completedAt: Date,
    attempts: 0,
    timeSpentMs: 0,
    notes: ["user notes"],
    artifacts: [{type, path, description, createdAt}]
  }
}
```

## 🎯 Ready to Use!

The interface is now available and ready to use. You can:

1. **Test it**: `node test-interface.js`
2. **Use in CLI**: `cd packages/cli && node enhanced-shell.js`
3. **Import in your code**: `require('./packages/cli/src/questStepTypes')`

The enhanced quest step system is fully functional! 🎉
