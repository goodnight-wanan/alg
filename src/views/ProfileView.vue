<script setup>
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()

function logout() {
  userStore.logout()
  router.push('/')
}
</script>

<template>
  <div class="functional-page profile-page">
    <div class="profile-avatar">{{ userStore.currentUser?.username?.charAt(0).toUpperCase() || '?' }}</div>
    <h1 class="functional-title">个人中心</h1>
    <p class="mine-user">{{ userStore.currentUser?.username }} · {{ userStore.currentUser?.email }}</p>
    <button class="logout-button" type="button" @click="logout">退出登录</button>
  </div>
</template>
