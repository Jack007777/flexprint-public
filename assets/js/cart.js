const KEY = 'flexprint_cart_v1';

export function getCart(){
  try{
    const v = localStorage.getItem(KEY);
    return v ? JSON.parse(v) : [];
  }catch{ return []; }
}

export function saveCart(items){
  localStorage.setItem(KEY, JSON.stringify(items));
}

export function addToCart(variantId, qty){
  const items = getCart();
  const found = items.find(x => x.variantId === variantId);
  if(found) found.qty += qty;
  else items.push({ variantId, qty });
  saveCart(items);
  return items;
}

export function removeFromCart(variantId){
  const items = getCart().filter(x => x.variantId !== variantId);
  saveCart(items);
  return items;
}

export function updateQty(variantId, qty){
  const items = getCart();
  const found = items.find(x => x.variantId === variantId);
  if(found) found.qty = Math.max(1, qty);
  saveCart(items);
  return items;
}

export function clearCart(){
  saveCart([]);
}

export function getCartCount(){
  return getCart().reduce((s,x)=>s + (x.qty||0), 0);
}
