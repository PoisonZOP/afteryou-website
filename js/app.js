"use strict";

/* ============================================================
   UTILITIES & RENDERING HELPERS
   ============================================================ */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const money = n => PRICE_PLACEHOLDER ? "฿000" : "฿" + n;
const minPrice = p => Math.min(...p.sizes.map(s => s[1]));
const productById = id => PRODUCTS.find(p => p.id === id);
const branchById = id => BRANCHES.find(b => b.id === id);

function placeholder(alt, square) {
  return `<div class="ph${square ? " square" : ""}" role="img" aria-label="${esc(alt)}">
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <circle cx="32" cy="24" r="11" fill="none" stroke="currentColor" stroke-width="2.5"/>
      <path d="M14 42h36a18 18 0 0 1-36 0Z" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/>
      <path d="M32 13v-5" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/>
    </svg>
  </div>`;
}

function productImg(p, square) {
  const ph = placeholder("Image of " + (p ? p.name : "dessert"), square);
  if (!p || !p.img) return ph;
  return `<div class="img-wrap">${ph}<img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy" onerror="this.remove()"></div>`;
}

let toastTimer;
function toast(msg) {
  const el = $("#toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("is-open");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-open"), 2600);
}

/* ============================================================
   CART STATE MANAGEMENT
   ============================================================ */
const CART_KEY = "ay_cart_v1";
const FULFIL_KEY = "ay_fulfilment_v1";
const PROMO_KEY = "ay_promo_dismissed_v1";
const ORDER_KEY = "ay_last_order_v1";

let cart = (() => {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || []; }
  catch { return []; }
})();

let fulfilment = (() => {
  try { return Object.assign({mode:"pickup", branch:"b01", time:"ASAP", address:""}, JSON.parse(localStorage.getItem(FULFIL_KEY)) || {}); }
  catch { return {mode:"pickup", branch:"b01", time:"ASAP", address:""}; }
})();

function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {}
  syncCartBadge();
  renderCartPanel();
}
function saveFulfilment() {
  try { localStorage.setItem(FULFIL_KEY, JSON.stringify(fulfilment)); } catch {}
}
const cartCount = () => cart.reduce((n, i) => n + i.qty, 0);
const cartTotal = () => cart.reduce((n, i) => n + i.qty * i.price, 0);

function addToCart(productId, sizeLabel, price) {
  const key = productId + "|" + sizeLabel;
  const existing = cart.find(i => i.key === key);
  if (existing) existing.qty += 1;
  else cart.push({key, id:productId, name:productById(productId).name, size:sizeLabel, price, qty:1});
  saveCart();
  toast("Added to cart");
}
function changeQty(key, delta) {
  const item = cart.find(i => i.key === key);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) cart = cart.filter(i => i.key !== key);
  saveCart();
}
function removeItem(key) {
  cart = cart.filter(i => i.key !== key);
  saveCart();
}

function syncCartBadge() {
  const n = cartCount();
  ["#cart-badge", "#cart-badge-m"].forEach(sel => {
    const el = $(sel);
    if (!el) return;
    el.textContent = n;
    el.hidden = n === 0;
  });
  $$("#cart-open, #cart-open-m").forEach(btn => {
    btn.setAttribute("aria-label", n === 0 ? "Open cart, empty" : `Open cart, ${n} item${n > 1 ? "s" : ""}`);
  });
}

/* ============================================================
   ROUTER
   ============================================================ */
function currentRoute() {
  const raw = location.hash.replace(/^#/, "") || "/";
  return raw.split("?")[0];
}

function navigate(path) {
  if (location.hash === "#" + path) render();
  else location.hash = path;
}

function render() {
  closeSearch();
  disposeMenuDropdown();
  const path = currentRoute();
  const parts = path.split("/").filter(Boolean);
  const main = $("#main");

  let html = "";
  let navKey = "/";

  switch (parts[0]) {
    case undefined:
    case "":
      html = viewHome(); navKey = "/"; break;
    case "menu":
      html = viewMenu(); navKey = "/menu"; break;
    case "order":
      if (parts[1]) { html = viewProduct(parts[1]); navKey = "/menu"; }
      else { html = viewOrder(); navKey = "/order"; }
      break;
    case "branches":
      html = viewBranches(); navKey = "/branches"; break;
    case "faq":
      html = viewFaq(); navKey = "/faq"; break;
    case "contact":
      html = viewContact(); navKey = "/contact"; break;
    case "checkout":
      html = viewCheckout(); navKey = "/order"; break;
    case "confirmation":
      html = viewConfirmation(); navKey = "/order"; break;
    default:
      html = viewNotFound();
  }

  main.innerHTML = html;
  document.title = pageTitle(parts) + " — After You Dessert Cafe";

  $$("[data-nav]").forEach(a => {
    const on = a.dataset.nav === navKey;
    if (on) a.setAttribute("aria-current", "page");
    else a.removeAttribute("aria-current");
  });

  bindViewEvents(parts);
  applyLanguage();
  window.scrollTo({top:0, behavior:"instant" in window ? "instant" : "auto"});

  if (document.activeElement !== $("#global-search")) {
    main.focus({ preventScroll: true });
  }

  revealSearchedFaq();
}

function pageTitle(parts) {
  const map = {menu:"Menu", order:"Order", branches:"Branches", faq:"FAQ", contact:"Contact Us", checkout:"Checkout", confirmation:"Order confirmed"};
  return map[parts[0]] || "Home";
}

/* ============================================================
   VIEWS — HOME
   ============================================================ */
function viewHome() {
  const top = PRODUCTS.filter(p => p.cat !== "Other").slice(0, 8);
  return `
  <section class="section" aria-labelledby="home-title">
    <div class="container">
      <p class="eyebrow">Bangkok · since 2007</p>
      <h1 id="home-title">Desserts worth the queue.</h1>
      <p class="lede">Kakigōri, thick toast and croffles, made fresh to order. Browse our menu, pick a branch for collection — or order delivery right to your door.</p>
      <div class="row-between mt-3" style="justify-content:flex-start">
        <a class="btn btn-primary" href="#/menu">See the menu</a>
        <a class="btn btn-secondary" href="#/branches">Find a branch</a>
      </div>
    </div>
  </section>

  <section class="section" aria-labelledby="top-title" style="padding-top:0">
    <div class="container">
      <div class="row-between" style="margin-bottom:var(--s3)">
        <h2 id="top-title" style="margin:0">Top orders</h2>
        <a href="#/menu" style="font-weight:600">View full menu &rarr;</a>
      </div>
      <div class="grid-products">
        ${top.map(p => productCard(p)).join("")}
      </div>
    </div>
  </section>`;
}

function productCard(p) {
  return `
  <a class="card" href="#/order/${encodeURIComponent(p.id)}">
    ${productImg(p)}
    <div class="card-body">
      <span class="card-name">${esc(p.name)}</span>
      <span class="card-price">From ${money(minPrice(p))}</span>
    </div>
  </a>`;
}

/* ============================================================
   VIEWS — MENU
   ============================================================ */
let menuState = {cat:"All", sub:null, q:""};

function viewMenu() {
  return `
  <section class="section">
    <div class="container">
      <p class="eyebrow">Menu</p>
      <h1>What would you like?</h1>

      <div class="menu-toolbar">
        <div class="chip-bar-wrapper">
          <div class="chip-row" role="group" aria-label="Filter by category" id="cat-row">
            <button class="chip" data-cat="All" aria-pressed="${menuState.cat === "All"}">All</button>
            ${CATEGORIES.filter(c => c !== "Other").map(c =>
              `<button class="chip" data-cat="${esc(c)}" aria-pressed="${menuState.cat === c}">${esc(c)}</button>`
            ).join("")}
            
            <button class="chip" id="other-chip" aria-haspopup="true" aria-expanded="false" aria-controls="other-menu"
              aria-pressed="${menuState.cat === "Other"}">
              ${menuState.sub ? esc(menuState.sub) : "Other"}
              <svg class="chev" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </button>
          </div>
          
          <!-- Floating dropdown outside the overflow scroller -->
          <div class="other-menu" id="other-menu" role="menu" hidden>
            <button role="menuitemradio" aria-checked="${menuState.sub === null}" data-sub="">All Other</button>
            ${OTHER_SUBS.map(s =>
              `<button role="menuitemradio" aria-checked="${menuState.sub === s}" data-sub="${esc(s)}">${esc(s)}</button>`
            ).join("")}
          </div>
        </div>
      </div>

      <p class="result-count" id="menu-count" aria-live="polite"></p>
      <div class="grid-products" id="menu-grid"></div>
      <div id="menu-empty" hidden>
        <div class="empty-state">
          <h3>No desserts match your search</h3>
          <p>Try a different item name or clear your filters to view the full menu.</p>
          <button class="btn btn-secondary" id="clear-menu">Clear search and filters</button>
        </div>
      </div>
    </div>
  </section>`;
}

function filteredProducts() {
  const q = menuState.q.trim().toLowerCase();
  return PRODUCTS.filter(p => {
    if (menuState.cat !== "All" && p.cat !== menuState.cat) return false;
    if (menuState.cat === "Other" && menuState.sub && p.sub !== menuState.sub) return false;
    if (q && !(p.name.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))) return false;
    return true;
  });
}

