import { initBaseUI, euro, toast } from '../app.js';
import { api } from '../api.js';

initBaseUI();

const KEY = 'flexprint_admin_token';
const tokenInput = document.getElementById('token');
const saveBtn = document.getElementById('saveToken');
const refreshBtn = document.getElementById('refresh');
const list = document.getElementById('adminList');

tokenInput.value = localStorage.getItem(KEY) || '';

saveBtn.addEventListener('click', ()=>{
  localStorage.setItem(KEY, tokenInput.value.trim());
  toast('已保存 token');
});

function headers(){
  const t = (localStorage.getItem(KEY)||'').trim();
  return t ? { 'Authorization': `Bearer ${t}` } : {};
}

async function load(){
  list.textContent = '加载中…';
  try{
    const data = await api('/api/admin/orders', { headers: headers() });
    if(!data.orders?.length){
      list.textContent = '暂无订单';
      return;
    }
    list.innerHTML = data.orders.map(o => `
      <div class="card" style="margin-top:12px">
        <div class="row" style="justify-content:space-between">
          <div>
            <div><strong>${o.id}</strong> <span class="badge">${o.status}</span> <span class="badge">${o.payment_method}</span></div>
            <div class="small">${o.customer_email || ''} · ${new Date(o.created_at).toLocaleString('de-DE')}</div>
          </div>
          <div class="row">
            <div class="kpi"><strong>${euro(o.total_cents)}</strong></div>
            <button class="btn" data-pay="${o.id}">标记已付款</button>
          </div>
        </div>
      </div>
    `).join('');

    list.querySelectorAll('[data-pay]').forEach(btn => {
      btn.addEventListener('click', async ()=>{
        const id = btn.getAttribute('data-pay');
        try{
          await api('/api/admin/orders/mark-paid', { method:'POST', headers: headers(), body:{ order_id: id }});
          toast('已更新');
          load();
        }catch(e){
          toast(e.message);
        }
      });
    });

  }catch(e){
    list.textContent = e.message + '（提示：需要 ADMIN_TOKEN）';
  }
}

refreshBtn.addEventListener('click', load);
load();
