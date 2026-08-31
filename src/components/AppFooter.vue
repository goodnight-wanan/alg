<script setup>
import { showNotice } from '../utils/notice'
</script>

<template>
  <footer class="app-footer">
    <div class="app-footer-inner">
      <div class="app-footer-brand">
        <RouterLink to="/" class="app-footer-logo">
          <span class="app-footer-logo-mark"><Icon name="music-note" :size="18" /></span>
          <span class="app-footer-logo-text">悦音音乐</span>
        </RouterLink>
        <p class="app-footer-desc">个人学习与开源展示的全栈音乐平台</p>
      </div>

      <nav class="app-footer-links" aria-label="页脚链接">
        <a href="https://github.com/goodnight-wanan/alg" target="_blank" rel="noopener">GitHub 仓库</a>
        <a href="#" @click.prevent="showNotice('服务条款为演示内容，暂未开放')">服务条款</a>
        <a href="#" @click.prevent="showNotice('隐私政策为演示内容，暂未开放')">隐私政策</a>
        <a href="#" @click.prevent="showNotice('意见反馈为演示功能，暂未开放')">意见反馈</a>
      </nav>
    </div>

    <div class="app-footer-bottom">
      <p>© 2026 悦音音乐 · Vue 3 + NestJS + PostgreSQL · MIT 开源</p>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  margin-top: 48px;
  padding-bottom: calc(var(--player-height) + 24px);
  border-top: 1px solid rgba(255, 255, 255, 0.6);
  background: rgb(255 214 214 / 82%);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

.app-footer-inner {
  width: min(1320px, calc(100% - 48px));
  margin: 0 auto;
  padding: 28px 0 20px;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
}

.app-footer-brand {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
}

.app-footer-logo {
  display: flex;
  align-items: center;
  gap: 10px;
  text-decoration: none;
}

.app-footer-logo-mark {
  display: grid;
  place-items: center;
  width: 34px;
  height: 34px;
  border-radius: 10px;
  background: linear-gradient(135deg, var(--brand-soft), var(--brand-strong));
  color: #fff;
  box-shadow: 0 6px 14px rgba(233, 78, 119, 0.28);
}

.app-footer-logo-text {
  color: var(--text);
  font-size: 20px;
  font-weight: 900;
  letter-spacing: 2px;
}

.app-footer-desc {
  margin: 0;
  color: var(--text-secondary);
  font-size: 14px;
  line-height: 1.6;
}

.app-footer-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 20px;
  padding-top: 6px;
}

.app-footer-links a {
  color: var(--text);
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  transition: color 0.15s ease;
}

.app-footer-links a:hover {
  color: var(--brand-strong);
}

.app-footer-bottom {
  width: min(1320px, calc(100% - 48px));
  margin: 0 auto;
  padding: 14px 0 4px;
  border-top: 1px solid rgba(25, 25, 25, 0.08);
}

.app-footer-bottom p {
  margin: 0;
  color: var(--text-muted);
  font-size: 13px;
  text-align: center;
}

@media (max-width: 720px) {
  .app-footer-inner {
    flex-direction: column;
    gap: 16px;
  }

  .app-footer-links {
    padding-top: 0;
  }
}
</style>
