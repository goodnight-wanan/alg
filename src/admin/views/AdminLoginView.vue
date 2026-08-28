<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAdminAuthStore } from '../auth'

const auth = useAdminAuthStore()
const router = useRouter()
const form = reactive({ account: '', password: '' })
const error = ref('')
const submitting = ref(false)

async function submit() {
  error.value = ''
  submitting.value = true
  try {
    await auth.login(form.account, form.password)
    await router.replace({ name: 'songs' })
  } catch (requestError) {
    error.value = requestError.message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="login-page">
    <section class="login-card glass-panel">
      <span class="eyebrow">YUEYIN ADMIN</span>
      <h1>管理你的音乐空间</h1>
      <p>使用已经提升为管理员的悦音账号登录。</p>
      <form @submit.prevent="submit">
        <label>
          <span>用户名或邮箱</span>
          <input v-model.trim="form.account" autocomplete="username" required />
        </label>
        <label>
          <span>密码</span>
          <input v-model="form.password" type="password" autocomplete="current-password" required />
        </label>
        <p v-if="error" class="form-message error-message">{{ error }}</p>
        <button class="primary-button" type="submit" :disabled="submitting">
          {{ submitting ? '登录中…' : '登录后台' }}
        </button>
      </form>
    </section>
  </main>
</template>
