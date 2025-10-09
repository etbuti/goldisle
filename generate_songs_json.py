import os
import json
from pathlib import Path

# 设置基础路径
MEDIA_DIR = Path("media")
OUTPUT_FILE = Path("songs.json")

# 支持的音频格式
AUDIO_EXTENSIONS = [".mp3", ".wav", ".ogg", ".flac"]

# 尝试自动匹配封面图
def find_cover(file_stem):
    for ext in [".jpg", ".jpeg", ".png", ".webp"]:
        candidate = MEDIA_DIR / f"{file_stem}{ext}"
        if candidate.exists():
            return str(candidate).replace("\\", "/")
    return "default_cover.jpg"  # 若找不到封面则使用默认图

def main():
    songs = []

    for file in sorted(MEDIA_DIR.iterdir()):
        if file.suffix.lower() in AUDIO_EXTENSIONS:
            title = file.stem
            cover = find_cover(file.stem)
            audio_path = str(file).replace("\\", "/")

            song_entry = {
                "title": title,
                "artist": "Evan Bei",
                "file": audio_path,
                "cover": cover,
                "lyrics": f"lyrics/{title}.txt",  # 若未来添加歌词
                "info": f"info/{title}.txt"
            }

            songs.append(song_entry)

    # 写入 songs.json
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(songs, f, ensure_ascii=False, indent=2)

    print(f"✅ 已生成 {OUTPUT_FILE} ，共收录 {len(songs)} 首歌曲。")

if __name__ == "__main__":
    if not MEDIA_DIR.exists():
        print("❌ 未找到 media/ 文件夹，请确认路径。")
    else:
        main()
