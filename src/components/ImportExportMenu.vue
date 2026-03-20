<template>
  <div class="menu">
    <input ref="fileInput" class="hidden" type="file" accept="application/json" @change="onPickFile" />

    <button class="btn" type="button" @click="emit('export')">导出</button>
    <button class="btn" type="button" @click="pickImport">导入</button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const emit = defineEmits<{
  export: [];
  import: [jsonText: string];
}>();

const fileInput = ref<HTMLInputElement | null>(null);

function pickImport() {
  fileInput.value?.click();
}

async function onPickFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  const text = await file.text();
  emit('import', text);
}
</script>

<style scoped>
.menu {
  display: flex;
  gap: 8px;
}
.hidden {
  display: none;
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

