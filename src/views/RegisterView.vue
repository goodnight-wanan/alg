<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

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

  router.replace('/mine')
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-panel">
      <div class="auth-intro">
        <p class="eyebrow">JOIN US</p>
        <h1>创建悦音账号</h1>
        <p>收藏喜欢的歌单，记录每一次心动的播放。</p>
      </div>

      <form class="auth-form" @submit.prevent="submit">
        <div class="field">
          <label for="username">用户名</label>
          <input id="username" v-model="form.username" type="text" placeholder="请输入用户名" required />
        </div>

        <div class="field">
          <label for="email">邮箱地址</label>
          <input id="email" v-model="form.email" type="email" placeholder="请输入邮箱地址" required />
        </div>

        <div class="field">
          <label for="password">密码</label>
          <input id="password" v-model="form.password" type="password" placeholder="至少 6 位密码" required />
        </div>

        <div class="field">
          <label for="confirm-password">确认密码</label>
          <input
            id="confirm-password"
            v-model="form.confirmPassword"
            type="password"
            placeholder="再次输入密码"
            required
          />
        </div>

        <p v-if="error" class="form-error">{{ error }}</p>

        <button class="btn btn-primary submit-button" type="submit">注册</button>

        <p class="auth-switch">
          已经有账号？
          <RouterLink to="/login">直接登录</RouterLink>
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
    linear-gradient(150deg, #6c83ff, #a56cff);
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
  gap: 15px;
  padding: 42px;
}

.submit-button {
  width: 100%;
  height: 48px;
  margin-top: 4px;
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
