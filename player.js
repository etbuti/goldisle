const mediaFolder = "media/"; // 音频与封面文件夹
const lyricsFolder = "lyrics/"; // 歌词文件夹

// 手动定义播放列表（文件名与封面、歌词同名）
const songs = [
  { name: "Manchester-First Light" },
  { name: "Millennial Path" }
];

let currentIndex = 0;
let isPlaying = false;

const audio = new Audio();
const coverImg = document.getElementById("cover-img");
const trackTitle = document.getElementById("track-title");
const trackArtist = document.getElementById("track-artist");
const seek = document.getElementById("seek");
const playBtn = document.getElementById("play-btn");
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const volumeSlider = document.getElementById("volume");
const timeDisplay = document.getElementById("time-display");
const playlistEl = document.getElementById("playlist");
const lyricsBtn = document.getElementById("lyrics-btn");
const downloadBtn = document.getElementById("download-btn");

function loadSong(index) {
  const song = songs[index];
  audio.src = `${mediaFolder}${song.name}.mp3`;
  coverImg.src = `${mediaFolder}${song.name}.jpg`;
  trackTitle.textContent = song.name;
  trackArtist.textContent = "Evan Bei";

  // 更新播放列表高亮
  [...playlistEl.children].forEach((li, i) => li.classList.toggle("active", i === index));
}

function playPause() {
  if (isPlaying) {
    audio.pause();
  } else {
    audio.play();
  }
}

function nextSong() {
  currentIndex = (currentIndex + 1) % songs.length;
  loadSong(currentIndex);
  audio.play();
}

function prevSong() {
  currentIndex = (currentIndex - 1 + songs.length) % songs.length;
  loadSong(currentIndex);
  audio.play();
}

// 更新播放/暂停状态
audio.addEventListener("play", () => { isPlaying = true; playBtn.textContent = "⏸"; });
audio.addEventListener("pause", () => { isPlaying = false; playBtn.textContent = "▶"; });
audio.addEventListener("timeupdate", () => {
  seek.value = audio.currentTime / audio.duration * 100 || 0;
  timeDisplay.textContent = `${Math.floor(audio.currentTime/60)}:${String(Math.floor(audio.currentTime%60)).padStart(2,'0')} / ${Math.floor(audio.duration/60)}:${String(Math.floor(audio.duration%60)).padStart(2,'0')}`;
});
seek.addEventListener("input", () => {
  audio.currentTime = seek.value/100 * audio.duration;
});
volumeSlider.addEventListener("input", () => { audio.volume = volumeSlider.value; });
playBtn.addEventListener("click", playPause);
nextBtn.addEventListener("click", nextSong);
prevBtn.addEventListener("click", prevSong);

// 播放结束自动下一首
audio.addEventListener("ended", nextSong);

// 下载
downloadBtn.addEventListener("click", () => {
  const song = songs[currentIndex];
  const link = document.createElement("a");
  link.href = `${mediaFolder}${song.name}.mp3`;
  link.download = `${song.name}.mp3`;
  link.click();
});

// 歌词
lyricsBtn.addEventListener("click", () => {
  const song = songs[currentIndex];
  fetch(`${lyricsFolder}${song.name}.txt`)
    .then(r => r.text())
    .then(txt => {
      document.getElementById("modal-content").textContent = txt;
      document.getElementById("modal").classList.remove("hidden");
    })
    .catch(()=>alert("Lyrics not found."));
});

document.getElementById("modal-close").addEventListener("click", () => {
  document.getElementById("modal").classList.add("hidden");
});

// 渲染播放列表
songs.forEach((s,i)=>{
  const li = document.createElement("li");
  li.textContent = s.name;
  li.addEventListener("click", () => { currentIndex=i; loadSong(i); audio.play(); });
  playlistEl.appendChild(li);
});

// 初始化
loadSong(currentIndex);
