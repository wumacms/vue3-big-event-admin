<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()
</script>

<template>
  <el-card class="not-found" shadow="never">
    <el-result icon="warning" title="404" sub-title="抱歉，你访问的页面不存在或已被移除">
      <template #extra>
        <el-button type="primary" @click="router.push('/')">返回首页</el-button>
      </template>
    </el-result>
  </el-card>
</template>

<style scoped lang="scss">
.not-found {
  border-radius: 8px;
}
</style>