function refreshMenuGrid() {
  const list = filteredProducts();
  const grid = $("#menu-grid");
  const empty = $("#menu-empty");
  const count = $("#menu-count");
  if (!grid) return;

  grid.innerHTML = list.map(p => productCard(p)).join("");
  count.textContent = list.length === 1 ? "1 dessert found" : `${list.length} desserts found`;
  empty.hidden = list.length > 0;

  $$("#cat-row [data-cat]").forEach(b => {
    b.setAttribute("aria-pressed", String(b.dataset.cat === menuState.cat));
  });
  const otherChip = $("#other-chip");
  if (otherChip) {
    otherChip.setAttribute("aria-pressed", String(menuState.cat === "Other"));
    otherChip.childNodes[0].nodeValue = (menuState.sub || "Other") + " ";
  }
}

/* ============================================================
   VIEWS — PRODUCT DETAIL
   ============================================================ */
function viewProduct(id) {
  const p = productById(id);
  if (!p) return viewNotFound();

  const sizes = p.sizes.map(([label, price], i) => ({label, price, i}));
  const first = sizes[0];

  return `
  <section class="section">
    <div class="container">
      <p style="margin-bottom:var(--s3)"><a href="#/menu" style="font-weight:600">&larr; Back to menu</a></p>

      <div class="product-layout">
        <div class="product-media">
          ${productImg(p, true)}
        </div>

        <div>
          <p class="eyebrow">${esc(p.cat)}${p.sub ? " · " + esc(p.sub) : ""}</p>
          <h1>${esc(p.name)}</h1>
          <p class="lede">${esc(p.desc || "Delicious handcrafted signature recipe from After You Dessert Cafe.")}</p>

          <span class="size-label" id="size-label">Select Option</span>
          <div class="size-grid" role="radiogroup" aria-labelledby="size-label" id="size-grid">
            ${sizes.map(({label, price, i}) => `
              <button class="size-opt" role="radio" aria-checked="${i === 0}" data-size="${esc(label)}" data-price="${price}" tabindex="${i === 0 ? 0 : -1}">
                <span class="sz">${esc(label)}</span>
                <span class="pr">${money(price)}</span>
              </button>`).join("")}
          </div>

          <div class="row-between" style="margin-bottom:var(--s3)">
            <span class="caption" style="color:var(--muted)">Selected: <strong id="sel-label" style="color:var(--cocoa)">${esc(first.label)} — ${money(first.price)}</strong></span>
          </div>

          <button class="btn btn-primary btn-block" id="add-to-cart">
            Add to cart
          </button>
          <p class="caption" style="margin-top:var(--s2);color:var(--muted);text-align:center">
            You can review items in your cart before checkout.
          </p>
        </div>
      </div>
    </div>
  </section>`;
}

/* ============================================================
   VIEWS — ORDER PAGE
   ============================================================ */
function viewOrder() {
  if (cart.length === 0) {
    return `
    <section class="section">
      <div class="container">
        <p class="eyebrow">Order</p>
        <h1>Your order</h1>
        <div class="empty-state">
          <h3>Your cart is empty</h3>
          <p>Explore our menu and add something sweet to your order!</p>
          <a class="btn btn-primary" href="#/menu">Browse the menu</a>
        </div>
      </div>
    </section>`;
  }

  return `
  <section class="section">
    <div class="container">
      <p class="eyebrow">Order Summary</p>
      <h1>Review your cart</h1>
      <p class="lede">Review your selected desserts, then proceed to pickup or delivery options.</p>

      <div class="checkout-layout mt-3">
        <div class="summary-card">
          <h2 style="font-size:22px">Selected Items</h2>
          <div id="order-items">
            ${cart.map(i => `
              <div class="summary-line">
                <span>${esc(i.name)} <span style="color:var(--muted)">· ${esc(i.size)}</span> × ${i.qty}</span>
                <span class="nowrap">${money(i.price * i.qty)}</span>
              </div>`).join("")}
          </div>
          <div class="summary-line total" style="margin-top:var(--s2)">
            <span>Subtotal</span>
            <span class="amt" id="order-total">${money(cartTotal())}</span>
          </div>
        </div>
        <div class="summary-card">
          <h2 style="font-size:22px">Checkout</h2>
          <p style="color:var(--muted);font-size:15px">Choose pickup branch or delivery on the next page.</p>
          <a class="btn btn-primary btn-block" href="#/checkout" style="margin-top:var(--s2)">Proceed to checkout</a>
          <a class="btn btn-secondary btn-block" href="#/menu" style="margin-top:var(--s1)">Add more items</a>
        </div>
      </div>
    </div>
  </section>`;
}

/* ============================================================
   VIEWS — BRANCHES & MAP
   ============================================================ */
let branchState = {q:"", dist:2, expanded:new Set()};

