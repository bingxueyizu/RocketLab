<template>
  <div class="row" :class="{ compact: !editMode, editing: editMode }">
    <div class="emoji">{{ item.emoji || '🔖' }}</div>
    <button class="main" type="button" @click="emit('open')">
      <div class="name" :title="item.name">{{ item.name }}</div>
      <div v-if="item.description" class="desc" :title="item.description">
        {{ previewDesc }}
      </div>
      <div v-else class="desc muted" :title="item.url">
        {{ previewDesc }}
      </div>
    </button>
    <div v-if="editMode" class="actions">
      <button class="icon" type="button" title="复制" @click="emit('copy')">📋</button>
      <button class="icon" type="button" title="编辑" @click="emit('edit')">✏️</button>
      <button class="icon" type="button" title="删除" @click="emit('delete')">🗑️</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { NavItem } from '@/storage/types';

const props = defineProps<{
  item: NavItem;
  editMode?: boolean;
}>();

const emit = defineEmits<{
  open: [];
  copy: [];
  edit: [];
  delete: [];
}>();

const MAX_PREVIEW_DESC = 30;

const previewDesc = computed(() => {
  const text = props.item.description || props.item.url || '';
  if (props.editMode) {
    return text;
  }
  if (text.length <= MAX_PREVIEW_DESC) {
    return text;
  }
  return text.slice(0, MAX_PREVIEW_DESC) + '…';
});
</script>

<style scoped>
.row {
  display: flex;
  align-items: stretch;
  gap: 8px;
  padding: 8px 8px;
  border-radius: 12px;
  border: 1px solid var(--border2);
  background: var(--btnBg);
  width: calc(100% - 48px);
}

.row:hover {
  background: var(--btnHover);
}

.row.compact {
  padding: 5px 6px;
  gap: 5px;
  border-radius: 10px;
  width: calc(100% - 14px);
}

.row.compact .emoji {
  width: 22px;
  font-size: 14px;
}

.row.compact .name {
  font-size: 12px;
  font-weight: 600;
}

.row.compact .desc {
  margin-top: 1px;
  font-size: 11px;
}


.emoji {
  width: 28px;
  display: grid;
  place-items: center;
  font-size: 16px;
  flex: none;
}

.main {
  flex: 1;
  min-width: 0;
  border: none;
  background: transparent;
  color: inherit;
  text-align: left;
  padding: 0;
  cursor: pointer;
}

.name {
  font-size: 13px;
  font-weight: 650;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.desc {
  margin-top: 2px;
  font-size: 12px;
  color: var(--muted);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.desc.muted {
  color: var(--muted2);
}

.actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.icon {
  border: 1px solid var(--border);
  background: var(--btnBg);
  color: inherit;
  border-radius: 10px;
  width: 30px;
  height: 30px;
  cursor: pointer;
}

.icon:hover {
  background: var(--btnHover);
}
</style>
