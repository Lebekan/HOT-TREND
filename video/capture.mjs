/**
 * 通过 CDP 精确截取 HOT TREND 界面（视频用）。
 *
 * 关键修正：
 * 1. 视口直接取 1600x900（标准 16:9），避免后续缩放产生裁切。
 * 2. deviceScaleFactor=2 → 输出 3200x1800，缩到 1080p 是下采样，文字锐利。
 * 3. 滚动到顶部，避免内容上移导致的顶部留白异常。
 *
 * 不执行任何删除操作。
 */
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = 'http://127.0.0.1:5178'
const OUT = path.resolve('video/shots')
const PORT = 9500 + (Date.now() % 300)
const PROFILE = path.resolve(`video/.cdp2-${Date.now()}`)

const DESKTOP = { w: 1600, h: 900, dsf: 2, mobile: false }
const MOBILE = { w: 390, h: 844, dsf: 3, mobile: true }

const SHOTS = [
  { name: '01-today', route: '/#/today', ...DESKTOP },
  { name: '02-audios', route: '/#/audios', ...DESKTOP },
  { name: '03-effects', route: '/#/effects', ...DESKTOP },
  { name: '04-copies', route: '/#/copies', ...DESKTOP },
  { name: '05-quotes', route: '/#/quotes', ...DESKTOP },
  { name: '06-douyin', route: '/#/douyin', ...DESKTOP },
  { name: '07-rising', route: '/#/rising', ...DESKTOP },
  { name: '10-mobile-today', route: '/#/today', ...MOBILE },
  { name: '11-mobile-copies', route: '/#/copies', ...MOBILE },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  await mkdir(OUT, { recursive: true })
  await mkdir(PROFILE, { recursive: true })

  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${PROFILE}`,
      'about:blank',
    ],
    { stdio: 'ignore', windowsHide: true }
  )

  let target = null
  for (let i = 0; i < 60; i += 1) {
    await sleep(250)
    try {
      const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
      target = list.find((t) => t.type === 'page')
      if (target) break
    } catch {
      /* 等待 */
    }
  }
  if (!target) {
    console.error('✗ 无法连接 Chrome')
    chrome.kill()
    process.exit(1)
  }

  const ws = new WebSocket(target.webSocketDebuggerUrl)
  let seq = 0
  const pending = new Map()
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++seq
      pending.set(id, { resolve, reject })
      ws.send(JSON.stringify({ id, method, params }))
    })

  await new Promise((r) => ws.addEventListener('open', r, { once: true }))
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id)
      pending.delete(m.id)
      if (m.error) reject(new Error(m.error.message))
      else resolve(m.result)
    }
  })

  await send('Page.enable')
  await send('Runtime.enable')

  let ok = 0
  for (const s of SHOTS) {
    await send('Emulation.setDeviceMetricsOverride', {
      width: s.w,
      height: s.h,
      deviceScaleFactor: s.dsf,
      mobile: s.mobile,
    })
    await send('Page.navigate', { url: `${BASE}${s.route}` })
    await sleep(2800)
    // 确保滚动到顶部
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0,0)' })
    await sleep(350)

    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: false,
    })
    await writeFile(path.join(OUT, `${s.name}.png`), Buffer.from(shot.data, 'base64'))
    console.log(`✓ ${s.name}  ${s.w}x${s.h} @${s.dsf}x`)
    ok += 1
  }

  console.log(`\n完成：${ok}/${SHOTS.length}`)
  ws.close()
  chrome.kill()
  process.exit(0)
}

main().catch((e) => {
  console.error('失败:', e.message)
  process.exit(1)
})
