<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  modelValue: {
    type: String,
    default: ''
  },
  artists: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue'])

const keyword = ref('')
const open = ref(false)

const selectedArtist = computed(() =>
  props.artists.find((artist) => artist.id === props.modelValue)
)

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  if (!kw) return props.artists
  return props.artists.filter((artist) =>
    [artist.name, artist.region].some((value) =>
      String(value || '').toLowerCase().includes(kw)
    )
  )
})

function onInput(event) {
  keyword.value = event.target.value
  open.value = true
}

function select(artist) {
  emit('update:modelValue', artist.id)
  keyword.value = ''
  open.value = false
}

function clear() {
  emit('update:modelValue', '')
  keyword.value = ''
}
</script>

<template>
  <div class="artist-search">
    <div class="artist-search-control">
      <input
        :value="keyword"
        :placeholder="selectedArtist ? selectedArtist.name : '搜索歌手'"
        @focus="open = true"
        @input="onInput"
        @blur="open = false"
      />
      <button
        v-if="modelValue"
        type="button"
        class="artist-search-clear"
        aria-label="清除歌手"
        @mousedown.prevent="clear"
      >
        ×
      </button>
    </div>
    <div v-if="open" class="artist-search-dropdown">
      <p v-if="!filtered.length" class="artist-search-empty">未找到匹配歌手</p>
      <button
        v-for="artist in filtered"
        :key="artist.id"
        type="button"
        class="artist-search-item"
        :class="{ active: artist.id === modelValue }"
        @mousedown.prevent
        @click="select(artist)"
      >
        <span>{{ artist.name }}</span>
        <small v-if="artist.region">{{ artist.region }}</small>
      </button>
    </div>
  </div>
</template>

<style scoped>
.artist-search {
  position: relative;
}

.artist-search-control {
  position: relative;
  display: flex;
  align-items: center;
}

.artist-search-control input {
  width: 100%;
  padding-right: 32px;
}

.artist-search-clear {
  position: absolute;
  right: 8px;
  border: none;
  background: transparent;
  font-size: 18px;
  line-height: 1;
  color: var(--text-muted, #9ca3af);
  cursor: pointer;
}

.artist-search-clear:hover {
  color: var(--brand-strong, #e94e77);
}

.artist-search-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  z-index: 100;
  max-height: 240px;
  overflow-y: auto;
  padding: 6px;
  border: 1px solid rgba(112, 72, 94, 0.16);
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.16);
}

.artist-search-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 8px;
  background: transparent;
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
}

.artist-search-item:hover {
  background: rgba(255, 105, 157, 0.08);
}

.artist-search-item.active {
  background: rgba(255, 105, 157, 0.14);
  color: var(--brand-strong, #e94e77);
  font-weight: 700;
}

.artist-search-item small {
  color: var(--text-muted, #9ca3af);
  font-size: 12px;
}

.artist-search-empty {
  margin: 0;
  padding: 10px;
  color: var(--text-muted, #9ca3af);
  font-size: 12px;
  text-align: center;
}
</style>
