const SITE_NOTICE = {
  title: "欢迎来到 ANGEL 小店",
};

const categories = [
  { id: "娃娃服装", label: "娃娃服装", icon: "🎀" },
  { id: "娃娃用品", label: "娃娃用品", icon: "🧸" },
  { id: "文创", label: "文创", icon: "✦" },
];

const products = [];

const shippingFee = 10;
const PAYMENT_QR_URL = "assets/payment-qr.png";
const state = {
  view: "home",
  category: "all",
  search: "",
  cart: load("angel_cart", []),
  lastOrder: load("angel_last_order", null),
};

const app = document.querySelector("#app");
const toast = document.querySelector("#toast");
const cartCount = document.querySelector("#cartCount");
const drawer = document.querySelector("#drawer");
const noticeModal = document.querySelector("#noticeModal");
const cartModal = document.querySelector("#cartModal");
const checkoutModal = document.querySelector("#checkoutModal");

function money(value) {
  return `¥${Number(value).toFixed(2)}`;
}

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
}

function save() {
  localStorage.setItem("angel_cart", JSON.stringify(state.cart));
  if (state.lastOrder) {
    localStorage.setItem("angel_last_order", JSON.stringify(state.lastOrder));
  } else {
    localStorage.removeItem("angel_last_order");
  }
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
}

