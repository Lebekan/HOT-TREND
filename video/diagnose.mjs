/**
 * 用 CDP 精确诊断移动端横向溢出。
 * 不依赖 puppeteer：Node 22 自带 WebSocket，直接对话 Chrome DevTools Protocol。
 */
import { spawn } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9333
const TARGET_URL = process.argv[2] ?? 'http://127.0.0.1:5178/#/today'
const VW = Number(process.argv[3] ?? 390)
const VH = Number(process.argv[4] ?? 844)
const PROFILE = path.resolve(`video/.diag-${Date.now()}`)

const EXPR = `(() => {
  const vw = document.documentElement.clientWidth;
  const out = [];
  document.querySelectorAll('body *').forEach(el => {
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return;
    if (r.right > vw + 0.5 || r.left < -0.5) {
      out.push({
        tag: el.tagName,
        cls: String(el.className || '').slice(0, 90),
        left: Math.round(r.left * 10) / 10,
        right: Math.round(r.right * 10) / 10,
        w: Math.round(r.width * 10) / 10,
      });
    }
  });
  return JSON.stringify({
    vw,
    docScrollW: document.documentElement.scrollWidth,
    bodyScrollW: document.body.scrollWidth,
    overflow: document.documentElement.scrollWidth - vw,
    offenders: out.slice(0, 30),
  });
})()`

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  await mkdir(PROFILE, { recursive: true })
  const chrome = spawn(
    CHROME,
    [
      '--headless=new',
      '--disable-gpu',
      '--hide-scrollbars',
      `--remote-debugging-port=${PORT}`,
      `--user-data-dir=${PROFILE}`,
      `--window-size=${VW},${VH}`,
      '--force-device-scale-factor=1',
      'about:blank',
    ],
    { stdio: 'ignore', windowsHide: true }
  )

  let targets = null
  for (let i = 0; i < 40; i += 1) {
    await sleep(250)
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/json/list`)
      targets = await res.json()
      if (targets.some((t) => t.type === 'page')) break
    } catch {
      /* 还没起来 */
    }
  }
  const page = targets?.find((t) => t.type === 'page')
  if (!page) {
    console.error('无法获取调试目标')
    chrome.kill()
    process.exit(1)
  }

  const ws = new WebSocket(page.webSocketDebuggerUrl)
  let id = 0
  const pending = new Map()

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const msgId = ++id
      pending.set(msgId, { resolve, reject })
      ws.send(JSON.stringify({ id: msgId, method, params }))
    })

  await new Promise((r) => ws.addEventListener('open', r, { once: true }))
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) reject(new Error(msg.error.message))
      else resolve(msg.result)
    }
  })

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', {
    width: VW,
    height: VH,
    deviceScaleFactor: 1,
    mobile: true,
  })
  await send('Page.navigate', { url: TARGET_URL })
  await sleep(3500)

  const res = await send('Runtime.evaluate', {
    expression: EXPR,
    returnByValue: true,
  })

  const data = JSON.parse(res.result.value)
  console.log(`视口宽度: ${data.vw}`)
  console.log(`documentElement.scrollWidth: ${data.docScrollW}`)
  console.log(`body.scrollWidth: ${data.bodyScrollW}`)
  console.log(`横向溢出: ${data.overflow}px\n`)
  if (data.offenders.length === 0) {
    console.log('✓ 未发现溢出元素')
  } else {
    console.log('溢出元素（left / right / width）：')
    for (const o of data.offenders) {
      console.log(`  ${o.tag}  L=${o.left}  R=${o.right}  W=${o.w}`)
      console.log(`     .${o.cls}`)
    }
  }

  ws.close()
  chrome.kill()
  process.exit(0)
}

main().catch((e) => {
  console.error('诊断失败:', e.message)
  process.exit(1)
})
