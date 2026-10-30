import { request } from '@/utils/request'
import type { UserInfo } from '@/types/api'

export interface LoginForm {
  username: string
  password: string
}

export interface RegisterForm extends LoginForm {
  repassword: string
}

/** 注册 */
export function registerApi(data: RegisterForm) {
  return request<null>({ url: '/api/register', method: 'post', data })
}

/** 登录 */
export function loginApi(data: LoginForm) {
  return request<{ token: string }>({ url: '/api/login', method: 'post', data })
}

/** 获取当前登录用户信息 */
export function getUserInfoApi() {
  return request<UserInfo>({ url: '/api/user/info' })
}

/** 更新用户基本资料 */
export function updateUserInfoApi(data: { id: number; nickname: string; email: string }) {
  return request<null>({ url: '/api/user/info', method: 'patch', data })
}

/** 更新用户头像 */
export function updateUserAvatarApi(avatar: string) {
  return request<null>({ url: '/api/user/avatar', method: 'patch', data: { avatar } })
}
