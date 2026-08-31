<script setup>
import { computed, onMounted, ref } from 'vue'
import { API_BASE_URL } from '../api'
import { useAdminAuthStore } from '../auth'

const auth = useAdminAuthStore()
const users = ref([])
const loading = ref(false)
const search = ref('')
const page = ref(1)
const pageSize = 10
const totalPages = ref(1)
const toast = ref(null)
let toastTimer = null

const apiOrigin = new URL(API_BASE_URL, window.location.origin).origin
const currentUserId = computed(() => auth.session?.user?.id)

function assetUrl(value) {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  return `${apiOrigin}${value}`
}

function formatDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

function initialOf(name) {
  return String(name || '?').charAt(0).toUpperCase()
}

function roleLabel(role) {
  return role === 'ADMIN' ? '管理员' : '用户'
}

function statusLabel(status) {
  return status === 'ACTIVE' ? '正常' : '已禁用'
}

function statusClass(status) {
  return status === 'ACTIVE' ? 'published' : 'unpublished'
}

function pushToast(message, type) {
  toast.value = { message, type }
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(
    () => {
      toast.value = null
    },
    type === 'error' ? 4500 : 2600
  )
}

function showError(requestError) {
  pushToast(requestError.message || '操作失败', 'error')
}

function showNotice(message) {
  pushToast(message, 'success')
}

async function loadUsers() {
  loading.value = true
  try {
    const params = new URLSearchParams({ page: String(page.value), pageSize: String(pageSize) })
    if (search.value.trim()) params.set('search', search.value.trim())
    const result = await auth.request(`/admin/users?${params}`)
    users.value = result.items
    totalPages.value = Math.max(1, result.pagination.totalPages)
  } catch (requestError) {
    showError(requestError)
  } finally {
    loading.value = false
  }
}

function applySearch() {
  page.value = 1
  void loadUsers()
}

async function setUserStatus(user) {
  const next = user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'
  const action = next === 'DISABLED' ? '禁用' : '启用'
  if (!window.confirm(`确定${action}用户「${user.username}」吗？`)) return
  try {
    await auth.request(`/admin/users/${user.id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: next })
    })
    showNotice(`已${action}用户「${user.username}」`)
    void loadUsers()
  } catch (requestError) {
    showError(requestError)
  }
}

async function setUserRole(user) {
  const next = user.role === 'ADMIN' ? 'USER' : 'ADMIN'
  const action = next === 'ADMIN' ? '设为管理员' : '取消管理员'
  if (!window.confirm(`确定将「${user.username}」${action}吗？`)) return
  try {
    await auth.request(`/admin/users/${user.id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role: next })
    })
    showNotice(`已${action}「${user.username}」`)
    void loadUsers()
  } catch (requestError) {
    showError(requestError)
  }
}

async function deleteUser(user) {
  if (!window.confirm(`确定删除用户「${user.username}」吗？此操作不可撤销。`)) return
  try {
    await auth.request(`/admin/users/${user.id}`, { method: 'DELETE' })
    showNotice(`已删除用户「${user.username}」`)
    if (users.value.length === 1 && page.value > 1) page.value -= 1
    void loadUsers()
  } catch (requestError) {
    showError(requestError)
  }
}

function previousPage() {
  if (page.value <= 1) return
  page.value -= 1
  void loadUsers()
}

function nextPage() {
  if (page.value >= totalPages.value) return
  page.value += 1
  void loadUsers()
}

onMounted(() => {
  void loadUsers()
})
</script>

