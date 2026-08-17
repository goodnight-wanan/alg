<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const router = useRouter()
const userStore = useUserStore()
const keyword = ref('')

function submitSearch() {
  const value = keyword.value.trim()
  if (!value) return
  router.push({ name: 'search', query: { q: value } })
  keyword.value = ''
}
</script>

<template>
  <header class="app-header">
    <div class="header-top">
      <RouterLink to="/" class="header-logo" aria-label="悦音音乐首页">悦音音乐</RouterLink>

      <div class="header-column">
        <RouterLink to="/" class="header-col music-hall">音乐馆</RouterLink>
        <RouterLink to="/mine" class="header-col">我的音乐</RouterLink>
        <a class="header-col" href="#" @click.prevent>客户端</a>
        <a class="header-col" href="#" @click.prevent>VIP</a>
      </div>

      <form class="header-seek" @submit.prevent="submitSearch">
        <input
          v-model="keyword"
          type="search"
          placeholder="搜索音乐，歌单，用户"
          aria-label="搜索音乐，歌单，用户"
        />
        <button class="header-button" type="submit" aria-label="搜索">⌕</button>
      </form>

      <div class="login">
        <template v-if="userStore.isLoggedIn">
          <RouterLink class="user-link" to="/mine">
            <span>{{ userStore.currentUser.username }}</span>
          </RouterLink>
          <button class="logout-link" type="button" @click="userStore.logout">退出</button>
        </template>
        <RouterLink v-else class="a_login" to="/login">登录</RouterLink>
      </div>
    </div>

    <div class="header-line"></div>

    <nav class="header-menu">
      <RouterLink to="/" class="header-mn homepage">主页</RouterLink>
      <a class="header-mn" href="#" @click.prevent>歌手</a>
      <a class="header-mn" href="#" @click.prevent>新碟</a>
      <RouterLink to="/search?tab=song" class="header-mn">排行榜</RouterLink>
      <RouterLink to="/category" class="header-mn">分类歌单</RouterLink>
    </nav>
  </header>
</template>

<style scoped>
.app-header {
  position: sticky;
  top: 0;
  z-index: 30;
  height: var(--header-height);
  background: rgba(255, 255, 255, 0.88);
  border-bottom: 1px solid rgba(0, 0, 0, 0.04);
  backdrop-filter: blur(12px);
}

.header-top {
  width: min(1500px, calc(100% - 48px));
  height: 120px;
  margin: 0 auto;
  display: flex;
  align-items: flex-start;
}

.header-logo {
  display: grid;
  place-items: center;
  width: 300px;
  height: 120px;
  flex: 0 0 auto;
  border: 1px solid #191516;
  color: #191516;
  font-size: 32px;
  font-weight: 1000;
  letter-spacing: 4px;
  transition:
    background 0.2s ease,
    color 0.2s ease;
}

.header-logo:hover {
  background: pink;
  color: #fff;
}

.header-column {
  width: min(600px, 50vw);
  height: 120px;
  display: flex;
  justify-content: space-around;
}

.header-col {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 25%;
  height: 120px;
  color: #191516;
  font-size: clamp(16px, 2.2vw, 35px);
  font-weight: 1000;
  line-height: 110px;
  cursor: pointer;
  transition: 0.15s;
}

.music-hall {
  background-color: pink;
  color: #fff;
}

.header-col:hover {
  background-color: pink;
  color: #fff;
}

.header-seek {
  position: relative;
  width: min(350px, 27vw);
  height: 50px;
  margin-top: 35px;
  margin-left: 50px;
}

.header-seek input {
  width: 100%;
  height: 50px;
  padding: 0 48px 0 20px;
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.5);
  color: #191516;
  font-size: 15px;
}

.header-seek input:focus {
  background: #fff;
}

.header-button {
  position: absolute;
  top: 5px;
  right: 6px;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  background: transparent;
  color: #665d63;
  font-size: 26px;
}

.header-button:hover {
  color: var(--primary);
}

.login {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 40px;
  margin-top: 42px;
  margin-left: 40px;
  font-size: clamp(18px, 2vw, 30px);
  font-weight: 1000;
  line-height: 43px;
}

.a_login,
.user-link {
  transition: 0.2s;
  cursor: pointer;
}

.a_login:hover,
.user-link:hover {
  color: pink;
}

.logout-link {
  padding: 3px 8px;
  border-radius: 999px;
  background: rgba(25, 25, 25, 0.06);
  color: #665d63;
  font-size: 13px;
  font-weight: 700;
}

.header-line {
  width: min(1500px, calc(100% - 48px));
  height: 2px;
  margin: 0 auto;
  background-color: #f3f3f3;
}

.header-menu {
  width: min(800px, 80vw);
  height: 50px;
  margin: 25px auto 0;
  display: flex;
  justify-content: space-around;
  text-align: center;
}

.header-mn {
  font-size: clamp(15px, 2vw, 20px);
  font-weight: 1000;
  line-height: 50px;
  transition: 0.1s;
  cursor: pointer;
}

.header-mn:hover,
.header-mn.homepage {
  color: pink;
}

@media (max-width: 1280px) {
  :root {
    --header-height: 172px;
  }

  .header-logo {
    width: 210px;
  }

  .header-seek {
    margin-left: 20px;
  }
}

@media (max-width: 760px) {
  :root {
    --header-height: 126px;
  }

  .header-top {
    width: calc(100% - 28px);
    height: 74px;
  }

  .header-logo {
    width: 110px;
    height: 74px;
    font-size: 17px;
    letter-spacing: 1px;
  }

  .header-column {
    width: auto;
    height: 74px;
    gap: 4px;
  }

  .header-col {
    height: 74px;
    padding: 0 6px;
    font-size: 13px;
    line-height: 1;
  }

  .header-seek {
    width: 28vw;
    height: 38px;
    margin-top: 18px;
    margin-left: 6px;
  }

  .header-seek input {
    height: 38px;
    padding: 0 34px 0 10px;
    font-size: 12px;
  }

  .header-button {
    top: 0;
    right: 2px;
    width: 32px;
    height: 38px;
    font-size: 20px;
  }

  .login {
    height: 74px;
    margin: 18px 0 0 4px;
    font-size: 14px;
    line-height: 1;
  }

  .logout-link {
    display: none;
  }

  .header-line {
    width: calc(100% - 28px);
  }

  .header-menu {
    width: calc(100% - 28px);
    margin-top: 10px;
    height: 44px;
  }

  .header-mn {
    line-height: 44px;
  }
}
</style>
