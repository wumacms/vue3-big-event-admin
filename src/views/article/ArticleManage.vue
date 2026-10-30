<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import type { FormInstance, FormRules, UploadProps } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Delete, Edit, Plus, Search } from '@element-plus/icons-vue'
import {
  delArticleApi,
  getArticleDetailApi,
  getArticleListApi,
  getChannelListApi,
  publishArticleApi,
  updateArticleApi,
} from '@/api/article'
import type { Article, ArticleDetail, Channel } from '@/types/api'
import { isHtmlEmpty, sanitizeHtml } from '@/utils/html'

// 编辑器体积较大，抽屉打开时才加载
const RichEditor = defineAsyncComponent(() => import('@/components/RichEditor.vue'))

/* ---------------- 列表 ---------------- */

const channelList = ref<Channel[]>([])
const articleList = ref<Article[]>([])
const total = ref(0)
const loading = ref(false)

const params = reactive({
  pagenum: 1,
  pagesize: 5,
  cate_id: '' as number | '',
  state: '',
})

async function loadArticles() {
  loading.value = true
  try {
    const res = await getArticleListApi(params)
    articleList.value = res.items
    total.value = res.total
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  params.pagenum = 1
  loadArticles()
}

function handleSizeChange() {
  params.pagenum = 1
  loadArticles()
}

onMounted(async () => {
  const res = await getChannelListApi()
  channelList.value = res.channels
  await loadArticles()
})

/* ---------------- 发布 / 编辑 ---------------- */

const drawerVisible = ref(false)
const drawerTitle = ref('发布文章')
const submitting = ref(false)
const editingId = ref(0)
const formRef = ref<FormInstance>()

const articleForm = reactive<{
  title: string
  cate_id: number | ''
  content: string
  state: '已发布' | '草稿'
}>({
  title: '',
  cate_id: '',
  content: '',
  state: '草稿',
})

const rules: FormRules = {
  title: [
    { required: true, message: '请输入文章标题', trigger: 'blur' },
    { min: 1, max: 30, message: '标题长度需在 1-30 个字符之间', trigger: 'blur' },
  ],
  cate_id: [{ required: true, message: '请选择文章分类', trigger: 'change' }],
  content: [
    {
      validator: (_rule, value: string, callback) => {
        if (isHtmlEmpty(value || '')) callback(new Error('请输入文章内容'))
        else callback()
      },
      trigger: 'blur',
    },
  ],
}

/* 封面：coverFile 为新上传的文件，coverPreview 用于预览，coverUrl 为编辑时后端返回的原封面 */
const coverFile = ref<File | null>(null)
const coverPreview = ref('')
const coverUrl = ref('')

function revokePreview() {
  if (coverPreview.value.startsWith('blob:')) URL.revokeObjectURL(coverPreview.value)
}

const onCoverChange: UploadProps['onChange'] = (uploadFile) => {
  const raw = uploadFile.raw as File | undefined
  if (!raw) return
  if (!validateCover(raw)) return
  revokePreview()
  coverFile.value = raw
  coverPreview.value = URL.createObjectURL(raw)
}

const beforeCoverUpload: UploadProps['beforeUpload'] = (rawFile) => validateCover(rawFile)

function validateCover(file: File) {
  const isImage = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)
  if (!isImage) ElMessage.error('封面只支持 JPG / PNG / GIF / WEBP 格式')
  if (file.size / 1024 / 1024 > 2) ElMessage.error('封面大小不能超过 2MB')
  return isImage && file.size / 1024 / 1024 <= 2
}

const coverDisplay = computed(() => coverPreview.value || coverUrl.value)

const uploadRef = ref()

function resetForm() {
  revokePreview()
  coverFile.value = null
  coverPreview.value = ''
  coverUrl.value = ''
  Object.assign(articleForm, { title: '', cate_id: '', content: '', state: '草稿' })
  formRef.value?.clearValidate()
  uploadRef.value?.clearFiles()
}

function openPublish() {
  drawerTitle.value = '发布文章'
  editingId.value = 0
  resetForm()
  drawerVisible.value = true
}

async function openEdit(row: Article) {
  drawerTitle.value = '编辑文章'
  editingId.value = row.id
  resetForm()
  const detail = await getArticleDetailApi(row.id)
  Object.assign(articleForm, {
    title: detail.title,
    cate_id: detail.cate_id,
    content: detail.content,
    state: detail.state,
  })
  coverUrl.value = detail.cover_img
  drawerVisible.value = true
}

