import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes: RouteRecordRaw[] = [
  { path: '/login', component: () => import('@/views/Login.vue'), meta: { title: '登录' } },
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '首页' },
      },
      {
        path: 'article/channel',
        name: 'articleChannel',
        component: () => import('@/views/article/ArticleChannel.vue'),
        meta: { title: '文章分类', group: '文章管理' },
      },
      {
        path: 'article/manage',
        name: 'articleManage',
        component: () => import('@/views/article/ArticleManage.vue'),
        meta: { title: '文章列表', group: '文章管理' },
      },
      {
        path: 'user/profile',
        name: 'userProfile',
        component: () => import('@/views/user/UserProfile.vue'),
        meta: { title: '基本资料', group: '个人中心' },
      },
      {
        path: 'user/avatar',
        name: 'userAvatar',
        component: () => import('@/views/user/UserAvatar.vue'),
        meta: { title: '更换头像', group: '个人中心' },
      },
      {
        path: ':pathMatch(.*)*',
        name: 'notFound',
        component: () => import('@/views/NotFound.vue'),
        meta: { title: '页面不存在' },
      },
    ],
  },
]

// 使用 BASE_URL，保证部署到 GitHub Pages 子路径后路由仍然正常
const router = createRouter({ history: createWebHistory(import.meta.env.BASE_URL), routes })

router.beforeEach((to) => {
  const userStore = useUserStore()
  if (to.path !== '/login' && !userStore.token) return '/login'
  if (to.path === '/login' && userStore.token) return '/'
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} - 大事件` : '大事件'
})

export default router
