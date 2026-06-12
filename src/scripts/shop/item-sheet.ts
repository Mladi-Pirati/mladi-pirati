import type { CartItem } from "../../internal/order-form";
import type { ShopItem } from "../../internal/shop";

type QtyState = Record<string, number>;

let currentItem: ShopItem | null = null;
let qtyState: QtyState = {};

export function initShopPage(): void {
  const itemsEl = document.getElementById("shop-items");
  if (!itemsEl) return;

  const items: ShopItem[] = JSON.parse(itemsEl.textContent ?? "[]");
  const itemMap = new Map(items.map((i) => [i.id, i]));

  const grid = document.querySelector<HTMLElement>("[data-shop-grid]");
  if (grid) {
    grid.addEventListener("click", (e) => {
      const card = (e.target as Element).closest<HTMLElement>("[data-item-id]");
      if (!card) return;
      const item = itemMap.get(card.dataset.itemId ?? "");
      if (item) openSheet(item);
    });
  }

  document.getElementById("sheet-close")?.addEventListener("click", closeSheet);
  document.getElementById("item-sheet-overlay")?.addEventListener("click", closeSheet);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && currentItem) closeSheet();
  });

  document.getElementById("sheet-order-btn")?.addEventListener("click", () => {
    if (!currentItem) return;
    const cart: CartItem[] = Object.entries(qtyState).map(([size, quantity]) => ({
      itemId: currentItem!.id,
      size,
      quantity,
      name: currentItem!.name,
      price: currentItem!.price,
    }));
    sessionStorage.setItem("mp_cart", JSON.stringify(cart));
    window.location.href = "/narocilo";
  });
}

function openSheet(item: ShopItem): void {
  currentItem = item;
  qtyState = {};

  const sheet = document.getElementById("item-sheet");
  const overlay = document.getElementById("item-sheet-overlay");
  if (!sheet || !overlay) return;

  populateImages(item);
  populateInfo(item);
  populateSizes(item);
  resetQtySection();

  sheet.hidden = false;
  overlay.classList.remove("hidden");
  document.body.style.overflow = "hidden";

  // Focus the close button for keyboard users
  document.getElementById("sheet-close")?.focus();
}

function closeSheet(): void {
  currentItem = null;
  qtyState = {};

  const sheet = document.getElementById("item-sheet");
  const overlay = document.getElementById("item-sheet-overlay");
  if (!sheet || !overlay) return;

  sheet.hidden = true;
  overlay.classList.add("hidden");
  document.body.style.overflow = "";
}

function populateImages(item: ShopItem): void {
  const mainImg = document.getElementById("sheet-main-image") as HTMLImageElement | null;
  const placeholder = document.getElementById("sheet-image-placeholder");
  const thumbsEl = document.getElementById("sheet-thumbnails");
  if (!mainImg || !placeholder || !thumbsEl) return;

  thumbsEl.innerHTML = "";

  const sorted = [...item.images].sort((a, b) => a.sortOrder - b.sortOrder);

  if (sorted.length === 0) {
    mainImg.style.display = "none";
    placeholder.style.display = "";
    return;
  }

  setMainImage(sorted[0].url, item.name);
  placeholder.style.display = "none";

  sorted.forEach((img, idx) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className =
      "h-14 w-14 flex-shrink-0 overflow-hidden rounded border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent " +
      (idx === 0 ? "border-accent" : "border-border hover:border-accent");
    btn.setAttribute("aria-label", `Slika ${idx + 1}`);

    const thumbImg = document.createElement("img");
    thumbImg.src = img.url;
    thumbImg.alt = "";
    thumbImg.className = "h-full w-full object-cover";
    thumbImg.loading = "lazy";
    btn.appendChild(thumbImg);

    btn.addEventListener("click", () => {
      setMainImage(img.url, item.name);
      thumbsEl.querySelectorAll("button").forEach((b) =>
        b.classList.replace("border-accent", "border-border")
      );
      btn.classList.replace("border-border", "border-accent");
    });

    thumbsEl.appendChild(btn);
  });
}

function setMainImage(url: string, alt: string): void {
  const mainImg = document.getElementById("sheet-main-image") as HTMLImageElement | null;
  if (!mainImg) return;
  mainImg.src = url;
  mainImg.alt = alt;
  mainImg.style.display = "";
}

function populateInfo(item: ShopItem): void {
  const nameEl = document.getElementById("sheet-name");
  const priceEl = document.getElementById("sheet-price");
  const descEl = document.getElementById("sheet-description");
  if (nameEl) nameEl.textContent = item.name;
  if (priceEl) priceEl.textContent = `${item.price} €`;
  if (descEl) descEl.textContent = item.description;
}

