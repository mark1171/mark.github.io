window.addEventListener("load", () => {
  document.body.classList.add("loaded");
});

/* Highlight current page in nav */
document.addEventListener("DOMContentLoaded", () => {
  const path = location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("nav a").forEach((link) => {
    if (link.getAttribute("href") === path) link.classList.add("active");
  });
});

/* Ambient blue/violet particle field (index page) */
document.addEventListener("DOMContentLoaded", () => {
  const field = document.getElementById("particle-field");
  if (!field) return;
  const colors = ["#4f7cff", "#8b5cf6", "#c4b5fd"];
  const count = 34;
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    p.className = "particle";
    const size = Math.random() * 4 + 2;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    p.style.left = `${Math.random() * 100}%`;
    p.style.top = `${Math.random() * 100}%`;
    p.style.background = colors[i % colors.length];
    p.style.animationDuration = `${Math.random() * 10 + 8}s`;
    p.style.animationDelay = `${Math.random() * 6}s`;
    p.style.animationDirection = Math.random() > 0.5 ? "alternate" : "alternate-reverse";
    field.appendChild(p);
  }
});

/* Memories page: upload photos, persist them permanently in this browser */
document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("memories-grid");
  if (!grid) return;

  const addBtn = document.getElementById("add-memory-btn");
  const fileInput = document.getElementById("memory-file-input");
  const STORAGE_KEY = "you-and-me:memories";

  const grads = [
    "linear-gradient(155deg, #4f7cff, #8b5cf6)",
    "linear-gradient(155deg, #8b5cf6, #c4b5fd)",
    "linear-gradient(155deg, #3a5fe0, #7c4fd4)",
  ];

  const load = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
      return [];
    }
  };

  const save = (memories) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(memories));
  };

  const render = () => {
    grid.querySelectorAll(".memory-card:not(.memory-add)").forEach((el) => el.remove());
    const memories = load();

    memories.forEach((memory, i) => {
      const card = document.createElement("div");
      card.className = "memory-card has-photo";
      card.style.backgroundImage = `url(${memory.src})`;
      card.style.setProperty("--grad", grads[i % grads.length]);
      card.style.animationDelay = `${i * 0.06}s`;

      const label = document.createElement("span");
      label.textContent = memory.caption || `Memory ${String(i + 1).padStart(2, "0")}`;
      card.appendChild(label);

      const del = document.createElement("button");
      del.type = "button";
      del.className = "memory-delete";
      del.setAttribute("aria-label", "Remove this memory");
      del.textContent = "×";
      del.addEventListener("click", (e) => {
        e.stopPropagation();
        const updated = load().filter((_, idx) => idx !== i);
        save(updated);
        render();
      });
      card.appendChild(del);

      card.addEventListener("animationend", () => {
        card.style.animation = "none";
      }, { once: true });

      grid.insertBefore(card, addBtn);
    });
  };

  addBtn?.addEventListener("click", () => fileInput.click());

  fileInput?.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const caption = window.prompt("Add a short caption for this memory (optional):", "") || "";
      const memories = load();
      memories.push({ src: reader.result, caption });
      save(memories);
      render();
      fileInput.value = "";
    };
    reader.readAsDataURL(file);
  });

  render();
});

/* 3D rotating carousel (gallery page) — continuous auto-rotate,
   hover zoom, persistent photos, adjustable slide count */
