<template>
  <div class="root">
    <header class="topbar">
      <div class="topRow">
        <div class="title">RocketLab 导航</div>
        <div class="headerRight">
          <span v-if="saveStatus === 'saving'" class="status">保存中…</span>
          <span v-else-if="saveStatus === 'saved'" class="status">已保存</span>
          <span v-else-if="saveStatus === 'error'" class="status error">保存失败</span>
          <button v-if="!isEditMode" class="btn" type="button" @click="isEditMode = true">编辑</button>
          <button v-else class="btn ghost" type="button" @click="isEditMode = false">预览</button>
        </div>
      </div>

      <div v-if="isEditMode" class="toolbar">
        <button class="btn" type="button" @click="openCreateGroup">新增分组</button>
        <button class="btn" type="button" @click="openCreateItemDefault">新增标签</button>
        <ImportExportMenu @export="onExport" @import="onImport" />
      </div>

      <div v-if="lastError" class="errorBanner">错误：{{ lastError }}</div>
    </header>

    <main class="content" :class="isEditMode ? 'content--edit' : 'content--preview'">
      <div v-if="!ready" class="skeleton">加载中…</div>
      <div v-else-if="orderedGroups.length === 0" class="emptyState">
        <div class="emptyTitle">还没有任何分组</div>
        <div class="emptyDesc">先创建一个分组，然后把 GitLab/Jenkins/Nexus 等常用入口加进来。</div>
        <button class="btn" type="button" @click="openCreateGroup">创建分组</button>
      </div>
      <GroupList v-else :groups="orderedGroups" :items-by-id="state.itemsById" :edit-mode="isEditMode"
        @toggle-group-collapse="onToggleGroupCollapse" @add-item="openCreateItem" @edit-group="openEditGroup"
        @delete-group="onDeleteGroup" @open-item="onOpenItem" @copy-item="onCopyItem" @edit-item="openEditItem"
        @delete-item="onDeleteItem" @reorder-groups="onReorderGroups" @reorder-items="onReorderItems" />
    </main>

    <GroupEditorDialog :open="groupDialog.open" :title="groupDialog.mode === 'create' ? '新增分组' : '编辑分组'"
      :initial-title="groupDialog.initialTitle" @cancel="closeGroupDialog" @save="submitGroupDialog"
      @dialog-height="onGroupDialogHeight" />

    <ItemEditorDialog :open="itemDialog.open" :title="itemDialog.mode === 'create' ? '新增标签' : '编辑标签'"
      :initial="itemDialog.initial" :normalize-url="normalizeUrl" @cancel="closeItemDialog" @save="submitItemDialog"
      @dialog-height="onItemDialogHeight" />
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue';
import GroupList from '@/components/GroupList.vue';
import GroupEditorDialog from '@/components/GroupEditorDialog.vue';
import ItemEditorDialog, { type ItemDraft } from '@/components/ItemEditorDialog.vue';
import ImportExportMenu from '@/components/ImportExportMenu.vue';
import type { Id } from '@/storage/types';
import { exportStateToJson, importStateFromJson } from '@/storage/transfer';
import { useNavState } from './useNavState';

const {
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
  reorderGroups,
  reorderItems,
} = useNavState();

const firstGroupId = computed<Id | null>(() => orderedGroups.value[0]?.id ?? null);
const isEditMode = ref(false);

const groupDialogHeight = ref(0);
const itemDialogHeight = ref(0);

function onGroupDialogHeight(h: number) {
  groupDialogHeight.value = h;
}
function onItemDialogHeight(h: number) {
  itemDialogHeight.value = h;
}

watch(
  [groupDialogHeight, itemDialogHeight],
  ([g, i]) => {
    const total = Math.max(g, i);
    document.body.style.minHeight = total ? `${total + 32}px` : '';
  },
  { immediate: true }
);

const groupDialog = reactive<{
  open: boolean;
  mode: 'create' | 'edit';
  groupId: Id | null;
  initialTitle: string;
}>({ open: false, mode: 'create', groupId: null, initialTitle: '' });

