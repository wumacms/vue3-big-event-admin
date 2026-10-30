<script setup lang="ts">
import { ref } from 'vue'
import type { UploadFile } from 'element-plus'
import { ElMessage } from 'element-plus'
import { updateUserAvatarApi } from '@/api/user'
import { useUserStore } from '@/stores/user'

const userStore = useUserStore()
const previewUrl = ref('')

function validateImageFile(rawFile: File): boolean {
  const isImage = ['image/jpeg', 'image/png', 'image/gif'].includes(rawFile.type)
  if (!isImage) ElMessage.error('头像只支持 JPG / PNG / GIF 格式')
  if (rawFile.size / 1024 / 1024 > 2) ElMessage.error('头像大小不能超过 2MB')
  return isImage && rawFile.size / 1024 / 1024 <= 2
}

async function handleUpload() {
  // 从上传组件的事件回调里缓存选中文件
  const rawFile = selectedFile.value
  if (!rawFile) {
    ElMessage.warning('请先选择图片')
    return
  }

  // 大事件接口要求头像以 base64 字符串提交
  const reader = new FileReader()
  reader.readAsDataURL(rawFile)
  reader.onload = async () => {
    await updateUserAvatarApi(reader.result as string)
    ElMessage.success('更换头像成功')
    await userStore.getUserInfo()
    previewUrl.value = ''
  }
}

// 缓存用户选择的文件
const selectedFile = ref<File | null>(null)
const onFileChange = (uploadFile: UploadFile) => {
  if (!validateImageFile(uploadFile.raw as File)) {
    selectedFile.value = null
    previewUrl.value = ''
    return
  }
  selectedFile.value = uploadFile.raw as File
  previewUrl.value = URL.createObjectURL(selectedFile.value)
}
</script>

<template>
  <el-card class="page-card" shadow="never">
    <template #header>
      <div class="card-header">
        <span>更换头像</span>
      </div>
    </template>

    <el-upload
      class="avatar-uploader"
      drag
      :auto-upload="false"
      :show-file-list="false"
      accept="image/jpeg,image/png,image/gif"
      :on-change="onFileChange"
    >
      <img v-if="previewUrl" :src="previewUrl" class="avatar-preview" />
      <el-avatar v-else :size="120" :src="userStore.userInfo?.user_pic">
        {{ (userStore.userInfo?.nickname || '用').slice(0, 1) }}
      </el-avatar>
      <div class="upload-tip">点击或拖拽图片到此处上传</div>
    </el-upload>

    <div class="actions">
      <el-button type="primary" @click="handleUpload">确认更换</el-button>
    </div>
  </el-card>
</template>

<style scoped lang="scss">
.page-card {
  border-radius: 8px;
}

.card-header {
  font-weight: 600;
}

.avatar-uploader {
  :deep(.el-upload-dragger) {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    width: 360px;
    padding: 32px 0;
  }

  .avatar-preview {
    width: 120px;
    height: 120px;
    border-radius: 50%;
    object-fit: cover;
  }

  .upload-tip {
    color: #909399;
    font-size: 13px;
  }
}

.actions {
  margin-top: 16px;
}
</style>
