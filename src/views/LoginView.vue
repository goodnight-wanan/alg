<script setup>
import { reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

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
  router.replace(redirect)
}

function socialLogin(name) {
  notice.value = `${name} 登录为演示功能，请先使用账号密码登录。`
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-panel">
      <div class="auth-intro">
        <p class="eyebrow">WELCOME BACK</p>
        <h1>登录悦音音乐</h1>
        <p>跟随音乐的律动，一起遨游在自由的海洋。</p>
      </div>

      <form class="auth-form" @submit.prevent="submit">
        <div class="field">
          <label for="account">用户名或邮箱</label>
          <input
            id="account"
            v-model="form.account"
            type="text"
            placeholder="请输入用户名或邮箱"
            required
          />
        </div>

        <div class="field">
          <label for="password">密码</label>
          <input
            id="password"
            v-model="form.password"
            type="password"
            placeholder="请输入密码"
            required
          />
        </div>

        <label class="agree-line">
          <input v-model="form.agree" type="checkbox" />
          <span>我已阅读并同意 <a href="#" @click.prevent>用户协议</a></span>
        </label>

        <p v-if="error" class="form-error">{{ error }}</p>
        <p v-if="notice" class="form-notice">{{ notice }}</p>

        <button class="btn btn-primary submit-button" type="submit">登录</button>

        <div class="social-buttons">
          <button type="button" class="social-button qq" @click="socialLogin('QQ')">使用 QQ 登录</button>
          <button type="button" class="social-button wechat" @click="socialLogin('微信')">使用微信登录</button>
        </div>

        <p class="auth-switch">
          还没有账号？
          <RouterLink to="/register">注册账号</RouterLink>
        </p>
      </form>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: grid;
  place-items: center;
  min-height: calc(100vh - var(--header-height) - var(--player-height) - 100px);
}

.auth-panel {
  width: min(880px, 100%);
  display: grid;
  grid-template-columns: 0.9fr 1.1fr;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: 28px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: var(--shadow);
}

.auth-intro {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 48px;
  background:
    radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.24), transparent 28%),
    linear-gradient(150deg, #ff5e94, #a56cff);
  color: #fff;
}

.eyebrow {
  margin: 0 0 10px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.18em;
}

.auth-intro h1 {
  margin: 0;
  font-size: 38px;
  line-height: 1.1;
}

.auth-intro p:last-child {
  margin: 18px 0 0;
  color: rgba(255, 255, 255, 0.78);
  line-height: 1.7;
}

.auth-form {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 16px;
  padding: 42px;
}

.agree-line {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--muted);
  font-size: 13px;
}

.agree-line input {
  width: auto;
}

.agree-line a {
  color: var(--primary);
}

.form-notice {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: #fff4d6;
  color: #8a651c;
  font-size: 13px;
}

.submit-button {
  width: 100%;
  height: 48px;
  margin-top: 4px;
}

.social-buttons {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}

.social-button {
  height: 40px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 700;
}

.social-button.qq {
  background: #eaf5ff;
  color: #0d7fd6;
}

.social-button.wechat {
  background: #ecfbe5;
  color: #48a51a;
}

.auth-switch {
  margin: 6px 0 0;
  color: var(--muted);
  font-size: 13px;
  text-align: center;
}

.auth-switch a {
  color: var(--primary);
  font-weight: 700;
}

@media (max-width: 760px) {
  .auth-panel {
    grid-template-columns: 1fr;
  }

  .auth-intro {
    padding: 30px;
  }

  .auth-form {
    padding: 28px;
  }
}
</style>
