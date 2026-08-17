<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import { usePageCss } from '../utils/pageCss'

usePageCss(['/assets/css/login.css'])

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const form = reactive({
  account: '',
  password: '',
  agree: false
})
const error = ref('')
const notice = ref('')

function submit() {
  error.value = ''

  if (!form.agree) {
    error.value = '请先阅读并同意用户协议'
    return
  }

  const result = userStore.login({
    account: form.account,
    password: form.password
  })

  if (!result.ok) {
    error.value = result.message
    return
  }

  const redirect = String(route.query.redirect || '/mine')

  if (window.opener) {
    window.opener.postMessage(
      { type: 'auth-success', redirect },
      window.location.origin
    )
    window.opener.focus()
    window.close()
    return
  }

  router.replace(redirect)
}

function socialLogin(name) {
  notice.value = `${name} 登录为演示功能，请先使用账号密码登录。`
}
</script>

<template>
  <div class="auth-page">
    <div class="login-container">
      <h2>登录</h2>
      <form @submit.prevent="submit">
        <input v-model="form.account" type="text" placeholder="请输入你的用户名或邮箱" name="account" required />
        <input v-model="form.password" type="password" placeholder="请输入你的密码" name="password" required />

        <div class="social-login">
          <button type="button" class="social-button QQ" @click="socialLogin('QQ')">使用 QQ 登录</button>
          <button type="button" class="social-button wechat" @click="socialLogin('微信')">使用 wechat 登录</button>
        </div>

        <div class="terms">
          <input v-model="form.agree" type="checkbox" id="terms" name="terms" required />
          <label for="terms">我已阅读并同意 <a href="#" @click.prevent>用户协议</a></label>
        </div>

        <p v-if="error" class="form-error">{{ error }}</p>
        <p v-if="notice" class="form-notice">{{ notice }}</p>

        <button type="submit">登录</button>
        <a href="#" @click.prevent>忘记密码？</a>
        <a href="#/register">注册账号</a>
      </form>
    </div>
  </div>
</template>
