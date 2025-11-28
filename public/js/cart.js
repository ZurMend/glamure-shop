// cart.js
document.addEventListener('click', function(e) {
  if (e.target.classList.contains('add-to-cart')) {
    const id = e.target.dataset.id;
    const qtyInput = document.getElementById(`qty-${id}`);
    const qty = qtyInput ? Number(qtyInput.value) : 1;
    fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id, qty })
    }).then(r => r.json()).then(data => {
      // simple feedback
      alert('Agregado al carrito');
    });
  }
  if (e.target.classList.contains('remove-item')) {
    const id = e.target.dataset.id;
    fetch('/api/cart/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id })
    }).then(r => r.json()).then(updateCartFromServer);
  }
});

document.addEventListener('change', function(e) {
  if (e.target.classList.contains('cart-qty')) {
    const id = e.target.dataset.id;
    const q = Number(e.target.value);
    fetch('/api/cart/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id, quantity: q })
    }).then(r => r.json()).then(updateCartFromServer);
  }
});

function updateCartFromServer(data) {
  // Rebuild cart UI client-side from server response (simple approach: recargar la pagina)
  // For nicer UX, update DOM elements in-place. Here we reload the cart page to keep code short:
  if (location.pathname === '/cart') location.reload();
  else console.log('Cart updated', data);
}
