<template>
  <div v-if="open" class="overlay" @keydown.esc.prevent="emit('cancel')">
    <div ref="dialogEl" class="dialog" role="dialog" aria-modal="true">
      <div class="header">
        <div class="title">{{ title }}</div>
      </div>

      <div class="body">
        <div class="grid">
          <label class="field">
            <div class="label">表情（可选）</div>
            <input v-model="draft.emoji" class="input" type="text" maxlength="8" autocomplete="off" />
          </label>

          <label class="field">
            <div class="label">名称</div>
            <input v-model="draft.name" class="input" type="text" autocomplete="off" />
          </label>

          <label class="field">
            <div class="label">跳转地址</div>
            <input v-model="draft.url" class="input" type="text" placeholder="https://..." autocomplete="off" />
          </label>

          <label class="field">
            <div class="label">描述（可选）</div>
            <textarea v-model="draft.description" class="textarea" rows="3" />
          </label>
        </div>

        <div v-if="error" class="error">{{ error }}</div>
      </div>

      <div class="footer">
        <button class="btn ghost" type="button" @click="emit('cancel')">取消</button>
        <button class="btn" type="button" @click="submit">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { nextTick, reactive, ref, watch } from 'vue';

export type ItemDraft = {
  emoji?: string;
  name: string;
  url: string;
  description?: string;
};

const props = defineProps<{
  open: boolean;
  title: string;
  initial?: Partial<ItemDraft>;
  normalizeUrl: (url: string) => string;
}>();

const emit = defineEmits<{
  cancel: [];
  save: [draft: ItemDraft];
  dialogHeight: [height: number];
}>();

const draft = reactive<ItemDraft>({
  emoji: '',
  name: '',
  url: '',
  description: '',
});

const error = ref<string | null>(null);
const dialogEl = ref<HTMLDivElement | null>(null);

watch(
  () => [props.open, props.initial] as const,
  ([isOpen, initial]) => {
    if (!isOpen) return;
    error.value = null;
    draft.emoji = initial?.emoji ?? '';
    draft.name = initial?.name ?? '';
    draft.url = initial?.url ?? '';
    draft.description = initial?.description ?? '';
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
  error.value = null;
  try {
    const normalized = props.normalizeUrl(draft.url);
    emit('save', {
      emoji: draft.emoji,
      name: draft.name,
      url: normalized,
      description: draft.description,
    });
  } catch (e) {
    error.value = e instanceof Error ? e.message : String(e);
  }
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
  min-width: 0;
}
.grid {
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}
.label {
  font-size: 12px;
  color: var(--muted);
}
.input,
.textarea {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
  border-radius: 10px;
  padding: 10px 12px;
  border: 1px solid var(--border);
  background: #fff;
  color: var(--fg);
  outline: none;
  resize: vertical;
  font-size: 13px;
}
.textarea {
  min-height: 72px;
}
.input:focus,
.textarea:focus {
  border-color: rgba(59, 130, 246, 0.55);
}
.error {
  margin-top: 10px;
  font-size: 12px;
  color: var(--dangerFg);
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

