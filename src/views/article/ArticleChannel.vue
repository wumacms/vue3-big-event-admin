<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import { addChannelApi, delChannelApi, getChannelListApi, updateChannelApi } from '@/api/article'
import type { Channel } from '@/types/api'

const loading = ref(false)
const channelList = ref<Channel[]>([])

async function loadChannels() {
  loading.value = true
  try {
    const res = await getChannelListApi()
    channelList.value = res.channels
  } finally {
    loading.value = false
  }
}

onMounted(loadChannels)

/* ---------- 新增 / 编辑弹窗 ---------- */
const dialogVisible = ref(false)
const dialogTitle = ref('添加文章分类')
const formRef = ref<FormInstance>()
const form = reactive({ id: 0, cate_name: '', cate_alias: '' })

const rules: FormRules = {
  cate_name: [
    { required: true, message: '请输入分类名称', trigger: 'blur' },
    { pattern: /^\S{1,10}$/, message: '分类名称必须是 1-10 位的非空字符', trigger: 'blur' },
  ],
  cate_alias: [
    { required: true, message: '请输入分类别名', trigger: 'blur' },
    { pattern: /^[a-zA-Z0-9]{1,15}$/, message: '分类别名必须是 1-15 位的字母数字', trigger: 'blur' },
  ],
}

function openAdd() {
  dialogTitle.value = '添加文章分类'
  Object.assign(form, { id: 0, cate_name: '', cate_alias: '' })
  dialogVisible.value = true
}

function openEdit(row: Channel) {
  dialogTitle.value = '编辑文章分类'
  Object.assign(form, { id: row.id, cate_name: row.cate_name, cate_alias: row.cate_alias })
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return

  if (form.id) {
    await updateChannelApi({ ...form })
    ElMessage.success('修改成功')
  } else {
    await addChannelApi({ cate_name: form.cate_name, cate_alias: form.cate_alias })
    ElMessage.success('添加成功')
  }
  dialogVisible.value = false
  loadChannels()
}

/* ---------- 删除 ---------- */
async function handleDelete(row: Channel) {
  await ElMessageBox.confirm('你确认要删除该分类吗？', '温馨提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  })
  await delChannelApi(row.id)
  ElMessage.success('删除成功')
  loadChannels()
}
</script>

<template>
  <el-card class="page-card" shadow="never">
    <template #header>
      <div class="card-header">
        <span>文章分类</span>
        <el-button type="primary" :icon="Plus" @click="openAdd">添加分类</el-button>
      </div>
    </template>

    <el-table :data="channelList" v-loading="loading" stripe>
      <el-table-column type="index" label="序号" width="80" />
      <el-table-column prop="cate_name" label="分类名称" />
      <el-table-column prop="cate_alias" label="分类别名" />
      <el-table-column label="操作" width="160" align="center">
        <template #default="{ row }">
          <el-button :icon="Edit" circle type="primary" plain @click="openEdit(row as Channel)" />
          <el-button :icon="Delete" circle type="danger" plain @click="handleDelete(row as Channel)" />
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无分类数据" />
      </template>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" width="420px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="分类名称" prop="cate_name">
          <el-input v-model="form.cate_name" placeholder="请输入分类名称" />
        </el-form-item>
        <el-form-item label="分类别名" prop="cate_alias">
          <el-input v-model="form.cate_alias" placeholder="请输入分类别名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确认</el-button>
      </template>
    </el-dialog>
  </el-card>
</template>

<style scoped lang="scss">
.page-card {
  border-radius: 8px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 600;
}
</style>
