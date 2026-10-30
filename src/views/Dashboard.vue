<script setup lang="ts">
import { computed, ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useUserStore } from '@/stores/user'
import { resetMockDb } from '@/mock/db'

const userStore = useUserStore()
const isMock = ref(import.meta.env.VITE_USE_MOCK === 'true')
const resetting = ref(false)
const nickname = computed(() => userStore.userInfo?.nickname || userStore.userInfo?.username || '')

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 6) return '夜深了'
  if (hour < 9) return '早上好'
  if (hour < 12) return '上午好'
  if (hour < 14) return '中午好'
  if (hour < 18) return '下午好'
  return '晚上好'
})

async function handleReset() {
  await ElMessageBox.confirm('将清空本地新增/修改的分类与文章，恢复初始演示数据，确认继续？', '重置演示数据', {
    confirmButtonText: '重置',
    cancelButtonText: '取消',
    type: 'warning',
  })
  resetting.value = true
  try {
    resetMockDb()
    ElMessage.success('演示数据已重置，返回列表可查看')
    window.location.reload()
  } finally {
    resetting.value = false
  }
}
</script>

<template>
  <div class="dashboard">
    <el-card shadow="never" class="welcome-card">
      <div class="welcome">
        <el-avatar :size="56" :src="userStore.userInfo?.user_pic">
          {{ nickname.slice(0, 1) || '用' }}
        </el-avatar>
        <div class="welcome-text">
          <h2>{{ greeting }}，{{ nickname }}</h2>
          <p>欢迎回来，祝你今天工作顺利！</p>
        </div>
      </div>
    </el-card>

    <el-row :gutter="16" class="stat-row">
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat">
            <span class="stat-label">快捷入口</span>
            <div class="stat-links">
              <RouterLink to="/article/channel">文章分类</RouterLink>
              <RouterLink to="/article/manage">文章管理</RouterLink>
              <RouterLink to="/user/profile">基本资料</RouterLink>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat">
            <span class="stat-label">系统说明</span>
            <p class="stat-desc">Vue 3 + Vite + TypeScript + Pinia + Element Plus</p>
          </div>
        </el-card>
      </el-col>
      <el-col :span="8">
        <el-card shadow="hover">
          <div class="stat">
            <span class="stat-label">当前登录</span>
            <p class="stat-desc">账号：{{ userStore.userInfo?.username || '-' }}</p>
            <p class="stat-desc">数据来源：{{ isMock ? '本地 Mock 演示数据' : '远程接口' }}</p>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-card v-if="isMock" shadow="never" class="mock-card">
      <div class="mock-tip">
        <div>
          <div class="mock-title">演示模式</div>
          <p class="mock-desc">
            当前使用浏览器 localStorage 中的模拟数据（账号 admin / admin123），所有增删改都会保存在本地。
          </p>
        </div>
        <el-button @click="handleReset">重置演示数据</el-button>
      </div>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.welcome-card {
  border-radius: 8px;

  .welcome {
    display: flex;
    align-items: center;
    gap: 16px;

    h2 {
      margin-bottom: 4px;
      font-size: 20px;
    }

    p {
      color: #909399;
      font-size: 14px;
    }
  }
}

.stat-row {
  margin-top: 16px;
}

.stat {
  .stat-label {
    display: inline-block;
    margin-bottom: 12px;
    padding: 2px 10px;
    border-radius: 4px;
    background-color: #ecf5ff;
    color: #409eff;
    font-size: 13px;
  }

  .stat-links {
    display: flex;
    gap: 16px;

    a {
      color: #409eff;
      font-size: 14px;

      &:hover {
        text-decoration: underline;
      }
    }
  }

  .stat-desc {
    color: #606266;
    font-size: 14px;
  }
}

.mock-card {
  margin-top: 16px;
  border-radius: 8px;

  .mock-tip {
    display: flex;
    gap: 16px;
    align-items: center;
    justify-content: space-between;
  }

  .mock-title {
    margin-bottom: 6px;
    font-weight: 600;
  }

  .mock-desc {
    color: #909399;
    font-size: 13px;
  }
}
</style>
