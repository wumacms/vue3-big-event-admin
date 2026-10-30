import 'axios'

declare module 'axios' {
  export interface AxiosRequestConfig {
    /** 置为 true 时该请求不显示全局 loading */
    silent?: boolean
  }
}
