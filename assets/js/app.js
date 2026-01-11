import { getCartCount } from './cart.js';

export function euro(cents){
  const v = (cents ?? 0) / 100;
  return new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(v);
}

export function toast(msg, ms=2600){
  const el = document.getElementById('toast');
  if(!el) return;
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(()=> el.classList.remove('show'), ms);
}

export function setNavCartCount(){
  const el = document.getElementById('navCartCount');
  if(el) el.textContent = String(getCartCount());
}

export function initBaseUI(){
  const y = document.getElementById('year');
  if(y) y.textContent = String(new Date().getFullYear());
  setNavCartCount();
}
