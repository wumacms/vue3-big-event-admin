import { describe, expect, it } from 'vitest'
import { isHtmlEmpty, sanitizeHtml } from '@/utils/html'

describe('rich text 工具函数', () => {
  it('移除 script 标签', () => {
    const html = '<p>正文</p><script>alert(1)</script>'
    expect(sanitizeHtml(html)).toBe('<p>正文</p>')
  })

  it('移除内联事件属性', () => {
    const html = '<img src="a.png" onerror="alert(1)"><p onclick="x()">文字</p>'
    const result = sanitizeHtml(html)
    expect(result).not.toContain('onerror')
    expect(result).not.toContain('onclick')
    expect(result).toContain('文字')
  })

  it('移除 javascript: 协议链接', () => {
    const html = '<a href="javascript:alert(1)">点我</a>'
    expect(sanitizeHtml(html)).toBe('<a>点我</a>')
  })

  it('保留正常富文本结构', () => {
    const html = '<h2>标题</h2><ul><li>条目</li></ul>'
    expect(sanitizeHtml(html)).toContain('<h2>标题</h2>')
    expect(sanitizeHtml(html)).toContain('<li>条目</li>')
  })

  it('判断内容是否为空', () => {
    expect(isHtmlEmpty('<p><br></p>')).toBe(true)
    expect(isHtmlEmpty('<p>&nbsp;</p>')).toBe(true)
    expect(isHtmlEmpty('<p>有内容</p>')).toBe(false)
  })
})
