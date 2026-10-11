import './style.css';
import { FESTIVALS, FESTIVALS_2026, NAVRATRI_DAYS } from './festivals.js';

const list = FESTIVALS || FESTIVALS_2026;
const navDays = NAVRATRI_DAYS;

function pad(n) {
  return n < 10 ? '0' + n : String(n);
}
function todayISO() {
  const n = new Date();
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
}
function parseISO(s) {
  const p = s.split('-');
  return new Date(+p[0], +p[1] - 1, +p[2]);
}
function festivalOn(iso) {
  const t = parseISO(iso).getTime();
  for (const f of list) {
    const a = parseISO(f.date).getTime();
    const b = parseISO(f.end || f.date).getTime();
    if (t >= a && t <= b) return f;
  }
  return null;
}
function nextFestivals(iso, count = 6) {
  const t = parseISO(iso).getTime();
  return list.filter((f) => parseISO(f.date).getTime() >= t).slice(0, count);
}
function navDayFor(iso, fest) {
  // Day 1 = first day of navratri range, etc.
  if (!fest || !fest.isNavratri) return null;
  const start = parseISO(fest.date).getTime();
  const cur = parseISO(iso).getTime();
  const dayIndex = Math.floor((cur - start) / 86400000) + 1;
  if (dayIndex < 1 || dayIndex > 9) return navDays[0];
  return navDays.find((d) => d.day === dayIndex) || navDays[0];
}

const app = document.getElementById('app');
app.innerHTML = `
  <div id="petals"></div>
  <div class="page">
    <header class="top">
      <div class="clock-box">
        <div class="clock-row" id="liveDay">—</div>
        <div class="clock-row" id="liveDate">—</div>
        <div class="clock-time" id="liveTime">00:00:00</div>
        <div class="clock-labels">
          <span>HOUR</span><span>MIN</span><span>SEC</span>
        </div>
      </div>
      <p class="brand">Festival Wishes · 2026 · Divyanshu Gangwar</p>
    </header>
    <main class="card">
      <div id="heroWrap" class="hero-wrap hidden">
        <img class="hero-img" id="heroImg" src="" alt="Festival" />
      </div>
      <p class="status-pill" id="statusPill">आज का त्योहार</p>
      <h1 id="festName">…</h1>
      <p class="hindi" id="festHindi"></p>
      <p class="about" id="festAbout"></p>
      <div id="navratriBox" class="nav-box hidden">
        <p class="nav-label" id="navLabel"></p>
        <p class="nav-goddess" id="navGoddess"></p>
        <p class="nav-about" id="navAbout"></p>
      </div>
      <p class="wish-line" id="wishLine"></p>
      <hr class="line" />
      <div class="sender">
        <div class="photo locked">
          <img id="ownerPhoto" src="images/divyanshu-gangwar.jpg" alt="Divyanshu Gangwar"
            onerror="this.src='https://ui-avatars.com/api/?name=Divyanshu+Gangwar&background=4a0e4e&color=ffd54f&size=128'" />
        </div>
        <p class="from">Wish from</p>
        <p class="name">Divyanshu Gangwar</p>
      </div>

      <div class="guest-box">
        <p class="guest-title" id="guestTitle">आप भी शुभकामनाएँ भेजना चाहते हैं?</p>
        <p class="guest-hint">अपनी फोटो और नाम जोड़ें (वैकल्पिक) — सिर्फ आपके डिवाइस पर सेव होगा।</p>
        <div class="guest-row">
          <div class="guest-photo-wrap">
            <img id="guestPhoto" class="guest-photo hidden" alt="Aapki photo" />
            <div id="guestPlaceholder" class="guest-placeholder">+</div>
          </div>
          <div class="guest-fields">
            <input type="file" id="guestFile" accept="image/*" class="guest-file" />
            <label for="guestFile" class="btn btn-upload">📷 फोटो अपलोड</label>
            <input type="text" id="guestName" placeholder="आपका नाम" maxlength="40" />
            <button type="button" id="guestClear" class="btn btn-clear hidden">फोटो हटाएँ</button>
          </div>
        </div>
      </div>

      <div class="form">
        <label for="toName">किसको शुभकामनाएँ भेजनी हैं?</label>
        <div class="row">
          <input id="toName" type="text" placeholder="नाम लिखें..." maxlength="40" />
          <button type="button" id="applyBtn" class="btn btn-p">Apply</button>
        </div>
        <p class="greeting">Dear <strong id="toDisplay">Friend</strong>,</p>
      </div>
      <div class="actions">
        <button type="button" id="shareBtn" class="btn btn-share">📤 Share Wish</button>
        <button type="button" id="blessBtn" class="btn btn-ghost">🙏 Blessings</button>
      </div>
      <footer id="pageFooter">तारीख के हिसाब से त्योहार और छवि अपने आप बदल जाती है</footer>
    </main>
  </div>
  <div class="toast" id="toast"></div>
`;


