/* Mini store: renders pages and sends GA4 ecommerce + engagement events. */
var CUR = 'INR';
var PRODUCTS = [
  {id:'SKU_HOODIE', name:'Hacker Hoodie', cat:'Apparel', price:1999, icon:'🧥', bg:'#dbe7ff', desc:'Heavy fleece hoodie with a tiny "sudo" on the sleeve.'},
  {id:'SKU_TSHIRT', name:'I Love Firewalls Tee', cat:'Apparel', price:699, icon:'👕', bg:'#ffe3e0', desc:'Soft cotton tee for people who block things professionally.'},
  {id:'SKU_SLEEVE', name:'Laptop Sleeve 14"', cat:'Accessories', price:899, icon:'💻', bg:'#e3f6e8', desc:'Padded sleeve with an inner pocket for adapters.'},
  {id:'SKU_MUG', name:'sudo make coffee Mug', cat:'Accessories', price:449, icon:'☕', bg:'#fff1d6', desc:'350 ml ceramic mug. Dishwasher safe, root access not included.'},
  {id:'SKU_ORG', name:'Cable Organizer', cat:'Accessories', price:299, icon:'🔌', bg:'#ece3ff', desc:'Keeps chargers and USB cables from becoming a botnet of tangles.'},
  {id:'SKU_STICK', name:'Sticker Pack (12)', cat:'Stickers', price:249, icon:'🛡️', bg:'#d9f3f7', desc:'Twelve vinyl stickers: padlocks, shields and terminal jokes.'}
];
var $ = function (s, r) { return (r || document).querySelector(s); };
var money = function (n) { return '₹' + n.toLocaleString('en-IN'); };
var find = function (id) { return PRODUCTS.filter(function (p) { return p.id === id; })[0]; };
function load(k, d) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } }
function save(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
function gaItem(p, q, i) { var o = {item_id:p.id, item_name:p.name, item_category:p.cat, price:p.price, quantity:q || 1}; if (i !== undefined) o.index = i; return o; }
function send(name, params) {
  if (window.gtag) gtag('event', name, params || {});
  var l = $('#evlog');
  if (l) { var d = document.createElement('div'); d.innerHTML = '<b>' + name + '</b> ' + JSON.stringify(params || {}).slice(0, 110); l.insertBefore(d, l.children[1] || null); }
}
function cart() { return load('cart', []); }
function setCart(c) { save('cart', c); badge(); }
function badge() { var n = cart().reduce(function (a, i) { return a + i.q; }, 0); var b = $('#cartn'); if (b) b.textContent = n; }
function toast(t) { var e = $('#toast'); e.textContent = t; e.classList.add('show'); setTimeout(function () { e.classList.remove('show'); }, 1600); }
function addToCart(id, from) {
  var c = cart(), p = find(id), row = c.filter(function (i) { return i.id === id; })[0];
  if (row) row.q++; else c.push({id:id, q:1});
  setCart(c);
  send('add_to_cart', {currency:CUR, value:p.price, items:[gaItem(p, 1)]});
  toast(p.name + ' added to cart');
}
function total(c) { return c.reduce(function (a, i) { return a + find(i.id).price * i.q; }, 0); }
function qs(k) { return new URLSearchParams(location.search).get(k); }

var pages = {};
pages.home = function (m) {
  var cat = 'All', term = '';
  m.innerHTML = '<div class="hero"><h1>Security merch for people who read logs</h1><p>A small demo store built to practise Google Analytics 4: every click, search and purchase here is an event you can analyse.</p></div>' +
    '<div class="bar" id="chips"></div><div class="grid" id="grid"></div>';
  var chips = ['All', 'Apparel', 'Accessories', 'Stickers'];
  function draw() {
    var list = PRODUCTS.filter(function (p) { return (cat === 'All' || p.cat === cat) && p.name.toLowerCase().indexOf(term.toLowerCase()) > -1; });
    $('#grid').innerHTML = list.map(function (p) {
      return '<div class="card"><div class="tile" style="background:' + p.bg + '">' + p.icon + '</div><div class="body"><span class="cat">' + p.cat + '</span><h3>' + p.name + '</h3>' +
        '<div class="row"><span class="price">' + money(p.price) + '</span><span><a class="btn alt" href="product.html?id=' + p.id + '" data-sel="' + p.id + '">View</a> <button class="btn" data-add="' + p.id + '">Add</button></span></div></div></div>';
    }).join('') || '<p>No products match your search.</p>';
    send('view_item_list', {item_list_id:cat.toLowerCase(), item_list_name:cat, items:list.map(function (p, i) { return gaItem(p, 1, i); })});
  }
  var bar = $('#chips');
  bar.innerHTML = chips.map(function (c) { return '<button class="chip' + (c === 'All' ? ' on' : '') + '" data-cat="' + c + '">' + c + '</button>'; }).join('') + '<input id="q" placeholder="Search products">';
  bar.addEventListener('click', function (e) { var c = e.target.dataset.cat; if (!c) return; cat = c; [].forEach.call(bar.querySelectorAll('.chip'), function (x) { x.classList.toggle('on', x.dataset.cat === c); }); draw(); });
  var t; $('#q').addEventListener('input', function (e) { term = e.target.value; clearTimeout(t); t = setTimeout(function () { if (term.length > 1) send('search', {search_term:term}); draw(); }, 400); });
  m.addEventListener('click', function (e) {
    var a = e.target.dataset.add; if (a) addToCart(a);
    var s = e.target.dataset.sel; if (s) { var p = find(s); send('select_item', {item_list_name:cat, items:[gaItem(p, 1)]}); }
  });
  draw();
};
pages.product = function (m) {
  var p = find(qs('id')) || PRODUCTS[0];
  m.innerHTML = '<p><a href="index.html">← Back to shop</a></p><div class="two"><div class="big" style="background:' + p.bg + '">' + p.icon + '</div><div class="panel"><span class="cat">' + p.cat + '</span><h1 style="margin:4px 0">' + p.name + '</h1>' +
    '<p>' + p.desc + '</p><p class="price" style="font-size:1.5rem">' + money(p.price) + '</p><button class="btn" id="add">Add to cart</button> <a class="btn alt" href="cart.html">Go to cart</a></div></div>';
  send('view_item', {currency:CUR, value:p.price, items:[gaItem(p, 1)]});
  $('#add').onclick = function () { addToCart(p.id); };
};
pages.cart = function (m) {
  function draw() {
    var c = cart();
    if (!c.length) { m.innerHTML = '<h1>Your cart</h1><div class="panel">Your cart is empty. <a href="index.html">Browse the shop</a>.</div>'; return; }
    m.innerHTML = '<h1>Your cart</h1><div class="panel"><table><tr><th>Item</th><th>Qty</th><th>Price</th><th></th></tr>' + c.map(function (i) { var p = find(i.id);
      return '<tr><td>' + p.icon + ' ' + p.name + '</td><td>' + i.q + '</td><td>' + money(p.price * i.q) + '</td><td><button class="btn red" data-rm="' + i.id + '">Remove</button></td></tr>'; }).join('') +
      '</table><div class="total">Total: ' + money(total(c)) + '</div><p style="text-align:right"><button class="btn" id="go">Proceed to checkout</button></p></div>';
  }
  m.addEventListener('click', function (e) {
    var r = e.target.dataset.rm;
    if (r) { var p = find(r), c = cart(), row = c.filter(function (i) { return i.id === r; })[0]; send('remove_from_cart', {currency:CUR, value:p.price * row.q, items:[gaItem(p, row.q)]}); setCart(c.filter(function (i) { return i.id !== r; })); draw(); }
    if (e.target.id === 'go') { var c2 = cart(); send('begin_checkout', {currency:CUR, value:total(c2), items:c2.map(function (i, x) { return gaItem(find(i.id), i.q, x); })}); location.href = 'checkout.html'; }
  });
  var c0 = cart(); if (c0.length) send('view_cart', {currency:CUR, value:total(c0), items:c0.map(function (i, x) { return gaItem(find(i.id), i.q, x); })});
  draw();
};
pages.checkout = function (m) {
  var c = cart(), order = load('last_order', null);
  if (!c.length && order && qs('done')) return confirmation(m, order);
  if (!c.length) { m.innerHTML = '<h1>Checkout</h1><div class="panel">Nothing to check out. <a href="index.html">Back to shop</a>.</div>'; return; }
  m.innerHTML = '<h1>Checkout</h1><div class="two"><div class="panel"><h3>Delivery details</h3><form id="f"><label>Full name<input name="n" required></label><label>Email<input type="email" name="e" required></label><label>Address<textarea name="a" rows="2" required></textarea></label>' +
    '<label>Payment method<select name="pay"><option>UPI</option><option>Credit card</option><option>Cash on delivery</option></select></label><button class="btn" type="submit">Place order</button></form></div>' +
    '<div class="panel"><h3>Order summary</h3><table>' + c.map(function (i) { var p = find(i.id); return '<tr><td>' + p.name + ' × ' + i.q + '</td><td>' + money(p.price * i.q) + '</td></tr>'; }).join('') + '</table><div class="total">Total: ' + money(total(c)) + '</div></div></div>';
  $('#f').addEventListener('submit', function (e) {
    e.preventDefault();
    var items = c.map(function (i, x) { return gaItem(find(i.id), i.q, x); }), v = total(c), pay = e.target.pay.value;
    send('add_shipping_info', {currency:CUR, value:v, shipping_tier:'Standard', items:items});
    send('add_payment_info', {currency:CUR, value:v, payment_type:pay, items:items});
    var tid = 'T' + Date.now().toString().slice(-8);
    send('purchase', {transaction_id:tid, currency:CUR, value:v, shipping:0, tax:0, items:items});
    var o = {id:tid, value:v, items:items}; save('last_order', o); setCart([]);
    confirmation(m, o);
  });
};
function confirmation(m, o) {
  m.innerHTML = '<h1>Thank you!</h1><div class="panel"><p class="ok">Order ' + o.id + ' placed. Total ' + money(o.value) + '.</p><p>This order was sent to GA4 as a <code>purchase</code> event, so it shows up under Reports &gt; Monetization.</p>' +
    '<button class="btn red" id="rf">Request refund (sends a refund event)</button> <a class="btn alt" href="index.html">Continue shopping</a></div>';
  $('#rf').onclick = function () { send('refund', {transaction_id:o.id, currency:CUR, value:o.value}); toast('Refund event sent'); };
}
pages.account = function (m) {
  var u = load('user', null);
  function draw() {
    if (u) { m.innerHTML = '<h1>My account</h1><div class="panel"><p>Signed in as <b>' + u.email + '</b></p><p>Your GA4 <code>user_id</code> is <code>' + u.uid + '</code>. GA4 uses it to recognise you when you come back, which feeds the Retention reports.</p><button class="btn red" id="out">Sign out</button></div>'; $('#out').onclick = function () { u = null; save('user', null); draw(); }; return; }
    m.innerHTML = '<h1>Create account / sign in</h1><div class="panel"><form id="f"><label>Email<input type="email" name="e" required></label><label>Password<input type="password" name="p" required></label>' +
      '<div><button class="btn" data-m="sign_up">Sign up</button> <button class="btn alt" data-m="login">Log in</button></div></form></div>';
    var mode = 'sign_up'; m.addEventListener('click', function (e) { if (e.target.dataset.m) mode = e.target.dataset.m; });
    $('#f').addEventListener('submit', function (e) {
      e.preventDefault(); var em = e.target.e.value, h = 0; for (var i = 0; i < em.length; i++) h = (h * 31 + em.charCodeAt(i)) >>> 0;
      u = {email:em, uid:'u_' + h.toString(16)}; save('user', u); try { localStorage.setItem('user_id', u.uid); } catch (x) {}
      if (window.gtag) gtag('set', {user_id:u.uid});
      send(mode, {method:'email'}); draw();
    });
  }
  draw();
};
pages.campaigns = function (m) {
  var base = location.href.replace(/[^\/]*$/, '') + 'index.html';
  var rows = [['instagram','social','diwali_sale'],['newsletter','email','weekly_deals'],['google','cpc','brand_search'],['college-blog','referral','security_week']];
  m.innerHTML = '<h1>Campaign links</h1><p>GA4 reads <code>utm_source</code>, <code>utm_medium</code> and <code>utm_campaign</code> from the address to decide where a visit came from. Open these links (or share them) to create visits from different sources, then compare them in Reports &gt; Acquisition &gt; Traffic acquisition.</p>' +
    '<div class="panel"><table><tr><th>Source</th><th>Medium</th><th>Campaign</th><th>Link</th></tr>' + rows.map(function (r) { var u = base + '?utm_source=' + r[0] + '&utm_medium=' + r[1] + '&utm_campaign=' + r[2];
      return '<tr><td>' + r[0] + '</td><td>' + r[1] + '</td><td>' + r[2] + '</td><td><a href="' + u + '" data-event="campaign_link_open" data-label="' + r[0] + '">Open</a></td></tr>'; }).join('') + '</table></div>' +
    '<h3>Build your own link</h3><div class="panel"><form id="b"><label>Source<input name="s" value="whatsapp"></label><label>Medium<input name="m" value="social"></label><label>Campaign<input name="c" value="launch"></label><button class="btn">Generate</button></form><p id="out"></p></div>';
  $('#b').addEventListener('submit', function (e) { e.preventDefault(); var f = e.target; $('#out').innerHTML = '<code>' + base + '?utm_source=' + encodeURIComponent(f.s.value) + '&utm_medium=' + encodeURIComponent(f.m.value) + '&utm_campaign=' + encodeURIComponent(f.c.value) + '</code>'; });
};
document.addEventListener('DOMContentLoaded', function () {
  var m = $('main'), pg = document.body.dataset.page;
  if (qs('debug') || load('debug', false)) { var l = document.createElement('div'); l.id = 'evlog'; l.style.display = 'block'; l.innerHTML = '<div><b>GA4 event log</b></div>'; document.body.appendChild(l); }
  badge(); pages[pg](m);
  document.addEventListener('click', function (e) { var el = e.target.closest('[data-event]'); if (el) send(el.dataset.event, {label:el.dataset.label}); });
  var fired = {}; window.addEventListener('scroll', function () { var pct = Math.round((scrollY + innerHeight) / document.documentElement.scrollHeight * 100); if (pct >= 50 && !fired[50]) { fired[50] = 1; send('scroll_depth', {percent:50}); } });
});