const itemDialog = reactive<{
  open: boolean;
  mode: 'create' | 'edit';
  groupId: Id | null;
  itemId: Id | null;
  initial?: Partial<ItemDraft>;
}>({ open: false, mode: 'create', groupId: null, itemId: null, initial: undefined });

function openCreateGroup() {
  groupDialog.open = true;
  groupDialog.mode = 'create';
  groupDialog.groupId = null;
  groupDialog.initialTitle = '';
}

function openEditGroup(groupId: Id) {
  const g = state.value.groups.find((x) => x.id === groupId);
  if (!g) return;
  groupDialog.open = true;
  groupDialog.mode = 'edit';
  groupDialog.groupId = groupId;
  groupDialog.initialTitle = g.title;
}

function closeGroupDialog() {
  groupDialog.open = false;
}

function submitGroupDialog(title: string) {
  if (groupDialog.mode === 'create') {
    addGroup(title);
  } else if (groupDialog.groupId) {
    updateGroup(groupDialog.groupId, { title });
  }
  closeGroupDialog();
}

function openCreateItem(groupId: Id) {
  itemDialog.open = true;
  itemDialog.mode = 'create';
  itemDialog.groupId = groupId;
  itemDialog.itemId = null;
  itemDialog.initial = { emoji: '', name: '', url: '', description: '' };
}

function openCreateItemDefault() {
  if (!firstGroupId.value) {
    openCreateGroup();
    return;
  }
  openCreateItem(firstGroupId.value);
}

function openEditItem(groupId: Id, itemId: Id) {
  const it = state.value.itemsById[itemId];
  if (!it) return;
  itemDialog.open = true;
  itemDialog.mode = 'edit';
  itemDialog.groupId = groupId;
  itemDialog.itemId = itemId;
  itemDialog.initial = {
    emoji: it.emoji,
    name: it.name,
    url: it.url,
    description: it.description,
  };
}

function onCopyItem(groupId: Id, itemId: Id) {
  const it = state.value.itemsById[itemId];
  if (!it) return;
  itemDialog.open = true;
  itemDialog.mode = 'create';
  itemDialog.groupId = groupId;
  itemDialog.itemId = null;
  itemDialog.initial = {
    emoji: it.emoji ?? '',
    name: it.name,
    url: it.url,
    description: it.description ?? '',
  };
}

function closeItemDialog() {
  itemDialog.open = false;
}

function submitItemDialog(draft: ItemDraft) {
  if (!itemDialog.groupId) return;
  if (itemDialog.mode === 'create') {
    addItem(itemDialog.groupId, draft);
  } else if (itemDialog.itemId) {
    updateItem(itemDialog.itemId, draft);
  }
  closeItemDialog();
}

function onToggleGroupCollapse(groupId: Id) {
  const g = state.value.groups.find((x) => x.id === groupId);
  if (!g) return;
  updateGroup(groupId, { collapsed: !g.collapsed });
}

function onDeleteGroup(groupId: Id) {
  if (!confirm('删除分组会同时删除分组内所有标签，确定吗？')) return;
  deleteGroup(groupId);
}

function onOpenItem(_groupId: Id, itemId: Id) {
  const it = state.value.itemsById[itemId];
  if (!it) return;
  openUrl(it.url);
}

function onDeleteItem(groupId: Id, itemId: Id) {
  if (!confirm('确定删除这个标签吗？')) return;
  deleteItem(groupId, itemId);
}

function onReorderGroups(groupIds: Id[]) {
  reorderGroups(groupIds);
}

function onReorderItems(groupId: Id, itemIds: Id[]) {
  reorderItems(groupId, itemIds);
}

function onExport() {
  const json = exportStateToJson(state.value);
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  downloadText(`rocketlab-nav-${stamp}.json`, json);
}

function onImport(jsonText: string) {
  if (!confirm('导入会覆盖当前所有分组与标签，确定继续吗？')) return;
  try {
    const next = importStateFromJson(jsonText);
    replaceState(next);
  } catch (e) {
    alert(e instanceof Error ? e.message : String(e));
  }
}

function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
</script>

