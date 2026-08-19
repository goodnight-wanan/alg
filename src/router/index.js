import { createRouter, createWebHashHistory } from 'vue-router'
import { useUserStore } from '../stores/user'

const routes = [
  {
    path: '/',
    name: 'home',
    component: () => import('../views/HomeView.vue'),
    meta: { title: '悦音音乐 - 发现好音乐' }
  },
  {
    path: '/category',
    name: 'category',
    component: () => import('../views/CategoryView.vue'),
    meta: { title: '分类歌单' }
  },
  {
    path: '/playlist/:id',
    name: 'playlist',
    component: () => import('../views/PlaylistView.vue'),
    meta: { title: '歌单详情' }
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('../views/SearchView.vue'),
    meta: { title: '搜索' }
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('../views/RegisterView.vue'),
    meta: { title: '注册' }
  },
  {
    path: '/mine',
    name: 'mine',
    component: () => import('../views/MineView.vue'),
    meta: { title: '我的音乐', requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('../views/ProfileView.vue'),
    meta: { title: '个人中心', requiresAuth: true }
  },
  {
    path: '/404',
    name: 'not-found',
    component: () => import('../views/NotFoundView.vue'),
    meta: { title: '页面不存在' }
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/404'
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  }
})

router.beforeEach((to) => {
  const userStore = useUserStore()

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    return { name: 'login' }
  }

  document.title = to.meta.title || '悦音音乐'
  return true
})

export default router
