// player.js - simple playlist-driven player
const playlistEl = document.getElementById('playlist');
const coverImg = document.getElementById('cover-img');
const titleEl = document.getElementById('track-title');
const artistEl = document.getElementById('track-artist');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const seek = document.getElementById('seek');
const timeDisplay = document.getElementById('time-display');
const volume = document.getElementById('volume');
const downloadBtn = document.getElementById('download-btn');
const lyricsBtn = document.getElementById('lyrics-btn');
const infoBtn = document.getElementById('info-btn');
const modal = document.getElementById('modal');
const modalContent = document.getElementById('modal-content');
const modalClose = document.getElementById('modal-close');
const openInDeepcurrent = document.getElementById('open-in-deepcurrent');

let audio = new Audio();
audio.crossOrigin = "anonymous";
let songs = [];
let idx = -1;
let isPlaying = false;
let progressTimer = null;

// load songs.json
fetch('songs.json').then(r=>r.json()).then(data=>{
  songs = data.songs || [];
  renderPlaylist();
  if(songs.length>0) loadTrack(0);
}).catch(err=>console.warn('songs.json load fail', err));

function renderPlaylist(){
  playlistEl.innerHTML='';
  songs.forEach((s,i)=>{
    const li = document.createElement('li');
    li.dataset.index = i;
    li.innerHTML = `<div><strong>${s.title}</strong><div class="meta">${s.artist} • ${s.album || ''}</div></div><div class="meta">${s.duration || ''}</div>`;
    li.addEventListener('click', ()=>{ loadTrack(i); play(); });
    playlistEl.appendChild(li);
  });
}

function loadTrack(i){
  if(i<0 || i>=songs.length) return;
  idx = i;
  const s = songs[i];
  audio.src = s.url;
  audio.load();
  coverImg.src = s.cover || '';
  titleEl.textContent = s.title;
  artistEl.textContent = `${s.artist}${s.album? ' — '+s.album : ''}`;
  downloadBtn.onclick = ()=>{ window.open(s.url, '_blank'); };
  lyricsBtn.onclick = ()=>{ showModal(`<h3>Lyrics — ${s.title}</h3><pre>${s.lyrics || 'No lyrics provided.'}</pre>`); };
  infoBtn.onclick = ()=>{ showModal(renderInfoHtml(s)); };
  updateActivePlaylist();
}

function renderInfoHtml(s){
  return `<h3>${s.title}</h3>
    <p><strong>Artist:</strong> ${s.artist}</p>
    <p><strong>Album:</strong> ${s.album||'—'}</p>
    <p><strong>ISRC:</strong> ${s.isrc||'—'}</p>
    <p><strong>Year:</strong> ${s.year||'—'}</p>
    <p><strong>Notes:</strong> ${s.notes||''}</p>
  `;
}

function updateActivePlaylist(){
  Array.from(playlistEl.children).forEach((li)=>li.classList.remove('active'));
  if(idx>=0) playlistEl.children[idx].classList.add('active');
}

function play(){
  if(!audio.src) return;
  audio.play();
  isPlaying=true;
  playBtn.textContent='⏸';
}
function pause(){
  audio.pause();
  isPlaying=false;
  playBtn.textContent='▶';
}
playBtn.addEventListener('click', ()=>{
  if(isPlaying) pause(); else play();
});
prevBtn.addEventListener('click', ()=>{ if(idx>0){ loadTrack(idx-1); play(); }});
nextBtn.addEventListener('click', ()=>{ if(idx < songs.length-1){ loadTrack(idx+1); play(); }});

audio.addEventListener('timeupdate', ()=>{
  if(!audio.duration) return;
  const p = Math.floor( audio.currentTime / audio.duration * 100 );
  seek.value = p;
  timeDisplay.textContent = `${formatTime(audio.currentTime)} / ${formatTime(audio.duration)}`;
});
seek.addEventListener('input', ()=>{
  if(!audio.duration) return;
  const t = audio.duration * (seek.value/100);
  audio.currentTime = t;
});
audio.addEventListener('ended', ()=>{
  if(idx < songs.length-1){ loadTrack(idx+1); play(); } else { pause(); }
});
volume.addEventListener('input', ()=>{ audio.volume = parseFloat(volume.value); });

function formatTime(sec){
  sec = Math.floor(sec);
  const m = Math.floor(sec/60), s = sec%60;
  return `${m}:${s.toString().padStart(2,'0')}`;
}

function showModal(html){
  modalContent.innerHTML = html;
  modal.classList.remove('hidden');
}
modalClose.addEventListener('click', ()=> modal.classList.add('hidden'));
modal.addEventListener('click', (e)=>{ if(e.target===modal) modal.classList.add('hidden'); });

function updateStatus(text){ /* can extend to show site status */ }

// open in DeepCurrent - this link simply instructs user, DeepCurrent can intercept if desired
openInDeepcurrent.addEventListener('click', (e)=>{
  e.preventDefault();
  alert('Open this URL in DeepCurrent Browser for integrated AI features.\n\nIf you have DeepCurrent installed, open the browser and navigate to this page.');
});

// simple auto-scroll to active track
function scrollActiveIntoView(){
  const el = playlistEl.children[idx];
  if(el) el.scrollIntoView({behavior:'smooth',block:'center'});
}
audio.addEventListener('play', ()=>{ scrollActiveIntoView(); });

// helper to update active styles
document.addEventListener('keydown', (e)=>{
  if(e.code==='Space'){ e.preventDefault(); if(isPlaying) pause(); else play(); }
});
