import { initBaseUI, euro, toast } from '../app.js';
import { api, uploadToR2 } from '../api.js';
import { getCart, clearCart } from '../cart.js';

initBaseUI();

const summary = document.getElementById('summary');
const btn = document.getElementById('placeOrderBtn');
const paymentSel = document.getElementById('paymentMethod');
const klarnaBox = document.getElementById('klarnaBox');
const fileEl = document.getElementById('file');

paymentSel?.addEventListener('change', ()=>{
  klarnaBox.style.display = paymentSel.value === 'klarna' ? '' : 'none';
});

function readForm(){
  return {
    customer_name: document.getElementById('name').value.trim(),
    customer_email: document.getElementById('email').value.trim(),
    ship_address1: document.getElementById('addr1').value.trim(),
    ship_postal: document.getElementById('zip').value.trim(),
    ship_city: document.getElementById('city').value.trim(),
    ship_country: document.getElementById('country').value.trim().toUpperCase(),
    ship_phone: document.getElementById('phone').value.trim(),
  };
}

async function renderSummary(){
  const cart = getCart();
  if(cart.length===0){
    summary.innerHTML = '购物车为空，请先去 <a href="/shop/">Shop</a>。';
    btn.disabled = true;
    return;
  }
  try{
    const data = await api('/api/products');
    const map = new Map();
    for(const p of data.products) for(const v of p.variants) map.set(v.id, {p, v});
    let total = 0;
    let lines = [];
    for(const item of cart){
      const it = map.get(item.variantId);
      if(!it) continue;
      total += it.v.price_cents * item.qty;
      lines.push(`<div class="kpi"><strong>${it.p.title}</strong> · ${it.v.title} × ${item.qty}<span style="margin-left:auto">${euro(it.v.price_cents*item.qty)}</span></div>`);
    }
    summary.innerHTML = lines.join('') + `<hr style="border:0;border-top:1px solid rgba(255,255,255,.10);margin:10px 0" />
      <div class="kpi"><strong>合计</strong><span style="margin-left:auto">${euro(total)}</span></div>`;
  }catch(e){
    summary.textContent = e.message;
  }
}

async function ensureUpload(){
  const f = fileEl?.files?.[0];
  if(!f) return null;
  toast('正在上传到 R2…');
  const up = await uploadToR2(f);
  toast('上传完成');
  return up; // { key, url, contentType, size }
}

async function payWithKlarna(orderId){
  const session = await api('/api/payments/klarna/session', { method:'POST', body: { order_id: orderId }});
  const client_token = session.client_token;

  // Klarna SDK: init -> load -> authorize
  if(!window.Klarna || !window.Klarna.Payments) throw new Error('Klarna SDK 未加载');
  window.Klarna.Payments.init({ client_token });

  await new Promise((resolve, reject) => {
    window.Klarna.Payments.load({
      container: '#klarna_container',
      payment_method_category: session.payment_method_category || undefined
    }, (res) => {
      if(res?.show_form === false && res?.error) reject(new Error(res.error?.message || 'Klarna load failed'));
      else resolve(res);
    });
  });

  const authRes = await new Promise((resolve, reject) => {
    window.Klarna.Payments.authorize({
      payment_method_category: session.payment_method_category || undefined
    }, {
      // billing_address 也可以在这里传，示例省略
    }, (res) => {
      if(res?.approved) resolve(res);
      else reject(new Error(res?.error?.message || 'Klarna authorize failed'));
    });
  });

  const authorization_token = authRes.authorization_token;
  const created = await api('/api/payments/klarna/order', { method:'POST', body: { order_id: orderId, authorization_token }});
  return created;
}

btn?.addEventListener('click', async ()=>{
  btn.disabled = true;
  try{
    const cart = getCart();
    if(cart.length===0) throw new Error('购物车为空');
    const method = paymentSel.value;

    // optional upload
    const upload = await ensureUpload();

    const order = await api('/api/orders', {
      method: 'POST',
      body: {
        payment_method: method,
        customer: readForm(),
        items: cart,
        design_upload: upload ? { key: upload.key, url: upload.url, content_type: upload.contentType, size: upload.size } : null
      }
    });

    const orderId = order.order_id;

    if(method === 'bank_transfer'){
      clearCart();
      location.href = `/checkout/success/?order_id=${encodeURIComponent(orderId)}`;
      return;
    }

    if(method === 'paypal'){
      const pp = await api('/api/payments/paypal/create', { method:'POST', body:{ order_id: orderId }});
      // 跳转到 PayPal approve link
      location.href = pp.approve_url;
      return;
    }

    if(method === 'klarna'){
      // 显示 Klarna 容器
      klarnaBox.style.display = '';
      const k = await payWithKlarna(orderId);
      clearCart();
      location.href = `/checkout/success/?order_id=${encodeURIComponent(orderId)}&klarna_order_id=${encodeURIComponent(k.klarna_order_id || '')}`;
      return;
    }

    throw new Error('未知支付方式');
  }catch(e){
    toast(e.message || '下单失败');
    btn.disabled = false;
  }
});

renderSummary();
