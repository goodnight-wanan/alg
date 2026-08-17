<template>
  <footer class="app-footer">
    <div class="footer-inner">
      <div class="footer-brand">
        <span class="footer-mark">♪</span>
        <div>
          <strong>悦音音乐</strong>
          <p>跟随音乐的律动，一起遨游在自由的海洋。</p>
        </div>
      </div>
      <p class="footer-copy">© 2026 悦音音乐 · 前端课程作业 Vue 3 重构版</p>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  padding: 34px 24px 40px;
  background: #241f31;
  color: #f7f6fb;
}

.footer-inner {
  width: min(1240px, 100%);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.footer-brand {
  display: flex;
  align-items: center;
  gap: 14px;
}

.footer-mark {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 14px;
  background: linear-gradient(135deg, var(--primary), #ff8eab);
  color: #fff;
  font-size: 26px;
}

.footer-brand strong {
  display: block;
  font-size: 18px;
}

.footer-brand p {
  margin: 4px 0 0;
  color: rgba(247, 246, 251, 0.62);
  font-size: 13px;
}

.footer-copy {
  margin: 0;
  color: rgba(247, 246, 251, 0.48);
  font-size: 12px;
  text-align: right;
}

@media (max-width: 700px) {
  .footer-inner {
    flex-direction: column;
    align-items: flex-start;
  }

  .footer-copy {
    text-align: left;
  }
}
</style>
