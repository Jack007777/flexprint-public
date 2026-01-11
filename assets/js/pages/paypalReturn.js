import { initBaseUI, toast } from '../app.js';
import { api } from '../api.js';

initBaseUI();

const qs = new URLSearchParams(location.search);
const orderId = qs.get('o');
const paypalOrderId = qs.get('token'); // PayPal 会带 token=PAYPAL_ORDER_ID

const status = document.getElementById('status');

(async ()=>{
  try{
    if(!orderId || !paypalOrderId) throw new Error('缺少 PayPal 参数');
    status.textContent = '正在 capture…';
    await api('/api/payments/paypal/capture', { method:'POST', body:{ order_id: orderId, paypal_order_id: paypalOrderId }});
    status.textContent = '支付成功，正在跳转…';
    toast('PayPal 支付成功');
    location.href = `/checkout/success/?order_id=${encodeURIComponent(orderId)}`;
  }catch(e){
    status.textContent = `失败：${e.message}`;
  }
})();
