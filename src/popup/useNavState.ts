import { computed, onMounted, ref, watch } from 'vue';
import type { Group, Id, NavItem, NavState } from '@/storage/types';
import { createDefaultState, loadState, saveState } from '@/storage/state';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

function now() {
  return Date.now();
}

function newId(): Id {
  return crypto.randomUUID();
}

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) throw new Error('URL 不能为空');
  const withScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(trimmed) ? trimmed : `https://${trimmed}`;
  // eslint-disable-next-line no-new
  new URL(withScheme);
  return withScheme;
}

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let t: number | undefined;
  return (...args: Parameters<T>) => {
    if (t) window.clearTimeout(t);
    t = window.setTimeout(() => fn(...args), ms);
  };
}

export function useNavState() {
  const state = ref<NavState>(createDefaultState());
  const ready = ref(false);
  const saveStatus = ref<SaveStatus>('idle');
  const lastError = ref<string | null>(null);

  const groupsById = computed(() => {
    const m = new Map<Id, Group>();
    for (const g of state.value.groups) m.set(g.id, g);
    return m;
  });

  const orderedGroups = computed(() => {
    const byId = groupsById.value;
    const ordered: Group[] = [];
    for (const id of state.value.groupOrder) {
      const g = byId.get(id);
      if (g) ordered.push(g);
    }
    for (const g of state.value.groups) {
      if (!ordered.find((x) => x.id === g.id)) ordered.push(g);
    }
    return ordered;
  });

  const persist = debounce(async () => {
    try {
      saveStatus.value = 'saving';
      await saveState(state.value);
      saveStatus.value = 'saved';
      window.setTimeout(() => {
        if (saveStatus.value === 'saved') saveStatus.value = 'idle';
      }, 800);
    } catch (e) {
      saveStatus.value = 'error';
      lastError.value = e instanceof Error ? e.message : String(e);
    }
  }, 250);

  onMounted(async () => {
    try {
      state.value = await loadState();
      ready.value = true;
    } catch (e) {
      lastError.value = e instanceof Error ? e.message : String(e);
      ready.value = true;
    }
  });

  watch(
    state,
    () => {
      if (!ready.value) return;
      persist();
    },
    { deep: true }
  );

  function replaceState(next: NavState) {
    state.value = next;
    ready.value = true;
    lastError.value = null;
    persist();
  }

  function ensureGroupOrder() {
    const ids = new Set(state.value.groups.map((g) => g.id));
    state.value.groupOrder = state.value.groupOrder.filter((id) => ids.has(id));
    for (const g of state.value.groups) {
      if (!state.value.groupOrder.includes(g.id)) state.value.groupOrder.push(g.id);
    }
  }

  function addGroup(title: string) {
    const t = title.trim() || '未命名分组';
    const g: Group = { id: newId(), title: t, collapsed: false, itemIds: [] };
    state.value.groups.push(g);
    state.value.groupOrder.push(g.id);
  }

  function updateGroup(groupId: Id, patch: Partial<Pick<Group, 'title' | 'collapsed'>>) {
    const g = state.value.groups.find((x) => x.id === groupId);
    if (!g) return;
    if (patch.title !== undefined) g.title = patch.title.trim() || g.title;
    if (patch.collapsed !== undefined) g.collapsed = patch.collapsed;
  }

  function deleteGroup(groupId: Id) {
    const idx = state.value.groups.findIndex((g) => g.id === groupId);
    if (idx < 0) return;
    const g = state.value.groups[idx];
    for (const itemId of g.itemIds) {
      delete state.value.itemsById[itemId];
    }
    state.value.groups.splice(idx, 1);
    state.value.groupOrder = state.value.groupOrder.filter((id) => id !== groupId);
    ensureGroupOrder();
  }

  function addItem(groupId: Id, item: { emoji?: string; name: string; description?: string; url: string }) {
    const group = state.value.groups.find((g) => g.id === groupId);
    if (!group) throw new Error('分组不存在');
    const id = newId();
    const t = now();
    const url = normalizeUrl(item.url);
    const full: NavItem = {
      id,
      emoji: item.emoji?.trim() || undefined,
      name: item.name.trim() || '未命名',
      description: item.description?.trim() || undefined,
      url,
      createdAt: t,
      updatedAt: t,
    };
    state.value.itemsById[id] = full;
    group.itemIds.unshift(id);
  }

  function updateItem(itemId: Id, patch: Partial<Pick<NavItem, 'emoji' | 'name' | 'description' | 'url'>>) {
    const it = state.value.itemsById[itemId];
    if (!it) return;
    if (patch.emoji !== undefined) it.emoji = patch.emoji?.trim() || undefined;
    if (patch.name !== undefined) it.name = patch.name.trim() || it.name;
    if (patch.description !== undefined) it.description = patch.description?.trim() || undefined;
    if (patch.url !== undefined) it.url = normalizeUrl(patch.url);
    it.updatedAt = now();
  }

  function deleteItem(groupId: Id, itemId: Id) {
    const g = state.value.groups.find((x) => x.id === groupId);
    if (!g) return;
    g.itemIds = g.itemIds.filter((id) => id !== itemId);
    delete state.value.itemsById[itemId];
  }

  function moveItem(itemId: Id, fromGroupId: Id, toGroupId: Id, toIndex: number) {
    const from = state.value.groups.find((g) => g.id === fromGroupId);
    const to = state.value.groups.find((g) => g.id === toGroupId);
    if (!from || !to) return;
    from.itemIds = from.itemIds.filter((id) => id !== itemId);
    const idx = Math.max(0, Math.min(toIndex, to.itemIds.length));
    to.itemIds.splice(idx, 0, itemId);
  }

  function reorderGroups(newOrder: Id[]) {
    state.value.groupOrder = newOrder;
    ensureGroupOrder();
  }

  function reorderItems(groupId: Id, newOrder: Id[]) {
    const g = state.value.groups.find((x) => x.id === groupId);
    if (!g) return;
    g.itemIds = newOrder;
  }

  function openUrl(url: string) {
    chrome.tabs.create({ url });
  }

  return {
    state,
    ready,
    orderedGroups,
    saveStatus,
    lastError,
    normalizeUrl,
    openUrl,
    replaceState,
    addGroup,
    updateGroup,
    deleteGroup,
    addItem,
    updateItem,
    deleteItem,
    moveItem,
    reorderGroups,
    reorderItems,
  };
}

