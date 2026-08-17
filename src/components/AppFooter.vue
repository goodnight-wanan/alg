<template>
  <footer class="app-footer">
    <div class="footer-inner">
      <a class="download" href="#" @click.prevent>
        <p>下载客户端</p>
      </a>

      <p>相关信息：</p>
      <p>北华大学计算机科学技术学院 @1977-2099</p>
      <p>软件工程北华前端开发小组 · Vue 3 重构版</p>
      <p>违法和不良信息举报电话：6666-88888</p>
      <p>举报邮箱：xxx@qg.com</p>
      <p>音乐网站 | 服务条款 | 隐私政策 | 版权投诉指引 | 意见反馈</p>
    </div>
  </footer>
</template>

<style scoped>
.app-footer {
  min-height: 360px;
  padding: 72px 24px 60px;
  background-color: rgba(25, 25, 25, 0.85);
  color: #fff;
}

.footer-inner {
  width: min(1200px, 100%);
  margin: 0 auto;
  font-size: 20px;
  font-weight: 1000;
  line-height: 2.1;
  letter-spacing: 2px;
  text-align: center;
}

.download {
  display: block;
  width: 500px;
  max-width: 80vw;
  margin: 0 auto 30px;
  color: #fff;
  transition: color 0.2s ease;
}

.download p {
  margin: 0;
}

.download:hover {
  color: pink;
}

@media (max-width: 700px) {
  .footer-inner {
    font-size: 15px;
    line-height: 2.2;
  }
}
</style>