/** Load image: try path, on fail try .svg then hide */
function setHeroImage(imgEl, path, alt) {
  if (!imgEl) return;
  if (!path) {
    imgEl.removeAttribute('src');
    return;
  }
  imgEl.alt = alt || '';
  imgEl.onerror = function () {
    // try svg fallback once
    if (path.endsWith('.jpg') || path.endsWith('.png')) {
      const svgPath = path.replace(/\.(jpg|png)$/i, '.svg');
      imgEl.onerror = function () {
        imgEl.onerror = null;
        const wrap = document.getElementById('heroWrap');
        if (wrap) wrap.classList.add('hidden');
      };
      imgEl.src = svgPath;
    } else {
      imgEl.onerror = null;
      const wrap = document.getElementById('heroWrap');
      if (wrap) wrap.classList.add('hidden');
    }
  };
  imgEl.src = path;
}


let currentFest = null;
let selectedNavDay = null;

const WEEKDAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];
const WEEKDAYS_HI = [
  'रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार',
];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function updateClock() {
  const n = new Date();
  const dayEl = document.getElementById('liveDay');
  const dateEl = document.getElementById('liveDate');
  const timeEl = document.getElementById('liveTime');
  if (!dayEl || !dateEl || !timeEl) return;

  const wd = n.getDay();
  const day = n.getDate();
  const month = n.getMonth();
  const year = n.getFullYear();
  const h = pad(n.getHours());
  const m = pad(n.getMinutes());
  const s = pad(n.getSeconds());

  // Full day name (English + Hindi)
  dayEl.textContent = `${WEEKDAYS[wd]} · ${WEEKDAYS_HI[wd]}`;

  // Full date: 11 October 2026
  dateEl.textContent = `${day} ${MONTHS[month]} ${year}`;

  // Hour : Minute : Second
  timeEl.innerHTML =
    `<span class="t-h">${h}</span><span class="t-colon">:</span>` +
    `<span class="t-m">${m}</span><span class="t-colon">:</span>` +
    `<span class="t-s">${s}</span>`;
}
updateClock();
setInterval(updateClock, 1000);

function applyTheme(fest) {
  const g = (fest && fest.gradient) || ['#4a148c', '#ff6f00'];
  document.body.style.background =
    `linear-gradient(165deg, #12022a 0%, ${g[g.length - 1]} 45%, ${g[0]} 100%)`;
}