function viewBranches() {
  const regions = ["North","East","South","West"];
  return `
  <section class="section">
    <div class="container">
      <p class="eyebrow">Branches</p>
      <h1>Find a branch near you</h1>

      <div class="filters">
        <div class="field" style="margin:0">
          <label for="branch-search">Search by area or mall name</label>
          <input id="branch-search" type="search" placeholder="Search by area or mall name..." value="${esc(branchState.q)}" autocomplete="off">
        </div>
        <div class="field" style="margin:0">
          <label for="distance">Radius</label>
          <select id="distance">
            <option value="1">Within 1 km</option>
            <option value="2" selected>Within 2 km</option>
            <option value="5">Within 5 km</option>
            <option value="10">Within 10 km</option>
            <option value="999">Show All</option>
          </select>
        </div>
        <button class="btn btn-secondary" id="reset-branches">Reset Filters</button>
      </div>

      <div class="row-between" style="margin-bottom:var(--s3)">
        <button class="btn btn-secondary btn-sm" id="use-location">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false">
            <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>
            <circle cx="12" cy="10" r="2.5" stroke="currentColor" stroke-width="2"/>
          </svg>
          Use my current location
        </button>
        <a href="#/contact" class="caption" style="font-weight:600">Branch inquiries</a>
      </div>

      <p class="result-count" id="branch-count" aria-live="polite"></p>

      <div class="branch-layout">
        <div class="branch-map-col">
          <div class="map" role="group" aria-label="Interactive map showing branch locations">
            ${BRANCHES.map(b => `
              <button class="map-pin" data-branch="${esc(b.id)}" style="left:${b.x}%;top:${b.y}%"
                aria-label="${esc(b.name)} — View details">
                <svg viewBox="0 0 32 40" aria-hidden="true" focusable="false">
                  <path d="M16 1C8.3 1 2 7.1 2 14.7 2 24.4 16 39 16 39s14-14.6 14-24.3C30 7.1 23.7 1 16 1Z" fill="#B83256" stroke="#FFF9F0" stroke-width="2"/>
                  <circle cx="16" cy="14.5" r="5" fill="#FFF9F0"/>
                </svg>
              </button>`).join("")}
            <p class="map-legend">Select a pin to view branch opening hours and details.</p>
          </div>
        </div>

        <div>
          <div id="branch-list"></div>

          <h2 style="font-size:22px;margin-top:var(--s4)">Browse by region</h2>
          ${regions.map(r => {
            const items = BRANCHES.filter(b => b.region === r);
            const open = branchState.expanded.has(r);
            return `
            <div class="region">
              <button class="region-btn" aria-expanded="${open}" aria-controls="region-${r}" data-region="${r}">
                ${r} Bangkok
                <span class="count">${items.length} branch${items.length === 1 ? "" : "es"}</span>
                <svg class="chev" width="14" height="14" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
                  <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </button>
              <div class="region-panel" id="region-${r}" ${open ? "" : "hidden"}>
                <ul>
                  ${items.map(b => `<li><button data-branch="${esc(b.id)}">${esc(b.name)}</button></li>`).join("")}
                </ul>
              </div>
            </div>`;
          }).join("")}
        </div>
      </div>
    </div>
  </section>`;
}

function filteredBranches() {
  const q = branchState.q.trim().toLowerCase();
  return BRANCHES
    .filter(b => b.dist <= branchState.dist)
    .filter(b => !q || b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q) || b.region.toLowerCase().includes(q))
    .sort((a, b) => a.dist - b.dist);
}

function refreshBranchList() {
  const list = filteredBranches();
  const wrap = $("#branch-list");
  const count = $("#branch-count");
  if (!wrap) return;

  count.textContent = list.length === 1 ? "1 branch available" : `${list.length} branches available`;

  if (list.length === 0) {
    wrap.innerHTML = `
      <div class="empty-state" style="padding:var(--s4) var(--s2)">
        <h3>No branches match these filters</h3>
        <p>Try widening the distance filter or clearing your search term.</p>
        <button class="btn btn-secondary" id="reset-branches-2">Reset filters</button>
      </div>`;
    const btn = $("#reset-branches-2");
    if (btn) btn.addEventListener("click", resetBranches);
  } else {
    wrap.innerHTML = list.map(b => `
      <div class="branch-card">
        <div class="info">
          <h3>${esc(b.name)}</h3>
          <p class="dist">${b.dist.toFixed(1)} km away · ${esc(b.region)}</p>
        </div>
        <button class="btn btn-secondary btn-sm" data-branch="${esc(b.id)}">View details</button>
      </div>`).join("");
  }

  const visible = new Set(list.map(b => b.id));
  $$(".map-pin").forEach(pin => {
    pin.classList.toggle("dim", !visible.has(pin.dataset.branch));
  });
}

function resetBranches() {
  branchState = {q:"", dist:2, expanded:new Set()};
  const s = $("#branch-search"); if (s) s.value = "";
  const d = $("#distance"); if (d) d.value = "2";
  $$(".region-btn").forEach(btn => {
    btn.setAttribute("aria-expanded", "false");
    const panel = $("#region-" + btn.dataset.region);
    if (panel) panel.hidden = true;
  });
  refreshBranchList();
}

/* ============================================================
   VIEWS — FAQ
   ============================================================ */
function viewFaq() {
  const sideCatering = `
    <div class="side-panel">
      <h2>Catering & Events</h2>
      <ul>
        <li><a href="#/contact">Wedding Reception Catering</a></li>
        <li><a href="#/contact">Custom Dessert Snack Box</a></li>
        <li><a href="#/contact">Corporate Events & Parties</a></li>
      </ul>
      <a class="side-link" href="#/contact">Member Benefits</a>
    </div>`;

  const sideIr = `
    <div class="side-panel">
      <h2>Investor Relations</h2>
      <ul>
        ${["IR Home","Factsheet","Financial Information","IR Calendar","Stock Information","Dividend Policy","Corporate Governance"]
          .map(t => `<li><a href="#">${esc(t)}</a></li>`).join("")}
      </ul>
    </div>
    <a class="side-link" href="#">Franchise Opportunities</a>`;

  return `
  <section class="section">
    <div class="container">
      <p class="eyebrow">Help & Support</p>
      <h1>Frequently Asked Questions</h1>
      <p class="lede">Have questions about online ordering, points, or location details? Find quick answers below.</p>

      <div class="faq-layout mt-3">
        <div>
          <div class="faq-group">
            <h2>General Questions</h2>
            ${FAQ_GENERAL.map((f, i) => faqItem("gen", i, f.q, f.a, f.q === "How can I order online?" ? orderingAnswer() : null)).join("")}
          </div>

          <div class="faq-group">
            <h2>Investor Relations</h2>
            ${FAQ_INVESTOR.map((f, i) => faqItem("inv", i, f.q, f.a)).join("")}
          </div>
        </div>

        <aside aria-label="Related links">
          ${sideCatering}
          <div style="margin-top:var(--s2)"></div>
          ${sideIr}
        </aside>
      </div>
    </div>
  </section>`;
}

function orderingAnswer() {
  return `
    <p>Ordering online is simple and fast:</p>
    <ol style="padding-left:20px;margin:0 0 var(--s2)">
      <li>Go to the <a href="#/menu">Menu</a> and select your favorite desserts.</li>
      <li>Choose options or size and select <strong>Add to cart</strong>.</li>
      <li>Open your cart panel and choose <strong>Pickup</strong> or <strong>Delivery</strong>.</li>
      <li>Proceed to <strong>Checkout</strong>, complete your payment, and track your order confirmation.</li>
    </ol>
    <p><a href="#/order" style="font-weight:600">View current cart &rarr;</a></p>`;
}

function faqItem(group, i, q, a, custom) {
  const id = `faq-${group}-${i}`;
  return `
  <div class="disclosure">
    <button class="disclosure-btn" aria-expanded="false" aria-controls="${id}">
      <span>${esc(q)}</span>
      <svg class="chev" width="14" height="14" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
        <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <div class="disclosure-panel" id="${id}" hidden>
      ${custom || `<p>${esc(a)}</p>`}
    </div>
  </div>`;
}

/* ============================================================
   VIEWS — CONTACT
   ============================================================ */
function viewContact() {
  return `
  <section class="section">
    <div class="container">
      <p class="eyebrow">Get in touch</p>
      <h1>Contact Us</h1>
      <p class="lede">Have questions about an order, franchise opportunities, or catering services? Contact our headquarters team directly.</p>

      <div class="mt-3" style="display:grid;gap:var(--s2)">
        <div class="contact-block">
          <p class="label-sm">Head Office Address</p>
          <p>${esc(CONTACT.headOffice.address)}</p>
          <p>Phone: <a href="tel:${esc(CONTACT.headOffice.phone.replace(/\s/g,""))}" class="strong">${esc(CONTACT.headOffice.phone)}</a></p>
          <p>Fax: <span class="strong">${esc(CONTACT.headOffice.fax)}</span></p>
          <p>Email: <a href="mailto:${esc(CONTACT.headOffice.email)}" class="strong">${esc(CONTACT.headOffice.email)}</a></p>
        </div>

        ${CONTACT.departments.map(d => `
          <div class="contact-block">
            <h3>${esc(d.name)}</h3>
            ${d.phone ? `<p>Phone: <a href="tel:${esc(d.phone.replace(/\s/g,""))}" class="strong">${esc(d.phone)}</a></p>` : ""}
            ${d.email ? `<p>Email: <a href="mailto:${esc(d.email)}" class="strong">${esc(d.email)}</a></p>` : ""}
            ${d.line ? `<p>LINE: <span class="strong">${esc(d.line)}</span></p>` : ""}
          </div>`).join("")}

        <p class="caption">Looking for a specific café location? <a href="#/branches" style="font-weight:600">See all branch locations &rarr;</a></p>
      </div>
    </div>
  </section>`;
}