async function submitArticle(state: '已发布' | '草稿') {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) {
    ElMessage.warning('请先完善文章信息')
    return
  }
  if (!editingId.value && !coverFile.value) {
    ElMessage.warning('请上传文章封面')
    return
  }

  articleForm.state = state
  const fd = new FormData()
  fd.append('title', articleForm.title.trim())
  fd.append('cate_id', String(articleForm.cate_id))
  fd.append('content', articleForm.content)
  fd.append('state', state)
  // 编辑时不重新上传则沿用原封面，避免接口要求封面必填导致失败
  if (coverFile.value) fd.append('cover_img', coverFile.value)

  submitting.value = true
  try {
    if (editingId.value) {
      await updateArticleApi(editingId.value, fd, { silent: true })
      ElMessage.success('编辑成功')
    } else {
      await publishArticleApi(fd, { silent: true })
      ElMessage.success(state === '草稿' ? '已存为草稿' : '发布成功')
    }
    drawerVisible.value = false
    await loadArticles()
  } finally {
    submitting.value = false
  }
}

/* ---------------- 详情预览 ---------------- */

const detailVisible = ref(false)
const detailLoading = ref(false)
const detail = ref<ArticleDetail | null>(null)

async function openDetail(row: Article) {
  detailVisible.value = true
  detailLoading.value = true
  detail.value = null
  try {
    detail.value = await getArticleDetailApi(row.id)
  } finally {
    detailLoading.value = false
  }
}

const detailContent = computed(() => sanitizeHtml(detail.value?.content ?? ''))

/* ---------------- 删除 ---------------- */

async function handleDelete(row: Article) {
  await ElMessageBox.confirm('你确认要删除该文章吗？', '温馨提示', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  })
  await delArticleApi(row.id)
  ElMessage.success('删除成功')
  if (articleList.value.length === 1 && params.pagenum > 1) params.pagenum -= 1
  await loadArticles()
}

onBeforeUnmount(revokePreview)
</script>

