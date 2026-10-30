<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage } from 'element-plus'
import { updateUserInfoApi } from '@/api/user'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const formRef = ref<FormInstance>()

const form = reactive({
  id: userStore.userInfo?.id ?? 0,
  nickname: userStore.userInfo?.nickname ?? '',
  email: userStore.userInfo?.email ?? '',
})

const rules: FormRules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { pattern: /^\S{1,10}$/, message: '昵称必须是 1-10 位的非空字符', trigger: 'blur' },
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' },
  ],
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  await updateUserInfoApi({ ...form })
  ElMessage.success('修改成功')
  userStore.getUserInfo()
}
</script>

<template>
  <el-card class="page-card" shadow="never">
    <template #header>
      <div class="card-header">
        <span>基本资料</span>
      </div>
    </template>

    <el-row :gutter="20">
      <el-col :span="12">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
          <el-form-item label="登录名称">
            <el-input :model-value="userStore.userInfo?.username" disabled />
          </el-form-item>
          <el-form-item label="用户昵称" prop="nickname">
            <el-input v-model="form.nickname" placeholder="请输入用户昵称" />
          </el-form-item>
          <el-form-item label="用户邮箱" prop="email">
            <el-input v-model="form.email" placeholder="请输入用户邮箱" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSubmit">提交修改</el-button>
          </el-form-item>
        </el-form>
      </el-col>
      <el-col :span="12">
        <div class="avatar-tip">
          <el-avatar :size="120" :src="userStore.userInfo?.user_pic">
            {{ (form.nickname || '用').slice(0, 1) }}
          </el-avatar>
          <p>头像可在「更换头像」页面修改</p>
        </div>
      </el-col>
    </el-row>
  </el-card>
</template>

<style scoped lang="scss">
.page-card {
  border-radius: 8px;
}

.card-header {
  font-weight: 600;
}

.avatar-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;

  p {
    color: #909399;
    font-size: 13px;
  }
}
</style>
