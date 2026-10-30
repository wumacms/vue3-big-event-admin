import { beforeEach, describe, expect, it } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { getUserInfoApi, loginApi, registerApi, updateUserAvatarApi } from '@/api/user'
import { addChannelApi, delChannelApi, getArticleListApi, getChannelListApi } from '@/api/article'
import { useUserStore } from '@/stores/user'
import { resetMockDb } from '@/mock/db'

/** 登录并返回可用的 store（内部已写入 token） */
async function loginAsAdmin() {
  const store = useUserStore()
  const { token } = await loginApi({ username: 'admin', password: 'admin123' })
  store.setToken(token)
  return store
}

describe('接口层（本地 Mock）', () => {
  beforeEach(() => {
    localStorage.clear()
    resetMockDb()
    setActivePinia(createPinia())
  })

  it('admin / admin123 可以登录并取得 token', async () => {
    const { token } = await loginApi({ username: 'admin', password: 'admin123' })
    expect(token).toMatch(/^mock-token-admin-/)
  })

  it('密码错误时登录失败', async () => {
    await expect(loginApi({ username: 'admin', password: 'wrong' })).rejects.toThrow(
      '用户名或密码错误',
    )
  })

  it('注册后可以使用新账号登录', async () => {
    await registerApi({ username: 'tester', password: '123456', repassword: '123456' })
    const { token } = await loginApi({ username: 'tester', password: '123456' })
    expect(token).toContain('tester')
  })

  it('携带 token 可以获取当前用户信息', async () => {
    const store = await loginAsAdmin()
    await store.getUserInfo()
    expect(store.userInfo?.username).toBe('admin')
    expect(store.userInfo?.nickname).toBe('管理员')
  })

  it('没有 token 时获取用户信息会被拒绝', async () => {
    await expect(getUserInfoApi()).rejects.toThrow('身份认证失败')
  })

  it('头像以 base64 提交后可以读回', async () => {
    const store = await loginAsAdmin()
    const avatar = 'data:image/png;base64,iVBORw0KGgo='
    await updateUserAvatarApi(avatar)
    await store.getUserInfo()
    expect(store.userInfo?.user_pic).toBe(avatar)
  })

  it('分类可以新增与删除，且分类下存在文章时不允许删除', async () => {
    await loginAsAdmin()
    await addChannelApi({ cate_name: '测试分类', cate_alias: 'test' })

    const { channels } = await getChannelListApi()
    const created = channels.find((item) => item.cate_alias === 'test')
    expect(created).toBeTruthy()

    // 种子数据中「前端开发」（id=1）下有文章，删除应失败
    await expect(delChannelApi(1)).rejects.toThrow('该分类下还有文章')
    await delChannelApi(created!.id)

    const after = await getChannelListApi()
    expect(after.channels.some((item) => item.cate_alias === 'test')).toBe(false)
  })

  it('文章列表支持分页与按状态筛选', async () => {
    await loginAsAdmin()
    const page1 = await getArticleListApi({ pagenum: 1, pagesize: 2 })
    expect(page1.items).toHaveLength(2)
    expect(page1.total).toBeGreaterThanOrEqual(3)

    const drafts = await getArticleListApi({ pagenum: 1, pagesize: 10, state: '草稿' })
    expect(drafts.items.every((item) => item.state === '草稿')).toBe(true)
  })
})
