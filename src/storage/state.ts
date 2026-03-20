import type { Group, Id, NavItem, NavState, NavStateV1 } from './types';

const STORAGE_KEY = 'navState';

function now() {
  return Date.now();
}

function newId(): Id {
  return crypto.randomUUID();
}

export function createDefaultState(): NavStateV1 {
  const g1: Group = { id: newId(), title: '项目', collapsed: false, itemIds: [] };
  const g2: Group = { id: newId(), title: '基础设施', collapsed: false, itemIds: [] };

  const seed = (group: Group, item: Omit<NavItem, 'id' | 'createdAt' | 'updatedAt'>) => {
    const id = newId();
    const t = now();
    const full: NavItem = { id, createdAt: t, updatedAt: t, ...item };
    group.itemIds.push(id);
    return full;
  };

  const items: Record<Id, NavItem> = {};

  const i1 = seed(g1, {
    emoji: '🦊',
    name: 'GitLab',
    description: '代码与 Issue',
    url: 'https://gitlab.com',
  });
  const i2 = seed(g2, {
    emoji: '🧱',
    name: 'Jenkins',
    description: 'CI/CD',
    url: 'https://www.jenkins.io',
  });
  const i3 = seed(g2, {
    emoji: '📦',
    name: 'Nexus',
    description: '制品仓库',
    url: 'https://www.sonatype.com/products/sonatype-nexus-repository',
  });

  items[i1.id] = i1;
  items[i2.id] = i2;
  items[i3.id] = i3;

  return {
    schemaVersion: 1,
    groups: [g1, g2],
    groupOrder: [g1.id, g2.id],
    itemsById: items,
  };
}

export async function loadState(): Promise<NavState> {
  const raw = await chrome.storage.local.get(STORAGE_KEY);
  const stored = raw?.[STORAGE_KEY] as unknown;
  if (!stored) return createDefaultState();
  return migrateState(stored);
}

export async function saveState(state: NavState): Promise<void> {
  const plain = JSON.parse(JSON.stringify(state)) as NavState;
  await chrome.storage.local.set({ [STORAGE_KEY]: plain });
}

export function migrateState(input: unknown): NavState {
  const v = input as Partial<NavStateV1> | undefined | null;
  if (v?.schemaVersion === 1) {
    return normalizeV1(v);
  }
  return createDefaultState();
}

function normalizeV1(v: Partial<NavStateV1>): NavStateV1 {
  const rawGroups = Array.isArray(v.groups) ? v.groups : [];
  const itemsById = (v.itemsById && typeof v.itemsById === 'object' ? v.itemsById : {}) as Record<Id, NavItem>;

  let normalizedGroups: Group[] = rawGroups
    .filter((g): g is Group => !!g && typeof g.id === 'string' && typeof g.title === 'string')
    .map((g) => ({
      id: g.id,
      title: g.title,
      collapsed: !!g.collapsed,
      itemIds: Array.isArray(g.itemIds) ? g.itemIds.filter((id): id is string => typeof id === 'string') : [],
    }));

  // 兼容旧数据：有标签但是没有任何分组时，自动创建一个“未分组”把所有标签挂进去
  if (!normalizedGroups.length && Object.keys(itemsById).length) {
    const allIds = Object.keys(itemsById) as Id[];
    const g: Group = {
      id: newId(),
      title: '未分组',
      collapsed: false,
      itemIds: allIds,
    };
    normalizedGroups = [g];
  }

  let groupOrder: Id[];
  if (Array.isArray(v.groupOrder) && v.groupOrder.length) {
    groupOrder = v.groupOrder.filter((id): id is Id => typeof id === 'string');
  } else {
    groupOrder = normalizedGroups.map((g) => g.id);
  }

  return {
    schemaVersion: 1,
    groups: normalizedGroups,
    groupOrder,
    itemsById,
  };
}

