import type { NavState } from './types';
import { migrateState } from './state';

export function exportStateToJson(state: NavState): string {
  return JSON.stringify(state, null, 2);
}

export function importStateFromJson(jsonText: string): NavState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('导入失败：不是合法的 JSON');
  }
  return migrateState(parsed);
}