/* ============================================================
   VIEWS — CHECKOUT
   ============================================================ */
let checkoutState = {method:"card", simulateFail:false, processing:false, error:false};

function viewCheckout() {
  if (cart.length === 0 && !checkoutState.processing) {
    return `
    <section class="section"><div class="container">
      <h1>Checkout</h1>
      <div class="empty-state">
        <h3>Nothing to check out</h3>
        <p>Your cart is empty.</p>
        <a class="btn btn-primary" href="#/menu">Browse the menu</a>
      </div>
    </div></section>`;
  }

  const total = cartTotal();
  const deliveryFee = fulfilment.mode === "delivery" ? 40 : 0;
  const grand = total + deliveryFee;

  return `
  <section class="section">
    <div class="container">
      <p class="eyebrow">Checkout</p>
      <h1>Complete your order</h1>

      <div class="checkout-layout mt-3">
        <div>
          ${checkoutState.error ? `
            <div class="alert" role="alert">
              <div>
                <strong>Payment failed</strong>
                <p>We couldn't process your order payment. Your card has not been charged.</p>
                <button class="btn btn-primary btn-sm" id="try-again">Try payment again</button>
              </div>
            </div>` : ""}

          <div class="summary-card" style="margin-bottom:var(--s2)">
            <h2 style="font-size:20px">Fulfilment Method</h2>
            <div class="segmented" role="group" aria-label="Fulfilment method">
              <button data-mode="pickup" aria-pressed="${fulfilment.mode === "pickup"}">Pickup</button>
              <button data-mode="delivery" aria-pressed="${fulfilment.mode === "delivery"}">Delivery</button>
            </div>

            <div id="fulfil-fields">
              ${fulfilment.mode === "pickup" ? `
                <div class="field">
                  <label for="co-branch">Select Pickup Branch</label>
                  <select id="co-branch">
                    ${BRANCHES.slice().sort((a,b)=>a.dist-b.dist).map(b =>
                      `<option value="${esc(b.id)}" ${fulfilment.branch === b.id ? "selected" : ""}>${esc(b.name)} — ${b.dist.toFixed(1)} km</option>`
                    ).join("")}
                  </select>
                </div>
                <div class="field">
                  <label for="co-time">Pickup Time</label>
                  <select id="co-time">
                    ${["ASAP (15–20 min)","30 minutes","1 hour","2 hours"].map(t =>
                      `<option ${fulfilment.time === t ? "selected" : ""}>${esc(t)}</option>`
                    ).join("")}
                  </select>
                </div>
              ` : `
                <div class="field">
                  <label for="co-address">Delivery Address</label>
                  <input id="co-address" type="text" value="${esc(fulfilment.address)}" placeholder="Street, building, district, postcode..." autocomplete="street-address">
                  <p class="hint">Delivery available within branch service radius. Standard delivery fee is ฿40.</p>
                </div>
              `}
            </div>
          </div>

          <div class="summary-card">
            <h2 style="font-size:20px">Payment Options</h2>
            <label class="radio-row">
              <input type="radio" name="pay" value="card" ${checkoutState.method === "card" ? "checked" : ""}>
              <span><span class="rt">Credit / Debit Card</span><span class="rs">Visa, Mastercard, JCB</span></span>
            </label>
            <label class="radio-row">
              <input type="radio" name="pay" value="promptpay" ${checkoutState.method === "promptpay" ? "checked" : ""}>
              <span><span class="rt">PromptPay QR Code</span><span class="rs">Scan using mobile banking app</span></span>
            </label>
            <label class="radio-row">
              <input type="radio" name="pay" value="cod" ${checkoutState.method === "cod" ? "checked" : ""}>
              <span><span class="rt">Cash on Delivery / Pickup</span><span class="rs">Pay in cash when order arrives</span></span>
            </label>

            <label class="radio-row" style="background:rgba(245,236,227,0.5);border-style:dashed;margin-top:var(--s2)">
              <input type="checkbox" id="sim-fail" ${checkoutState.simulateFail ? "checked" : ""}>
              <span><span class="rt">Simulate failed payment</span><span class="rs">For prototype payment state testing</span></span>
            </label>
          </div>
        </div>

        <div class="summary-card">
          <h2 style="font-size:20px">Order Summary</h2>
          <div id="co-items">
            ${cart.map(i => `
              <div class="summary-line">
                <span>${esc(i.name)} <span style="color:var(--muted)">· ${esc(i.size)}</span> × ${i.qty}</span>
                <span class="nowrap">${money(i.price * i.qty)}</span>
              </div>`).join("")}
          </div>
          <div class="summary-line">
            <span>Subtotal</span><span>${money(total)}</span>
          </div>
          ${deliveryFee ? `<div class="summary-line"><span>Delivery Fee</span><span>${money(deliveryFee)}</span></div>` : ""}
          <div class="summary-line total">
            <span>Grand Total</span><span class="amt">${money(grand)}</span>
          </div>

          <button class="btn btn-primary btn-block" id="pay-btn" style="margin-top:var(--s2)" ${checkoutState.processing ? "disabled" : ""}>
            ${checkoutState.processing ? "Processing Order..." : `Pay ${money(grand)}`}
          </button>
          <a class="btn btn-secondary btn-block" href="#/order" style="margin-top:var(--s1)">Back to cart</a>
        </div>
      </div>
    </div>
  </section>`;
}

/* ============================================================
   VIEWS — CONFIRMATION
   ============================================================ */
function viewConfirmation() {
  let order = null;
  try { order = JSON.parse(sessionStorage.getItem(ORDER_KEY)); } catch {}
  if (!order) {
    return `
    <section class="section"><div class="container">
      <h1>Order Confirmation</h1>
      <div class="empty-state">
        <h3>No recent order found</h3>
        <p>Place an order from our menu to view confirmation details here.</p>
        <a class="btn btn-primary" href="#/menu">Browse the menu</a>
      </div>
    </div></section>`;
  }

  return `
  <section class="section">
    <div class="container">
      <div class="confirm-hero">
        <div class="tick" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" focusable="false">
            <path d="M4 12.5l5.2 5.2L20 7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </div>
        <h1>Order Confirmed!</h1>
        <p class="lede" style="margin-inline:auto">Thank you for ordering with After You. Your order code is:</p>
        <p class="order-ref" style="margin-top:var(--s2)">${esc(order.ref)}</p>

        <div class="summary-card" style="text-align:left;margin-top:var(--s3)">
          <h2 style="font-size:20px">Order Details</h2>
          ${order.items.map(i => `
            <div class="summary-line">
              <span>${esc(i.name)} <span style="color:var(--muted)">· ${esc(i.size)}</span> × ${i.qty}</span>
              <span class="nowrap">${money(i.price * i.qty)}</span>
            </div>`).join("")}
          <div class="summary-line">
            <span>${order.mode === "pickup" ? "Pickup Branch:" : "Delivery Address:"}</span>
            <span style="text-align:right;font-weight:600">${esc(order.where)}</span>
          </div>
          ${order.mode === "pickup" ? `<div class="summary-line"><span>Estimated Time:</span><span>${esc(order.time)}</span></div>` : ""}
          <div class="summary-line total">
            <span>Total Paid</span><span class="amt">${money(order.total)}</span>
          </div>
        </div>

        <div class="row-between" style="justify-content:center;margin-top:var(--s3)">
          <a class="btn btn-primary" href="#/menu">Order again</a>
          <a class="btn btn-secondary" href="#/">Back to home</a>
        </div>
      </div>
    </div>
  </section>`;
}

