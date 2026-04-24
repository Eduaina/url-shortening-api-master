const form = document.getElementById("form");
const input = document.getElementById("urlInput");
const results = document.getElementById("results");
const error = document.getElementById("error");

let links = JSON.parse(localStorage.getItem("links")) || [];

function render() {
  results.innerHTML = "";

  links.forEach((item, index) => {
    const div = document.createElement("div");
    div.className = "card p-3 mb-2";

    div.innerHTML = `
      <div class="d-md-flex justify-content-between align-items-center">
        <p class="mb-2 mb-md-0">${item.original}</p>
        <div class="d-flex gap-2">
          <a href="${item.short}" target="_blank">${item.short}</a>
          <button class="btn btn-sm btn-secondary" onclick="copyLink('${item.short}', this)">Copy</button>
        </div>
      </div>
    `;

    results.appendChild(div);
  });
}

async function shorten(url) {
  try {
    const res = await fetch("https://cleanuri.com/api/v1/shorten", {
      method: "POST",
      body: new URLSearchParams({ url })
    });
    const data = await res.json();
    return data.result_url;
  } catch {
    return null;
  }
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  if (!input.value.trim()) {
    error.classList.remove("d-none");
    input.classList.add("border-danger");
    return;
  }

  error.classList.add("d-none");
  input.classList.remove("border-danger");

  const short = await shorten(input.value);
  if (!short) return;

  links.unshift({ original: input.value, short });
  localStorage.setItem("links", JSON.stringify(links));

  render();
  input.value = "";
});

function copyLink(link, btn) {
  navigator.clipboard.writeText(link);
  btn.textContent = "Copied!";
  btn.classList.replace("btn-secondary", "btn-success");
}

render();