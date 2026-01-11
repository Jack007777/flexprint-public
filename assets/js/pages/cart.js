import { initBaseUI, euro, toast } from '../app.js';
import { api } from '../api.js';
import { getCart, removeFromCart, updateQty } from '../cart.js';

initBaseUI();

const empty = document.getElementById('cartEmpty');
const wrap = document.getElementById('cartWrap');
const tbody = document.querySelector('#cartTable tbody');
const totalEl = document.getElementById('cartTotal');

function row(item, v){
  const tr = document.createElement('tr');
  const sub = v.price_cents * item.qty;
  tr.innerHTML = `
    <td>${v.sku}</td>
    <td>${v.product_title}</td>
    <td>${v.title}</td>
    <td>${euro(v.price_cents)}</td>
    <td><input class="input" style="width:90px" type="number" min="1" value="${item.qty}" /></td>
    <td>${euro(sub)}</td>
    <td><button class="btn" data-del="1">删除</button></td>
  `;
  tr.querySelector('input')?.addEventListener('change', (e) => {
    const q = Math.max(1, parseInt(e.target.value || '1', 10));
    updateQty(item.variantId, q);
    render();
  });
  tr.querySelector('[data-del]')?.addEventListener('click', ()=>{
    removeFromCart(item.variantId);
    toast('已删除');
    initBaseUI();
    render();
  });
  return tr;
}

async function render(){
  const cart = getCart();
  if(cart.length===0){
    empty.textContent = '购物车为空。';
    wrap.style.display = 'none';
    return;
  }
  try{
    const data = await api('/api/products');
    const map = new Map();
    for(const p of data.products){
      for(const v of p.variants){
        map.set(v.id, {...v, product_title: p.title});
      }
    }
    tbody.innerHTML = '';
    let total = 0;
    for(const item of cart){
      const v = map.get(item.variantId);
      if(!v) continue;
      total += v.price_cents * item.qty;
      tbody.appendChild(row(item, v));
    }
    totalEl.textContent = euro(total);
    empty.textContent = '';
    wrap.style.display = '';
  }catch(e){
    empty.textContent = e.message;
    wrap.style.display = 'none';
  }
}

render();