<template>
  <el-card class="page-card" shadow="never">
    <template #header>
      <div class="card-header">
        <span>文章管理</span>
        <el-button type="primary" :icon="Plus" @click="openPublish">发布文章</el-button>
      </div>
    </template>

    <el-form inline>
      <el-form-item label="文章分类">
        <el-select v-model="params.cate_id" placeholder="请选择分类" clearable style="width: 180px">
          <el-option
            v-for="channel in channelList"
            :key="channel.id"
            :label="channel.cate_name"
            :value="channel.id"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="发布状态">
        <el-select v-model="params.state" placeholder="请选择状态" clearable style="width: 160px">
          <el-option label="已发布" value="已发布" />
          <el-option label="草稿" value="草稿" />
        </el-select>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
      </el-form-item>
    </el-form>

    <el-table :data="articleList" v-loading="loading" stripe>
      <el-table-column label="封面" width="120">
        <template #default="{ row }">
          <el-image
            v-if="(row as Article).cover_img"
            :src="(row as Article).cover_img"
            :preview-src-list="[(row as Article).cover_img as string]"
            preview-teleported
            fit="cover"
            class="cover-thumb"
          />
          <span v-else class="cover-empty">无封面</span>
        </template>
      </el-table-column>
      <el-table-column prop="title" label="文章标题" min-width="200">
        <template #default="{ row }">
          <el-link type="primary" :underline="false" @click="openDetail(row as Article)">
            {{ (row as Article).title }}
          </el-link>
        </template>
      </el-table-column>
      <el-table-column prop="cate_name" label="分类" width="120" />
      <el-table-column prop="pub_date" label="发表时间" width="180">
        <template #default="{ row }">
          {{ (row as Article).pub_date?.replace('T', ' ').slice(0, 19) }}
        </template>
      </el-table-column>
      <el-table-column prop="state" label="状态" width="100">
        <template #default="{ row }">
          <el-tag :type="(row as Article).state === '已发布' ? 'success' : 'info'">
            {{ (row as Article).state }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="160" align="center">
        <template #default="{ row }">
          <el-button :icon="Edit" circle type="primary" plain @click="openEdit(row as Article)" />
          <el-button
            :icon="Delete"
            circle
            type="danger"
            plain
            @click="handleDelete(row as Article)"
          />
        </template>
      </el-table-column>
      <template #empty>
        <el-empty description="暂无文章数据" />
      </template>
    </el-table>

    <div class="page-footer">
      <el-pagination
        v-model:current-page="params.pagenum"
        v-model:page-size="params.pagesize"
        :page-sizes="[5, 10, 20, 50]"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
        background
        @size-change="handleSizeChange"
        @current-change="loadArticles"
      />
    </div>

    <!-- 发布 / 编辑抽屉 -->
    <el-drawer v-model="drawerVisible" :title="drawerTitle" size="50%" destroy-on-close>
      <el-form ref="formRef" :model="articleForm" :rules="rules" label-width="80px">
        <el-form-item label="文章标题" prop="title">
          <el-input v-model="articleForm.title" maxlength="30" show-word-limit placeholder="请输入文章标题" />
        </el-form-item>
        <el-form-item label="文章分类" prop="cate_id">
          <el-select v-model="articleForm.cate_id" placeholder="请选择分类" style="width: 100%">
            <el-option
              v-for="channel in channelList"
              :key="channel.id"
              :label="channel.cate_name"
              :value="channel.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="文章封面">
          <el-upload
            ref="uploadRef"
            class="cover-uploader"
            :auto-upload="false"
            :show-file-list="false"
            accept="image/jpeg,image/png,image/gif,image/webp"
            :on-change="onCoverChange"
            :before-upload="beforeCoverUpload"
          >
            <img v-if="coverDisplay" :src="coverDisplay" class="cover-preview" alt="封面预览" />
            <div v-else class="cover-placeholder">
              <el-icon><Plus /></el-icon>
              <span>点击上传封面</span>
            </div>
          </el-upload>
          <div class="cover-tip">建议尺寸 300×180，大小不超过 2MB，编辑时不重新上传将沿用原封面</div>
        </el-form-item>
        <el-form-item label="文章内容" prop="content">
          <RichEditor v-model="articleForm.content" />
        </el-form-item>
        <el-form-item>
          <el-button type="info" :loading="submitting" @click="submitArticle('草稿')">
            存为草稿
          </el-button>
          <el-button type="primary" :loading="submitting" @click="submitArticle('已发布')">
            发布
          </el-button>
        </el-form-item>
      </el-form>
    </el-drawer>

    <!-- 文章详情预览 -->
    <el-dialog v-model="detailVisible" title="文章详情" width="720px" top="6vh">
      <div v-loading="detailLoading" class="article-detail">
        <template v-if="detail">
          <h1 class="detail-title">{{ detail.title }}</h1>
          <div class="detail-meta">
            <el-tag size="small" :type="detail.state === '已发布' ? 'success' : 'info'">
              {{ detail.state }}
            </el-tag>
            <span>分类：{{ detail.cate_name }}</span>
            <span>发表时间：{{ detail.pub_date.replace('T', ' ').slice(0, 19) }}</span>
          </div>
          <el-image
            v-if="detail.cover_img"
            :src="detail.cover_img"
            fit="cover"
            class="detail-cover"
          />
          <!-- 内容已经 sanitizeHtml 清洗 -->
          <div class="detail-content" v-html="detailContent"></div>
        </template>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
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

.cover-thumb {
  width: 96px;
  height: 54px;
  border-radius: 4px;
}

.cover-empty {
  color: #c0c4cc;
  font-size: 12px;
}

.cover-uploader {
  :deep(.el-upload) {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 200px;
    height: 112px;
    overflow: hidden;
    border: 1px dashed var(--el-border-color);
    border-radius: 6px;
    cursor: pointer;

    &:hover {
      border-color: var(--el-color-primary);
    }
  }

  .cover-preview {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .cover-placeholder {
    display: flex;
    flex-direction: column;
    gap: 6px;
    align-items: center;
    color: #8c939d;
    font-size: 13px;
  }
}

.cover-tip {
  width: 100%;
  margin-top: 6px;
  color: #909399;
  font-size: 12px;
}

.article-detail {
  min-height: 200px;

  .detail-title {
    margin-bottom: 12px;
    font-size: 22px;
    line-height: 1.4;
  }

  .detail-meta {
    display: flex;
    gap: 16px;
    align-items: center;
    margin-bottom: 16px;
    color: #909399;
    font-size: 13px;
  }

  .detail-cover {
    width: 100%;
    max-height: 280px;
    margin-bottom: 16px;
    border-radius: 6px;
  }

  .detail-content {
    color: #303133;
    line-height: 1.8;

    :deep(h1),
    :deep(h2),
    :deep(h3) {
      margin: 16px 0 8px;
      line-height: 1.4;
    }

    :deep(p) {
      margin: 8px 0;
    }

    :deep(ul),
    :deep(ol) {
      padding-left: 24px;
    }

    :deep(code) {
      padding: 2px 4px;
      border-radius: 3px;
      background-color: #f5f7fa;
      font-size: 13px;
    }

    :deep(pre) {
      padding: 12px;
      border-radius: 6px;
      background-color: #f5f7fa;
      overflow-x: auto;
    }

    :deep(blockquote) {
      margin: 12px 0;
      padding-left: 12px;
      border-left: 3px solid var(--el-border-color);
      color: #606266;
    }

    :deep(img) {
      max-width: 100%;
      border-radius: 4px;
    }
  }
}
</style>
