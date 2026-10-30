/** 提交信息规范：feat / fix / docs / style / refactor / perf / test / build / ci / chore */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // 允许中文描述（中文没有大小写概念）
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
    // 描述必须有内容
    'subject-empty': [2, 'never'],
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'],
    ],
  },
}