function setView(view) {
  state.view = view;
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
  render();
  app.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getCartItems() {
  return state.cart
    .map((line) => ({ ...line, product: products.find((product) => String(product.id) === String(line.id)) }))
    .filter((line) => line.product);
}

function cartSubtotal() {
  return getCartItems().reduce((sum, line) => sum + line.product.price * line.qty, 0);
}

function cartQuantity() {
  return state.cart.reduce((sum, line) => sum + line.qty, 0);
}

function addToCart(id) {
  if (!products.some((product) => String(product.id) === String(id))) return;
  const found = state.cart.find((line) => String(line.id) === String(id));
  if (found) {
    found.qty += 1;
  } else {
    state.cart.push({ id, qty: 1 });
  }
  save();
  updateCartBadge();
  renderCart();
  showToast("已加入购物袋");
}

function changeQty(id, delta) {
  const found = state.cart.find((line) => line.id === id);
  if (!found) return;
  found.qty += delta;
  if (found.qty <= 0) {
    state.cart = state.cart.filter((line) => line.id !== id);
  }
  save();
  updateCartBadge();
  renderCart();
}

function updateCartBadge() {
  cartCount.textContent = cartQuantity();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function productCategoryLabel(product) {
  return categories.find((category) => category.id === product.category)?.label || product.category || "ANGEL";
}

function productCard(product) {
  const art = product.imageUrl
    ? `<img class="product-image" src="${escapeHtml(product.imageUrl)}" alt="${escapeHtml(product.name)}" loading="lazy" />`
    : `<div class="product-art" style="--art-a:#bfe3ff;--art-b:#ffd3e9">🎀</div>`;
  return `
    <article class="product-card">
      ${art}
      <div class="product-info">
        <span class="eyebrow">${escapeHtml(productCategoryLabel(product))}</span>
        <h3>${escapeHtml(product.name)}</h3>
        <div class="product-meta">
          <span class="price">${money(product.price)}</span>
          <button class="round-add" data-add="${escapeHtml(product.id)}" aria-label="加入购物车">🛒</button>
        </div>
      </div>
    </article>
  `;
}

function renderHome() {
  const featured = products.slice(0, 4);
  const listing = featured.length
    ? `
      <div class="section-heading">
        <h2>新品可爱小物上线啦</h2>
        <button class="soft-button" data-view="shop">查看全部</button>
      </div>
      <div class="product-grid">${featured.map(productCard).join("")}</div>
    `
    : `
      <div class="empty-state listing-state">
        <strong>正在上架</strong>
        <span>ANGEL 小物很快就会补上来</span>
      </div>
    `;
  app.innerHTML = `
    <section class="hero">
      <div class="hero-banner">
        <img src="assets/angel-hero.png" alt="ANGEL 品牌主视觉，粉蓝礼物、护肤品、手机配件和可爱猫咪" />
        <div class="hero-copy">
          <p class="eyebrow">Find your fire</p>
          <h1>ANGEL<br />Shop</h1>
          <p>生活的意义就是感知细碎的幸福</p>
          <button class="primary-button" data-view="shop">立即选购</button>
        </div>
      </div>
      <div class="category-strip updating-strip">
        <button type="button" disabled>正在更新中</button>
      </div>
    </section>

    <section>
      ${listing}
    </section>

    <section>
      <div class="section-heading">
        <h2>Collections</h2>
      </div>
      <div class="collection-grid single-collection">
        <button class="collection-card" data-view="shop"><strong>娃娃服装 (˶ᵔ ᵕ ᵔ˶)</strong></button>
      </div>
    </section>

    <section class="about-band">
      <h2>ABOUT US</h2>
      <p>ANGEL 是一个收藏柔软心事的小店，主打棉花娃娃、娃娃服装与娃娃用品，也会慢慢上新可爱的文创小物。我们希望每一件小东西都像送给自己的礼物，带一点甜、一点陪伴，也带一点认真生活的仪式感。</p>
    </section>
  `;
}

function filteredProducts() {
  return products.filter((product) => {
    const matchCategory = state.category === "all" || product.category === state.category;
    const keyword = state.search.trim().toLowerCase();
    const matchSearch =
      !keyword ||
      product.name.toLowerCase().includes(keyword) ||
      String(product.description || "").toLowerCase().includes(keyword);
    return matchCategory && matchSearch;
  });
}

function renderShop() {
  const liveCategories = [...new Set(products.map((product) => product.category).filter(Boolean))];
  const activeProducts = filteredProducts();
  const categoryButtons = products.length
    ? liveCategories
        .map(
          (category) =>
            `<button class="${state.category === category ? "active" : ""}" data-filter="${escapeHtml(category)}">${escapeHtml(
              categories.find((entry) => entry.id === category)?.label || category,
            )}</button>`,
        )
        .join("")
    : `<button class="updating-pill" type="button" disabled>正在更新中</button>`;
  const listing = products.length
    ? activeProducts.length
      ? `<div class="product-grid">${activeProducts.map(productCard).join("")}</div>`
      : `<div class="empty-state"><p>没有找到这个商品，换个关键词试试看。</p></div>`
    : `
      <div class="empty-state listing-state">
        <strong>正在上架</strong>
        <span>ANGEL 小物很快就会补上来</span>
      </div>
    `;
  app.innerHTML = `
    <section>
      <div class="section-heading">
        <h2>商品</h2>
        <button class="ghost-button" id="resetFilters">全部分类</button>
      </div>
      <div class="toolbar">
        <input class="search-input" id="searchInput" value="${escapeHtml(state.search)}" placeholder="搜索商品" />
        <div class="category-pills">
          <button class="${state.category === "all" ? "active" : ""}" data-filter="all">全部</button>
          ${categoryButtons}
        </div>
      </div>
      ${listing}
    </section>
  `;
}

function renderPayment() {
  const order = state.lastOrder;
  const paymentNote = order
    ? `${order.id}｜${order.items.map((item) => `${item.name}×${item.qty}`).join("、")}｜${order.customer.name}｜${order.customer.phone || "联系电话"}｜${order.customer.address || "完整收货地址"}`
    : "";
  const qrCode = PAYMENT_QR_URL
    ? `<img class="payment-qr-image" src="${escapeHtml(PAYMENT_QR_URL)}" alt="ANGEL 收款二维码" />`
    : `<div class="payment-qr-placeholder"><strong>收款二维码</strong><span>等待店主上传</span></div>`;
  const orderDetails = order
    ? `
      <div class="payment-order">
        <p><strong>订单号：</strong><span id="paymentOrderNumber">${escapeHtml(order.id)}</span></p>
        <p><strong>收件人：</strong>${escapeHtml(order.customer.name)}</p>
        <p><strong>应付金额：</strong>${money(order.total)}</p>
        <p><strong>付款备注：</strong>${escapeHtml(paymentNote)}</p>
      </div>
    `
    : `
      <div class="payment-empty">
        <p>选好商品并填写收货信息后，这里会显示订单号和应付金额。</p>
        <button class="primary-button" data-view="shop">先去选商品</button>
      </div>
    `;

  app.innerHTML = `
    <section class="payment-page">
      <div class="payment-heading">
        <p class="eyebrow">Payment</p>
        <h1>支付方式</h1>
        <p>无需注册帐号。提交订单后扫描下方二维码完成付款。</p>
      </div>
      <div class="payment-layout">
        <div class="payment-qr-panel">
          ${qrCode}
          <p class="fine-print">${PAYMENT_QR_URL ? "支持微信支付和支付宝，请选择对应二维码扫码付款。" : "二维码会在店主提供正式收款码后显示。"}</p>
        </div>
        <div class="payment-guide">
          <h2>付款说明</h2>
          ${orderDetails}
          <ol>
            <li>请核对应付金额后再扫码付款。</li>
            <li>付款备注请填写“订单号 + 商品名称和数量 + 收件人姓名 + 联系电话 + 完整收货地址”。</li>
            <li>请认真核对备注内容，确保商品和收货信息完整无误。</li>
            <li>付款后请保留支付截图，方便需要时核对。</li>
          </ol>
        </div>
      </div>
    </section>
  `;
}

function renderCart() {
  const cartItems = getCartItems();
  const subtotal = cartSubtotal();
  const shipping = subtotal >= 65 || subtotal === 0 ? 0 : shippingFee;
  document.querySelector("#cartItems").innerHTML = cartItems.length
    ? cartItems
        .map(
          ({ product, qty }) => `
            <div class="cart-line">
              <div>
                <strong>${product.name}</strong>
                <p>${money(product.price)} × ${qty}</p>
              </div>
              <div class="qty-controls">
                <button data-qty="${product.id}" data-delta="-1" aria-label="减少">−</button>
                <strong>${qty}</strong>
                <button data-qty="${product.id}" data-delta="1" aria-label="增加">+</button>
              </div>
            </div>
          `,
        )
        .join("")
    : `<div class="empty-state">购物袋还是空的</div>`;
  document.querySelector("#cartSubtotal").textContent = money(subtotal);
  document.querySelector("#cartShipping").textContent = money(shipping);
  document.querySelector("#checkoutButton").disabled = !cartItems.length;
}

function openCheckout() {
  if (!getCartItems().length) return;
  const subtotal = cartSubtotal();
  const shipping = subtotal >= 65 ? 0 : shippingFee;
  document.querySelector("#checkoutTotal").textContent = money(subtotal + shipping);
  cartModal.classList.add("hidden");
  checkoutModal.classList.remove("hidden");
  document.querySelector("#customerName").focus();
}

async function submitGuestOrder(event) {
  event.preventDefault();
  const items = getCartItems().map(({ product, qty }) => ({
    id: product.id,
    name: product.name,
    price: product.price,
    qty,
  }));
  if (!items.length) {
    showToast("购物袋还是空的");
    return;
  }
  const customer = {
    name: document.querySelector("#customerName").value.trim(),
    phone: document.querySelector("#customerPhone").value.trim(),
    address: document.querySelector("#customerAddress").value.trim(),
  };
  const subtotal = items.reduce((sum, item) => sum + item.price * item.qty, 0);
  const shipping = subtotal >= 65 ? 0 : shippingFee;
  const order = {
    id: `AN${Date.now().toString().slice(-10)}`,
    createdAt: new Intl.DateTimeFormat("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date()),
    customer,
    note: document.querySelector("#customerNote").value.trim(),
    items,
    shipping,
    total: subtotal + shipping,
    status: "pending_payment",
  };

  try {
    state.lastOrder = order;
    state.cart = [];
    save();
    updateCartBadge();
    checkoutModal.classList.add("hidden");
    document.querySelector("#checkoutForm").reset();
    setView("payment");
    showToast("订单已生成，请扫码付款");
  } catch {
    showToast("无法保存订单，请稍后再试");
  }
}

function render() {
  if (state.view === "home") renderHome();
  if (state.view === "shop") renderShop();
  if (state.view === "payment") renderPayment();
  updateCartBadge();
}

document.addEventListener("click", (event) => {
  const viewButton = event.target.closest("[data-view]");
  if (viewButton) setView(viewButton.dataset.view);

  const addButton = event.target.closest("[data-add]");
  if (addButton) addToCart(addButton.dataset.add);

  const filterButton = event.target.closest("[data-filter]");
  if (filterButton) {
    state.category = filterButton.dataset.filter;
    renderShop();
  }

  const categoryButton = event.target.closest("[data-category]");
  if (categoryButton) {
    state.category = categoryButton.dataset.category;
    setView("shop");
  }

  const qtyButton = event.target.closest("[data-qty]");
  if (qtyButton) changeQty(qtyButton.dataset.qty, Number(qtyButton.dataset.delta));
});

document.querySelector("#menuButton").addEventListener("click", () => {
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
});

document.querySelector("#closeDrawer").addEventListener("click", () => {
  drawer.classList.remove("open");
  drawer.setAttribute("aria-hidden", "true");
});

document.querySelector("#searchButton").addEventListener("click", () => {
  setView("shop");
  window.setTimeout(() => document.querySelector("#searchInput")?.focus(), 0);
});

document.querySelector("#cartButton").addEventListener("click", () => {
  renderCart();
  cartModal.classList.remove("hidden");
});

document.querySelector("#mobileCartButton").addEventListener("click", () => {
  renderCart();
  cartModal.classList.remove("hidden");
});

document.querySelector("#closeCart").addEventListener("click", () => cartModal.classList.add("hidden"));
document.querySelector("#checkoutButton").addEventListener("click", openCheckout);
document.querySelector("#closeCheckout").addEventListener("click", () => checkoutModal.classList.add("hidden"));
document.querySelector("#checkoutForm").addEventListener("submit", submitGuestOrder);

document.querySelector("#closeNotice").addEventListener("click", () => noticeModal.classList.add("hidden"));
document.querySelector("#noticeAction").addEventListener("click", () => noticeModal.classList.add("hidden"));
document.querySelector("#noticeTitle").textContent = SITE_NOTICE.title;

app.addEventListener("input", (event) => {
  if (event.target.id === "searchInput") {
    state.search = event.target.value;
    renderShop();
    document.querySelector("#searchInput")?.focus();
  }
});

app.addEventListener("click", (event) => {
  if (event.target.id === "resetFilters") {
    state.category = "all";
    state.search = "";
    renderShop();
  }
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    noticeModal.classList.add("hidden");
    cartModal.classList.add("hidden");
    checkoutModal.classList.add("hidden");
    drawer.classList.remove("open");
  }
});

async function initialize() {
  render();
}

initialize();