<style>
:root {
  --bg: #f6f7fb;
  --fg: #0f172a;
  --muted: rgba(15, 23, 42, 0.62);
  --muted2: rgba(15, 23, 42, 0.45);
  --card: #ffffff;
  --border: rgba(15, 23, 42, 0.12);
  --border2: rgba(15, 23, 42, 0.08);
  --shadow: 0 10px 30px rgba(15, 23, 42, 0.08);
  --btnBg: rgba(15, 23, 42, 0.04);
  --btnHover: rgba(15, 23, 42, 0.07);
  --dangerBg: rgba(239, 68, 68, 0.08);
  --dangerBorder: rgba(239, 68, 68, 0.22);
  --dangerFg: #b91c1c;
}

html {
  box-sizing: border-box;
  height: auto;
  overflow-y: auto;
  /* Chrome popup 最大宽度 713px，尽量占满,本来是727px，需要给浏览器的Y向滚动轴预留位置，否则会出现横向滚动轴 */
  width: 713px;
}

body {
  margin: 0;
  padding: 0;
  /* 最小宽度：小窗口时不再缩小 */
  min-width: 360px;
  /* 高度最少够内容区使用（弹窗高度另外由 manifest / 浏览器控制上限） */
  min-height: 320px;
  /* 固定使用 713px 宽度，不再变窄 */
  width: 713px;
  max-width: 713px;
  overflow-y: auto;
  overflow-x: hidden;
  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica,
    Arial, "Apple Color Emoji", "Segoe UI Emoji";
  background: var(--bg);
  color: var(--fg);
  box-sizing: border-box;
}

#app {
  min-width: 360px;
  min-height: 320px;
  width: 100%;
}

.root {
  min-width: 360px;
  min-height: 320px;
  width: 100%;
}

.topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  padding: 12px 12px 8px;
  border-bottom: 1px solid var(--border2);
  /* 覆盖 body 背景，避免滚动时透出下层内容 */
  background: var(--bg);
}

.topRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.title {
  font-size: 14px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.headerRight {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status {
  font-size: 12px;
  color: var(--muted);
}

.status.error {
  color: var(--dangerFg);
}

.btn.ghost {
  background: transparent;
  border-color: var(--border2);
}

.toolbar {
  margin-top: 10px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.errorBanner {
  margin-top: 10px;
  font-size: 12px;
  padding: 8px 10px;
  border-radius: 12px;
  background: var(--dangerBg);
  border: 1px solid var(--dangerBorder);
  color: var(--dangerFg);
}

.skeleton {
  padding: 10px;
  font-size: 12px;
  color: var(--muted);
  border: 1px dashed var(--border);
  border-radius: 12px;
}

.content {
  padding: 12px;
  /* 占据除头部外的剩余高度，并单独滚动 */
  flex: 1 1 auto;
  overflow-y: auto;
  overflow-x: hidden;
}

/* 预览 / 编辑模式下，通过样式显式控制内容区域高度 */
.content.content--edit {
  height: 427px;
}

.content.content--preview {
  height: 469px;
}

.fallback {
  margin-top: 12px;
  padding: 10px;
  border-radius: 14px;
  border: 1px dashed var(--border);
  background: rgba(245, 158, 11, 0.08);
}

.fallbackTitle {
  font-size: 12px;
  font-weight: 700;
  margin-bottom: 6px;
}

.fallbackGroup {
  font-size: 12px;
  color: var(--muted);
  padding: 3px 0;
}

.emptyState {
  padding: 12px;
  border-radius: 14px;
  border: 1px dashed var(--border);
  background: var(--btnBg);
}

.emptyTitle {
  font-size: 13px;
  font-weight: 750;
}

.emptyDesc {
  margin-top: 6px;
  margin-bottom: 10px;
  font-size: 12px;
  color: var(--muted);
  line-height: 1.35;
}

.btn {
  border: 1px solid var(--border);
  background: var(--btnBg);
  color: var(--fg);
  border-radius: 10px;
  padding: 6px 10px;
  font-size: 12px;
  cursor: pointer;
}

.btn:hover {
  background: var(--btnHover);
}
</style>
