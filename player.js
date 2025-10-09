async function loadSongs() {
  // 从 lyrics.txt 读取歌词
  const lyricsRaw = await fetch('lyrics.txt').then(r => r.text());
  const lyricsMap = {};
  lyricsRaw.split('---').forEach(block => {
    const lines = block.trim().split('\n');
    if (lines.length > 1) {
      const name = lines[0].trim();
      const text = lines.slice(1).join('\n').trim();
      lyricsMap[name] = text;
    }
  });

  // 扫描 /media 下的 mp3（手动维护列表）
  const songs = [
    { name: 'song1', title: 'song1' },
    { name: 'song2', title: 'song2' }
  ];

  const listEl = document.getElementById('song-list');
  const playerEl = document.getElementById('player');
  const audioEl = document.getElementById('audio');
  const coverEl = document.getElementById('cover');
  const titleEl = document.getElementById('title');
  const lyricsEl = document.getElementById('lyrics');

  songs.forEach(song => {
    const div = document.createElement('div');
    div.className = 'song';
    div.textContent = song.title;
    div.onclick = () => {
      playerEl.style.display = 'block';
      titleEl.textContent = song.title;
      coverEl.src = `media/${song.name}.jpg`;
      audioEl.src = `media/${song.name}.mp3`;
      lyricsEl.textContent = lyricsMap[song.name] || '(暂无歌词)';
      audioEl.play();
    };
    listEl.appendChild(div);
  });
}

loadSongs();
