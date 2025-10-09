let player = new Audio();
let currentIndex = 0;
let playlist = [];
const playlistEl = document.getElementById("playlist");
const titleEl = document.getElementById("track-title");
const artistEl = document.getElementById("track-artist");
const coverEl = document.getElementById("cover-img");
const playBtn = document.getElementById("play-btn");
const seekBar = document.getElementById("seek");
const volume = document.getElementById("volume");
const timeDisplay = document.getElementById("time-display");

async function loadSongs() {
  try {
    const res = await fetch("songs.json");
    playlist = await res.json();
    renderPlaylist();
    loadTrack(0);
  } catch (e) {
    playlistEl.innerHTML = "<li>⚠️ songs.json not found</li>";
  }
}

function renderPlaylist() {
  playlistEl.innerHTML = "";
  playlist.forEach((song, i) => {
    const li = document.createElement("li");
    li.textContent = song.title + " — " + song.artist;
    li.onclick = () => loadTrack(i);
    playlistEl.appendChild(li);
  });
}

function loadTrack(index) {
  currentIndex = index;
  const song = playlist[index];
  if (!song) return;

  player.src = "media/" + song.file;
  titleEl.textContent = song.title;
  artistEl.textContent = song.artist;
  coverEl.src = song.cover ? "covers/" + song.cover : "";
  
  document.querySelectorAll("#playlist li").forEach((li, i) => {
    li.classList.toggle("active", i === index);
  });

  player.play();
  playBtn.textContent = "⏸";
}

playBtn.onclick = () => {
  if (player.paused) {
    player.play();
    playBtn.textContent = "⏸";
  } else {
    player.pause();
    playBtn.textContent = "▶";
  }
};

document.getElementById("prev-btn").onclick = () => {
  loadTrack((currentIndex - 1 + playlist.length) % playlist.length);
};
document.getElementById("next-btn").onclick = () => {
  loadTrack((currentIndex + 1) % playlist.length);
};

player.ontimeupdate = () => {
  const percent = (player.currentTime / player.duration) * 100 || 0;
  seekBar.value = percent;
  timeDisplay.textContent = `${formatTime(player.currentTime)} / ${formatTime(player.duration)}`;
};

seekBar.oninput = () => {
  player.currentTime = (seekBar.value / 100) * player.duration;
};

volume.oninput = () => {
  player.volume = volume.value;
};

function formatTime(sec) {
  if (isNaN(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

player.onended = () => {
  loadTrack((currentIndex + 1) % playlist.length);
};

loadSongs();
