/**
 * Mock do Firebase Admin SDK para testes.
 * Substitui a conexão real do Firestore, evitando impacto em produção.
 */

type DocData = Record<string, any>;

interface MockDocSnapshot {
  id: string;
  exists: boolean;
  data(): DocData | undefined;
  ref: MockDocumentReference;
}

interface MockDocumentReference {
  id: string;
  get(): Promise<MockDocSnapshot>;
  update(data: DocData): Promise<void>;
  delete(): Promise<void>;
  set(data: DocData): Promise<void>;
  collection(name: string): MockCollection;
}

interface MockQuerySnapshot {
  empty: boolean;
  size: number;
  docs: MockDocSnapshot[];
}

interface MockQuery {
  where(field: string, op: string, value: any): MockQuery;
  orderBy(field: string, direction?: string): MockQuery;
  limit(n: number): MockQuery;
  get(): Promise<MockQuerySnapshot>;
}

interface MockCollection {
  doc(id?: string): MockDocumentReference;
  add(data: DocData): Promise<MockDocumentReference>;
  where(field: string, op: string, value: any): MockQuery;
  orderBy(field: string, direction?: string): MockQuery;
  limit(n: number): MockQuery;
  get(): Promise<MockQuerySnapshot>;
}

interface MockBatch {
  update(ref: MockDocumentReference, data: DocData): MockBatch;
  set(ref: MockDocumentReference, data: DocData): MockBatch;
  delete(ref: MockDocumentReference): MockBatch;
  commit(): Promise<void>;
}

interface MockFieldValue {
  serverTimestamp(): Date;
  increment(n: number): number;
  arrayUnion(...items: any[]): any[];
}

const store = new Map<string, DocData>();

let idCounter = 0;
function genId(): string {
  idCounter++;
  return `mock-${idCounter}`;
}

function now(): Date {
  return new Date();
}

export const FieldValue: MockFieldValue = {
  serverTimestamp: () => now(),
  increment: (n: number) => n,
  arrayUnion: (...items: any[]) => items,
};

function makeRef(id: string, col: string): MockDocumentReference {
  return {
    id,
    async get() {
      const data = store.get(`${col}/${id}`);
      return {
        id,
        exists: !!data,
        data: () => data,
        ref: makeRef(id, col),
      };
    },
    async update(updates) {
      const existing = store.get(`${col}/${id}`) || {};
      store.set(`${col}/${id}`, { ...existing, ...updates });
    },
    async delete() {
      store.delete(`${col}/${id}`);
    },
    async set(data) {
      store.set(`${col}/${id}`, data);
    },
    collection(name) {
      return makeCollection(`${col}/${id}/${name}`);
    },
  };
}

function makeCollection(path: string): MockCollection {
  return {
    doc(id?: string) {
      const docId = id || genId();
      return makeRef(docId, path);
    },
    async add(data) {
      const docId = genId();
      store.set(`${path}/${docId}`, data);
      return makeRef(docId, path);
    },
    where(field, op, value) {
      return makeQuery(path, field, op, value);
    },
    orderBy() {
      return makeQuery(path);
    },
    limit() {
      return makeQuery(path);
    },
    async get() {
      return makeQuery(path).get();
    },
  };
}

function makeQuery(path: string, filterField?: string, filterOp?: string, filterValue?: any): MockQuery {
  return {
    where(field, op, value) {
      filterField = field;
      filterOp = op;
      filterValue = value;
      return makeQuery(path, field, op, value);
    },
    orderBy() {
      return makeQuery(path, filterField, filterOp, filterValue);
    },
    limit() {
      return makeQuery(path, filterField, filterOp, filterValue);
    },
    async get() {
      const docs: MockDocSnapshot[] = [];
      for (const [key, data] of store.entries()) {
        if (!key.startsWith(path)) continue;
        const id = key.replace(`${path}/`, '');
        if (filterField && filterOp === '==' && data[filterField] !== filterValue) {
          continue;
        }
        docs.push({
          id,
          exists: true,
          data: () => data,
          ref: makeRef(id, path),
        });
      }
      return {
        empty: docs.length === 0,
        size: docs.length,
        docs,
      };
    },
  };
}

export const db: MockCollection = makeCollection('') as any;

export function resetMocks(): void {
  store.clear();
  idCounter = 0;
}

export function seed(collection: string, data: DocData[]): void {
  data.forEach(d => {
    const id = d.id || genId();
    store.set(`${collection}/${id}`, { ...d, id: undefined });
  });
}

export function getStore(): Map<string, DocData> {
  return store;
}