function showFestival(fest, iso) {
  currentFest = fest;
  const heroWrap = document.getElementById('heroWrap');
  const heroImg = document.getElementById('heroImg');
  const statusPill = document.getElementById('statusPill');
  const festName = document.getElementById('festName');
  const festHindi = document.getElementById('festHindi');
  const festAbout = document.getElementById('festAbout');
  const wishLine = document.getElementById('wishLine');
  const navBox = document.getElementById('navratriBox');
  const guestTitle = document.getElementById('guestTitle');
  const pageFooter = document.getElementById('pageFooter');

  if (!fest) {
    // Koi tyohar nahi → koi festival image nahi
    if (heroWrap) heroWrap.classList.add('hidden');
    if (heroImg) {
      heroImg.removeAttribute('src');
      heroImg.alt = '';
    }
    if (statusPill) statusPill.textContent = 'आज कोई बड़ा त्योहार नहीं';
    if (festName) festName.textContent = 'Festival Calendar';
    if (festHindi) festHindi.textContent = 'त्योहार कैलेंडर';
    if (festAbout) {
      festAbout.textContent =
        'आज कोई प्रमुख त्योहार नहीं है। जब त्योहार आएगा तो छवि, रंग और शुभकामनाएँ अपने आप बदल जाएँगी।';
    }
    if (wishLine) wishLine.textContent = 'शुभकामनाएँ! ✨';
    if (guestTitle) guestTitle.textContent = 'आप भी शुभकामनाएँ भेजना चाहते हैं?';
    if (pageFooter) pageFooter.textContent = 'तारीख के हिसाब से त्योहार और छवि अपने आप बदल जाती है';
    applyTheme(null);
    if (navBox) navBox.classList.add('hidden');
  } else {
    if (heroWrap) heroWrap.classList.remove('hidden');
    if (statusPill) statusPill.textContent = `आज · ${iso}`;
    if (festName) festName.textContent = fest.name;
    if (festHindi) festHindi.textContent = fest.hindi;
    if (festAbout) festAbout.textContent = fest.about;
    if (wishLine) wishLine.textContent = fest.wish;
    if (guestTitle) {
      guestTitle.textContent = fest.isNavratri
        ? 'आप भी माँ दुर्गा की शुभकामनाएँ भेजना चाहते हैं?'
        : `आप भी ${fest.hindi} की शुभकामनाएँ भेजना चाहते हैं?`;
    }
    if (pageFooter) {
      pageFooter.textContent = fest.isNavratri
        ? 'नवरात्रि के हर दिन माँ का रूप और रंग अपने आप बदलता है'
        : `${fest.emoji} ${fest.name} — तारीख के साथ छवि और शुभकामनाएँ बदलती हैं`;
    }
    applyTheme(fest);

    if (fest.isNavratri) {
      if (navBox) navBox.classList.remove('hidden');
      const nd = navDayFor(iso, fest) || navDays[0];
      selectedNavDay = nd.day;
      if (heroImg && nd) {
        setHeroImage(heroImg, nd.image, nd.goddess);
      }
      renderNav(nd);
    } else {
      if (navBox) navBox.classList.add('hidden');
      if (heroImg) {
        setHeroImage(heroImg, fest.image, fest.name);
      }
    }
  }
}

function renderNav(nd) {
  // "Day X · Colour" label removed as requested
  const navLabel = document.getElementById('navLabel');
  if (navLabel) {
    navLabel.textContent = '';
    navLabel.style.display = 'none';
  }
  document.getElementById('navGoddess').textContent = `${nd.goddess} · ${nd.hindi}`;
  document.getElementById('navAbout').textContent = nd.about;
  // Mata photo change
  const heroImg = document.getElementById('heroImg');
  if (nd && nd.image) {
    setHeroImage(heroImg, nd.image, nd.goddess);
  }
}

function buildNavPills() {
  /* day pills removed */
}

function renderUpcoming(iso) {
  /* upcoming list removed */
}

const iso = todayISO();
showFestival(festivalOn(iso), iso);

// petals
const cols = ['#ff8a65', '#ffd54f', '#e040fb', '#ff6f00', '#f8bbd0'];
for (let i = 0; i < 14; i++) {
  const p = document.createElement('div');
  p.className = 'petal';
  p.style.left = Math.random() * 100 + 'vw';
  p.style.animationDuration = 6 + Math.random() * 8 + 's';
  p.style.animationDelay = Math.random() * 5 + 's';
  p.style.background = cols[i % cols.length];
  document.getElementById('petals').appendChild(p);
}

// share + guest photo (Divyanshu photo NEVER changes)
const toName = document.getElementById('toName');
const toDisplay = document.getElementById('toDisplay');
const toast = document.getElementById('toast');
const guestFile = document.getElementById('guestFile');
const guestPhoto = document.getElementById('guestPhoto');
const guestPlaceholder = document.getElementById('guestPlaceholder');
const guestName = document.getElementById('guestName');
const guestClear = document.getElementById('guestClear');
const OWNER_NAME = 'Divyanshu Gangwar';

