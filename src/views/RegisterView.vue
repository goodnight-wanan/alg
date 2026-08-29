<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { authRouteQuery, finishAuth, openAuthWindow } from '../utils/authWindow'
import '../styles/register.css'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const form = reactive({ username: '', email: '', password: '', confirmPassword: '' })
const error = ref('')
const submitting = ref(false)

async function submit() {
  error.value = ''
  submitting.value = true
  const result = await userStore.register(form)
  submitting.value = false
  if (!result.ok) {
    error.value = result.message
    return
  }
  finishAuth(router, route)
}

function openLogin() {
  if (route.query.popup === '1') {
    router.push({ name: 'login', query: authRouteQuery(route) })
    return
  }
  openAuthWindow(router, 'login', route.query.redirect || '/')
}
</script>

<template>
  <div class='auth-page'>
    <div class='register-container'>
      <h2>注册</h2>
      <form @submit.prevent='submit'>
        <div class='form-field'>
          <label for='reg-username'>用户名</label>
          <input id='reg-username' v-model.trim='form.username' type='text' placeholder='请输入用户名' name='username' autocomplete='username' required />
        </div>
        <div class='form-field'>
          <label for='reg-email'>邮箱地址</label>
          <input id='reg-email' v-model.trim='form.email' type='email' placeholder='请输入邮箱地址' name='email' autocomplete='email' required />
        </div>
        <div class='form-field'>
          <label for='reg-password'>密码</label>
          <input id='reg-password' v-model='form.password' type='password' minlength='8' maxlength='72' placeholder='至少 8 位密码' name='password' autocomplete='new-password' required />
        </div>
        <div class='form-field'>
          <label for='reg-confirm-password'>确认密码</label>
          <input id='reg-confirm-password' v-model='form.confirmPassword' type='password' minlength='8' maxlength='72' placeholder='请再次输入密码' name='confirm_password' autocomplete='new-password' required />
        </div>
        <p v-if='error' class='form-error'><Icon name='alert' :size='16' />{{ error }}</p>
        <button type='submit' :disabled='submitting'>{{ submitting ? '正在注册…' : '注册' }}</button>
        <button type='button' class='auth-text-button' @click='openLogin'>已有账号？登录</button>
      </form>
    </div>
  </div>
</template>
