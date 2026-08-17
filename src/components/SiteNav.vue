<script setup>
import { useUserStore } from '../stores/user'
import { openAuthWindow } from '../utils/openAuthWindow'

const userStore = useUserStore()
</script>

<template>
  <header class="site-nav">
    <RouterLink to="/" class="site-logo">悦音音乐</RouterLink>

    <nav class="site-links">
      <RouterLink to="/" class="site-link" active-class="active">首页</RouterLink>
      <RouterLink to="/category" class="site-link" active-class="active">分类歌单</RouterLink>
      <RouterLink to="/search" class="site-link" active-class="active">搜索</RouterLink>
      <a
        v-if="!userStore.isLoggedIn"
        href="#/login?redirect=%2Fmine"
        class="site-link"
        @click.prevent="openAuthWindow('/mine')"
      >我的音乐</a>
      <RouterLink v-else to="/mine" class="site-link" active-class="active">我的音乐</RouterLink>
    </nav>

    <div class="site-action">
      <RouterLink v-if="userStore.isLoggedIn" to="/mine" class="site-user">
        {{ userStore.currentUser.username }}
      </RouterLink>
      <a v-else href="#/login" class="site-login" @click.prevent="openAuthWindow()">登录</a>
    </div>
  </header>
</template>