document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".carousel-container");
  if (!container) return;

  const STORAGE_KEY = "you-and-me:gallery";
  const fileInput = document.getElementById("carousel-file-input");
  const countInput = document.getElementById("carousel-count");
  const countApplyBtn = document.getElementById("carousel-count-apply");

  const grads = [
    "linear-gradient(160deg, #4f7cff, #8b5cf6)",
    "linear-gradient(160deg, #8b5cf6, #c4b5fd)",
    "linear-gradient(160deg, #3a5fe0, #7c4fd4)",
    "linear-gradient(160deg, #6d8bff, #a78bfa)",
    "linear-gradient(160deg, #5a6fe8, #9061f9)",
  ];

  let items = [];
  let total = 0;
  let rotation = 0;
  let isPaused = false;
  let editIndex = null;

  const loadPhotos = () => {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  };

  const savePhotos = (photos) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(photos));
  };

  const applyPhoto = (item, src) => {
    item.style.backgroundImage = `url(${src})`;
    item.classList.add("has-photo");
  };

  const clearPhoto = (item) => {
    item.style.backgroundImage = "";
    item.classList.remove("has-photo");
  };

  const applyRotation = () => {
    container.style.transform = `rotateY(${rotation}deg)`;
  };

  /* space items evenly around a circle sized to fit the item width */
  const layoutItems = () => {
    const itemWidth = 220;
    const minRadius = Math.round((itemWidth / 2) / Math.tan(Math.PI / total));
    const radius = Math.min(500, Math.max(180, Math.round(minRadius * 2)));
    items.forEach((item, i) => {
      const angle = (360 / total) * i;
      item.style.setProperty("--base-transform", `rotateY(${angle}deg) translateZ(${radius}px)`);
    });
  };

  /* rebuild the carousel with a given number of slots, keeping any
     saved photos that still fit within the new count */
  const buildItems = (count) => {
    const photos = loadPhotos();
    container.innerHTML = "";
    items = [];

    for (let i = 0; i < count; i++) {
      const item = document.createElement("div");
      item.className = "carousel-item";
      item.style.setProperty("--grad", grads[i % grads.length]);

      const label = document.createElement("span");
      label.className = "item-label";
      label.textContent = `Clip ${String(i + 1).padStart(2, "0")}`;
      item.appendChild(label);

      const hint = document.createElement("span");
      hint.className = "item-edit-hint";
      hint.textContent = "Click to add photo";
      item.appendChild(hint);

      const removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.className = "item-remove";
      removeBtn.setAttribute("aria-label", "Remove photo");
      removeBtn.textContent = "×";
      removeBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const stored = loadPhotos();
        delete stored[i];
        savePhotos(stored);
        clearPhoto(item);
      });
      item.appendChild(removeBtn);

      item.addEventListener("click", () => {
        editIndex = i;
        fileInput?.click();
      });

      if (photos[i]) applyPhoto(item, photos[i]);

      container.appendChild(item);
      items.push(item);
    }

    total = count;
    layoutItems();
    applyRotation();
  };

  fileInput?.addEventListener("change", () => {
    const file = fileInput.files?.[0];
    if (!file || editIndex === null) return;

    const reader = new FileReader();
    reader.onload = () => {
      const photos = loadPhotos();
      photos[editIndex] = reader.result;
      savePhotos(photos);
      applyPhoto(items[editIndex], reader.result);
      fileInput.value = "";
      editIndex = null;
    };
    reader.readAsDataURL(file);
  });

  container.style.transition = "none";

  const tick = () => {
    if (!isPaused) {
      rotation -= 0.05; // degrees per frame — tweak for faster/slower spin
      applyRotation();
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  document.getElementById("next-btn")?.addEventListener("click", () => {
    rotation -= 360 / total;
    applyRotation();
  });

  document.getElementById("prev-btn")?.addEventListener("click", () => {
    rotation += 360 / total;
    applyRotation();
  });

  container.addEventListener("mouseenter", () => { isPaused = true; });
  container.addEventListener("mouseleave", () => { isPaused = false; });

  countApplyBtn?.addEventListener("click", () => {
    let count = parseInt(countInput.value, 10);
    if (Number.isNaN(count)) return;
    count = Math.min(12, Math.max(2, count));
    countInput.value = count;
    buildItems(count);
  });

  const initialCount = countInput
    ? Math.min(12, Math.max(2, parseInt(countInput.value, 10) || 5))
    : 5;
  buildItems(initialCount);
});

/* Typewriter effect for the message page */
document.addEventListener("DOMContentLoaded", () => {
  const el = document.getElementById("typewriter");
  if (!el) return;
  const message = el.dataset.message || "";
  el.textContent = "";
  const caret = document.createElement("span");
  caret.className = "caret";
  let i = 0;

  const type = () => {
    if (i < message.length) {
      el.textContent = message.slice(0, i + 1);
      el.appendChild(caret);
      i++;
      setTimeout(type, 22);
    }
  };
  type();
});