function viewNotFound() {
  return `
  <section class="section"><div class="container">
    <h1>Page not found</h1>
    <p class="lede">The page or dessert you are looking for could not be found.</p>
    <div class="row-between" style="justify-content:flex-start;margin-top:var(--s3)">
      <a class="btn btn-primary" href="#/menu">Back to menu</a>
      <a class="btn btn-secondary" href="#/">Home</a>
    </div>
  </div></section>`;
}

/* ============================================================
   CART PANEL RENDER
   ============================================================ */
function renderCartPanel() {
  const body = $("#cart-body");
  const foot = $("#cart-foot");
  if (!body || !foot) return;

  const active = document.activeElement;
  const aKey = active && active.dataset ? active.dataset.ck : null;
  const aAct = active && active.dataset ? active.dataset.ca : null;

  if (cart.length === 0) {
    body.innerHTML = `
      <div class="empty-state">
        <h3>Your cart is empty</h3>
        <p>Explore our menu and add something delicious!</p>
        <a class="btn btn-primary" href="#/menu" data-close-cart>Browse the menu</a>
      </div>`;
    foot.innerHTML = "";
    return;
  }

  body.innerHTML = cart.map(i => {
    const prod = productById(i.id);
    return `
    <div class="cart-item">
      ${prod ? productImg(prod, true) : placeholder("Image of " + i.name, true)}
      <div>
        <p class="ci-name">${esc(i.name)}</p>
        <p class="ci-meta">${esc(i.size)} · ${money(i.price)}</p>
        <div class="ci-bottom">
          <div class="qty">
            <button data-ck="${esc(i.key)}" data-ca="dec" aria-label="Decrease quantity of ${esc(i.name)}">−</button>
            <output aria-label="Quantity">${i.qty}</output>
            <button data-ck="${esc(i.key)}" data-ca="inc" aria-label="Increase quantity of ${esc(i.name)}">+</button>
          </div>
          <span class="ci-price">${money(i.price * i.qty)}</span>
        </div>
        <button class="ci-remove" data-ck="${esc(i.key)}" data-ca="rm" aria-label="Remove ${esc(i.name)} from cart">Remove</button>
      </div>
    </div>`;
  }).join("");

  foot.innerHTML = `
    <div class="cart-total">
      <span>Total</span>
      <span class="amt">${money(cartTotal())}</span>
    </div>

    <div class="segmented" role="group" aria-label="Fulfilment method">
      <button data-mode="pickup" aria-pressed="${fulfilment.mode === "pickup"}">Pickup</button>
      <button data-mode="delivery" aria-pressed="${fulfilment.mode === "delivery"}">Delivery</button>
    </div>

    ${fulfilment.mode === "pickup" ? `
      <div class="field">
        <label for="cart-branch">Pickup Branch</label>
        <select id="cart-branch">
          ${BRANCHES.slice().sort((a,b)=>a.dist-b.dist).map(b =>
            `<option value="${esc(b.id)}" ${fulfilment.branch === b.id ? "selected" : ""}>${esc(b.name)} — ${b.dist.toFixed(1)} km</option>`
          ).join("")}
        </select>
      </div>
      <div class="field">
        <label for="cart-time">Pickup Time</label>
        <select id="cart-time">
          ${["ASAP (15–20 min)","30 minutes","1 hour","2 hours"].map(t =>
            `<option ${fulfilment.time === t ? "selected" : ""}>${esc(t)}</option>`
          ).join("")}
        </select>
      </div>
    ` : `
      <div class="field">
        <label for="cart-address">Delivery Address</label>
        <input id="cart-address" type="text" value="${esc(fulfilment.address)}" placeholder="Street, building, district..." autocomplete="street-address">
      </div>
    `}

    <a class="btn btn-primary btn-block" href="#/checkout" data-close-cart>Checkout · ${money(cartTotal())}</a>`;

  if (aKey) {
    const el = body.querySelector(`[data-ck="${CSS.escape(aKey)}"][data-ca="${aAct}"]`);
    if (el) el.focus();
  }
}

/* ============================================================
   OVERLAY CONTROLLERS & ACCESSIBILITY
   ============================================================ */
let lastFocused = null;

function trapFocus(container) {
  container.addEventListener("keydown", e => {
    if (e.key !== "Tab") return;
    const sel = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea,[tabindex]:not([tabindex="-1"])';
    const items = Array.from(container.querySelectorAll(sel)).filter(el => el.offsetParent !== null);
    if (!items.length) return;
    const first = items[0], last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  });
}

function openOverlay(el, trigger) {
  lastFocused = trigger || document.activeElement;
  el.hidden = false;
  requestAnimationFrame(() => el.classList.add("is-open"));
  $("#scrim").classList.add("is-open");
  document.body.classList.add("no-scroll");
  const focusable = el.querySelector('button, a[href], input, select, textarea');
  if (focusable) setTimeout(() => focusable.focus(), 60);
  if (trigger) trigger.setAttribute("aria-expanded", "true");
}

function closeOverlay(el, trigger) {
  el.classList.remove("is-open");
  $("#scrim").classList.remove("is-open");
  document.body.classList.remove("no-scroll");
  setTimeout(() => { el.hidden = true; }, 240);
  if (trigger) trigger.setAttribute("aria-expanded", "false");
  if (lastFocused && typeof lastFocused.focus === "function") lastFocused.focus();
}

function openCart() {
  renderCartPanel();
  openOverlay($("#cart-panel"), document.activeElement);
}
function closeCart() {
  closeOverlay($("#cart-panel"), null);
  $$("#cart-open, #cart-open-m").forEach(b => b.setAttribute("aria-expanded", "false"));
}

