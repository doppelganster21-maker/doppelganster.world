
const uploadForm = document.getElementById('uploadForm');
const statusEl = document.getElementById('status');
const galleryGrid = document.getElementById('galleryGrid');
const emptyMsg = document.getElementById('emptyMsg');
const searchInput = document.getElementById('searchInput');
const nextPageBtn = document.getElementById('nextPageBtn');
const prevPageBtn = document.getElementById('prevPageBtn');

// Set your backend URL here (e.g. https://your-backend.onrender.com)
// If left as 'AUTO', the script will use the same origin as the frontend.
let API_BASE = 'AUTO';

let currentPage = 0;

function getItemsPerPage() {
  return window.innerWidth <= 820 ? 10 : 20;
}
function setStatus(msg) { statusEl.textContent = msg; }
function resetForm() { uploadForm.reset(); setStatus(''); }

async function loadItems() {
  const base = (API_BASE === 'AUTO') ? window.location.origin : API_BASE;
  const res = await fetch(base + '/api/images');
  if (!res.ok) throw new Error('Failed to load images');
  return await res.json();
}

async function saveItem(formData) {
  const base = (API_BASE === 'AUTO') ? window.location.origin : API_BASE;
  const res = await fetch(base + '/api/upload', { method: 'POST', body: formData });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Upload failed');
  }
  return await res.json();
}

function renderGallery(items) {
  galleryGrid.innerHTML = '';
  const filtered = items.filter(item => (item.name || '').toLowerCase().includes(searchInput.value.toLowerCase()));
  const perPage = getItemsPerPage();
  const start = currentPage * perPage;
  const paged = filtered.slice(start, start + perPage);

  prevPageBtn.disabled = currentPage === 0;
  nextPageBtn.disabled = (start + perPage) >= filtered.length;

  if (paged.length === 0) { emptyMsg.style.display = 'block'; return; }
  emptyMsg.style.display = 'none';
  paged.forEach(item => {
    const tile = document.createElement('div');
    tile.className = 'tile';
    tile.innerHTML = `<img src="${item.url}" alt=""/><div class="meta"><b>${escapeHtml(item.name || 'Anonymous')}</b><div class="small">Reward: ₹${escapeHtml(item.reward || 0)}</div><div class="small muted">${escapeHtml(item.email || '')}</div></div>`;
    galleryGrid.appendChild(tile);
  });
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, function(m){ return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]); });
}

uploadForm.addEventListener('submit', async e => {
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim();
  const reward = document.getElementById('reward').value;
  const fileInput = document.getElementById('file');
  const file = fileInput.files[0];
  if (!file) { setStatus('Please choose an image file.'); return; }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('email', email);
  formData.append('reward', reward);
  formData.append('file', file);

  setStatus('Uploading...');
  try {
    await saveItem(formData);
    const items = await loadItems();
    renderGallery(items);
    resetForm();
    setStatus('Uploaded successfully.');
  } catch (err) {
    console.error(err);
    setStatus('Upload failed: ' + err.message);
  }
});

searchInput.addEventListener('input', () => { currentPage = 0; loadItems().then(renderGallery).catch(()=>{}); });
nextPageBtn.addEventListener('click', async () => { currentPage++; const items = await loadItems(); renderGallery(items); });
prevPageBtn.addEventListener('click', async () => { if(currentPage>0) currentPage--; const items = await loadItems(); renderGallery(items); });

// Initial load
loadItems().then(renderGallery).catch(err => { console.warn('Could not load items yet', err); });
window.addEventListener('resize', () => loadItems().then(renderGallery).catch(()=>{}));
