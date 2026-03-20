<template>
  <section class="card">
    <header class="header">
      <div v-if="editMode" class="groupDragHandle" title="拖拽排序分组">⋮⋮</div>
      <button class="collapse" type="button" @click="emit('toggleCollapse')">
        <span class="chev">{{ group.collapsed ? '▸' : '▾' }}</span>
        <span class="title">{{ group.title }}</span>
        <span class="count">{{ group.itemIds.length }}</span>
      </button>

      <div v-if="editMode" class="headerActions">
        <button class="mini" type="button" title="新增标签" @click="emit('addItem')">＋</button>
        <button class="mini" type="button" title="重命名" @click="emit('editGroup')">✏️</button>
        <button class="mini danger" type="button" title="删除分组" @click="emit('deleteGroup')">🗑️</button>
      </div>
    </header>

    <div v-if="!group.collapsed" class="items" :class="{ itemsPreview: !editMode }">
      <div v-if="visibleItems.length === 0" class="empty">这个分组还没有标签</div>
      <div v-if="visibleItems.length" ref="itemsEl" class="itemList" :class="{ itemListPreview: !editMode }">
        <div v-for="itemId in group.itemIds" :key="itemId" class="itemWrap" :data-item-id="itemId">
          <div v-if="editMode" class="itemDragHandle" title="拖拽排序标签">⋮⋮</div>
          <ItemRow v-if="itemsById[itemId]" :item="itemsById[itemId]" :edit-mode="editMode"
            @open="emit('openItem', itemId)" @copy="emit('copyItem', itemId)" @edit="emit('editItem', itemId)"
            @delete="emit('deleteItem', itemId)" />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Group, Id, NavItem } from '@/storage/types';
import Sortable from 'sortablejs';
import ItemRow from './ItemRow.vue';

const props = defineProps<{
  group: Group;
  itemsById: Record<Id, NavItem>;
  editMode?: boolean;
}>();

const emit = defineEmits<{
  toggleCollapse: [];
  addItem: [];
  editGroup: [];
  deleteGroup: [];
  openItem: [itemId: Id];
  copyItem: [itemId: Id];
  editItem: [itemId: Id];
  deleteItem: [itemId: Id];
  reorderItems: [itemIds: Id[]];
}>();

const visibleItems = computed(() =>
  props.group.itemIds.map((id) => props.itemsById[id]).filter((x): x is NavItem => !!x)
);

const itemsEl = ref<HTMLDivElement | null>(null);
let sortable: Sortable | null = null;

function destroySortable() {
  if (sortable) {
    sortable.destroy();
    sortable = null;
  }
}

function emitItemOrder() {
  const el = itemsEl.value;
  if (!el) return;
  const ids = Array.from(el.querySelectorAll<HTMLElement>('[data-item-id]'))
    .map((n) => n.dataset.itemId)
    .filter((x): x is Id => !!x);
  emit('reorderItems', ids);
  nextTick(() => {
    destroySortable();
    initSortable();
  });
}

function initSortable() {
  if (!props.editMode || !itemsEl.value || props.group.itemIds.length === 0) return;
  destroySortable();
  sortable = Sortable.create(itemsEl.value, {
    animation: 150,
    handle: '.itemDragHandle',
    draggable: '.itemWrap',
    onEnd: emitItemOrder,
  });
}

onMounted(() => {
  nextTick(() => initSortable());
});

watch(
  () => [props.group.itemIds.length, props.editMode] as const,
  () => nextTick(() => initSortable())
);

onBeforeUnmount(() => destroySortable());
</script>

<style scoped>
.card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
  box-shadow: var(--shadow);
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 8px 8px 10px;
  gap: 10px;
}

.groupDragHandle {
  width: 20px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--btnBg);
  cursor: grab;
  user-select: none;
  opacity: 0.8;
}

.groupDragHandle:active {
  cursor: grabbing;
}

.collapse {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  padding: 6px 6px;
  border-radius: 12px;
}

.collapse:hover {
  background: var(--btnBg);
}

.chev {
  width: 16px;
  opacity: 0.9;
}

.title {
  font-size: 13px;
  font-weight: 750;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.count {
  font-size: 11px;
  color: var(--muted);
  border: 1px solid var(--border);
  padding: 1px 6px;
  border-radius: 999px;
}

.headerActions {
  display: flex;
  gap: 6px;
  flex: none;
}

.mini {
  width: 30px;
  height: 30px;
  border-radius: 10px;
  border: 1px solid var(--border);
  background: var(--btnBg);
  color: inherit;
  cursor: pointer;
}

.mini:hover {
  background: var(--btnHover);
}

.mini.danger:hover {
  background: rgba(239, 68, 68, 0.12);
}

.items {
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.itemsPreview {
  padding: 6px 8px;
  gap: 6px;
}

.itemList {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.itemListPreview {
  /* 预览模式：两列网格展示，更紧凑美观 */
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 8px;
  row-gap: 8px;
}

.itemWrap {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.itemListPreview .itemWrap {
  min-width: 0;
}

.itemDragHandle {
  width: 20px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--btnBg);
  display: grid;
  place-items: center;
  cursor: grab;
  user-select: none;
  opacity: 0.75;
}

.itemDragHandle:active {
  cursor: grabbing;
}

.empty {
  padding: 10px;
  font-size: 12px;
  color: var(--muted);
  border: 1px dashed var(--border);
  border-radius: 12px;
}
</style>