/* Search overlay */
let searchTrigger = null;
function placeSearch() {
  const panel = $("#search-panel");
  if (!panel || panel.hidden) return;
  const bottom = Math.max(8, $(".site-header").getBoundingClientRect().bottom + 8);
  panel.style.top = bottom + "px";
  panel.style.maxHeight = Math.max(100, (window.visualViewport?.height || innerHeight) - bottom - 16) + "px";
}
function openSearch(trigger) {
  closeOtherDropdown();
  searchTrigger = trigger instanceof HTMLElement ? trigger : document.activeElement;
  const panel = $("#search-panel");
  panel.hidden = false;
  $$("#search-open, #search-open-m").forEach(b => b.setAttribute("aria-expanded", "true"));
  placeSearch();
  renderGlobalResults($("#global-search").value);
  $("#global-search").focus({preventScroll:true});
}
function closeSearch(restoreFocus = false) {
  const panel = $("#search-panel");
  if (panel) panel.hidden = true;
  $$("#search-open, #search-open-m").forEach(b => b.setAttribute("aria-expanded", "false"));
  if (restoreFocus && searchTrigger?.isConnected) searchTrigger.focus({preventScroll:true});
}
function buildSiteSearchIndex() {
  const entries = [
    {
      title: "Home",
      type: "Page",
      text: "After You dessert cafe homepage",
      href: "#/"
    },
    {
      title: "Menu",
      type: "Page",
      text: "Browse desserts drinks coffee toast kakigori croffle",
      href: "#/menu"
    },
    {
      title: "Frequently Asked Questions",
      type: "Page",
      text: "FAQ help support questions answers membership points",
      href: "#/faq"
    },
    {
      title: "Contact Us",
      type: "Page",
      text: "Contact phone email head office catering franchise careers",
      href: "#/contact"
    },
    {
      title: "Branches",
      type: "Page",
      text: "Find stores locations opening hours addresses",
      href: "#/branches"
    },
    {
      title: "Your Order",
      type: "Page",
      text: "Review shopping cart order checkout pickup delivery",
      href: "#/order"
    }
  ];

  if (typeof PRODUCTS !== "undefined") {
    PRODUCTS.forEach(product => {
      entries.push({
        title: product.name,
        type: "Menu",
        text: [
          product.name,
          product.cat,
          product.sub,
          product.desc
        ].filter(Boolean).join(" "),
        href: "#/order/" + encodeURIComponent(product.id)
      });
    });
  }

  const faqGroups = [
    {
      prefix: "gen",
      items:
        typeof FAQ_GENERAL !== "undefined"
          ? FAQ_GENERAL
          : []
    },
    {
      prefix: "inv",
      items:
        typeof FAQ_INVESTOR !== "undefined"
          ? FAQ_INVESTOR
          : []
    }
  ];

  faqGroups.forEach(group => {
    group.items.forEach((faq, index) => {
      entries.push({
        title: faq.q,
        type: "FAQ",
        text: [
          faq.q,
          faq.a,
          faq.q === "How can I order online?"
            ? "Choose a dessert select options add to cart pickup delivery checkout payment"
            : ""
        ].filter(Boolean).join(" "),
        href:
          "#/faq?faq=" +
          encodeURIComponent("faq-" + group.prefix + "-" + index)
      });
    });
  });

  if (typeof BRANCHES !== "undefined") {
    BRANCHES.forEach(branch => {
      entries.push({
        title: branch.name,
        type: "Branch",
        text: [
          branch.name,
          branch.region,
          branch.address,
          branch.hours
        ].filter(Boolean).join(" "),
        href: "#/branches"
      });
    });
  }

  if (typeof CONTACT !== "undefined") {
    const office = CONTACT.headOffice || {};

    entries.push({
      title: "Head Office",
      type: "Contact",
      text: [
        "head office contact",
        office.address,
        office.phone,
        office.email
      ].filter(Boolean).join(" "),
      href: "#/contact"
    });

    (CONTACT.departments || []).forEach(department => {
      entries.push({
        title: department.name,
        type: "Contact",
        text: [
          department.name,
          department.phone,
          department.email,
          department.line
        ].filter(Boolean).join(" "),
        href: "#/contact"
      });
    });
  }

  return entries;
}

