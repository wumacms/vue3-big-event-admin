<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css'
import { onBeforeUnmount, shallowRef } from 'vue'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'
import type { IDomEditor, IEditorConfig, IToolbarConfig } from '@wangeditor/editor'

/** 编辑器内容（HTML 字符串） */
const modelValue = defineModel<string>({ default: '' })

const editorRef = shallowRef<IDomEditor>()

const toolbarConfig: Partial<IToolbarConfig> = {
  excludeKeys: ['group-video', 'insertVideo', 'fullScreen'],
}

const editorConfig: Partial<IEditorConfig> = {
  placeholder: '请输入文章内容，支持标题、列表、引用、代码块等格式',
  MENU_CONF: {
    uploadImage: {
      // Mock 演示环境不做图片上传，直接插入本地图片的 base64
      base64LimitSize: 1024 * 1024,
    },
  },
}

function handleCreated(editor: IDomEditor) {
  editorRef.value = editor
}

onBeforeUnmount(() => {
  editorRef.value?.destroy()
})
</script>

<template>
  <div class="rich-editor">
    <Toolbar
      class="rich-editor-toolbar"
      :editor="editorRef"
      :default-config="toolbarConfig"
      mode="default"
    />
    <Editor
      v-model="modelValue"
      class="rich-editor-content"
      :default-config="editorConfig"
      mode="default"
      @on-created="handleCreated"
    />
  </div>
</template>

<style scoped lang="scss">
.rich-editor {
  width: 100%;
  border: 1px solid var(--el-border-color);
  border-radius: 6px;
  overflow: hidden;
  background-color: #fff;
  z-index: 1;

  .rich-editor-toolbar {
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .rich-editor-content {
    height: 320px;
    overflow-y: auto;
  }
}
</style>
