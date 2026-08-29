<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  categories: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const GROUP_LABELS = {
  GENRE: '类型',
  MOOD: '心情',
  ERA: '年代',
  REGION: '地区',
  CHART: '榜单',
  FEATURE: '特色'
}
const GROUP_ORDER = ['GENRE', 'MOOD', 'ERA', 'REGION', 'CHART', 'FEATURE']

function categoryGroup(category) {
  if (category.type) return category.type
  const prefix = String(category.slug || '').split('-')[0].toUpperCase()
  return GROUP_ORDER.includes(prefix) ? prefix : ''
}

const groups = computed(() => {
  const byGroup = new Map()
  for (const category of props.categories) {
    const group = categoryGroup(category)
    if (!group) continue
    if (!byGroup.has(group)) byGroup.set(group, [])
    byGroup.get(group).push(category)
  }
  return GROUP_ORDER.filter((group) => byGroup.has(group)).map((group) => ({
    key: group,
    label: GROUP_LABELS[group],
    items: byGroup.get(group)
  }))
})

function isSelected(category) {
  return props.modelValue.includes(category.id)
}

function toggle(category) {
  const next = isSelected(category)
    ? props.modelValue.filter((id) => id !== category.id)
    : [...props.modelValue, category.id]
  emit('update:modelValue', next)
}

function clearAll() {
  emit('update:modelValue', [])
}
</script>

<template>
  <div class="tag-picker">
    <div v-for="group in groups" :key="group.key" class="tag-group">
      <span class="tag-group-label">{{ group.label }}</span>
      <div class="tag-chips">
        <label
          v-for="category in group.items"
          :key="category.id"
          class="tag-chip"
          :class="{ active: isSelected(category) }"
        >
          <input
            type="checkbox"
            :value="category.id"
            :checked="isSelected(category)"
            @change="toggle(category)"
          />
          <span>{{ category.name }}</span>
        </label>
      </div>
    </div>
    <div class="tag-footer">
      <p v-if="!groups.length" class="tag-empty">暂无可选标签，请先在「分类」页签中创建。</p>
      <template v-else>
        <span class="tag-count">已选 {{ modelValue.length }} 个标签</span>
        <button
          v-if="modelValue.length"
          type="button"
          class="tag-clear"
          @click="clearAll"
        >
          清除
        </button>
      </template>
    </div>
  </div>
</template>

<style scoped>
.tag-picker {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border: 1px solid rgba(25, 25, 25, 0.1);
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.42);
}

.tag-group {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.tag-group-label {
  flex: 0 0 auto;
  width: 42px;
  padding-top: 5px;
  color: var(--brand-strong, #e94e77);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1px;
}

.tag-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 7px;
}

.tag-chip {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: rgba(25, 25, 25, 0.06);
  color: var(--text-secondary, #6b7280);
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease;
}

.tag-chip input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

.tag-chip:focus-within {
  outline: 2px solid var(--brand, #ff699d);
  outline-offset: 2px;
}

.tag-chip:hover {
  color: var(--brand-strong, #e94e77);
  border-color: rgba(255, 105, 157, 0.35);
}

.tag-chip.active {
  background: var(--brand, #ff699d);
  border-color: var(--brand, #ff699d);
  color: #fff;
}

.tag-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding-top: 2px;
}

.tag-count {
  color: var(--text-muted, #9ca3af);
  font-size: 12px;
  font-weight: 700;
}

.tag-empty {
  margin: 0;
  color: var(--text-muted, #9ca3af);
  font-size: 12px;
}

.tag-clear {
  padding: 4px 10px;
  border: 0;
  border-radius: 999px;
  background: rgba(25, 25, 25, 0.08);
  color: var(--text-secondary, #6b7280);
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.tag-clear:hover {
  color: var(--brand-strong, #e94e77);
}
</style>
