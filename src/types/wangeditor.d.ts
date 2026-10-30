/**
 * @wangeditor/editor-for-vue 的 package.json exports 未正确暴露类型，
 * 这里补充最小声明，实际类型见 node_modules/@wangeditor/editor-for-vue/dist/src。
 */
declare module '@wangeditor/editor-for-vue' {
  import type { DefineComponent } from 'vue'

  export const Editor: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export const Toolbar: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
}
