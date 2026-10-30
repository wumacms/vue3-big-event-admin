import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUserInfoApi } from '@/api/user'
import type { UserInfo } from '@/types/api'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)

  function setToken(val: string) {
    token.value = val
    localStorage.setItem('token', val)
  }

  /** 拉取并缓存当前登录用户信息 */
  async function getUserInfo() {
    userInfo.value = await getUserInfoApi()
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }

  return { token, userInfo, setToken, getUserInfo, logout }
})
