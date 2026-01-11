import { initBaseUI, euro, toast } from '../app.js';
import { api } from '../api.js';
import { addToCart } from '../cart.js';

initBaseUI();

const qs = new URLSearchParams(location.search);
const handle = qs.get('handle');

const titleEl = document.getElementById('pTitle');
const descEl = document.getElementById('pDesc');
const sel = document.getElementById('variantSelect');
const qtyEl = document.getElementById('qty');
const priceEl = document.getElementById('price');
const btn = document.getElementById('addToCartBtn');

let variants = [];

function fill(){
  sel.innerHTML = variants.map(v => `<option value="${v.id}">${v.title} · ${v.sku}</option>`).join('');
  const v = variants[0];
  if(v) priceEl.value = euro(v.price_cents);
}

sel?.addEventListener('change', () => {
  const v = variants.find(x=>x.id===sel.value);
  if(v) priceEl.value = euro(v.price_cents);
});

btn?.addEventListener('click', () => {
  const vid = sel.value;
  const qty = Math.max(1, parseInt(qtyEl.value || '1', 10));
  addToCart(vid, qty);
  toast('已加入购物车');
  initBaseUI();
});

(async ()=>{
  if(!handle){
    titleEl.textContent = 'Product not found';
    descEl.textContent = '缺少 handle 参数。';
    return;
  }
  try{
    const data = await api('/api/products');
    const p = data.products.find(x=>x.handle===handle);
    if(!p) throw new Error('未找到该产品');
    titleEl.textContent = p.title;
    descEl.textContent = p.description || '';
    variants = p.variants || [];
    fill();
  }catch(e){
    titleEl.textContent = 'Error';
    descEl.textContent = e.message;
  }
})();
