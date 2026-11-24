#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
HOT TREND V1.0 项目演示片 —— 分段合成脚本

画面构成
--------
  背景 1920x1080 (#141317)
    └─ 网页截图 1440x810 居中偏上（完整不裁切，含页脚）
    └─ 字幕区：左侧强调竖条 + 主标题 + 副标题（独立区域，不遮挡界面）

技术要点
--------
1. 每段用 -frames:v 精确控制帧数，避免 -t 与滤镜链取整造成时长漂移。
2. 推近时按「先放大再裁剪」的顺序做，保证推近过程中不露出背景边缘。
3. 转场统一 xfade fade，0.5s。
4. 全片无音轨，避免音乐版权风险，方便投稿后自行配乐。
5. 不执行任何删除操作。
"""

import os
import subprocess
import sys

FFMPEG = (
    r"C:\Users\Administrator\AppData\Local\Microsoft\WinGet\Packages"
    r"\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-9.1-full_build\bin\ffmpeg.exe"
)
FFPROBE = FFMPEG.replace("ffmpeg.exe", "ffprobe.exe")

ROOT = os.path.dirname(os.path.abspath(__file__))
SHOTS = os.path.join(ROOT, "shots")
CLIPS = os.path.join(ROOT, "clips")
os.makedirs(CLIPS, exist_ok=True)

W, H, FPS = 1920, 1080, 30

F_BOLD = "C\\:/Windows/Fonts/msyhbd.ttc"
F_REG = "C\\:/Windows/Fonts/msyh.ttc"

BG = "0x141317"
WHITE = "0xFFFFFF"
SUB = "0x9E98A8"
ACCENT = "0xE21E46"
ORANGE = "0xFF6A00"
DIM = "0x7A7480"

# 界面在画布中的位置与尺寸（16:9，完整可见）
SC_W, SC_H = 1440, 810
SC_X, SC_Y = (W - SC_W) // 2, 30

# 字幕区
CAP_Y = 868
CAP_SUB_Y = 928
BAR_X = SC_X
BAR_Y = 878


def run(args, label):
    cmd = [FFMPEG, "-hide_banner", "-loglevel", "error", "-y"] + args
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        print(f"\n[FAIL] {label}")
        print(r.stderr[-4000:])
        sys.exit(1)
    print(f"[OK]   {label}")


def t(text):
    return (
        text.replace("\\", "\\\\")
        .replace(":", "\\:")
        .replace("'", "\\\u0027")
        .replace("%", "\\%")
    )


def screen_clip(name, shot, dur, caption, sub=None, zoom=True, accent=ACCENT):
    """网页界面段：截图按比例放置 + 推近 + 独立字幕区。"""
    frames = int(round(dur * FPS))
    src = os.path.join(SHOTS, shot)
    out = os.path.join(CLIPS, f"{name}.mp4")

    vf = []

    if zoom:
        # 先放大 1.10 倍，再 zoompan 推近，最后统一裁到 1440x810，
        # 保证推近过程中画面边缘不会露出背景。
        zoomed_w = int(SC_W * 1.10)
        zoomed_h = int(SC_H * 1.10)
        vf.append(
            f"scale={zoomed_w}:{zoomed_h}:flags=lanczos,"
            f"zoompan=z='1+0.055*on/{frames}':"
            f"x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':"
            f"d=1:s={zoomed_w}x{zoomed_h}:fps={FPS},"
            f"crop={SC_W}:{SC_H}"
        )
    else:
        vf.append(f"scale={SC_W}:{SC_H}:flags=lanczos,fps={FPS}")

    # 放到画布上
    vf.append(f"pad={W}:{H}:{SC_X}:{SC_Y}:color={BG}")

    # 界面外发光边（细描边，提升质感）
    vf.append(
        f"drawbox=x={SC_X-2}:y={SC_Y-2}:w={SC_W+4}:h={SC_H+4}:"
        f"color=0x2E2A34@1.0:t=2"
    )

    # 字幕：强调竖条 + 主标题 + 副标题
    vf.append(f"drawbox=x={BAR_X}:y={BAR_Y}:w=5:h=46:color={accent}@1.0:t=fill")
    vf.append(
        f"drawtext=fontfile='{F_BOLD}':text='{t(caption)}':"
        f"fontsize=46:fontcolor={WHITE}:x={BAR_X+32}:y={CAP_Y}"
    )
    if sub:
        vf.append(
            f"drawtext=fontfile='{F_REG}':text='{t(sub)}':"
            f"fontsize=27:fontcolor={SUB}:x={BAR_X+32}:y={CAP_SUB_Y}"
        )

    vf.append("format=yuv420p")
    vf.append("fade=t=in:st=0:d=0.3")
    vf.append(f"fade=t=out:st={max(0, dur-0.3):.2f}:d=0.3")

    run(
        [
            "-loop", "1", "-i", src,
            "-vf", ",".join(vf),
            "-frames:v", str(frames),
            "-c:v", "libx264", "-preset", "medium", "-crf", "19",
            "-pix_fmt", "yuv420p", "-r", str(FPS),
            out,
        ],
        f"{name}  ({dur}s / {frames}f)",
    )
    return out


def mobile_clip(name, shot, dur, caption, sub, bullets):
    """
    手机端演示段。
    竖屏截图必须保持原始宽高比，绝不能拉伸 —— 拉伸会让界面明显变形。
    布局：手机居中偏左，右侧竖排要点文字。
    """
    frames = int(round(dur * FPS))
    src = os.path.join(SHOTS, shot)
    out = os.path.join(CLIPS, f"{name}.mp4")

    # 保持 390:844 原始比例，按高度 840 反推宽度
    ph_h = 840
    ph_w = int(round(ph_h * 390 / 844))  # ≈388
    # 让「手机 + 右侧文字」整组水平居中：
    #   手机 490..878，间距 110，文字块从 988 起，最长一行约到 1440
    #   整组 490..1440，中心 ≈965，接近画布中心 960
    ph_x = 490
    ph_y = 96

    vf = [
        f"scale={ph_w}:{ph_h}:flags=lanczos,fps={FPS}",
        f"pad={W}:{H}:{ph_x}:{ph_y}:color={BG}",
        # 手机外框
        f"drawbox=x={ph_x-3}:y={ph_y-3}:w={ph_w+6}:h={ph_h+6}:color=0x3A3542@1.0:t=3",
    ]

    # 右侧要点
    tx = ph_x + ph_w + 110
    vf.append(f"drawbox=x={tx}:y=250:w=5:h=52:color={ACCENT}@1.0:t=fill")
    vf.append(
        f"drawtext=fontfile='{F_BOLD}':text='{t(caption)}':"
        f"fontsize=52:fontcolor={WHITE}:x={tx+30}:y=240"
    )
    y = 340
    for i, b in enumerate(bullets, 1):
        vf.append(
            f"drawtext=fontfile='{F_BOLD}':text='{i:02d}':"
            f"fontsize=26:fontcolor={ACCENT}:x={tx+30}:y={y+2}"
        )
        vf.append(
            f"drawtext=fontfile='{F_REG}':text='{t(b)}':"
            f"fontsize=32:fontcolor=0xD6D1DB:x={tx+86}:y={y}"
        )
        y += 76

    vf.append(
        f"drawtext=fontfile='{F_REG}':text='{t(sub)}':"
        f"fontsize=26:fontcolor={SUB}:x={tx+30}:y={y+18}"
    )

    vf.append("format=yuv420p")
    vf.append("fade=t=in:st=0:d=0.3")
    vf.append(f"fade=t=out:st={max(0, dur-0.3):.2f}:d=0.3")

    run(
        [
            "-loop", "1", "-i", src,
            "-vf", ",".join(vf),
            "-frames:v", str(frames),
            "-c:v", "libx264", "-preset", "medium", "-crf", "19",
            "-pix_fmt", "yuv420p", "-r", str(FPS),
            out,
        ],
        f"{name}  ({dur}s / {frames}f)",
    )
    return out


def color_clip(name, dur, builder):
    frames = int(round(dur * FPS))
    out = os.path.join(CLIPS, f"{name}.mp4")
    vf = []
    builder(vf, frames, dur)
    vf.append("format=yuv420p")
    vf.append("fade=t=in:st=0:d=0.35")
    vf.append(f"fade=t=out:st={max(0, dur-0.35):.2f}:d=0.35")

    run(
        [
            "-f", "lavfi",
            "-i", f"color=c={BG}:s={W}x{H}:r={FPS}",
            "-vf", ",".join(vf),
            "-frames:v", str(frames),
            "-c:v", "libx264", "-preset", "medium", "-crf", "19",
            "-pix_fmt", "yuv420p", "-r", str(FPS),
            out,
        ],
        f"{name}  ({dur}s / {frames}f)",
    )
    return out


def build_intro():
    """片头：细网格 + 三色柱状标识（在标题上方）+ 主副标题。"""

    def b(vf, frames, dur):
        vf.append("drawgrid=w=80:h=80:t=1:color=0x282530@0.6")

        # 柱状标识：位于标题上方，y=300..430，不重叠
        top = 300
        vf.append(f"drawbox=x=902:y={top+30}:w=13:h=100:color={ACCENT}@1.0:t=fill")
        vf.append(f"drawbox=x=954:y={top}:w=13:h=130:color={WHITE}@1.0:t=fill")
        vf.append(f"drawbox=x=1006:y={top+50}:w=13:h=80:color={ORANGE}@1.0:t=fill")

        vf.append(
            f"drawtext=fontfile='{F_BOLD}':text='HOT TREND':"
            f"fontsize=126:fontcolor={WHITE}:x=(w-text_w)/2:y=482"
        )
        vf.append(
            f"drawtext=fontfile='{F_REG}':text='{t('短视频热点观察台 · V1.0')}':"
            f"fontsize=42:fontcolor=0xB9B4C0:x=(w-text_w)/2:y=634"
        )
        vf.append(f"drawbox=x={(W-420)//2}:y=716:w=420:h=3:color=0x3A3542@1.0:t=fill")
        vf.append(
            f"drawtext=fontfile='{F_REG}':text='{t('抖音 · 快手  双平台聚合')}':"
            f"fontsize=28:fontcolor={DIM}:x=(w-text_w)/2:y=750"
        )

    return color_clip("00-intro", 3.6, b)


def build_outro(repo):
    def b(vf, frames, dur):
        vf.append("drawgrid=w=80:h=80:t=1:color=0x282530@0.6")
        vf.append(
            f"drawtext=fontfile='{F_BOLD}':text='HOT TREND V1.0':"
            f"fontsize=86:fontcolor={WHITE}:x=(w-text_w)/2:y=336"
        )
        vf.append(f"drawbox=x={(W-360)//2}:y=470:w=360:h=4:color={ACCENT}@1.0:t=fill")
        vf.append(
            f"drawtext=fontfile='{F_REG}':text='{t('React · TypeScript · Vite · Tailwind CSS')}':"
            f"fontsize=33:fontcolor=0xB9B4C0:x=(w-text_w)/2:y=516"
        )
        vf.append(
            f"drawtext=fontfile='{F_REG}':text='{t('GitHub Pages 免费部署 · 每日 08:00 自动更新')}':"
            f"fontsize=33:fontcolor=0xB9B4C0:x=(w-text_w)/2:y=576"
        )
        vf.append(
            f"drawtext=fontfile='{F_REG}':text='{t('9 个栏目 · 手机与电脑自适应 · 数据本地收藏')}':"
            f"fontsize=28:fontcolor={DIM}:x=(w-text_w)/2:y=646"
        )
        vf.append(
            f"drawtext=fontfile='{F_REG}':text='{t(repo)}':"
            f"fontsize=30:fontcolor=0x8C86A0:x=(w-text_w)/2:y=716"
        )

    return color_clip("99-outro", 4.2, b)


def probe_duration(path):
    r = subprocess.run(
        [FFPROBE, "-v", "error", "-show_entries", "format=duration",
         "-of", "default=nw=1:nk=1", path],
        capture_output=True, text=True,
    )
    return float(r.stdout.strip())


def main():
    repo = "github.com/Lebekan/HOT-TREND"

    segs = [
        build_intro(),
        screen_clip("01-today", "01-today.png", 5.2,
                    "今日热门视频", "抖音 / 快手当日公开热点，一键跳转官方页面播放"),
        screen_clip("02-douyin", "06-douyin.png", 4.4,
                    "抖音热门榜", "只展示平台公开名次，来源未提供排名时明确标注"),
        screen_clip("03-rising", "07-rising.png", 4.0,
                    "上升最快榜", "按来源给出的上升幅度排序，不做任何推算"),
        screen_clip("04-audios", "02-audios.png", 4.0,
                    "热门音频", "记录 BGM 元数据，仅跳转原平台使用"),
        screen_clip("05-effects", "03-effects.png", 4.0,
                    "热门特效", "滤镜 / 贴纸 / 转场，附官方使用入口"),
        screen_clip("06-copies", "04-copies.png", 4.8,
                    "爆款文案", "12 条按场景分类的原创模板，一键复制"),
        screen_clip("07-quotes", "05-quotes.png", 4.0,
                    "经典语录", "公版典籍名句 + 原创金句，全部标注出处"),
        mobile_clip("08-mobile", "10-mobile-today.png", 4.8,
                    "手机端适配", "同一套代码，桌面与移动端自适应",
                    ["竖屏单列布局", "栏目横向滑动", "按钮 44px 命中区"]),
        build_outro(repo),
    ]

    print("\n分段完成，开始拼接…\n")

    durs = [probe_duration(s) for s in segs]
    FADE = 0.5
    inputs = []
    for s in segs:
        inputs += ["-i", s]

    filt = []
    prev = "[0:v]"
    offset = 0.0
    for i in range(1, len(segs)):
        offset += durs[i - 1] - FADE
        outlbl = f"[v{i}]"
        filt.append(
            f"{prev}[{i}:v]xfade=transition=fade:duration={FADE}:offset={offset:.3f}{outlbl}"
        )
        prev = outlbl

    total = sum(durs) - FADE * (len(segs) - 1)
    final = os.path.join(ROOT, "HOT-TREND-V1.0-演示片.mp4")

    run(
        inputs + [
            "-filter_complex", ";".join(filt),
            "-map", prev,
            "-c:v", "libx264", "-preset", "slow", "-crf", "18",
            "-pix_fmt", "yuv420p", "-r", str(FPS),
            "-movflags", "+faststart", "-an",
            final,
        ],
        f"拼接 -> {os.path.basename(final)}",
    )

    print(f"\n时长 {total:.1f}s  输出 {final}")


if __name__ == "__main__":
    main()
