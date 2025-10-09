import os
import json

MEDIA_DIR = "media"
LYRICS_DIR = "lyrics"

songs = []

for file in os.listdir(MEDIA_DIR):
    if file.lower().endswith(".mp3"):
        name = os.path.splitext(file)[0]
        mp3_path = os.path.join(MEDIA_DIR, f"{name}.mp3")
        cover_path = os.path.join(MEDIA_DIR, f"{name}.jpg")
        lyrics_path = os.path.join(LYRICS_DIR, f"{name}.txt")

        songs.append({
            "name": name,
            "mp3": mp3_path if os.path.exists(mp3_path) else "",
            "cover": cover_path if os.path.exists(cover_path) else "",
            "lyrics": lyrics_path if os.path.exists(lyrics_path) else ""
        })

# 输出结果到控制台
print("\n--- COPY BELOW INTO player.js ---\n")
print("const songs = " + json.dumps(songs, indent=2, ensure_ascii=False) + ";")
print("\n--- END ---\n")

# 同时保存为 JSON 文件（可选）
with open("songs_auto.json", "w", encoding="utf-8") as f:
    json.dump(songs, f, indent=2, ensure_ascii=False)

print("✅ songs_auto.json 已生成。")
