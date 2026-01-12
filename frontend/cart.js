// Gestión del Carrito

function getCart() {
  const cart = localStorage.getItem('cart');
  return cart ? JSON.parse(cart) : [];
}

function saveCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
  updateCartCount();
}

function updateCartCount() {
  // Opcional: actualizar algún contador en el navbar si existiera
}

function addToCart(product) {
  const cart = getCart();
  const existing = cart.find(item => item.id === product._id);
  
  if (existing) {
    existing.quantity += 1;
    mostrarMensaje(`Cantidad actualizada: ${existing.quantity}`, 'ok');
  } else {
    cart.push({
      id: product._id,
      nombre: product.nombre,
      price: product.precio,
      quantity: 1
    });
    mostrarMensaje('Producto añadido al carrito', 'ok');
  }
  saveCart(cart);
}

// Renderizado en página del carrito
const cartItemsEl = document.getElementById('cart-items');
const cartTotalEl = document.getElementById('cart-total');
const emptyMsgEl = document.getElementById('empty-msg');
const totalAmountEl = document.getElementById('total-amount');
const btnCheckout = document.getElementById('btn-checkout');

function renderCart() {
  if (!cartItemsEl) return; // No estamos en la página del carrito

  const cart = getCart();
  if (cart.length === 0) {
    cartItemsEl.innerHTML = '';
    if (cartTotalEl) cartTotalEl.style.display = 'none';
    if (emptyMsgEl) emptyMsgEl.style.display = 'block';
    return;
  }

  if (emptyMsgEl) emptyMsgEl.style.display = 'none';
  if (cartTotalEl) cartTotalEl.style.display = 'block';
  cartItemsEl.innerHTML = '';

  let total = 0;

  cart.forEach((item, index) => {
    total += item.price * item.quantity;
    const div = document.createElement('div');
    div.className = 'cart-item';
    div.innerHTML = `
      <div>
        <strong>${item.nombre}</strong><br>
        $${item.price} x ${item.quantity}
      </div>
      <div style="display:flex; align-items:center; gap:10px;">
        <span>$${(item.price * item.quantity).toFixed(2)}</span>
        <button class="btn-remove" onclick="removeFromCart(${index})">Eliminar</button>
      </div>
    `;
    cartItemsEl.appendChild(div);
  });

  if (totalAmountEl) totalAmountEl.textContent = total.toFixed(2);
}

window.removeFromCart = function(index) {
  const cart = getCart();
  cart.splice(index, 1);
  saveCart(cart);
  renderCart();
};

// Checkout
if (btnCheckout) {
  btnCheckout.addEventListener('click', async () => {
    const cart = getCart();
    if (cart.length === 0) return;

    if (!authToken) {
      mostrarMensaje('Debes iniciar sesión para comprar', 'error');
      setTimeout(() => window.location.href = 'auth.html', 2000);
      return;
    }

    // GraphQL Mutation
    const itemsInput = cart.map(item => ({
      productId: item.id,
      quantity: item.quantity
    }));

    const query = `
      mutation CreateOrder($input: CreateOrderInput!) {
        createOrder(input: $input) {
          id
          total
          status
        }
      }
    `;

    mostrarSpinner(true);
    try {
      const res = await fetch(`${API_URL}/graphql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          query,
          variables: { input: { items: itemsInput } }
        })
      });

      const result = await res.json();
      if (result.errors) {
        throw new Error(result.errors[0].message);
      }

      mostrarMensaje(`¡Pedido realizado con éxito! ID: ${result.data.createOrder.id}`, 'ok');
      localStorage.removeItem('cart');
      renderCart();
    } catch (err) {
      mostrarMensaje(err.message, 'error');
    } finally {
      mostrarSpinner(false);
    }
  });
}

// Inicializar
if (document.body.dataset.page === 'cart') {
  renderCart();
}

// Hacer addToCart global
window.addToCart = addToCart;
