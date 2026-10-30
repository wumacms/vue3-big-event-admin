<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Avatar,
  CaretBottom,
  ChatLineSquare,
  EditPen,
  Expand,
  Fold,
  HomeFilled,
  Notebook,
  UserFilled,
} from '@element-plus/icons-vue'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const route = useRoute()
const router = useRouter()

const isCollapse = ref(false)
const asideWidth = computed(() => (isCollapse.value ? '64px' : '220px'))

// 刷新页面后 userInfo 为空，重新拉取一次
if (!userStore.userInfo) {
  userStore.getUserInfo().catch(() => {
    // 失败时由请求层统一处理（提示并跳转登录）
  })
}

const nickname = computed(
  () => userStore.userInfo?.nickname || userStore.userInfo?.username || '未设置昵称',
)
const avatarUrl = computed(() => userStore.userInfo?.user_pic || '')

const breadcrumbs = computed(() => {
  const list: string[] = []
  if (route.meta.group) list.push(String(route.meta.group))
  if (route.meta.title) list.push(String(route.meta.title))
  return list
})

const isDashboard = computed(() => route.path === '/dashboard')

async function handleCommand(command: string) {
  if (command === 'profile') router.push('/user/profile')
  if (command === 'avatar') router.push('/user/avatar')
  if (command === 'logout') {
    await ElMessageBox.confirm('你确认退出登录吗？', '温馨提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning',
    })
    userStore.logout()
    ElMessage.success('退出登录成功')
    router.push('/login')
  }
}
</script>

<template>
  <el-container class="layout-container">
    <!-- 左侧菜单 -->
    <el-aside :width="asideWidth" class="layout-aside">
      <div class="logo">
        <span class="logo-text">{{ isCollapse ? '大' : '大事件' }}</span>
      </div>
      <el-menu
        router
        :default-active="route.path"
        :collapse="isCollapse"
        :collapse-transition="false"
        background-color="#23262e"
        text-color="#c5c8d1"
        active-text-color="#ffffff"
        class="aside-menu"
      >
        <el-menu-item index="/dashboard">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </el-menu-item>

        <el-sub-menu index="/article">
          <template #title>
            <el-icon><Notebook /></el-icon>
            <span>文章管理</span>
          </template>
          <el-menu-item index="/article/channel">
            <el-icon><ChatLineSquare /></el-icon>
            <span>文章分类</span>
          </el-menu-item>
          <el-menu-item index="/article/manage">
            <el-icon><EditPen /></el-icon>
            <span>文章列表</span>
          </el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="/user">
          <template #title>
            <el-icon><UserFilled /></el-icon>
            <span>个人中心</span>
          </template>
          <el-menu-item index="/user/profile">基本资料</el-menu-item>
          <el-menu-item index="/user/avatar">更换头像</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <!-- 右侧区域 -->
    <el-container>
      <el-header class="layout-header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="isCollapse = !isCollapse">
            <Expand v-if="isCollapse" />
            <Fold v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item v-if="!isDashboard" :to="{ path: '/dashboard' }">
              首页
            </el-breadcrumb-item>
            <el-breadcrumb-item
              v-for="(item, index) in breadcrumbs"
              :key="item"
              :class="{ 'is-current': index === breadcrumbs.length - 1 }"
            >
              {{ item }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>

        <el-dropdown @command="handleCommand">
          <span class="user-info">
            <el-avatar :size="32" :src="avatarUrl" class="user-avatar">
              <el-icon><Avatar /></el-icon>
            </el-avatar>
            <span class="user-name">{{ nickname }}</span>
            <el-icon><CaretBottom /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">基本资料</el-dropdown-item>
              <el-dropdown-item command="avatar" divided>更换头像</el-dropdown-item>
              <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>

      <el-main class="layout-main">
        <RouterView v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </RouterView>
      </el-main>
    </el-container>
  </el-container>
</template>

<style scoped lang="scss">
.layout-container {
  height: 100%;
}

.layout-aside {
  background-color: #23262e;
  transition: width 0.2s;

  .logo {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 60px;

    .logo-text {
      color: #ffffff;
      font-size: 18px;
      font-weight: 700;
      letter-spacing: 4px;
      white-space: nowrap;
    }
  }

  .aside-menu {
    border-right: none;

    &:not(.el-menu--collapse) {
      width: 220px;
    }
  }
}

.layout-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  background-color: #ffffff;
  border-bottom: 1px solid #e4e7ed;

  .header-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .collapse-btn {
    font-size: 18px;
    color: #606266;
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
    }
  }

  .user-info {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    outline: none;

    .user-name {
      font-size: 14px;
      color: #303133;
    }
  }
}

.layout-main {
  padding: 16px;
  background-color: #f4f4f5;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
