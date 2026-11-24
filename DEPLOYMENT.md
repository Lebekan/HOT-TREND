# 部署与验收记录

> 记录 HOT TREND V1.0 的上线过程与自检结果，供后续排查对照。

## 一、实际部署信息（已核实）

| 项目 | 值 |
|---|---|
| GitHub 账号 | `Lebekan` |
| 仓库地址 | https://github.com/Lebekan/HOT-TREND |
| **线上访问地址** | **https://lebekan.github.io/HOT-TREND/** |
| 默认分支 | `main` |
| Pages 来源 | GitHub Actions |
| 部署方式 | `deploy.yml`，`push main` 自动触发 |

> ⚠️ **`www.lebekan.github.io` 访问不通。** GitHub Pages 的免费域名不带 `www` 前缀，正确写法是 `https://lebekan.github.io/HOT-TREND/`。GitHub Pages 后台也无法为 `*.github.io` 绑定 `www` 子域 —— 想用自定义域名必须自己买域名，与「不购买域名」的要求冲突，因此不采用。

## 二、验收自检结果

### 1. 所有页面可正常打开（线上实测，2026-11-24）

| 栏目 | 路由 | 结果 |
|---|---|---|
| 今日热门视频 | `#/today` | ✅ |
| 热门音频 | `#/audios` | ✅ |
| 热门特效 | `#/effects` | ✅ |
| 爆款文案 | `#/copies` | ✅ |
| 经典语录 | `#/quotes` | ✅ |
| 抖音热门榜 | `#/douyin` | ✅ |
| 快手热门榜 | `#/kuaishou` | ✅ |
| 上升最快榜 | `#/rising` | ✅ |
| 历史收藏 | `#/favorites` | ✅ |

### 2. 中文显示

- `<html lang="zh-CN">`，字体栈含 PingFang SC / 微软雅黑 / 思源黑体。
- 全部界面文案为简体中文；数字使用 `tabular-nums` 防止跳动。
- 所有日期按 `Asia/Shanghai` 格式化。
- 实测 9 个栏目标题、分类筛选词、文案与语录正文均正常渲染，无乱码、无豆腐块。

### 3. 手机端布局

- 移动优先：`viewport-fit=cover` + 安全区内边距。
- `lg` 以下隐藏侧栏，改为顶部横向滚动栏目条（`no-scrollbar`）。
- 图标按钮命中区 44×44px；卡片在 `xl` 断点切换为双列。
- 长标题两行截断（`clamp-2`），不撑破布局。
- 详情/日志使用底部弹层（`Sheet`），符合移动端手势习惯。

### 4. 构建

```
npm run build
✓ tsc -b 通过（strict + noUnusedLocals）
✓ 1598 modules transformed
dist/index.html                 0.92 kB │ gzip: 0.69 kB
dist/assets/index-*.css        27.19 kB │ gzip: 5.96 kB
dist/assets/index-*.js        205.69 kB │ gzip: 64.81 kB
```
GitHub Actions 上 `npm ci && npm run build` 同样通过。

### 5. 工作流

| 文件 | 状态 |
|---|---|
| `.github/workflows/update.yml` | ✅ 已实测 `workflow_dispatch` 运行成功 |
| `.github/workflows/deploy.yml` | ✅ 已实测 push 触发，构建 + 部署两步均 success |

### 6. 数据完整性（线上 `curl` 实测）

| 数据集 | HTTP | 条目数 |
|---|---|---|
| meta | 200 | 1 |
| videos | 200 | 4（示例） |
| audios | 200 | 3（示例） |
| effects | 200 | 3（示例） |
| douyin | 200 | 4（示例） |
| kuaishou | 200 | 4（示例） |
| rising | 200 | 3（示例） |
| copies | 200 | 12（真实可用） |
| quotes | 200 | 12（真实可用） |
| logs | 200 | 1 |

### 7. 更新管道（本地四用例实测）

| 用例 | 预期 | 实测 |
|---|---|---|
| 无快照文件 | skipped，exit 0，不改数据 | ✅ |
| 空 datasets | skipped | ✅ |
| 7 处非法字段 | failed，exit 1，`videos.json` MD5 不变 | ✅ |
| 合法快照 | 写入 + 更新 meta + 记日志 | ✅ |

## 三、已知限制

1. **`www.lebekan.github.io` 不可用**，请使用 `https://lebekan.github.io/HOT-TREND/`。
2. **热点数据目前是示例占位**（metrics 全为 null），需按 `scripts/sources/README.md` 导入真实快照后才会变成真实数据。
3. **定时任务首次触发时间**：GitHub Actions 的 schedule 在仓库创建后可能延迟数小时才首次生效，且高峰期会排队延迟几分钟到十几分钟 —— 这是平台行为，非配置问题。
4. **GitHub Actions 对公开仓库免费**；若仓库设为 Private，每月有 2000 分钟免费额度，本项目单次运行约 20–40 秒，足够用。
5. 截图接口当前不可用（返回超出图像限制），页面巡检改用 DOM 快照 + HTTP 探测完成。
