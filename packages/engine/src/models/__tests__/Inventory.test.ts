import { Inventory, Item, InventoryStatus } from '@mymcp/types';
import { v4 as uuidv4 } from 'uuid';

describe('Inventory Model Tests', () => {
  describe('Inventory Creation', () => {
    test('should create empty inventory', () => {
      const inventory: Inventory = {
        items: [],
        capacity: 10,
        status: 'empty'
      };

      expect(inventory.items).toHaveLength(0);
      expect(inventory.capacity).toBe(10);
      expect(inventory.status).toBe('empty');
    });

    test('should create inventory with items', () => {
      const items: Item[] = [
        createTestItem({ name: 'Sword', type: 'tool' }),
        createTestItem({ name: 'Gold Coin', type: 'treasure' })
      ];

      const inventory: Inventory = {
        items,
        capacity: 10,
        status: 'has-item'
      };

      expect(inventory.items).toHaveLength(2);
      expect(inventory.status).toBe('has-item');
    });
  });

  describe('Inventory Status', () => {
    test('should determine correct inventory status', () => {
      const testCases = [
        { items: 0, capacity: 10, expected: 'empty' as InventoryStatus },
        { items: 5, capacity: 10, expected: 'has-item' as InventoryStatus },
        { items: 10, capacity: 10, expected: 'full' as InventoryStatus }
      ];

      testCases.forEach(({ items, capacity, expected }) => {
        const status = getInventoryStatus(items, capacity);
        expect(status).toBe(expected);
      });
    });
  });

  describe('Inventory Operations', () => {
    test('should add item to inventory', () => {
      const inventory = createTestInventory();
      const newItem = createTestItem({ name: 'Potion' });
      
      const result = addItemToInventory(inventory, newItem);
      expect(result.success).toBe(true);
      expect(result.inventory.items).toHaveLength(1);
      expect(result.inventory.status).toBe('has-item');
    });

    test('should not add item to full inventory', () => {
      const inventory = createTestInventory({
        items: Array(10).fill(null).map(() => createTestItem()),
        capacity: 10,
        status: 'full'
      });
      const newItem = createTestItem({ name: 'Overflow Item' });
      
      const result = addItemToInventory(inventory, newItem);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Inventory is full');
    });

    test('should remove item from inventory', () => {
      const itemToRemove = createTestItem({ name: 'Target Item' });
      const inventory = createTestInventory({
        items: [
          createTestItem({ name: 'Item 1' }),
          itemToRemove,
          createTestItem({ name: 'Item 3' })
        ],
        status: 'has-item'
      });
      
      const result = removeItemFromInventory(inventory, itemToRemove.id);
      expect(result.success).toBe(true);
      expect(result.inventory.items).toHaveLength(2);
      expect(result.inventory.items.find(i => i.id === itemToRemove.id)).toBeUndefined();
    });

    test('should handle removing non-existent item', () => {
      const inventory = createTestInventory({
        items: [createTestItem()],
        status: 'has-item'
      });
      
      const result = removeItemFromInventory(inventory, 'non-existent-id');
      expect(result.success).toBe(false);
      expect(result.error).toBe('Item not found');
    });
  });

  describe('Item Model', () => {
    test('should create valid items of each type', () => {
      const itemTypes: Array<Item['type']> = ['quest', 'tool', 'treasure'];
      
      itemTypes.forEach(type => {
        const item = createTestItem({ type });
        expect(item.type).toBe(type);
        expect(isValidItem(item)).toBe(true);
      });
    });

    test('should validate item properties', () => {
      const validItem = createTestItem({
        name: 'Valid Item',
        description: 'A valid item description'
      });
      expect(isValidItem(validItem)).toBe(true);

      const invalidItems = [
        createTestItem({ name: '' }),
        createTestItem({ description: '' }),
        { ...createTestItem(), id: '' }
      ];

      invalidItems.forEach(item => {
        expect(isValidItem(item)).toBe(false);
      });
    });
  });

  describe('Inventory Queries', () => {
    test('should find items by type', () => {
      const inventory = createTestInventory({
        items: [
          createTestItem({ type: 'tool', name: 'Sword' }),
          createTestItem({ type: 'tool', name: 'Shield' }),
          createTestItem({ type: 'treasure', name: 'Gold' }),
          createTestItem({ type: 'quest', name: 'Key' })
        ],
        status: 'has-item'
      });

      const tools = findItemsByType(inventory, 'tool');
      expect(tools).toHaveLength(2);
      expect(tools.every(item => item.type === 'tool')).toBe(true);

      const treasures = findItemsByType(inventory, 'treasure');
      expect(treasures).toHaveLength(1);
      expect(treasures[0].name).toBe('Gold');
    });

    test('should calculate inventory value', () => {
      const inventory = createTestInventory({
        items: [
          createTestItem({ type: 'treasure', name: 'Gold Coin' }),
          createTestItem({ type: 'treasure', name: 'Ruby' }),
          createTestItem({ type: 'tool', name: 'Sword' })
        ],
        status: 'has-item'
      });

      const value = calculateInventoryValue(inventory);
      expect(value).toBeGreaterThan(0);
    });

    test('should check if inventory has specific item', () => {
      const targetItem = createTestItem({ name: 'Magic Sword' });
      const inventory = createTestInventory({
        items: [targetItem, createTestItem({ name: 'Shield' })],
        status: 'has-item'
      });

      expect(hasItem(inventory, targetItem.id)).toBe(true);
      expect(hasItem(inventory, 'non-existent-id')).toBe(false);
    });
  });

  describe('Inventory Capacity Management', () => {
    test('should calculate remaining capacity', () => {
      const inventory = createTestInventory({
        items: Array(3).fill(null).map(() => createTestItem()),
        capacity: 10,
        status: 'has-item'
      });

      const remaining = getRemainingCapacity(inventory);
      expect(remaining).toBe(7);
    });

    test('should check if can add multiple items', () => {
      const inventory = createTestInventory({
        items: Array(7).fill(null).map(() => createTestItem()),
        capacity: 10,
        status: 'has-item'
      });

      expect(canAddItems(inventory, 3)).toBe(true);
      expect(canAddItems(inventory, 4)).toBe(false);
    });
  });
});