function getTo() {
  try {
    return (new URLSearchParams(location.search).get('to') || '').trim().slice(0, 40);
  } catch {
    return '';
  }
}
function setTo(n) {
  n = (n || '').trim() || 'Friend';
  toDisplay.textContent = n;
  if (document.activeElement !== toName) toName.value = n === 'Friend' ? '' : n;
}
function shareURL(n) {
  try {
    const u = new URL(location.href);
    u.search = '';
    if (n && n !== 'Friend') u.searchParams.set('to', n);
    return u.toString();
  } catch {
    return location.href;
  }
}
function toastMsg(m) {
  toast.textContent = m;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// Guest photo — local only; owner photo untouched
function loadGuestFromStorage() {
  try {
    const data = localStorage.getItem('fw_guest_photo');
    const name = localStorage.getItem('fw_guest_name') || '';
    if (name) guestName.value = name;
    if (data) {
      guestPhoto.src = data;
      guestPhoto.classList.remove('hidden');
      guestPlaceholder.classList.add('hidden');
      guestClear.classList.remove('hidden');
    }
  } catch {}
}
function saveGuest(dataUrl, name) {
  try {
    if (dataUrl) localStorage.setItem('fw_guest_photo', dataUrl);
    else localStorage.removeItem('fw_guest_photo');
    if (name) localStorage.setItem('fw_guest_name', name);
    else localStorage.removeItem('fw_guest_name');
  } catch {}
}
function clearGuest() {
  guestPhoto.src = '';
  guestPhoto.classList.add('hidden');
  guestPlaceholder.classList.remove('hidden');
  guestClear.classList.add('hidden');
  guestFile.value = '';
  saveGuest(null, guestName.value.trim());
  toastMsg('आपकी फोटो हटा दी गई');
}

if (guestFile) {
  guestFile.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toastMsg('सिर्फ इमेज फ़ाइल चुनें');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toastMsg('फोटो 4MB से छोटी रखें');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result;
      if (guestPhoto) {
        guestPhoto.src = url;
        guestPhoto.classList.remove('hidden');
      }
      if (guestPlaceholder) guestPlaceholder.classList.add('hidden');
      if (guestClear) guestClear.classList.remove('hidden');
      saveGuest(url, guestName ? guestName.value.trim() : '');
      toastMsg('फोटो जुड़ गई (सिर्फ आपके डिवाइस पर)');
    };
    reader.onerror = () => toastMsg('फोटो लोड नहीं हुई, फिर से कोशिश करें');
    reader.readAsDataURL(file);
  });
}

if (guestName) {
  guestName.addEventListener('change', () => {
    const hasPhoto = guestPhoto && !guestPhoto.classList.contains('hidden') && guestPhoto.src;
    saveGuest(hasPhoto ? guestPhoto.src : null, guestName.value.trim());
  });
}

if (guestClear) guestClear.addEventListener('click', clearGuest);
loadGuestFromStorage();

// Owner image is fixed — never reassign #ownerPhoto src from guest logic

setTo(getTo() || 'Friend');
document.getElementById('applyBtn').onclick = () => {
  const n = toName.value.trim() || 'Friend';
  setTo(n);
  try { history.replaceState({}, '', shareURL(n)); } catch {}
  toastMsg('नाम सेट हो गया! अब Share दबाएँ');
};
toName.onkeydown = (e) => { if (e.key === 'Enter') document.getElementById('applyBtn').onclick(); };

document.getElementById('shareBtn').onclick = async () => {
  const n = toDisplay.textContent.trim() || 'Friend';
  const link = shareURL(n);
  const fest = currentFest;
  const gName = guestName.value.trim();
  let fromLine = `Wish from ${OWNER_NAME}`;
  if (gName) fromLine += `\nAlso from ${gName}`;
  const body =
    (fest ? `${fest.emoji} ${fest.wish}` : 'Shubhkamnayein!') +
    `\n\nDear ${n},\n${fromLine}\n\n${link}`;
  if (navigator.share) {
    try {
      await navigator.share({ title: fest?.name || 'Wish', text: body, url: link });
      return;
    } catch {}
  }
  try {
    await navigator.clipboard.writeText(body);
    toastMsg('कॉपी हो गया! WhatsApp पर पेस्ट करें');
  } catch {
    prompt('Copy:', link);
  }
};

document.getElementById('blessBtn').onclick = () => {
  toastMsg(currentFest ? `${currentFest.emoji} ${currentFest.hindi}` : '🙏');
};
