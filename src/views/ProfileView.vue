<script setup>
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import UserCard from '../components/UserCard.vue'
import { useUserStore } from '../stores/user'
import { showNotice } from '../utils/notice'
import '../styles/profile.css'

const MAX_AVATAR_BYTES = 1024 * 1024
const CAPTCHA_CHARACTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const userStore = useUserStore()
const router = useRouter()
const fileInput = ref(null)
const avatarDialogOpen = ref(false)
const avatarPreview = ref('')
const avatarFile = ref(null)
const avatarFileName = ref('')
const avatarError = ref('')
const profileError = ref('')
const profileSaving = ref(false)
const passwordError = ref('')
const passwordSaving = ref(false)
const captcha = ref(createCaptcha())
const nickname = ref(userStore.currentUser?.nickname || userStore.currentUser?.username || '')
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
  captcha: ''
})

const authProvider = computed(() => userStore.currentUser?.authProvider || 'password')
const canEditAccount = computed(() => authProvider.value === 'password')
const providerLabel = computed(() => {
  if (authProvider.value === 'qq') return 'QQ 登录'
  if (authProvider.value === 'wechat') return '微信登录'
  return '账号密码登录'
})
const joinedAt = computed(() => {
  const value = userStore.currentUser?.createdAt
  if (!value) return '暂未记录'
  return new Date(value).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
})

function createCaptcha() {
  return Array.from({ length: 4 }, () => {
    const index = Math.floor(Math.random() * CAPTCHA_CHARACTERS.length)
    return CAPTCHA_CHARACTERS[index]
  }).join('')
}

function refreshCaptcha() {
  captcha.value = createCaptcha()
  passwordForm.captcha = ''
}

function openAvatarDialog() {
  if (!canEditAccount.value) {
    showNotice('第三方登录账号暂不支持修改头像')
    return
  }
  avatarPreview.value = ''
  avatarFile.value = null
  avatarFileName.value = ''
  avatarError.value = ''
  avatarDialogOpen.value = true
}

function closeAvatarDialog() {
  avatarDialogOpen.value = false
  avatarPreview.value = ''
  avatarFile.value = null
  avatarFileName.value = ''
  avatarError.value = ''
}

async function isWebpFile(file) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer())
  const signature = String.fromCharCode(...bytes)
  return signature.startsWith('RIFF') && signature.slice(8, 12) === 'WEBP'
}

function readAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function handleAvatarFile(event) {
  const [file] = event.target.files || []
  event.target.value = ''
  if (!file) return

  avatarError.value = ''
  const extensionIsWebp = file.name.toLowerCase().endsWith('.webp')
  const mimeIsWebp = !file.type || file.type === 'image/webp'
  const contentIsWebp = await isWebpFile(file)
  if (!extensionIsWebp || !mimeIsWebp || !contentIsWebp) {
    avatarError.value = '请选择真实的 WebP 格式图片，修改文件后缀无效。'
    showNotice('头像上传失败：仅支持 WebP 图片', 'error')
    return
  }
  if (file.size > MAX_AVATAR_BYTES) {
    avatarError.value = '图片不能超过 1 MB，请压缩后重新上传。'
    showNotice('头像图片不能超过 1 MB', 'error')
    return
  }
  try {
    avatarPreview.value = await readAsDataUrl(file)
    avatarFile.value = file
    avatarFileName.value = file.name
  } catch {
    avatarError.value = '图片读取失败，请重新选择。'
    showNotice('图片读取失败，请重试', 'error')
  }
}

async function saveAvatar() {
  if (!avatarPreview.value || !avatarFile.value) {
    avatarError.value = '请先选择一张 WebP 图片。'
    return
  }
  const result = await userStore.updateAvatar(avatarFile.value)
  showNotice(result.message, result.ok ? 'success' : 'error')
  if (result.ok) closeAvatarDialog()
}

