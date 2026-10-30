import type { AxiosRequestConfig } from 'axios'
import { request } from '@/utils/request'
import type { Article, ArticleDetail, Channel, PageResult } from '@/types/api'

/* ---------------- 文章分类 ---------------- */

/** 获取文章分类列表 */
export function getChannelListApi() {
  return request<{ channels: Channel[] }>({ url: '/api/user/channel' })
}

/** 新增文章分类 */
export function addChannelApi(data: { cate_name: string; cate_alias: string }) {
  return request<null>({ url: '/api/user/channel', method: 'post', data })
}

/** 更新文章分类 */
export function updateChannelApi(data: { id: number; cate_name: string; cate_alias: string }) {
  return request<null>({ url: '/api/user/channel', method: 'put', data })
}

/** 删除文章分类 */
export function delChannelApi(id: number) {
  return request<null>({ url: '/api/user/channel', method: 'delete', params: { id } })
}

/* ---------------- 文章管理 ---------------- */

export interface ArticleQuery {
  pagenum: number
  pagesize: number
  cate_id?: number | ''
  state?: string
}

/** 获取文章分页列表 */
export function getArticleListApi(params: ArticleQuery) {
  return request<PageResult<Article>>({ url: '/api/article', params })
}

/** 获取文章详情 */
export function getArticleDetailApi(id: number) {
  return request<ArticleDetail>({ url: '/api/article/detail', params: { id } })
}

/** 发布文章（草稿或正式），cover_img 为 FormData 中的文件 */
export function publishArticleApi(data: FormData, config?: AxiosRequestConfig) {
  return request<null>({ url: '/api/article', method: 'post', data, ...config })
}

/** 编辑文章 */
export function updateArticleApi(id: number, data: FormData, config?: AxiosRequestConfig) {
  return request<null>({ url: '/api/article', method: 'put', params: { id }, data, ...config })
}

/** 删除文章 */
export function delArticleApi(id: number) {
  return request<null>({ url: '/api/article', method: 'delete', params: { id } })
}
