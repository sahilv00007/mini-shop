// Mini Shop: products come from an array, the cart is an object { productId: quantity }.
// Every change calls update(), which saves the cart and redraws it.

/* ---------- Settings ---------- */

const STORAGE_KEY = "cart";
const FREE_DELIVERY_FROM = 500; 
const DELIVERY_FEE = 40;        
const MAX_QTY = 10;             

/* ---------- Data: prices are numbers, formatted only when shown ---------- */

const products = [
  { id: 1,  name: "Notebook",     price: 120,  category: "Stationery",  image: "NB", color: "#ffe9a8" },
  { id: 2,  name: "Pen pack",     price: 80,   category: "Stationery",  image: "PN", color: "#d9ecff" },
  { id: 3,  name: "Sticky notes", price: 60,   category: "Stationery",  image: "SN", color: "#ffd9e6" },
  { id: 4,  name: "Desk lamp",    price: 650,  category: "Home",        image: "DL", color: "#fff0c2" },
  { id: 5,  name: "Coffee mug",   price: 299,  category: "Home",        image: "CM", color: "#e7dcff" },
  { id: 6,  name: "Water bottle", price: 350,  category: "Home",        image: "WB", color: "#d4f5e4" },
  { id: 7,  name: "Backpack",     price: 1299, category: "Accessories", image: "BP", color: "#ffd9c7" },
  { id: 8,  name: "Phone stand",  price: 249,  category: "Accessories", image: "PS", color: "#d9f0f5" },
  { id: 9,  name: "Mouse pad",    price: 199,  category: "Accessories", image: "MP", color: "#e6e6e6" },
  { id: 10, name: "Headphones",   price: 1499, category: "Electronics", image: "HP", color: "#d9e2ff" }
];

/* ---------- Page elements ---------- */

const productList = document.getElementById("products");
const filtersBox = document.getElementById("filters");
const cartBody = document.getElementById("cart-body");
const cartContent = document.getElementById("cart-content");
const emptyMsg = document.getElementById("empty");
const countEl = document.getElementById("cart-count");
const hintEl = document.getElementById("hint");
const statusEl = document.getElementById("status");
const checkoutBtn = document.getElementById("checkout-btn");
const clearBtn = document.getElementById("clear-btn");
const dialog = document.getElementById("checkout");

let cart = load();
let activeCategory = "All";

/* ---------- Helpers ---------- */

function money(amount) {
  return amount.toLocaleString("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
}


function findProduct(id) {
  return products.find(function (p) { return p.id === Number(id); });
}

function announce(message) {
  statusEl.textContent = message;
}


function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

/* ---------- Storage ---------- */


function load() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    const clean = {};
    if (data && typeof data === "object" && !Array.isArray(data)) {
      Object.keys(data).forEach(function (id) {
        const qty = Number(data[id]);
        if (findProduct(id) && Number.isInteger(qty) && qty > 0) {
          clean[id] = Math.min(qty, MAX_QTY);
        }
      });
    }
    return clean;
  } catch (e) {
    return {};
  }
}

function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
  } catch (e) {
    
  }
}

/* ---------- Cart logic ---------- */

function addToCart(id) {
  const p = findProduct(id);
  if (!p) return;
  if ((cart[id] || 0) >= MAX_QTY) {
    announce("You already have the maximum of " + MAX_QTY + " " + p.name + ".");
    return;
  }
  cart[id] = (cart[id] || 0) + 1;
  announce("Added " + p.name + " to the cart.");
  update();
}

function changeQuantity(id, delta) {
  if (!cart[id]) return;
  const next = cart[id] + delta;
  if (next > MAX_QTY) return;
  if (next <= 0) {
    removeItem(id);
    return;
  }
  cart[id] = next;
  update();
}

function removeItem(id) {
  const p = findProduct(id);
  delete cart[id];
  if (p) announce("Removed " + p.name + " from the cart.");
  update();
}

function clearCart() {
  cart = {};
  announce("Cart cleared.");
  update();
}

// subtotal and item count with reduce, then the delivery rule
function totals() {
  const ids = Object.keys(cart);

  const subtotal = ids.reduce(function (sum, id) {
    const p = findProduct(id);
    return p ? sum + p.price * cart[id] : sum;
  }, 0);

  const count = ids.reduce(function (sum, id) { return sum + cart[id]; }, 0);

  const delivery = subtotal > 0 && subtotal < FREE_DELIVERY_FROM ? DELIVERY_FEE : 0;

  return { subtotal: subtotal, delivery: delivery, total: subtotal + delivery, count: count };
}

function update() {
  save();
  renderCart();
}

/* ---------- Render: catalogue ---------- */

function renderFilters() {
  const categories = ["All"].concat(
    products.map(function (p) { return p.category; }).filter(function (c, i, all) {
      return all.indexOf(c) === i;
    })
  );

  filtersBox.textContent = "";
  categories.forEach(function (c) {
    const b = el("button", "", c);
    b.type = "button";
    b.dataset.category = c;
    b.setAttribute("aria-pressed", String(c === activeCategory));
    filtersBox.append(b);
  });
}

