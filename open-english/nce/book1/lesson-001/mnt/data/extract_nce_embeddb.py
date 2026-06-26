#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
extract_nce_embeddb.py v0.1

Purpose:
  First-pass extractor/mapper for ShineSoft/MyEbook NCE embeddb files.

What this version does reliably:
  1) Accepts NCE*.EXE or extracted embeddb.
  2) If given EXE, extracts ZIP member named 'embeddb'.
  3) Lists embedded resource paths from the metadata table.
  4) Focuses on Lesson 1 target paths:
       /1/1-5.htm
       /1/1-5.files/image001.jpg
       /1/1-5.files/image002.jpg
       /1/1-5.files/filelist.xml
  5) Carves MP3-frame candidates for later validation.
  6) Creates a modern web lesson-001 scaffold.

Important:
  This is v0.1. The resource payload is stored in a proprietary EbookMM/EmbedDB
  binary table. This version maps the catalog and prepares the project structure;
  the exact offset/size decoder for HTML/JPG payloads is the next step.
"""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

TARGETS = [
    "g:/nceproject/第一册/1/1-5.htm",
    "g:/nceproject/第一册/1/1-5.files/image001.jpg",
    "g:/nceproject/第一册/1/1-5.files/image002.jpg",
    "g:/nceproject/第一册/1/1-5.files/filelist.xml",
]


def read_embeddb(src: Path, workdir: Path) -> Path:
    """Return path to embeddb. If src is an EXE zip container, extract embeddb."""
    data = src.read_bytes()
    if data[:2] == b"JL":
        return src

    # NCE1A.EXE is a PE with a ZIP archive appended; zipfile can read it directly.
    try:
        with zipfile.ZipFile(src) as zf:
            if "embeddb" in zf.namelist():
                out = workdir / "embeddb"
                out.write_bytes(zf.read("embeddb"))
                return out
    except zipfile.BadZipFile:
        pass

    raise SystemExit(f"Cannot find embeddb inside: {src}")


def extract_gbk_paths(data: bytes) -> list[dict]:
    """Extract null-terminated GBK paths that look like the NCE project resources."""
    # GBK bytes for 第一册
    prefix = b"g:/nceproject/"
    results = []
    seen = set()
    for m in re.finditer(re.escape(prefix), data):
        start = m.start()
        end = data.find(b"\x00", start)
        if end == -1:
            continue
        raw = data[start:end]
        try:
            text = raw.decode("gbk")
        except UnicodeDecodeError:
            continue
        if not ("第一册" in text and (".htm" in text or ".jpg" in text or ".xml" in text or "addons" in text)):
            continue
        if text in seen:
            continue
        seen.add(text)
        results.append({"offset": start, "path": text})
    return results


def find_catalog_items(data: bytes) -> list[str]:
    """Find lesson htm names from the catalog string area."""
    names = []
    for m in re.finditer(rb"(?:nce1|help|1-\d+)\.htm\x00", data):
        s = data[m.start():m.end()-1].decode("ascii", errors="ignore")
        if s not in names:
            names.append(s)
    return names


def carve_mp3_candidates(data: bytes, outdir: Path, max_candidates: int = 80) -> list[dict]:
    """Carve possible MP3-frame candidates. Uses ffprobe if available for validation."""
    outdir.mkdir(parents=True, exist_ok=True)
    starts = sorted(set(m.start() for m in re.finditer(rb"\xff[\xfb\xf3\xf2]", data)))
    ffprobe = shutil.which("ffprobe")
    candidates = []

    for i, start in enumerate(starts[:max_candidates], 1):
        # Candidate slices. The true boundary will be decoded after offset/size parser is finished.
        end = min(len(data), start + 300_000)
        fname = f"mp3_candidate_{i:03d}_0x{start:x}.mp3"
        p = outdir / fname
        p.write_bytes(data[start:end])
        item = {"file": str(p.name), "offset": start, "bytes_written": end - start, "ffprobe_duration": None}

        if ffprobe:
            try:
                r = subprocess.run(
                    [ffprobe, "-v", "error", "-show_entries", "format=duration", "-of", "json", str(p)],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    timeout=3,
                )
                if r.returncode == 0 and "duration" in r.stdout:
                    j = json.loads(r.stdout)
                    dur = j.get("format", {}).get("duration")
                    item["ffprobe_duration"] = float(dur) if dur else None
            except Exception:
                pass
        candidates.append(item)
    return candidates


def write_lesson_scaffold(outdir: Path, manifest: dict) -> None:
    lesson = outdir / "open-english" / "nce" / "book1" / "lesson-001"
    lesson.mkdir(parents=True, exist_ok=True)
    (lesson / "assets").mkdir(exist_ok=True)
    (lesson / "index.html").write_text("""<!doctype html>
