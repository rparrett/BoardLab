export class IndexedMap<K, V> {
  private items: V[] = [];
  private keyToIndex: Map<K, number> = new Map();
  private keyExtractor: (item: V) => K;

  constructor(items: V[] = [], keyExtractor: (item: V) => K) {
    this.keyExtractor = keyExtractor;
    this.setItems(items);
  }

  setItems(items: V[]): void {
    this.items = [...items];
    this.keyToIndex = new Map();

    this.items.forEach((item, index) => {
      const key = this.keyExtractor(item);
      this.keyToIndex.set(key, index);
    });
  }

  get(key: K): V | null {
    const index = this.keyToIndex.get(key);
    return index !== undefined ? this.items[index] : null;
  }

  getByIndex(index: number): V | null {
    return this.items[index] || null;
  }

  getIndex(key: K): number {
    return this.keyToIndex.get(key) ?? -1;
  }

  getNextKey(key: K): K | null {
    const currentIndex = this.getIndex(key);
    const nextIndex = currentIndex + 1;

    if (currentIndex === -1 || nextIndex >= this.items.length) {
      return null;
    }

    return this.keyExtractor(this.items[nextIndex]);
  }

  getPreviousKey(key: K): K | null {
    const currentIndex = this.getIndex(key);
    const previousIndex = currentIndex - 1;

    if (currentIndex === -1 || previousIndex < 0) {
      return null;
    }

    return this.keyExtractor(this.items[previousIndex]);
  }

  get size(): number {
    return this.items.length;
  }

  isEmpty(): boolean {
    return this.items.length === 0;
  }

  toArray(): V[] {
    return [...this.items];
  }
}