<template>
  <main class="dashboard">
    <section class="hero glass-panel">
      <div>
        <span class="eyebrow">USER MANAGEMENT</span>
        <h2>用户管理</h2>
        <p>查看、禁用、变更角色或删除平台注册用户。</p>
      </div>
      <div class="hero-stat">
        <strong>{{ users.length }}</strong>
        <span>当前页用户</span>
      </div>
    </section>

    <Transition name="toast">
      <div
        v-if="toast"
        class="toast"
        :class="`is-${toast.type}`"
        role="status"
        aria-live="polite"
      >
        <span>{{ toast.message }}</span>
      </div>
    </Transition>

    <section class="glass-panel table-panel">
      <div class="table-toolbar">
        <h3>注册用户</h3>
        <div class="filters">
          <input
            v-model.trim="search"
            type="search"
            placeholder="搜索用户名 / 邮箱 / 昵称"
            @keyup.enter="applySearch"
          />
          <button class="secondary-button" type="button" @click="applySearch">查询</button>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>用户</th>
              <th>邮箱</th>
              <th>角色</th>
              <th>状态</th>
              <th>注册时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="user in users" :key="user.id">
              <td>
                <div class="user-cell">
                  <img
                    v-if="assetUrl(user.avatarUrl)"
                    class="user-avatar"
                    :src="assetUrl(user.avatarUrl)"
                    :alt="user.username"
                  />
                  <span v-else class="user-avatar placeholder">{{ initialOf(user.username) }}</span>
                  <div class="user-meta">
                    <strong>{{ user.username }}</strong>
                    <small v-if="user.nickname">{{ user.nickname }}</small>
                  </div>
                </div>
              </td>
              <td>{{ user.email }}</td>
              <td>
                <span class="tag" :class="`role-${user.role.toLowerCase()}`">
                  {{ roleLabel(user.role) }}
                </span>
              </td>
              <td>
                <span class="status-dot" :class="statusClass(user.status)">
                  {{ statusLabel(user.status) }}
                </span>
              </td>
              <td>{{ formatDate(user.createdAt) }}</td>
              <td>
                <div class="row-actions">
                  <button
                    type="button"
                    :disabled="user.id === currentUserId"
                    @click="setUserStatus(user)"
                  >
                    {{ user.status === 'ACTIVE' ? '禁用' : '启用' }}
                  </button>
                  <button
                    type="button"
                    :disabled="user.id === currentUserId"
                    @click="setUserRole(user)"
                  >
                    {{ user.role === 'ADMIN' ? '取消管理员' : '设为管理员' }}
                  </button>
                  <button
                    type="button"
                    class="danger-text"
                    :disabled="user.id === currentUserId"
                    @click="deleteUser(user)"
                  >
                    删除
                  </button>
                </div>
              </td>
            </tr>
            <tr v-if="!loading && !users.length">
              <td colspan="6" class="empty-state">
                {{ search.trim() ? '未找到匹配的用户' : '暂无用户' }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="pagination">
        <button type="button" :disabled="page <= 1 || loading" @click="previousPage">上一页</button>
        <span>第 {{ page }} / {{ totalPages }} 页</span>
        <button type="button" :disabled="page >= totalPages || loading" @click="nextPage">下一页</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.user-cell {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.user-avatar {
  flex: 0 0 auto;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  background: rgba(255, 192, 203, 0.35);
}

.user-avatar.placeholder {
  display: grid;
  place-items: center;
  color: var(--brand-strong, #e94e77);
  font-size: 15px;
  font-weight: 900;
}

.user-meta {
  min-width: 0;
}

.user-meta strong {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tag.role-admin {
  color: #9d294f;
  background: #ffe0eb;
}

.tag.role-user {
  color: #6c6470;
  background: #efe9ee;
}

.pagination span {
  align-self: center;
  color: var(--text-secondary, #6b7280);
  font-size: 13px;
  font-weight: 800;
}

.toast {
  position: fixed;
  top: 18px;
  right: 24px;
  z-index: 4000;
  max-width: 360px;
  padding: 12px 18px;
  border-radius: 12px;
  color: #fff;
  font-size: 14px;
  font-weight: 700;
  box-shadow: 0 14px 34px rgba(0, 0, 0, 0.22);
}

.toast.is-success {
  background: rgba(46, 160, 67, 0.94);
}

.toast.is-error {
  background: rgba(220, 53, 69, 0.94);
}

.toast-enter-active,
.toast-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