function renderCatalogue() {
  productList.textContent = "";

  products
    .filter(function (p) { return activeCategory === "All" || p.category === activeCategory; })
    .forEach(function (p) {
      const li = el("li", "product");

      const thumb = el("div", "thumb", p.image);
      thumb.style.setProperty("--tile", p.color);
      thumb.setAttribute("aria-hidden", "true");

      const add = el("button", "primary", "Add to cart");
      add.type = "button";
      add.dataset.id = p.id;
      add.dataset.action = "add";
      add.setAttribute("aria-label", "Add " + p.name + " to cart");

      li.append(thumb, el("h3", "", p.name), el("p", "category", p.category), el("p", "price", money(p.price)), add);
      productList.append(li);
    });
}

/* ---------- Render: cart ---------- */

function renderCart() {
  const t = totals();
  const ids = Object.keys(cart);

  countEl.textContent = t.count;
  emptyMsg.hidden = ids.length > 0;
  cartContent.hidden = ids.length === 0;
  checkoutBtn.disabled = ids.length === 0;

  cartBody.textContent = "";

  ids.forEach(function (id) {
    const p = findProduct(id);
    if (!p) return;

    const tr = document.createElement("tr");
    tr.dataset.id = id;

    // Item name + price each
    const tdItem = el("td", "item");
    tdItem.append(el("span", "item-name", p.name), el("span", "item-each", money(p.price) + " each"));

    // Quantity buttons
    const tdQty = el("td", "qtycell");
    const qty = el("div", "qty");
    const minus = el("button", "", "\u2212");
    minus.type = "button";
    minus.dataset.action = "minus";
    minus.setAttribute("aria-label", "Decrease quantity of " + p.name);
    const value = el("span", "qty-value", String(cart[id]));
    const plus = el("button", "", "+");
    plus.type = "button";
    plus.dataset.action = "plus";
    plus.disabled = cart[id] >= MAX_QTY;
    plus.setAttribute("aria-label", "Increase quantity of " + p.name);
    qty.append(minus, value, plus);
    tdQty.append(qty);

    // Line total
    const tdLine = el("td", "line-total", money(p.price * cart[id]));

    // Remove
    const tdRemove = el("td");
    const remove = el("button", "remove", "Remove");
    remove.type = "button";
    remove.dataset.action = "remove";
    remove.setAttribute("aria-label", "Remove " + p.name + " from the cart");
    tdRemove.append(remove);

    tr.append(tdItem, tdQty, tdLine, tdRemove);
    cartBody.append(tr);
  });

  document.getElementById("subtotal").textContent = money(t.subtotal);
  document.getElementById("delivery").textContent = t.delivery === 0 && t.subtotal > 0 ? "Free" : money(t.delivery);
  document.getElementById("total").textContent = money(t.total);

  if (t.subtotal === 0) {
    hintEl.textContent = "";
  } else if (t.subtotal < FREE_DELIVERY_FROM) {
    hintEl.textContent = "Add " + money(FREE_DELIVERY_FROM - t.subtotal) + " more for free delivery.";
  } else {
    hintEl.textContent = "You get free delivery on this order.";
  }
}

/* ---------- Checkout preview (demo only) ---------- */

function openCheckout() {
  const t = totals();
  if (t.count === 0) return;

  const lines = document.getElementById("order-lines");
  lines.textContent = "";
  Object.keys(cart).forEach(function (id) {
    const p = findProduct(id);
    if (!p) return;
    const li = el("li");
    li.append(el("span", "", cart[id] + " \u00D7 " + p.name), el("span", "", money(p.price * cart[id])));
    lines.append(li);
  });

  document.getElementById("o-subtotal").textContent = money(t.subtotal);
  document.getElementById("o-delivery").textContent = t.delivery === 0 ? "Free" : money(t.delivery);
  document.getElementById("o-total").textContent = money(t.total);

  dialog.showModal();
}

/* ---------- Events ---------- */


productList.addEventListener("click", function (e) {
  const btn = e.target.closest("button[data-action='add']");
  if (btn) addToCart(btn.dataset.id);
});


filtersBox.addEventListener("click", function (e) {
  const btn = e.target.closest("button[data-category]");
  if (!btn) return;
  activeCategory = btn.dataset.category;
  renderFilters();
  renderCatalogue();
  const active = filtersBox.querySelector("[aria-pressed='true']");
  if (active) active.focus();
});


cartBody.addEventListener("click", function (e) {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const row = btn.closest("tr");
  const id = row.dataset.id;
  if (btn.dataset.action === "plus") changeQuantity(id, 1);
  if (btn.dataset.action === "minus") changeQuantity(id, -1);
  if (btn.dataset.action === "remove") removeItem(id);
});

clearBtn.addEventListener("click", clearCart);
checkoutBtn.addEventListener("click", openCheckout);
document.getElementById("close-btn").addEventListener("click", function () { dialog.close(); });
document.getElementById("finish-btn").addEventListener("click", function () {
  dialog.close();
  cart = {};
  update();
  announce("Demo finished. Nothing was charged and no order was placed.");
});

/* ---------- Start ---------- */

renderFilters();
renderCatalogue();
renderCart();