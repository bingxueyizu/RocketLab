<template>
  <div v-if="open" class="overlay" @keydown.esc.prevent="emit('cancel')">
    <div ref="dialogEl" class="dialog" role="dialog" aria-modal="true">
      <div class="header">
        <div class="title">{{ title }}</div>
      </div>

      <div class="body">
        <label class="field">
          <div class="label">分组名称</div>
          <input v-model="draftTitle" class="input" type="text" autocomplete="off" />
        </label>
      </div>

      <div class="footer">
        <button class="btn ghost" type="button" @click="emit('cancel')">取消</button>
        <button class="btn" type="button" @click="submit">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, ref, watch } from 'vue';

const props = defineProps<{
  open: boolean;
  title: string;
  initialTitle?: string;
}>();

const emit = defineEmits<{
  cancel: [];
  save: [title: string];
  dialogHeight: [height: number];
}>();

const draftTitle = ref(props.initialTitle ?? '');
const dialogEl = ref<HTMLDivElement | null>(null);

watch(
  () => [props.open, props.initialTitle] as const,
  ([isOpen, t]) => {
    if (isOpen) draftTitle.value = t ?? '';
  }
);

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      nextTick(() => {
        const h = dialogEl.value?.offsetHeight ?? 0;
        emit('dialogHeight', h);
      });
    } else {
      emit('dialogHeight', 0);
    }
  }
);

function submit() {
  emit('save', draftTitle.value);
}
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 16px;
  overflow: hidden;
  box-sizing: border-box;
}
.dialog {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: visible;
  box-shadow: var(--shadow);
  flex-shrink: 0;
  box-sizing: border-box;
  margin: auto;
}
.header {
  padding: 14px 14px 6px;
}
.title {
  font-size: 14px;
  font-weight: 700;
}
.body {
  padding: 10px 14px 14px;
  overflow: visible;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.label {
  font-size: 12px;
  color: var(--muted);
}
.input {
  width: 100%;
  box-sizing: border-box;
  border-radius: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--fg);
  outline: none;
  font-size: 13px;
}
.input:focus {
  border-color: rgba(59, 130, 246, 0.55);
}
.footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 14px 14px;
  border-top: 1px solid var(--border2);
}
.btn {
  border: 1px solid var(--border);
  background: var(--btnBg);
  color: var(--fg);
  border-radius: 10px;
  padding: 7px 10px;
  font-size: 12px;
  cursor: pointer;
}
.btn.ghost {
  background: transparent;
}
.btn:hover {
  background: var(--btnHover);
}
</style>