function populateSizes(item: ShopItem): void {
  const sizesEl = document.getElementById("sheet-sizes");
  if (!sizesEl) return;
  sizesEl.innerHTML = "";

  item.sizes.forEach((size) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.size = size;
    btn.textContent = size;
    btn.className =
      "rounded border border-border bg-panel px-3 py-1.5 font-mono text-xs text-text-muted transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";

    btn.addEventListener("click", () => toggleSize(size, btn));
    sizesEl.appendChild(btn);
  });
}

function toggleSize(size: string, btn: HTMLButtonElement): void {
  if (qtyState[size] !== undefined) {
    // Deselect
    delete qtyState[size];
    btn.className =
      "rounded border border-border bg-panel px-3 py-1.5 font-mono text-xs text-text-muted transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
    removeQtyRow(size);
  } else {
    // Select
    qtyState[size] = 1;
    btn.className =
      "rounded border border-accent bg-accent px-3 py-1.5 font-mono text-xs font-bold text-canvas transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
    addQtyRow(size);
  }
  updateSummary();
}

function addQtyRow(size: string): void {
  const rowsEl = document.getElementById("sheet-qty-rows");
  const section = document.getElementById("sheet-qty-section");
  if (!rowsEl || !section) return;

  const row = document.createElement("div");
  row.dataset.qtySize = size;
  row.className =
    "flex items-center justify-between rounded border border-accent bg-panel px-3 py-2";

  const label = document.createElement("span");
  label.className = "font-mono text-sm text-text";
  label.textContent = size;

  const controls = document.createElement("div");
  controls.className = "flex items-center gap-3";

  const minus = document.createElement("button");
  minus.type = "button";
  minus.textContent = "−";
  minus.className =
    "flex h-7 w-7 items-center justify-center rounded border border-border font-mono text-base text-text transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
  minus.setAttribute("aria-label", `Zmanjšaj količino za ${size}`);

  const count = document.createElement("span");
  count.className = "w-5 text-center font-mono text-sm font-bold text-accent";
  count.textContent = "1";

  const plus = document.createElement("button");
  plus.type = "button";
  plus.textContent = "+";
  plus.className =
    "flex h-7 w-7 items-center justify-center rounded border border-border font-mono text-base text-text transition-colors hover:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
  plus.setAttribute("aria-label", `Povečaj količino za ${size}`);

  minus.addEventListener("click", () => {
    const qty = Math.max(1, (qtyState[size] ?? 1) - 1);
    qtyState[size] = qty;
    count.textContent = String(qty);
    updateSummary();
  });

  plus.addEventListener("click", () => {
    const qty = (qtyState[size] ?? 1) + 1;
    qtyState[size] = qty;
    count.textContent = String(qty);
    updateSummary();
  });

  controls.append(minus, count, plus);
  row.append(label, controls);
  rowsEl.appendChild(row);

  section.classList.remove("hidden");
}

function removeQtyRow(size: string): void {
  const rowsEl = document.getElementById("sheet-qty-rows");
  const section = document.getElementById("sheet-qty-section");
  if (!rowsEl || !section) return;

  rowsEl.querySelector(`[data-qty-size="${size}"]`)?.remove();

  if (rowsEl.children.length === 0) {
    section.classList.add("hidden");
  }
}

function resetQtySection(): void {
  const rowsEl = document.getElementById("sheet-qty-rows");
  const section = document.getElementById("sheet-qty-section");
  const summary = document.getElementById("sheet-summary");
  if (rowsEl) rowsEl.innerHTML = "";
  if (section) section.classList.add("hidden");
  if (summary) {
    summary.textContent = "";
    summary.classList.add("hidden");
  }
  setOrderBtnEnabled(false);
}

function updateSummary(): void {
  if (!currentItem) return;
  const summary = document.getElementById("sheet-summary");
  if (!summary) return;

  const price = parseFloat(currentItem.price);
  const totalQty = Object.values(qtyState).reduce((a, b) => a + b, 0);

  if (totalQty === 0) {
    summary.classList.add("hidden");
    setOrderBtnEnabled(false);
    return;
  }

  const totalPrice = (price * totalQty).toFixed(2).replace(".", ",");
  summary.textContent = `Skupaj: ${totalQty} ${totalQty === 1 ? "kos" : "kosi"} · ${totalPrice} €`;
  summary.classList.remove("hidden");
  setOrderBtnEnabled(true);
}

function setOrderBtnEnabled(enabled: boolean): void {
  const btn = document.getElementById("sheet-order-btn") as HTMLButtonElement | null;
  if (!btn) return;
  if (enabled) {
    btn.disabled = false;
    btn.className =
      "w-full rounded border border-accent bg-accent py-2.5 font-mono text-sm font-bold uppercase tracking-widest text-canvas transition-colors hover:border-accent-strong hover:bg-accent-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent";
  } else {
    btn.disabled = true;
    btn.className =
      "w-full cursor-not-allowed rounded border border-border py-2.5 font-mono text-sm font-bold uppercase tracking-widest text-text-muted opacity-40";
  }
}
