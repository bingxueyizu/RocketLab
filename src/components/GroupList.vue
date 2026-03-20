<template>
  <div ref="rootEl" class="list">
    <div v-for="g in groups" :key="g.id" class="groupWrap" :data-group-id="g.id">
      <GroupCard
        :group="g"
        :items-by-id="itemsById"
        :edit-mode="editMode"
        @toggle-collapse="emit('toggleGroupCollapse', g.id)"
        @add-item="emit('addItem', g.id)"
        @edit-group="emit('editGroup', g.id)"
        @delete-group="emit('deleteGroup', g.id)"
        @open-item="(itemId) => emit('openItem', g.id, itemId)"
        @copy-item="(itemId) => emit('copyItem', g.id, itemId)"
        @edit-item="(itemId) => emit('editItem', g.id, itemId)"
        @delete-item="(itemId) => emit('deleteItem', g.id, itemId)"
        @reorder-items="(itemIds) => emit('reorderItems', g.id, itemIds)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import type { Group, Id, NavItem } from '@/storage/types';
import Sortable from 'sortablejs';
import GroupCard from './GroupCard.vue';

const props = defineProps<{
  groups: Group[];
  itemsById: Record<Id, NavItem>;
  editMode?: boolean;
}>();

const emit = defineEmits<{
  toggleGroupCollapse: [groupId: Id];
  addItem: [groupId: Id];
  editGroup: [groupId: Id];
  deleteGroup: [groupId: Id];
  openItem: [groupId: Id, itemId: Id];
  copyItem: [groupId: Id, itemId: Id];
  editItem: [groupId: Id, itemId: Id];
  deleteItem: [groupId: Id, itemId: Id];
  reorderGroups: [groupIds: Id[]];
  reorderItems: [groupId: Id, itemIds: Id[]];
}>();

const rootEl = ref<HTMLDivElement | null>(null);
let sortable: Sortable | null = null;

function destroySortable() {
  if (sortable) {
    sortable.destroy();
    sortable = null;
  }
}

function emitOrder() {
  const el = rootEl.value;
  if (!el) return;
  const ids = Array.from(el.querySelectorAll<HTMLElement>('[data-group-id]'))
    .map((n) => n.dataset.groupId)
    .filter((x): x is Id => !!x);
  emit('reorderGroups', ids);
  nextTick(() => {
    destroySortable();
    initSortable();
  });
}

function initSortable() {
  if (!props.editMode || !rootEl.value || props.groups.length === 0) return;
  destroySortable();
  sortable = Sortable.create(rootEl.value, {
    animation: 150,
    handle: '.groupDragHandle',
    draggable: '.groupWrap',
    onEnd: emitOrder,
  });
}

onMounted(() => {
  nextTick(() => initSortable());
});

watch(
  () => [props.groups.length, props.editMode] as const,
  () => nextTick(() => initSortable())
);

onBeforeUnmount(() => destroySortable());
</script>

<style scoped>
.list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
</style>