<html lang=\"zh-CN\">
<head>
  <meta charset=\"utf-8\" />
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
  <title>Open English Learning Archive · Lesson 1</title>
  <style>
    body{font-family:system-ui,-apple-system,Segoe UI,sans-serif;max-width:860px;margin:40px auto;padding:0 18px;line-height:1.7;color:#222}
    header{border-bottom:1px solid #ddd;margin-bottom:24px}
    .card{border:1px solid #ddd;border-radius:14px;padding:18px;margin:18px 0;background:#fafafa}
    .notice{color:#666;font-size:.95em}
    audio{width:100%}
  </style>
</head>
<body>
<header>
  <h1>Open English Learning Archive</h1>
  <p>公益英语学习档案馆 · NCE Book 1 · Lesson 1</p>
</header>

<section class=\"card\">
  <h2>Lesson 1</h2>
  <p class=\"notice\">本页是现代网页样板。原课文/原音频仅在版权允许时展示；公益学习内容以原创讲解、AI朗读、词汇与语法整理为主。</p>
</section>

<section class=\"card\">
  <h2>AI 朗读</h2>
  <audio controls src=\"assets/audio-ai.mp3\"></audio>
</section>

<section class=\"card\">
  <h2>重点单词</h2>
  <ul>
    <li>excuse — 原谅；打扰一下</li>
    <li>pardon — 请再说一遍；原谅</li>
    <li>handbag — 手提包</li>
    <li>thank — 感谢</li>
  </ul>
</section>

<section class=\"card\">
  <h2>语法解析</h2>
  <p><strong>Is this your ...?</strong> 用来询问“这是你的……吗？”</p>
  <p><strong>Yes, it is.</strong> 是最基础、最标准的肯定回答。</p>
</section>

<section class=\"card\">
  <h2>学习心得</h2>
  <p>这里放项目发起人的学习经历与公益说明。</p>
</section>

</body>
</html>
""", encoding="utf-8")
    (lesson / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("input", help="NCE*.EXE or extracted embeddb")
    ap.add_argument("-o", "--out", default="nce_extract_out", help="output directory")
    ap.add_argument("--mp3-candidates", type=int, default=80, help="number of MP3 candidates to carve")
    args = ap.parse_args()

    src = Path(args.input).expanduser().resolve()
    outdir = Path(args.out).expanduser().resolve()
    outdir.mkdir(parents=True, exist_ok=True)

    embeddb = read_embeddb(src, outdir)
    data = embeddb.read_bytes()

    paths = extract_gbk_paths(data)
    catalog = find_catalog_items(data)
    target_hits = [p for p in paths if any(t in p["path"] for t in TARGETS)]
    mp3 = carve_mp3_candidates(data, outdir / "mp3_candidates", args.mp3_candidates)

    manifest = {
        "source": str(src),
        "embeddb": str(embeddb),
        "embeddb_size": len(data),
        "magic": data[:8].hex(),
        "catalog_items": catalog,
        "resource_path_count": len(paths),
        "target_hits": target_hits,
        "all_resource_paths": paths,
        "mp3_candidates": mp3,
        "status": "v0.1 maps metadata and carves MP3-frame candidates; proprietary offset/size payload decoder is next.",
    }
    (outdir / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    write_lesson_scaffold(outdir, manifest)

    print(f"OK: wrote {outdir}")
    print(f"Resource paths: {len(paths)}")
    print("Target hits:")
    for h in target_hits:
        print(f"  0x{h['offset']:x}  {h['path']}")
    print(f"MP3 candidates: {len(mp3)} -> {outdir / 'mp3_candidates'}")
    print(f"Lesson scaffold: {outdir / 'open-english' / 'nce' / 'book1' / 'lesson-001' / 'index.html'}")


if __name__ == "__main__":
    main()
