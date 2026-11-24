# HOT TREND V1.0

> 个人自用的抖音 / 快手热点观察台。纯静态、无后端、无账号、无 API Key，托管于 GitHub Pages。

---

## 一、这个项目是什么

一个**只读的热点聚合看板**，把抖音与快手的公开热点信息，用统一的中文界面整理成 9 个栏目，支持搜索、筛选、复制文案、本地收藏。

它**不是**爬虫，也**不接入**任何付费数据接口。原因见第五节。

## 二、功能清单

| # | 栏目 | 说明 |
|---|---|---|
| 1 | 今日热门视频 | 抖音 / 快手当日热点视频，跳官方页面播放 |
| 2 | 热门音频 | 热门 BGM 与配音素材，仅记录元数据 |
| 3 | 热门特效 | 滤镜 / 贴纸 / 转场等道具 |
| 4 | 爆款文案 | 12 条原创文案模板，一键复制 |
| 5 | 经典语录 | 公版典籍名句 + 原创金句，一键复制 |
| 6 | 抖音热门榜 | 只在来源给出 `rank` 时显示名次 |
| 7 | 快手热门榜 | 同上 |
| 8 | 上升最快榜 | 按来源给出的上升幅度 / 名次变化排序 |
| 9 | 历史收藏 | 本地 localStorage，可导出 JSON |

全局能力：搜索（标题 / 作者 / 标签 / 正文）、平台与分类筛选、深色模式、手机 / 桌面自适应、数据状态与执行日志面板。

## 三、技术栈

- React 18 + TypeScript（`strict` 全开）
- Vite 5（`base` 由 `VITE_BASE` 注入，适配 Pages 子路径）
- Tailwind CSS 3（CSS 变量驱动的明暗双主题）
- 数据层：`public/data/*.json` 静态文件 + `fetch`，零依赖
- 路由：自实现 hash 路由（`#/today`），规避静态托管刷新 404
- 图标：lucide-react（不使用 emoji 充当图标）
- 状态：React hooks + localStorage，无全局状态库

## 四、本地开发

```bash
npm install
npm run dev            # http://127.0.0.1:5173
npm run build          # 产出 dist/
npm run preview        # 预览 dist/
npm run typecheck      # 仅类型检查
npm run update:data:dry # 数据更新预演（只校验，不写盘）
npm run update:data     # 执行数据更新
```

## 五、数据从哪来（重要）

**约束**：不用 API / API Key / 付费接口，且**不得伪造播放量、点赞量、热度、排名**。

**现实**：抖音与快手都没有面向个人开发者的免鉴权公开数据接口。任何「全自动抓取」都要逆向平台签名（`a_bogus` 等）或复用登录态 Cookie —— 属于绕过技术保护措施，违反平台协议，且随时失效。

**因此 V1.0 的管道是**：

```
人工核验快照 (scripts/sources/curated.json)
        ↓  schema 校验（指标必须是整数或 null / 链接必须是官方 https 域名）
        ↓  清洗与规范化
   public/data/*.json  （静态数据，随仓库版本化）
        ↓  GitHub Actions 提交 → GitHub Pages 部署
      网页
```

**自动化程度没有降低**：每天 08:00 的定时任务照样执行、校验、入库、提交、部署。变的是「数据怎么来」，不是「流程是否自动」。

查看 [`scripts/sources/README.md`](scripts/sources/README.md) 了解填写规范。

**前端保障**：`useData` 会先请求网络，失败时回退到 localStorage 中的**上一次有效数据**，并在页面顶部提示，不会白屏、不会显示空值。

## 六、自动更新

`.github/workflows/update.yml`

- 触发：每天 **UTC 00:00 = 北京时间 08:00**（GitHub cron 只支持 UTC，故写 `0 0 * * *`），另支持 `workflow_dispatch` 手动触发。
- 时区：工作流级 `TZ: Asia/Shanghai`，日志时间、提交信息均为北京时间。
- 定时任务**只在默认分支（main）**生效 —— 请确保默认分支是 `main`。
- 失败策略：校验任一失败 → 不写任何文件 → 旧数据完整保留 → `logs.json` 记一条 `failed` → 该次运行标红。
- 无变化时跳过提交，不产生空提交。

`.github/workflows/deploy.yml`

- `push` 到 `main` 或手动触发 → `npm ci` → `npm run build` → 部署到 Pages。
- 自动注入 `VITE_BASE`：普通仓库为 `/<仓库名>/`，`<用户名>.github.io` 仓库自动为 `/`。

## 七、部署到 GitHub Pages（首次）

1. 在 GitHub 新建**空**仓库（不要勾选 README / .gitignore），记下仓库地址。
2. 本地初始化并推送：

```bash
cd HOT-TREND
git init -b main
git add .
git commit -m "feat: HOT TREND V1.0"
git remote add origin https://github.com/<用户名>/<仓库名>.git
git push -u origin main
```

3. 仓库 **Settings → Pages → Build and deployment → Source 选 `GitHub Actions`**。
4. 仓库 **Settings → Actions → General → Workflow permissions** 选 **Read and write permissions**（否则更新任务无法提交数据）。
5. 等待 `构建并部署到 GitHub Pages` 变绿，访问 `https://<用户名>.github.io/<仓库名>/`。
6. 把仓库地址填进 `src/config.ts` 的 `repoUrl`，页面内的「打开更新工作流」按钮即可直达。

## 八、目录结构

```
HOT-TREND/
├─ .github/workflows/       # update.yml（每日更新）/ deploy.yml（Pages 部署）
├─ public/
│  ├─ .nojekyll
│  ├─ favicon.svg
│  └─ data/                 # 全部静态数据（10 个 JSON）
├─ scripts/
│  ├─ update.mjs            # 更新管道：校验 → 清洗 → 原子写入 → 记日志
│  └─ sources/              # 数据源快照目录 + README
├─ src/
│  ├─ components/           # Header / Nav / cards / TrendList / DataPanel / ui
│  ├─ hooks/                # useData / useFavorites / useTheme
│  ├─ lib/                  # router / format / storage / clipboard / cx
│  ├─ pages/                # 9 个栏目页
│  ├─ types.ts              # 数据契约（唯一真源）
│  ├─ config.ts             # 站点与仓库配置
│  └─ main.tsx / App.tsx
├─ index.html
├─ tailwind.config.js / postcss.config.js
├─ vite.config.ts / tsconfig*.json
└─ package.json
```

## 九、数据契约要点

见 `src/types.ts` 与 `scripts/update.mjs` 的校验逻辑，三条铁律：

1. `metrics` 里的数值**只能是非负整数或 `null`**；`null` 渲染为「未公开」，绝不显示 0。
2. `rank` 只能来自平台公开榜单；没有就留 `null`，页面会隐藏排名列，并提示「展示顺序不等于排名」。
3. `url` 必须是 `https` + `*.douyin.com` / `*.kuaishou.com`，脚本会拒绝其它域名。

## 十、合规与边界

- 不绕过登录、验证码、签名校验或反爬机制；不采集个人信息。
- 视频与音频只提供原平台官方链接，不在本站缓存或二次分发；版权归原权利人。
- 站点为个人自用，`index.html` 已加 `robots: noindex, nofollow`，不做公开推广。
- 无后端、无数据库、无账号体系，不收集任何用户数据；收藏仅存于本机浏览器。

## 十一、许可

个人项目，未附带开源许可协议。若要公开分发，请自行补充 LICENSE 并复核第三方素材版权。