function renderGlobalResults(q = "") {
  const list = document.getElementById("global-results");
  const input = document.getElementById("global-search");
  const status = document.getElementById("search-status");

  if (!list || !input) return;

  const normalize = value =>
    String(value || "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const query = normalize(q);

  // Do not show products, FAQs, or suggestions before typing.
  list.innerHTML = "";
  list.hidden = true;
  input.setAttribute("aria-expanded", "false");

  if (status) status.textContent = "";

  if (!query) return;

  const words = query.split(" ");

  const matches = buildSiteSearchIndex()
    .map(entry => {
      const title = normalize(entry.title);
      const searchable = normalize(
        entry.title + " " + entry.type + " " + entry.text
      );

      if (!words.every(word => searchable.includes(word))) {
        return null;
      }

      const score =
        title === query ? 3 :
        title.startsWith(query) ? 2 :
        title.includes(query) ? 1 :
        0;

      return { ...entry, score };
    })
    .filter(Boolean)
    .sort((a, b) =>
      b.score - a.score || a.title.localeCompare(b.title)
    );

  list.hidden = false;

  if (!matches.length) {
    list.innerHTML = `
      <li class="search-empty">
        No results found. Try another word.
      </li>
    `;

    if (status) status.textContent = "No results found.";
    return;
  }

  // Keep the panel manageable.
  const visible = matches.slice(0, 12);

  list.innerHTML = visible.map(entry => `
    <li>
      <a href="${esc(entry.href)}" data-close-search>
        <span class="site-search-copy">
          <span class="site-search-title">
            ${esc(entry.title)}
          </span>
          <span class="site-search-type">
            ${esc(entry.type)}
          </span>
        </span>
      </a>
    </li>
  `).join("");

  input.setAttribute("aria-expanded", "true");

  if (status) {
    status.textContent =
      matches.length > visible.length
        ? `Showing ${visible.length} of ${matches.length} results. Refine your search for more specific results.`
        : `${matches.length} result${matches.length === 1 ? "" : "s"} found.`;
  }
}

/* Branch Modal */
function openBranchModal(id) {
  const b = branchById(id);
  if (!b) return;
  const card = $("#branch-modal-card");
  card.innerHTML = `
    <div class="modal-head">
      <h2 id="branch-modal-title">${esc(b.name)}</h2>
      <button class="icon-btn" id="branch-modal-close" aria-label="Close branch details">
        <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" focusable="false"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
      </button>
    </div>
    <ul class="detail-list">
      <li><span class="k">Address</span><span>${esc(b.address)}</span></li>
      <li><span class="k">Opening Hours</span><span>${esc(b.hours)}</span></li>
      <li><span class="k">Phone</span><span><a href="tel:${esc(b.phone.replace(/\s/g,""))}">${esc(b.phone)}</a></span></li>
      <li><span class="k">Distance</span><span>${b.dist.toFixed(1)} km away</span></li>
    </ul>
    <a class="btn btn-primary btn-block" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.name + " " + b.address)}" target="_blank" rel="noopener">Get Directions in Google Maps</a>
    <button class="btn btn-secondary btn-block" id="branch-order-here" style="margin-top:var(--s1)">Order for pickup here</button>`;

  openOverlay($("#branch-modal"), document.activeElement);
  $("#branch-modal-close").addEventListener("click", () => closeOverlay($("#branch-modal"), null));
  $("#branch-order-here").addEventListener("click", () => {
    fulfilment.branch = b.id;
    fulfilment.mode = "pickup";
    saveFulfilment();
    closeOverlay($("#branch-modal"), null);
    navigate("/menu");
    toast("Pickup branch set to " + b.name);
  });
}

/* ============================================================
   EVENT BINDINGS FOR VIEWS
   ============================================================ */
function bindViewEvents(parts) {
  const page = parts[0] || "";
  if (page === "menu") {
    refreshMenuGrid();
    setupMenuDropdown();
    $$("#cat-row [data-cat]").forEach(btn => btn.addEventListener("click", () => {
      closeOtherDropdown();
      menuState.cat = btn.dataset.cat;
      menuState.sub = null;
      refreshMenuGrid();
      applyLanguage();
    }));
    $("#clear-menu")?.addEventListener("click", () => {
      menuState = {cat:"All", sub:null, q:""};
      refreshMenuGrid(); applyLanguage();
    });
  }
  if (page === "order" && parts[1]) {
    const p = productById(decodeURIComponent(parts[1]));
    if (!p) return;
    const options = $$("#size-grid .size-opt");
    let selected = 0;
    const select = i => {
      selected = i;
      options.forEach((b,j) => { b.setAttribute("aria-checked", String(i === j)); b.tabIndex = i === j ? 0 : -1; });
      $("#sel-label").textContent = p.sizes[i][0] + " — " + money(p.sizes[i][1]);
    };
    options.forEach((b,i) => {
      b.addEventListener("click", () => select(i));
      b.addEventListener("keydown", e => {
        if (!["ArrowLeft","ArrowRight","ArrowUp","ArrowDown","Home","End"].includes(e.key)) return;
        e.preventDefault();
        const n = e.key === "Home" ? 0 : e.key === "End" ? options.length - 1 : (selected + (["ArrowLeft","ArrowUp"].includes(e.key) ? -1 : 1) + options.length) % options.length;
        select(n); options[n].focus();
      });
    });
    $("#add-to-cart")?.addEventListener("click", () => addToCart(p.id, p.sizes[selected][0], p.sizes[selected][1]));
  }
  if (page === "branches") {
    refreshBranchList();
    $("#branch-search")?.addEventListener("input", e => {branchState.q = e.target.value; refreshBranchList();});
    $("#distance").value = String(branchState.dist);
    $("#distance")?.addEventListener("change", e => {branchState.dist = Number(e.target.value); refreshBranchList();});
    $("#reset-branches")?.addEventListener("click", resetBranches);
    $("#use-location")?.addEventListener("click", () => toast("Live distance calculation is not connected in this prototype."));
  }
  if (page === "checkout") {
    $("#co-branch")?.addEventListener("change", e => {fulfilment.branch=e.target.value; saveFulfilment();});
    $("#co-time")?.addEventListener("change", e => {fulfilment.time=e.target.value; saveFulfilment();});
    $("#co-address")?.addEventListener("input", e => {fulfilment.address=e.target.value; saveFulfilment();});
    $$("input[name='pay']").forEach(b => b.addEventListener("change", () => {checkoutState.method=b.value;}));
    $("#sim-fail")?.addEventListener("change", e => {checkoutState.simulateFail=e.target.checked;});
    $("#pay-btn")?.addEventListener("click", submitPrototypeOrder);
    $("#try-again")?.addEventListener("click", () => {checkoutState.error=false; render();});
  }
}

let menuAbort = null;
let floatingOther = null;
function closeOtherDropdown(restore = false) {
  if (floatingOther) floatingOther.hidden = true;
  const trigger = $("#other-chip");
  const wasOpen = trigger?.getAttribute("aria-expanded") === "true";
  trigger?.setAttribute("aria-expanded", "false");
  if (restore && wasOpen) trigger.focus({preventScroll:true});
}
function disposeMenuDropdown() {
  menuAbort?.abort(); menuAbort = null;
  floatingOther?.remove(); floatingOther = null;
}
function setupMenuDropdown() {
  const trigger = $("#other-chip"), menu = $("#other-menu"), row = $("#cat-row");
  if (!trigger || !menu) return;
  menuAbort = new AbortController();
  const opts = {signal:menuAbort.signal};
  document.body.append(menu);
  floatingOther = menu;
  trigger.setAttribute("aria-haspopup", "menu");
  menu.querySelectorAll("button").forEach(b => b.tabIndex = -1);
  function position() {
    if (menu.hidden) return;
    const r = trigger.getBoundingClientRect(), rr = row.getBoundingClientRect();
    if (r.right <= rr.left || r.left >= rr.right || r.bottom <= 0 || r.top >= innerHeight) {closeOtherDropdown(); return;}
    const gap=8, pad=12, height=window.visualViewport?.height || innerHeight;
    const below=height-r.bottom-gap-pad, above=r.top-gap-pad;
    const up=below<180 && above>below;
    menu.style.maxHeight = Math.max(44, Math.min(360, up ? above : below)) + "px";
    menu.style.left = Math.max(pad, Math.min(r.right-menu.offsetWidth, innerWidth-menu.offsetWidth-pad)) + "px";
    menu.style.top = Math.max(pad, up ? r.top-menu.offsetHeight-gap : r.bottom+gap) + "px";
  }
  function open(focus = false, last = false) {
    closeSearch();
    menu.hidden=false;
    trigger.setAttribute("aria-expanded","true");
    $$("button[data-sub]",menu).forEach(b => b.setAttribute("aria-checked", String(menuState.cat === "Other" && (b.dataset.sub || null) === menuState.sub)));
    position();
    if (focus) {const items=$$("button",menu); (last ? items.at(-1) : items[0])?.focus();}
  }
  trigger.addEventListener("click", () => menu.hidden ? open() : closeOtherDropdown(), opts);
  trigger.addEventListener("keydown", e => {
    if (["ArrowDown","ArrowUp"].includes(e.key)) {e.preventDefault(); open(true,e.key === "ArrowUp");}
  },opts);
  menu.addEventListener("click", e => {
    const b=e.target.closest("button[data-sub]"); if (!b) return;
    menuState.cat="Other"; menuState.sub=b.dataset.sub || null;
    closeOtherDropdown(true); refreshMenuGrid(); applyLanguage();
  },opts);
  menu.addEventListener("keydown", e => {
    const items=$$("button",menu), i=items.indexOf(document.activeElement);
    if (e.key === "Escape") {e.preventDefault(); closeOtherDropdown(true);}
    else if (e.key === "Tab") {e.preventDefault(); closeOtherDropdown(true);}
    else if (["ArrowDown","ArrowUp","Home","End"].includes(e.key)) {
      e.preventDefault();
      items[e.key === "Home" ? 0 : e.key === "End" ? items.length-1 : (i+(e.key === "ArrowUp" ? -1 : 1)+items.length)%items.length]?.focus();
    }
  },opts);
  document.addEventListener("pointerdown", e => {if (!menu.contains(e.target) && !trigger.contains(e.target)) closeOtherDropdown();},opts);
  document.addEventListener("focusin",e=>{if(!menu.contains(e.target)&&!trigger.contains(e.target)) closeOtherDropdown();},opts);
  window.addEventListener("resize",position,opts);
  document.addEventListener("scroll",position,{...opts,capture:true,passive:true});
}

let language = (() => {try {return localStorage.getItem("ay_language") === "th" ? "th" : "en";} catch {return "en";}})();
const uiThai = {"Home":"หน้าแรก","Menu":"เมนู","Branches":"สาขา","Order":"สั่งซื้อ","More":"เพิ่มเติม","Contact Us":"ติดต่อเรา","FAQ":"คำถามที่พบบ่อย","All":"ทั้งหมด","Other":"อื่น ๆ","All Other":"อื่น ๆ ทั้งหมด","What would you like?":"วันนี้รับอะไรดี?","Kakigōri":"คากิโกริ","Toast":"โทสต์","Signature Dessert":"ขนมหวานซิกเนเจอร์","Croffle":"ครอฟเฟิล","Special Coffee":"กาแฟพิเศษ","Hot Drinks":"เครื่องดื่มร้อน","Hot Tea":"ชาร้อน","Cold Drink":"เครื่องดื่มเย็น","New":"เมนูใหม่"};

function applyLanguage() {
  document.documentElement.lang = language;
  $$("[data-lang]").forEach(b => {
    const active = b.dataset.lang === language;
    b.setAttribute("aria-pressed", String(active));
    b.removeAttribute("aria-current");
  });
  $$(".desktop-nav [data-nav], #menu-drawer [data-nav], #more-menu a, #main h1, #main .eyebrow, #cat-row [data-cat], #other-menu button").forEach(el => {
    if (!el.dataset.en) el.dataset.en = el.textContent.trim();
    el.textContent = language === "th" ? (uiThai[el.dataset.en] || el.dataset.en) : el.dataset.en;
  });
  const more = $("#more-label");
  if (more) more.textContent = language === "th" ? uiThai.More : "More";
  const chip = $("#other-chip");
  if (chip) chip.childNodes[0].nodeValue = (menuState.sub || (language === "th" ? uiThai.Other : "Other")) + " ";

  const input = document.getElementById("global-search");
  const title = document.getElementById("search-title");

  if (input) {
    input.placeholder =
      language === "th"
        ? "ค้นหาเมนู คำถามที่พบบ่อย สาขา และอื่น ๆ..."
        : "Search menu, FAQs, branches and more...";
  }

  if (title) {
    title.textContent =
      language === "th"
        ? "ค้นหาบนเว็บไซต์"
        : "Search the website";
  }

  if (!$("#search-panel").hidden && input) renderGlobalResults(input.value);
}

function setLanguage(lang) {
  if (!["th","en"].includes(lang)) return;
  language=lang; try {localStorage.setItem("ay_language",lang);} catch {}
  applyLanguage();
}
function submitPrototypeOrder() {
  if (checkoutState.processing || !cart.length) return;
  if (fulfilment.mode === "delivery" && !fulfilment.address.trim()) {toast("Please enter a delivery address."); $("#co-address")?.focus(); return;}
  checkoutState.processing=true; render();
  setTimeout(() => {
    checkoutState.processing=false;
    if (checkoutState.simulateFail) {checkoutState.error=true; render(); return;}
    const branch=branchById(fulfilment.branch);
    const order={ref:"AY-"+Date.now().toString(36).toUpperCase(),items:cart.map(i=>({...i})),mode:fulfilment.mode,where:fulfilment.mode === "delivery" ? fulfilment.address : (branch?.name || "Selected branch"),time:fulfilment.time,total:cartTotal()+(fulfilment.mode === "delivery" ? 40 : 0)};
    try {sessionStorage.setItem(ORDER_KEY,JSON.stringify(order));} catch {toast("Could not save this prototype order. Please enable session storage.");render();return;}
    cart=[]; saveCart(); checkoutState.error=false; navigate("/confirmation");
  },700);
}

function init() {
  // The panel is a body child, not inside the sticky, blurred header.
  document.body.append($("#search-panel"));
  closeSearch();
  $$("#search-open, #search-open-m").forEach(b => b.addEventListener("click", () => {
    if ($("#search-panel").hidden) openSearch(b); else closeSearch(true);
  }));
  $("#search-close").addEventListener("click",()=>closeSearch(true));
  $("#global-search").addEventListener("input", e=>renderGlobalResults(e.target.value));
  $("#global-search").addEventListener("keydown",e=>{
    if(e.key === "ArrowDown") {e.preventDefault(); $("#global-results a")?.focus();}
    if(e.key === "Enter") {e.preventDefault(); $("#global-results a")?.click();}
  });
  $("#global-results").addEventListener("keydown",e=>{
    const links=$$("a",$("#global-results")),i=links.indexOf(document.activeElement);
    if(["ArrowDown","ArrowUp"].includes(e.key)) {e.preventDefault(); if(e.key === "ArrowUp" && i<=0) $("#global-search").focus(); else links[(i+(e.key === "ArrowDown" ? 1 : -1)+links.length)%links.length]?.focus();}
  });
  document.addEventListener("pointerdown",e=>{
    if(!e.target.closest("#search-panel, #search-open, #search-open-m")) closeSearch();
    if(!e.target.closest("#more-btn, #more-menu")) {$("#more-menu").hidden=true; $("#more-btn").setAttribute("aria-expanded","false");}
  });
  document.addEventListener("focusin",e=>{if(!e.target.closest("#search-panel, #search-open, #search-open-m")) closeSearch();});
  window.addEventListener("resize",placeSearch);
  window.addEventListener("scroll",placeSearch,{passive:true});
  window.visualViewport?.addEventListener("resize",placeSearch);
  $$("[data-lang]").forEach(b=>b.addEventListener("click",()=>setLanguage(b.dataset.lang)));
  $$("#cart-open, #cart-open-m").forEach(b=>b.addEventListener("click",()=>{closeSearch();closeOtherDropdown();openCart();}));
  $("#cart-close").addEventListener("click",closeCart);
  $("#drawer-open").addEventListener("click",()=>{closeSearch();openOverlay($("#menu-drawer"),$("#drawer-open"));});
  $("#drawer-close").addEventListener("click",()=>closeOverlay($("#menu-drawer"),$("#drawer-open")));
  $("#more-btn").addEventListener("click",()=>{
    const menu=$("#more-menu"); menu.hidden=!menu.hidden;
    $("#more-btn").setAttribute("aria-expanded",String(!menu.hidden));
  });
  $("#scrim").addEventListener("click",()=>{
    if(!$("#cart-panel").hidden) closeCart();
    if(!$("#menu-drawer").hidden) closeOverlay($("#menu-drawer"),$("#drawer-open"));
    if(!$("#branch-modal").hidden) closeOverlay($("#branch-modal"));
  });
  document.addEventListener("keydown",e=>{
    if(e.key !== "Escape") return;
    if(!$("#search-panel").hidden) {e.preventDefault();closeSearch(true);return;}
    closeOtherDropdown(true);
    $("#more-menu").hidden=true; $("#more-btn").setAttribute("aria-expanded","false");
    if(!$("#cart-panel").hidden) closeCart();
    else if(!$("#menu-drawer").hidden) closeOverlay($("#menu-drawer"),$("#drawer-open"));
    else if(!$("#branch-modal").hidden) closeOverlay($("#branch-modal"));
  });
  document.addEventListener("click",e=>{
    const target=e.target;
    if(target.closest("[data-close-search]")) closeSearch();
    if(target.closest("[data-close-cart]")) closeCart();
    if(target.closest("#menu-drawer a")) closeOverlay($("#menu-drawer"),$("#drawer-open"));
    const qty=target.closest("[data-ca]");
    if(qty) {if(qty.dataset.ca === "rm") removeItem(qty.dataset.ck); else changeQty(qty.dataset.ck,qty.dataset.ca === "inc" ? 1 : -1); if(currentRoute() === "/order") render();}
    const mode=target.closest("[data-mode]");
    if(mode) {fulfilment.mode=mode.dataset.mode;saveFulfilment();renderCartPanel();if(currentRoute() === "/checkout") render();}
    const branch=target.closest("[data-branch]"); if(branch) openBranchModal(branch.dataset.branch);
    const disclosure=target.closest(".disclosure-btn, .region-btn");
    if(disclosure) {
      const open=disclosure.getAttribute("aria-expanded") === "true";
      disclosure.setAttribute("aria-expanded",String(!open));
      document.getElementById(disclosure.getAttribute("aria-controls")).hidden=open;
      if(disclosure.dataset.region) {if(open) branchState.expanded.delete(disclosure.dataset.region);else branchState.expanded.add(disclosure.dataset.region);}
    }
  });
  $("#cart-panel").addEventListener("change",e=>{
    if(e.target.id === "cart-branch") fulfilment.branch=e.target.value;
    if(e.target.id === "cart-time") fulfilment.time=e.target.value;
    saveFulfilment();
  });
  $("#cart-panel").addEventListener("input",e=>{if(e.target.id === "cart-address") {fulfilment.address=e.target.value;saveFulfilment();}});
  $("#promo-close")?.addEventListener("click",()=>{$("#promo").hidden=true;try{localStorage.setItem(PROMO_KEY,"1");}catch{}});
  ["#cart-panel","#menu-drawer","#branch-modal"].forEach(sel=>trapFocus($(sel)));
  window.addEventListener("hashchange",()=>{closeOtherDropdown();render();});
  syncCartBadge(); renderCartPanel(); render();
}
if(document.readyState === "loading") document.addEventListener("DOMContentLoaded",init,{once:true}); else init();

function revealSearchedFaq() {
  const hash = window.location.hash;
  const questionMark = hash.indexOf("?");

  if (questionMark === -1) return;

  const route = hash.slice(0, questionMark);

  if (route !== "#/faq") return;

  const params = new URLSearchParams(
    hash.slice(questionMark + 1)
  );

  const id = params.get("faq");

  if (!id) return;

  const panel = document.getElementById(id);

  if (!panel || !panel.classList.contains("disclosure-panel")) {
    return;
  }

  const card = panel.closest(".disclosure");
  const button = card?.querySelector(".disclosure-btn");

  if (!button) return;

  panel.hidden = false;
  button.setAttribute("aria-expanded", "true");

  requestAnimationFrame(() => {
    if (!button.isConnected) return;

    const header = document.querySelector(".site-header");
    const headerHeight =
      header?.getBoundingClientRect().height || 0;

    const top =
      button.getBoundingClientRect().top +
      window.scrollY -
      headerHeight -
      20;

    window.scrollTo({
      top: Math.max(0, top),
      behavior: "auto"
    });

    button.focus({ preventScroll: true });
  });
}