async function submitProfile() {
  profileError.value = ''
  profileSaving.value = true
  const result = await userStore.updateNickname(nickname.value)
  profileSaving.value = false
  if (!result.ok) {
    profileError.value = result.message
    return
  }
  showNotice(result.message, 'success')
}

async function submitPassword() {
  passwordError.value = ''
  if (passwordForm.captcha.trim().toUpperCase() !== captcha.value) {
    passwordError.value = '验证码不正确，请重新输入。'
    refreshCaptcha()
    return
  }
  passwordSaving.value = true
  const result = await userStore.changePassword(passwordForm)
  passwordSaving.value = false
  if (!result.ok) {
    passwordError.value = result.message
    refreshCaptcha()
    return
  }
  passwordForm.currentPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  refreshCaptcha()
  showNotice(result.message, 'success')
  router.replace({ name: 'login', query: { redirect: '/profile' } })
}

async function logout() {
  await userStore.logout()
  showNotice('已安全退出登录', 'success')
  router.replace({ name: 'home' })
}

watch(avatarDialogOpen, (value) => document.body.classList.toggle('modal-open', value))
onBeforeUnmount(() => document.body.classList.remove('modal-open'))
</script>

<template>
  <div class="functional-page profile-center-page">
    <header class="profile-heading">
      <div>
        <p class="profile-eyebrow">ACCOUNT CENTER</p>
        <h1 class="functional-title">个人中心</h1>
        <p>管理头像、账号信息与登录安全，打造属于你的音乐空间。</p>
      </div>
      <div class="profile-heading-actions">
        <span class="profile-status"><i></i>账号状态正常</span>
        <button type="button" class="profile-logout-button" @click="logout">退出登录</button>
      </div>
    </header>
    <UserCard show-stats />

    <div class="profile-content-grid">
      <div class="profile-column">
        <section class="profile-panel avatar-panel">
          <div class="profile-panel-heading">
            <span class="profile-panel-icon"><Icon name="music-note" :size="20" /></span>
            <div>
              <h2>个人头像</h2>
              <p>上传一张喜欢的图片，让账号更有辨识度。</p>
            </div>
          </div>
          <div class="avatar-editor">
            <div class="avatar-editor-preview">
              <img :src="userStore.currentUser?.avatarUrl" alt="当前用户头像" />
            </div>
            <div class="avatar-editor-copy">
              <strong>{{ userStore.currentUser?.username }}</strong>
              <span>仅支持 WebP 格式，文件大小不超过 1 MB。</span>
              <button type="button" class="profile-primary-button" @click="openAvatarDialog">
                更换头像
              </button>
            </div>
          </div>
        </section>

        <section class="profile-panel account-panel">
          <div class="profile-panel-heading">
            <span class="profile-panel-icon"><Icon name="info" :size="20" /></span>
            <div>
              <h2>账号资料</h2>
              <p>这些信息用于识别当前登录账号。</p>
            </div>
          </div>
          <dl class="account-details">
            <div>
              <dt>用户名</dt>
              <dd>{{ userStore.currentUser?.username }}</dd>
            </div>
            <div>
              <dt>邮箱</dt>
              <dd>{{ userStore.currentUser?.email }}</dd>
            </div>
            <div>
              <dt>昵称</dt>
              <dd>{{ userStore.currentUser?.nickname || '未设置' }}</dd>
            </div>
            <div>
              <dt>登录方式</dt>
              <dd>{{ providerLabel }}</dd>
            </div>
            <div>
              <dt>加入日期</dt>
              <dd>{{ joinedAt }}</dd>
            </div>
          </dl>
          <form class="password-form profile-nickname-form" @submit.prevent="submitProfile">
            <label for="profile-nickname">修改昵称</label>
            <input
              id="profile-nickname"
              v-model.trim="nickname"
              type="text"
              maxlength="50"
              autocomplete="nickname"
              placeholder="输入你的昵称"
              required
            />
            <p v-if="profileError" class="profile-form-error">
              <Icon name="alert" :size="16" />{{ profileError }}
            </p>
            <button
              type="submit"
              class="profile-primary-button"
              :disabled="profileSaving"
            >
              {{ profileSaving ? '正在保存…' : '保存资料' }}
            </button>
          </form>
        </section>
      </div>

      <section class="profile-panel security-panel">
        <div class="profile-panel-heading">
          <span class="profile-panel-icon"><Icon name="success" :size="20" /></span>
          <div>
            <h2>登录安全</h2>
            <p>定期更新密码可以提升账号安全性。</p>
          </div>
        </div>
        <form v-if="canEditAccount" class="password-form" @submit.prevent="submitPassword">
          <label for="profile-current-password">当前密码</label>
          <input
            id="profile-current-password"
            v-model="passwordForm.currentPassword"
            type="password"
            autocomplete="current-password"
            placeholder="请输入当前密码"
            required
          />
          <label for="profile-new-password">新密码</label>
          <input
            id="profile-new-password"
            v-model="passwordForm.newPassword"
            type="password"
            autocomplete="new-password"
            minlength="8"
            maxlength="72"
            placeholder="至少 8 位字符"
            required
          />
          <label for="profile-confirm-password">确认新密码</label>
          <input
            id="profile-confirm-password"
            v-model="passwordForm.confirmPassword"
            type="password"
            autocomplete="new-password"
            minlength="8"
            maxlength="72"
            placeholder="再次输入新密码"
            required
          />
          <label for="profile-captcha">安全验证码</label>
          <div class="captcha-field">
            <input
              id="profile-captcha"
              v-model="passwordForm.captcha"
              type="text"
              maxlength="4"
              autocomplete="off"
              placeholder="输入右侧验证码"
              required
            />
            <button
              type="button"
              class="captcha-code"
              title="点击刷新验证码"
              aria-label="刷新验证码"
              @click="refreshCaptcha"
            >
              {{ captcha }}
            </button>
          </div>
          <p class="captcha-tip">验证码仅在当前页面校验，不会上传或写入后台数据。</p>
          <p v-if="passwordError" class="profile-form-error">
            <Icon name="alert" :size="16" />{{ passwordError }}
          </p>
          <button
            type="submit"
            class="profile-primary-button password-submit"
            :disabled="passwordSaving"
          >
            {{ passwordSaving ? '正在修改…' : '修改密码' }}
          </button>
        </form>
        <div v-else class="social-account-notice">
          <Icon name="info" :size="22" />
          <p>当前为 {{ providerLabel }}，头像和密码请在对应平台管理。</p>
        </div>
      </section>
    </div>
  </div>

  <Teleport to="body">
    <Transition name="profile-dialog">
      <div v-if="avatarDialogOpen" class="profile-dialog-backdrop" @click="closeAvatarDialog">
        <section
          class="profile-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="avatar-dialog-title"
          @click.stop
        >
          <header>
            <div>
              <h2 id="avatar-dialog-title">上传新头像</h2>
              <p>请选择 WebP 图片，文件大小不超过 1 MB。</p>
            </div>
            <button type="button" aria-label="关闭头像上传弹窗" @click="closeAvatarDialog">
              <Icon name="close" :size="18" />
            </button>
          </header>
          <div class="avatar-upload-preview">
            <img :src="avatarPreview || userStore.currentUser?.avatarUrl" alt="头像预览" />
          </div>
          <p v-if="avatarFileName" class="avatar-file-name">已选择：{{ avatarFileName }}</p>
          <p v-if="avatarError" class="profile-form-error">
            <Icon name="alert" :size="16" />{{ avatarError }}
          </p>
          <input
            ref="fileInput"
            class="visually-hidden"
            type="file"
            accept=".webp,image/webp"
            @change="handleAvatarFile"
          />
          <div class="profile-dialog-actions">
            <button type="button" class="profile-secondary-button" @click="fileInput?.click()">
              选择 WebP 图片
            </button>
            <button
              type="button"
              class="profile-primary-button"
              :disabled="!avatarPreview"
              @click="saveAvatar"
            >
              保存头像
            </button>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
