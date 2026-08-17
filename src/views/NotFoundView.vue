<template>
  <div class="not-found">
    <p class="code">404</p>
    <h1>页面不存在</h1>
    <p>你要找的页面可能已经走丢了。</p>
    <RouterLink class="btn btn-primary" to="/">回到首页</RouterLink>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
}

.code {
  margin: 0;
  background: linear-gradient(135deg, var(--primary), #a56cff);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-size: 120px;
  font-weight: 900;
  line-height: 1;
}

.not-found h1 {
  margin: 8px 0 0;
  font-size: 30px;
}

.not-found p:not(.code) {
  margin: 12px 0 24px;
  color: var(--muted);
}
</style>
