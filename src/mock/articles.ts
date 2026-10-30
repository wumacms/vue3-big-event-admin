export type ChannelAlias = 'frontend' | 'backend' | 'database' | 'ai' | 'devops' | 'design'

export interface ArticleSeed {
  title: string
  cate: ChannelAlias
  state: '已发布' | '草稿'
  /** 距今多少天发布 */
  daysAgo: number
  content: string
}

/**
 * 演示文章：标题与正文按真实技术博客的写法组织，
 * 覆盖不同分类、发布时间与草稿状态，方便查看分页、筛选与详情效果。
 */
export const ARTICLE_SEEDS: ArticleSeed[] = [
  {
    title: 'Vue 3.5 的 defineModel 到底解决了什么问题',
    cate: 'frontend',
    state: '已发布',
    daysAgo: 1,
    content: `<p>3.4 之前写一个支持 v-model 的组件，要在 props 里声明 <code>modelValue</code>，再手动 emit <code>update:modelValue</code>，中间还得处理默认值、类型和修饰符。代码不多，但每写一个组件都要重复一遍。</p>
<h2>改动前后对比</h2>
<p><code>defineModel()</code> 直接返回一个可读写的 ref：父组件的值变化会同步回来，子组件赋值会自动 emit，默认值通过第一个参数声明。</p>
<pre><code class="language-ts">const model = defineModel&lt;string&gt;({ default: '' })

model.value = 'hello' // 自动 emit('update:modelValue')</code></pre>
<p>需要注意两点：解构会丢失响应性（要配合 <code>toRefs</code>），以及在 <code>v-model</code> 上挂修饰符时要在 <code>defineModel</code> 里显式声明 <code>set</code>。</p>`,
  },
  {
    title: 'Spring Boot 自动配置是怎么生效的',
    cate: 'backend',
    state: '已发布',
    daysAgo: 2,
    content: `<p>面试常问「自动配置原理」，标准答案一般是 <code>@EnableAutoConfiguration</code> 加载 <code>META-INF/spring/...AutoConfiguration.imports</code>。但真正决定某个配置类生不生效的，是那一串条件注解。</p>
<h2>条件装配的执行顺序</h2>
<ul>
<li><code>@ConditionalOnClass</code>：类路径上没有对应类就直接跳过，这是引入 starter 才有行为的原因</li>
<li><code>@ConditionalOnMissingBean</code>：允许用户自定义 Bean 覆盖默认实现，所以自定义优先于自动配置</li>
<li><code>@ConditionalOnProperty</code>：开关型配置，例如 <code>spring.datasource.enabled</code></li>
</ul>
<p>排查「为什么我的配置没生效」，最有效的方式是打开 <code>debug=true</code>，启动日志会打印 <code>ConditionEvaluationReport</code>，明确告诉你哪个条件没满足。</p>`,
  },
  {
    title: '企业级 Pinia 分层 store 的落地方式',
    cate: 'frontend',
    state: '已发布',
    daysAgo: 3,
    content: `<p>项目超过二十个页面之后，把所有状态塞进一个 store 会迅速失控：命名冲突、互相引用、热更新变慢。我们按职责拆成三层。</p>
<h2>分层结构</h2>
<ul>
<li><strong>数据层</strong>：只管接口调用与缓存，不写业务判断</li>
<li><strong>业务层</strong>：组合多个数据层 store，处理权限、流程与表单状态</li>
<li><strong>视图层</strong>：组件只读业务层的 getter，通过 action 触发变更</li>
</ul>
<p>拆完之后组件的 <code>import</code> 变多了，但排查数据流时链路非常清晰，新人上手成本反而下降。</p>
<blockquote>不要为了分层而分层，两个页面共用一份数据时再抽 store 也不迟。</blockquote>`,
  },
  {
    title: 'MySQL 索引失效的 12 种场景（附执行计划）',
    cate: 'database',
    state: '已发布',
    daysAgo: 4,
    content: `<p>慢查询排查里，超过一半的问题不是没建索引，而是索引没被用上。下面几种是线上最常见的。</p>
<h2>高频场景</h2>
<ul>
<li>对索引列做函数或运算，比如 <code>WHERE DATE(create_time) = '2026-10-01'</code></li>
<li>隐式类型转换：字符串字段用数字查询，索引直接失效</li>
<li>联合索引违反最左前缀，跳过了第一列</li>
<li><code>LIKE '%关键词'</code> 前置模糊匹配</li>
<li><code>OR</code> 连接的字段有一侧没索引</li>
</ul>
<p>验证方式统一用 <code>EXPLAIN</code>，重点看 <code>type</code>、<code>key</code> 和 <code>rows</code>。出现 <code>ALL</code> 基本就是全表扫描，<code>Using filesort</code> 则说明排序没走索引。</p>
<pre><code class="language-sql">EXPLAIN SELECT id, title FROM article
WHERE cate_id = 1 AND state = '已发布'
ORDER BY pub_date DESC LIMIT 10;</code></pre>`,
  },
  {
    title: 'Vite 换用 Rolldown 之后，构建时间从 14s 降到 2.3s',
    cate: 'frontend',
    state: '已发布',
    daysAgo: 5,
    content: `<p>项目是一个二十多页的后台系统，依赖 Element Plus 和富文本编辑器，原来的构建稳定在 14 秒左右。换 <code>rolldown-vite</code> 之后第一次跑就掉到 2.3 秒。</p>
<h2>迁移中实际改了什么</h2>
<p>配置层面基本零改动，但有两个地方踩了坑：<code>manualChunks</code> 只接受函数形式，对象写法会直接报错；部分 CJS 依赖需要显式加 <code>optimizeDeps.include</code>。</p>
<p>另外 dev 下偶尔出现 <code>504 Outdated Optimize Dep</code>，清掉 <code>node_modules/.vite</code> 并加 <code>--force</code> 重启即可，属于依赖预构建的缓存问题，不是代码问题。</p>
<blockquote>收益主要来自构建速度，产物体积变化不大，不要指望它顺手把包变小。</blockquote>`,
  },
  {
    title: 'Docker 镜像从 1.2G 瘦身到 180M 的完整过程',
    cate: 'devops',
    state: '已发布',
    daysAgo: 6,
    content: `<p>起因是每次发布要往镜像仓库推 1.2G，CI 光上传就要三分钟。优化分三步走，最终压到 180M。</p>
<h2>三步优化</h2>
<ul>
<li>换基础镜像：<code>node:22</code> 换成 <code>node:22-alpine</code>，直接从 1.1G 降到 220M</li>
<li>多阶段构建：构建阶段装全部依赖，运行阶段只拷贝 <code>dist</code> 和 <code>node_modules</code></li>
<li>合并 <code>RUN</code> 指令并及时清缓存：<code>apk add</code> 之后同一个 <code>RUN</code> 里执行 <code>rm -rf /var/cache/apk/*</code></li>
</ul>
<pre><code class="language-dockerfile">FROM node:22-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable &amp;&amp; pnpm install --frozen-lockfile
COPY . .
RUN pnpm build</code></pre>
<p>最后用 <code>dive</code> 检查每层体积，能直观看到哪一层还在浪费空间。</p>`,
  },
  {
    title: '把 NestJS 后端迁移到 Serverless 函数的一次复盘',
    cate: 'backend',
    state: '已发布',
    daysAgo: 7,
    content: `<p>团队后端原本是常驻的 NestJS 服务，为了省成本迁到云函数。整个过程比预期麻烦，主要难在三个地方。</p>
<h2>三个真实问题</h2>
<p>第一是冷启动：首次调用 1.8 秒，最终靠精简依赖和复用数据库连接池压到 600 毫秒左右。第二是文件上传，原来的本地临时目录不可写，要改成直传对象存储。第三是定时任务，云函数没有常驻进程，得换成平台的定时触发器。</p>
<p>接口适配层基本没动，前端也完全无感，这是当初分层设计带来的收益。</p>`,
  },
  {
    title: 'RAG 检索质量差，先检查你的分块策略',
    cate: 'ai',
    state: '已发布',
    daysAgo: 8,
    content: `<p>很多团队接完向量库就发现答非所问，第一反应是换模型。实际上大部分问题出在切分环节：把一整篇文档按固定 500 字切开，语义被拦腰斩断，召回的自然也是碎片。</p>
<h2>我们调整的三件事</h2>
<ul>
<li>按标题层级切分，保留小节完整语义，再对超长小节二次切分</li>
<li>每个分块拼接上级标题作为上下文前缀，检索时命中率明显提升</li>
<li>相邻分块保留 15% 重叠，避免边界信息丢失</li>
</ul>
<p>改完之后同一批问题的召回准确率从 62% 提到 84%，模型没换。</p>`,
  },
  {
    title: '别再用 watch 同步状态了',
    cate: 'frontend',
    state: '已发布',
    daysAgo: 9,
    content: `<p>常见写法：一个筛选条件变了，用 <code>watch</code> 去改另一个 ref，再用第二个 <code>watch</code> 触发请求。链条一长，数据流向就没人说得清。</p>
<h2>优先考虑派生状态</h2>
<p>能从已有状态算出来的，一律用 <code>computed</code>：它没有中间态，也不会因为时序问题出现两次渲染。只有「状态变化要产生副作用」（请求、埋点、本地存储）时才用 watch。</p>
<pre><code class="language-ts">// 不推荐：两个 ref 靠 watch 同步
watch(keyword, (val) =&gt; { filtered.value = list.value.filter(...) })

// 推荐：直接派生
const filtered = computed(() =&gt; list.value.filter((item) =&gt; item.title.includes(keyword.value)))</code></pre>`,
  },
  {
    title: '给团队做了一次 LLM Agent 落地分享',
    cate: 'ai',
    state: '草稿',
    daysAgo: 10,
    content: `<p>提纲还没整理完，先把要点记下来。</p>
<ul>
<li>Agent 不是万能胶，适合流程明确、步骤可枚举的场景</li>
<li>工具定义比提示词更重要，参数描述写清楚能少一半幻觉</li>
<li>必须有兜底：模型给不出结果时要能退回人工流程</li>
</ul>
<p>准备补几个内部真实案例，再补一页成本对比。</p>`,
  },
  {
    title: 'PostgreSQL 的 JSONB 到底该怎么建索引',
    cate: 'database',
    state: '已发布',
    daysAgo: 11,
    content: `<p>JSONB 灵活，但索引建错了比不建更糟：写入变慢，查询还是全表扫。</p>
<h2>三种索引的适用场景</h2>
<ul>
<li><strong>GIN + jsonb_ops</strong>：支持 <code>?</code>、<code>@&gt;</code> 等操作符，适合字段不固定的场景，索引体积较大</li>
<li><strong>GIN + jsonb_path_ops</strong>：只支持 <code>@&gt;</code>，体积约为前者的一半，推荐优先考虑</li>
<li><strong>B-tree 表达式索引</strong>：某个字段查询极其频繁时，直接对 <code>(data-&gt;&gt;'status')</code> 建索引最快</li>
</ul>
<pre><code class="language-sql">CREATE INDEX idx_article_meta ON article USING gin (meta jsonb_path_ops);</code></pre>
<p>判断标准很简单：如果 90% 的查询都在同一个字段上，用表达式索引；如果查询条件千变万化，再上 GIN。</p>`,
  },
  {
    title: 'JWT 刷新令牌：滑动过期还是双 token',
    cate: 'backend',
    state: '已发布',
    daysAgo: 12,
    content: `<p>两个方案都常见，选哪个取决于能不能接受「短时间内 token 失效」。</p>
<h2>滑动过期</h2>
<p>每次请求都刷新过期时间，实现简单，但 token 永不过期，一旦泄露就是长期风险，也不方便强制下线。</p>
<h2>双 token</h2>
<p>access token 短（15 分钟），refresh token 长（7 天）且只能换发一次。代价是要维护 refresh token 的白名单或版本号，注销时能立即失效。</p>
<p>我们最终选了双 token，并把 refresh token 存进 HttpOnly Cookie，前端拿不到，XSS 也偷不走。</p>`,
  },
  {
    title: '后台管理系统的信息密度怎么控',
    cate: 'design',
    state: '已发布',
    daysAgo: 13,
    content: `<p>后台系统最容易走两个极端：留白太多，一屏看不到十条数据；或者塞满字段，用户要横向滚动才能找到操作列。</p>
<h2>我们的取舍</h2>
<ul>
<li>列表默认只展示 5 到 7 列，其余字段收进详情抽屉</li>
<li>行高控制在 44 到 48 像素，低于 40 会明显增加误点</li>
<li>操作列固定在右侧，超过三个操作收进「更多」</li>
</ul>
<p>衡量标准不是好看，而是「完成一次核心任务需要几次滚动、几次点击」。</p>`,
  },
  {
    title: '接口幂等设计：从唯一索引到令牌',
    cate: 'backend',
    state: '草稿',
    daysAgo: 14,
    content: `<p>下单接口被重复调用的排查记录，还没整理完。</p>
<p>初步结论：前端防抖只能降低概率，服务端必须有幂等保证。目前考虑用业务唯一键建唯一索引，冲突时返回已有订单；对于没有天然唯一键的接口，用请求令牌加 Redis 短期占位。</p>`,
  },
  {
    title: 'GitHub Actions 部署前端项目的 3 个隐藏问题',
    cate: 'devops',
    state: '已发布',
    daysAgo: 16,
    content: `<p>配置本身不复杂，但有几个坑第一次基本都会踩。</p>
<h2>踩坑记录</h2>
<ul>
<li><strong>Pages 没开启</strong>：workflow 直接失败，报 <code>Get Pages site failed</code>，要先去仓库 Settings 把 Source 设成 GitHub Actions</li>
<li><strong>子路径资源 404</strong>：部署在 <code>/repo/</code> 下时，构建的 <code>base</code> 必须同步改，否则 JS 全部 404</li>
<li><strong>SPA 刷新白屏</strong>：history 模式需要 <code>404.html</code> 兜底，复制一份 <code>index.html</code> 即可</li>
</ul>
<p>另外 <code>pnpm</code> 版本要和本地锁文件一致，否则 <code>--frozen-lockfile</code> 会直接报 store 不匹配。</p>`,
  },
  {
    title: '一次慢查询排查：从 8 秒到 40 毫秒',
    cate: 'database',
    state: '已发布',
    daysAgo: 18,
    content: `<p>报表页打开要 8 秒，用户投诉了三次。按常规流程走了一遍。</p>
<h2>定位过程</h2>
<p>先开慢查询日志确认是单条 SQL，再用 <code>EXPLAIN</code> 看到 <code>type=ALL</code>、<code>rows</code> 接近两百万。原因是筛选条件里对时间字段用了 <code>DATE()</code> 函数，索引失效。</p>
<p>改成范围查询后降到 300 毫秒。继续优化：把 <code>ORDER BY</code> 和筛选条件合成联合索引，避免 <code>Using filesort</code>，最终稳定在 40 毫秒左右。</p>
<blockquote>经验：先看执行计划，再谈加索引，顺序反了容易白干。</blockquote>`,
  },
  {
    title: '表单设计：错误提示应该出现在哪里',
    cate: 'design',
    state: '草稿',
    daysAgo: 20,
    content: `<p>收集了一些表单可用性问题的案例，提纲待补充。</p>
<p>目前的想法：字段级错误紧贴字段下方，表单级错误放在提交按钮上方，不要用弹窗打断填写。提交失败时自动滚动到第一个错误字段。</p>`,
  },
  {
    title: 'Prompt 工程不是玄学：三组对照实验',
    cate: 'ai',
    state: '已发布',
    daysAgo: 21,
    content: `<p>拿同一个抽取任务做了三组对照，每组 100 条样本，人工评估准确率。</p>
<h2>结果</h2>
<ul>
<li>只说「请提取关键信息」：准确率 58%，输出格式极不稳定</li>
<li>给出字段定义和两个示例：准确率 79%</li>
<li>再补一条「字段缺失时返回 null，不要编造」：准确率 91%</li>
</ul>
<p>提升最大的不是示例，而是明确约束「不许编造」。模型在信息不足时倾向于补全，这是幻觉的主要来源。</p>`,
  },
  {
    title: 'Redis 缓存穿透、击穿、雪崩的正确处理姿势',
    cate: 'database',
    state: '已发布',
    daysAgo: 25,
    content: `<p>三个概念经常被混着说，处理方式其实完全不同。</p>
<h2>分别怎么处理</h2>
<ul>
<li><strong>穿透</strong>：查不存在的数据，缓存永远不命中。用布隆过滤器拦截，或者把空结果也缓存一个短 TTL</li>
<li><strong>击穿</strong>：热点 key 过期瞬间大量请求打到数据库。用逻辑过期 + 互斥锁重建</li>
<li><strong>雪崩</strong>：大批 key 同时过期。给过期时间加随机抖动，并做好降级</li>
</ul>
<p>最容易忽略的是穿透，因为「查不到」在监控里看起来不像错误，只有数据库 QPS 异常升高时才暴露。</p>`,
  },
  {
    title: 'Nginx 反向代理配置模板（含 HTTPS 与 WebSocket）',
    cate: 'devops',
    state: '已发布',
    daysAgo: 30,
    content: `<p>这套配置在三个项目里复用过，直接改域名即可。</p>
<pre><code class="language-nginx">server {
  listen 443 ssl http2;
  server_name example.com;

  ssl_certificate     /etc/nginx/cert/fullchain.pem;
  ssl_certificate_key /etc/nginx/cert/privkey.pem;

  location /api/ {
    proxy_pass http://127.0.0.1:3000/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
  }

  location /ws/ {
    proxy_pass http://127.0.0.1:3000/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
  }
}</code></pre>
<p>两个易错点：<code>proxy_pass</code> 结尾带不带 <code>/</code> 会改变路径拼接结果；WebSocket 必须显式设置 <code>Upgrade</code> 和 <code>Connection</code> 头。</p>`,
  },
  {
    title: 'Element Plus 表单校验的 5 个隐蔽坑',
    cate: 'frontend',
    state: '草稿',
    daysAgo: 45,
    content: `<p>整理中，先记录几条。</p>
<ul>
<li><code>v-model</code> 绑在可选链上，值变化不会触发校验</li>
<li>动态渲染的表单项需要手动 <code>clearValidate</code></li>
<li><code>validate()</code> 不传回调时，校验失败会抛异常，要 catch</li>
</ul>
<p>还有两条待补充：嵌套表单的 <code>prop</code> 路径规则，以及自定义 validator 里的异步时序问题。</p>`,
  },
]
