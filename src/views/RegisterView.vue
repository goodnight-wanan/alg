<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { usePageCss } from '../utils/pageCss'

usePageCss(['/assets/css/register.css'])

const router = useRouter()
const userStore = useUserStore()

const form = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: ''
})
const error = ref('')

function submit() {
  error.value = ''
  const result = userStore.register(form)

  if (!result.ok) {
    error.value = result.message
    return
  }

  router.replace('/login')
}
</script>

<template>
  <div class="auth-page">
    <div class="register-container">
      <h2>注册</h2>
      <form @submit.prevent="submit">
        <input v-model.trim="form.username" type="text" placeholder="用户名" name="username" aria-label="用户名" autocomplete="username" required />
        <input v-model.trim="form.email" type="email" placeholder="邮箱地址" name="email" aria-label="邮箱地址" autocomplete="email" required />
        <input v-model="form.password" type="password" placeholder="密码" name="password" aria-label="密码" autocomplete="new-password" required />
        <input v-model="form.confirmPassword" type="password" placeholder="确认密码" name="confirm_password" aria-label="确认密码" autocomplete="new-password" required />

        <p v-if="error" class="form-error">{{ error }}</p>

        <button type="submit">注册</button>
        <RouterLink to="/login">已有账号？登录</RouterLink>
      </form>
    </div>
  </div>
</template>
