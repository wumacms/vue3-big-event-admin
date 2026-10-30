import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useUserStore } from '@/stores/user'

describe('user store', () => {
  beforeEach(() => {
    localStorage.clear()
    setActivePinia(createPinia())
  })

  it('setToken 同时写入 localStorage', () => {
    const store = useUserStore()
    store.setToken('abc')
    expect(store.token).toBe('abc')
    expect(localStorage.getItem('token')).toBe('abc')
  })

  it('初始化时从 localStorage 恢复 token', () => {
    localStorage.setItem('token', 'restored')
    const store = useUserStore()
    expect(store.token).toBe('restored')
  })

  it('logout 清空 token 与用户信息', () => {
    const store = useUserStore()
    store.setToken('abc')
    store.userInfo = {
      id: 1,
      username: 'admin',
      nickname: '管理员',
      email: '',
      user_pic: '',
    }

    store.logout()

    expect(store.token).toBe('')
    expect(store.userInfo).toBeNull()
    expect(localStorage.getItem('token')).toBeNull()
  })
})