// Helper functions
function createTestInventory(overrides: Partial<Inventory> = {}): Inventory {
  return {
    items: [],
    capacity: 10,
    status: 'empty',
    ...overrides
  };
}

function createTestItem(overrides: Partial<Item> = {}): Item {
  return {
    id: uuidv4(),
    name: 'Test Item',
    description: 'A test item',
    type: 'treasure',
    ...overrides
  };
}

function getInventoryStatus(itemCount: number, capacity: number): InventoryStatus {
  if (itemCount === 0) return 'empty';
  if (itemCount >= capacity) return 'full';
  return 'has-item';
}

function addItemToInventory(inventory: Inventory, item: Item): {
  success: boolean;
  inventory: Inventory;
  error?: string;
} {
  if (inventory.items.length >= inventory.capacity) {
    return { success: false, inventory, error: 'Inventory is full' };
  }

  const newItems = [...inventory.items, item];
  const newInventory: Inventory = {
    ...inventory,
    items: newItems,
    status: getInventoryStatus(newItems.length, inventory.capacity)
  };

  return { success: true, inventory: newInventory };
}

function removeItemFromInventory(inventory: Inventory, itemId: string): {
  success: boolean;
  inventory: Inventory;
  error?: string;
} {
  const itemIndex = inventory.items.findIndex(item => item.id === itemId);
  
  if (itemIndex === -1) {
    return { success: false, inventory, error: 'Item not found' };
  }

  const newItems = inventory.items.filter(item => item.id !== itemId);
  const newInventory: Inventory = {
    ...inventory,
    items: newItems,
    status: getInventoryStatus(newItems.length, inventory.capacity)
  };

  return { success: true, inventory: newInventory };
}

function isValidItem(item: Item): boolean {
  return !!(item.id && item.name && item.description && item.type);
}

function findItemsByType(inventory: Inventory, type: Item['type']): Item[] {
  return inventory.items.filter(item => item.type === type);
}

function calculateInventoryValue(inventory: Inventory): number {
  const values: Record<Item['type'], number> = {
    treasure: 100,
    tool: 50,
    quest: 0
  };
  
  return inventory.items.reduce((total, item) => {
    return total + (values[item.type] || 0);
  }, 0);
}

function hasItem(inventory: Inventory, itemId: string): boolean {
  return inventory.items.some(item => item.id === itemId);
}

function getRemainingCapacity(inventory: Inventory): number {
  return inventory.capacity - inventory.items.length;
}

function canAddItems(inventory: Inventory, count: number): boolean {
  return getRemainingCapacity(inventory) >= count;
} 