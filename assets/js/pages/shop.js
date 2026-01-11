import { initBaseUI, euro, toast } from '../app.js';
import { api } from '../api.js';
import { addToCart } from '../cart.js';

initBaseUI();

const grid = document.getElementById('productGrid');

function productCard(p){
  const min = Math.min(...p.variants.map(v=>v.price_cents));
  const div = document.createElement('div');
  div.className = 'product';
  div.innerHTML = `
    <div class="img">POD</div>
    <div class="meta">
      <div>
        <div class="title">${p.title}</div>
        <div class="small">${p.tagline || ''}</div>
      </div>
      <div class="price">${euro(min)}</div>
    </div>
    <div class="row">
      <a class="btn" href="/product/?handle=${encodeURIComponent(p.handle)}">查看</a>
      <button class="btn primary" data-quick="${p.variants[0]?.id || ''}">快速加入</button>
    </div>
  `;
  const quick = div.querySelector('[data-quick]');
  quick?.addEventListener('click', () => {
    const vid = quick.getAttribute('data-quick');
    if(!vid) return;
    addToCart(vid, 1);
    toast('已加入购物车');
    initBaseUI();
  });
  return div;
}

(async ()=>{
  try{
    const data = await api('/api/products');
    grid.innerHTML = '';
    for(const p of data.products){
      grid.appendChild(productCard(p));
    }
  }catch(e){
    grid.innerHTML = `<div class="card"><p>${e.message}</p></div>`;
  }
})();
