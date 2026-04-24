/* =============================================
   SHORTLY — script.js
   ============================================= */

(function () {
  'use strict';

  /* ---------- DOM refs ---------- */
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const mobileMenu   = document.getElementById('mobileMenu');
  const urlInput     = document.getElementById('urlInput');
  const urlError     = document.getElementById('urlError');
  const shortenBtn   = document.getElementById('shortenBtn');
  const resultsList  = document.getElementById('resultsList');

  /* ---------- State ---------- */
  const STORAGE_KEY = 'shortly_links';

  /* ---------- Mobile menu toggle ---------- */
  hamburgerBtn.addEventListener('click', () => {
    mobileMenu.classList.toggle('is-open');
  });

  /* Close menu when a link inside it is clicked */
  mobileMenu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      mobileMenu.classList.remove('is-open');
    });
  });

  /* ---------- URL validation ---------- */
  function isValidUrl(value) {
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  function showError(message) {
    urlInput.classList.add('shortly-shortener__input--error');
    urlError.textContent = message || 'Please add a link';
    urlError.classList.add('is-visible');
  }

  function clearError() {
    urlInput.classList.remove('shortly-shortener__input--error');
    urlError.classList.remove('is-visible');
  }

  /* ---------- localStorage ---------- */
  function getStoredLinks() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  }

  function saveLinks(links) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
  }

  function addLink(original, shortened) {
    const links = getStoredLinks();
    links.unshift({ original, shortened });
    saveLinks(links);
  }

  /* ---------- Render a single result item ---------- */
  function createResultItem(original, shortened) {
    const li = document.createElement('li');
    li.className = 'result-item';

    li.innerHTML = `
      <span class="result-item__original" title="${escapeHtml(original)}">${escapeHtml(original)}</span>
      <div class="result-item__right">
        <a href="${escapeHtml(shortened)}" class="result-item__short" target="_blank" rel="noopener noreferrer">${escapeHtml(shortened)}</a>
        <button class="result-item__copy-btn" data-link="${escapeHtml(shortened)}">Copy</button>
      </div>
    `;

    const copyBtn = li.querySelector('.result-item__copy-btn');
    copyBtn.addEventListener('click', () => handleCopy(copyBtn));

    return li;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /* ---------- Render all stored links ---------- */
  function renderStoredLinks() {
    const links = getStoredLinks();
    resultsList.innerHTML = '';
    links.forEach(({ original, shortened }) => {
      resultsList.appendChild(createResultItem(original, shortened));
    });
  }

  /* ---------- Copy to clipboard ---------- */
  function handleCopy(btn) {
    const link = btn.dataset.link;
    navigator.clipboard.writeText(link).then(() => {
      /* Reset any previously "Copied!" buttons */
      document.querySelectorAll('.result-item__copy-btn--copied').forEach((b) => {
        b.textContent = 'Copy';
        b.classList.remove('result-item__copy-btn--copied');
      });

      btn.textContent = 'Copied!';
      btn.classList.add('result-item__copy-btn--copied');
    }).catch(() => {
      /* Fallback for older browsers */
      const ta = document.createElement('textarea');
      ta.value = link;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.focus();
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);

      btn.textContent = 'Copied!';
      btn.classList.add('result-item__copy-btn--copied');
    });
  }

  /* ---------- API call ---------- */
  async function shortenUrl(url) {
    const formData = new FormData();
    formData.append('url', url);

    const response = await fetch('https://cleanuri.com/api/v1/shorten', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Something went wrong. Try again.');
    }

    const data = await response.json();
    if (!data.result_url) {
      throw new Error('No shortened URL returned.');
    }
    return data.result_url;
  }

  /* ---------- Shorten button handler ---------- */
  async function handleShorten() {
    const rawValue = urlInput.value.trim();

    /* Validate empty */
    if (!rawValue) {
      showError('Please add a link');
      urlInput.focus();
      return;
    }

    /* Validate URL format */
    if (!isValidUrl(rawValue)) {
      showError('Please enter a valid URL (including http:// or https://)');
      urlInput.focus();
      return;
    }

    clearError();

    /* Disable while loading */
    shortenBtn.disabled = true;
    shortenBtn.textContent = 'Shortening...';

    try {
      const shortened = await shortenUrl(rawValue);

      /* Prepend new item to list */
      const newItem = createResultItem(rawValue, shortened);
      resultsList.insertBefore(newItem, resultsList.firstChild);

      /* Persist */
      addLink(rawValue, shortened);

      /* Clear input */
      urlInput.value = '';
    } catch (err) {
      showError(err.message || 'Something went wrong. Try again.');
    } finally {
      shortenBtn.disabled = false;
      shortenBtn.textContent = 'Shorten It!';
    }
  }

  /* ---------- Events ---------- */
  shortenBtn.addEventListener('click', handleShorten);

  urlInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleShorten();
  });

  urlInput.addEventListener('input', () => {
    if (urlInput.value.trim()) clearError();
  });

  /* ---------- Init ---------- */
  renderStoredLinks();
})();
