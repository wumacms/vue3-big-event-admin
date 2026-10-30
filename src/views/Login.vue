<script setup lang="ts">
import { ref, reactive } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { loginApi, registerApi } from '@/api/user'
import { useUserStore } from '@/stores/user'
import { useRouter } from 'vue-router'
import loginBg from '@/assets/login-bg.jpg'
import loginLogo from '@/assets/login-logo.png'

const router = useRouter()
const userStore = useUserStore()

const formRef = ref<FormInstance>()
// true 代表注册表单，false 代表登录表单
const isRegister = ref(false)
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  repassword: '',
})

const rules: FormRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { pattern: /^\S{1,10}$/, message: '用户名必须是 1-10 位的非空字符', trigger: 'blur' },
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { pattern: /^\S{6,15}$/, message: '密码必须是 6-15 位的非空字符', trigger: 'blur' },
  ],
  repassword: [
    { required: true, message: '请再次输入密码', trigger: 'blur' },
    {
      validator: (_rule, value: string, callback) => {
        if (value !== form.password) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur',
    },
  ],
}

/** 填入演示账号，方便快速体验 */
function fillDemo() {
  form.username = 'admin'
  form.password = 'admin123'
  formRef.value?.clearValidate()
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  loading.value = true
  try {
    if (isRegister.value) {
      await registerApi({ ...form })
      ElMessage.success('注册成功，请登录')
      isRegister.value = false
    } else {
      const { token } = await loginApi({ username: form.username, password: form.password })
      userStore.setToken(token)
      ElMessage.success('登录成功')
      router.push('/')
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <!-- 左栏：背景图 + 居中透明 Logo -->
    <div class="banner" :style="{ backgroundImage: `url(${loginBg})` }">
      <img class="banner-logo" :src="loginLogo" alt="大事件" />
    </div>

    <!-- 右栏：登录 / 注册表单 -->
    <div class="panel">
      <el-card class="login-card">
        <template #header>
          <div class="card-header">
            <span class="logo">{{ isRegister ? '注 册' : '登 录' }}</span>
          </div>
        </template>

        <el-form ref="formRef" :model="form" :rules="rules" size="large" autocomplete="off">
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="请输入用户名" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" />
          </el-form-item>
          <el-form-item v-if="isRegister" prop="repassword">
            <el-input v-model="form.repassword" type="password" show-password placeholder="请再次输入密码" />
          </el-form-item>

          <el-form-item>
            <el-button class="submit-btn" type="primary" :loading="loading" @click="handleSubmit">
              {{ isRegister ? '注 册' : '登 录' }}
            </el-button>
          </el-form-item>

          <el-form-item>
            <el-link type="info" :underline="false" @click="isRegister = !isRegister">
              {{ isRegister ? '← 已有账号？去登录' : '没有账号？去注册 →' }}
            </el-link>
          </el-form-item>
        </el-form>

        <el-alert v-if="!isRegister" type="info" :closable="false" class="demo-tip">
          <template #title>
            演示账号：admin / admin123
            <el-link type="primary" :underline="false" class="fill-link" @click="fillDemo">
              一键填入
            </el-link>
          </template>
        </el-alert>
      </el-card>
    </div>
  </div>
</template>

<style scoped lang="scss">
.login-page {
  display: flex;
  height: 100%;

  // 左栏：背景图铺满，Logo 水平垂直居中
  .banner {
    position: relative;
    flex: 1.4;
    background-size: cover;
    background-position: center;

    .banner-logo {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 38%;
      max-width: 380px;
      min-width: 220px;
    }
  }

  // 右栏：表单卡片居中
  .panel {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background:
      radial-gradient(1200px 500px at 20% -10%, #4a5dbf33, transparent),
      linear-gradient(135deg, #23262e 0%, #2c3e50 100%);
  }

  .login-card {
    width: 400px;
    max-width: 100%;
    border-radius: 12px;
  }

  .demo-tip {
    margin-top: 4px;
    --el-alert-padding: 8px 12px;

    .fill-link {
      margin-left: 8px;
      font-size: 12px;
    }
  }

  .card-header {
    display: flex;
    align-items: center;

    .logo {
      position: relative;
      padding-left: 12px;
      color: #303133;
      font-size: 20px;
      font-weight: 700;
      letter-spacing: 2px;

      // 标题左侧的强调竖线
      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 50%;
        transform: translateY(-50%);
        width: 4px;
        height: 16px;
        border-radius: 2px;
        background-color: var(--el-color-primary);
      }
    }
  }

  .submit-btn {
    width: 100%;
    letter-spacing: 4px;
  }
}

// 窄屏下隐藏左栏图片，只保留表单
@media (max-width: 768px) {
  .login-page .banner {
    display: none;
  }
}
</style>
