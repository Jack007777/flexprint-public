import { initBaseUI, toast, euro } from '../app.js';
import { api } from '../api.js';

initBaseUI();

const msg = document.getElementById('msg');
const qs = new URLSearchParams(location.search);
const orderId = qs.get('order_id');

const bankCard = document.getElementById('bankCard');

(async ()=>{
  if(!orderId){
    msg.textContent = '缺少 order_id。';
    return;
  }
  try{
    const data = await api(`/api/orders/${encodeURIComponent(orderId)}`);
    msg.innerHTML = `订单号：<strong>${data.id}</strong> · 状态：<strong>${data.status}</strong> · 合计：<strong>${euro(data.total_cents)}</strong>`;
    if(data.payment_method === 'bank_transfer'){
      bankCard.style.display = '';
      document.getElementById('ref').textContent = data.id;
      document.getElementById('bankName').textContent = data.bank?.account_name || '';
      document.getElementById('iban').textContent = data.bank?.iban || '';
      document.getElementById('bic').textContent = data.bank?.bic || '';
      document.getElementById('bankNote').textContent = data.bank?.note || '';
    }
  }catch(e){
    msg.textContent = e.message;
  }
})();
