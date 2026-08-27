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
        <div class="form-field">
          <label for="reg-username">用户名</label>
          <input id="reg-username" v-model.trim="form.username" type="text" placeholder="请输入用户名" name="username" autocomplete="username" required />
        </div>
        <div class="form-field">
          <label for="reg-email">邮箱地址</label>
          <input id="reg-email" v-model.trim="form.email" type="email" placeholder="请输入邮箱地址" name="email" autocomplete="email" required />
        </div>
        <div class="form-field">
          <label for="reg-password">密码</label>
          <input id="reg-password" v-model="form.password" type="password" placeholder="请输入密码" name="password" autocomplete="new-password" required />
        </div>
        <div class="form-field">
          <label for="reg-confirm-password">确认密码</label>
          <input id="reg-confirm-password" v-model="form.confirmPassword" type="password" placeholder="请再次输入密码" name="confirm_password" autocomplete="new-password" required />
        </div>

        <p v-if="error" class="form-error"><Icon name="alert" :size="16" />{{ error }}</p>

        <button type="submit">注册</button>
        <RouterLink to="/login">已有账号？登录</RouterLink>
      </form>
    </div>
  </div>
</template>
