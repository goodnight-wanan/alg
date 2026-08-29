<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { authRouteQuery, finishAuth, openAuthWindow } from '../utils/authWindow'
import '../styles/login.css'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const form = reactive({ account: '', password: '', agree: false })
const error = ref('')
const notice = ref(route.query.registered === '1' ? '注册成功，请使用新账号登录。' : '')
const submitting = ref(false)

async function submit() {
  error.value = ''
  if (!form.agree) {
    error.value = '请先阅读并同意用户协议'
    return
  }

  submitting.value = true
  const result = await userStore.login({ account: form.account, password: form.password })
  submitting.value = false
  if (!result.ok) {
    error.value = result.message
    return
  }
  finishAuth(router, route)
}

function socialLogin(name) {
  notice.value = `${name} 登录为演示功能，请先使用账号密码登录。`
}

function showForgotPasswordNotice() {
  notice.value = '忘记密码功能暂未完善，请使用注册时的账号和密码登录。'
}

function showAgreementNotice() {
  notice.value = '用户协议内容暂未完善，后续将补充完整协议页面。'
}

function openRegister() {
  if (route.query.popup === '1') {
    router.push({ name: 'register', query: authRouteQuery(route) })
    return
  }
  openAuthWindow(router, 'register', route.query.redirect || '/')
}
</script>

<template>
  <div class="auth-page">
    <div class="login-container">
      <h2>登录</h2>
      <form @submit.prevent="submit">
        <div class="form-field">
          <label for="login-account">账号</label>
          <input
            id="login-account"
            v-model="form.account"
            type="text"
            placeholder="请输入用户名或邮箱"
            name="account"
            autocomplete="username"
            required
          />
        </div>
        <div class="form-field">
          <label for="login-password">密码</label>
          <input
            id="login-password"
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            name="password"
            autocomplete="current-password"
            required
          />
        </div>
        <div class="social-login">
          <button type="button" class="social-button QQ" @click="socialLogin('QQ')">
            使用 QQ 登录
          </button>
          <button type="button" class="social-button wechat" @click="socialLogin('微信')">
            使用微信登录
          </button>
        </div>
        <div class="terms">
          <input id="terms" v-model="form.agree" type="checkbox" name="terms" required />
          <label for="terms"
            >我已阅读并同意 <a href="#" @click.prevent="showAgreementNotice">用户协议</a></label
          >
        </div>
        <p v-if="error" class="form-error"><Icon name="alert" :size="16" />{{ error }}</p>
        <p v-if="notice" class="form-notice"><Icon name="info" :size="16" />{{ notice }}</p>
        <button type="submit" :disabled="submitting">
          {{ submitting ? '正在登录…' : '登录' }}
        </button>
        <a href="#" @click.prevent="showForgotPasswordNotice">忘记密码？</a>
        <button type="button" class="auth-text-button" @click="openRegister">注册账号</button>
      </form>
    </div>
  </div>
</template>
