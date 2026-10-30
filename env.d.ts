/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 接口基地址 */
  readonly VITE_API_BASE_URL: string
  /** 是否启用本地 Mock（'false' 关闭，其余值开启） */
  readonly VITE_USE_MOCK: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
