// Lógica del Panel de Administración

if (!isAdmin()) {
  mostrarMensaje('Acceso denegado. Se requiere rol de administrador.', 'error');
  setTimeout(() => window.location.replace('productos.html'), 2000);
}

function switchTab(tab) {
  const usersView = document.getElementById('users-view');
  const ordersView = document.getElementById('orders-view');
  const tabUsers = document.getElementById('tab-users-btn');
  const tabOrders = document.getElementById('tab-orders-btn');

  if (tab === 'users') {
    usersView.style.display = 'block';
    ordersView.style.display = 'none';
    tabUsers.classList.add('active');
    tabOrders.classList.remove('active');
    loadUsers();
  } else {
    usersView.style.display = 'none';
    ordersView.style.display = 'block';
    tabUsers.classList.remove('active');
    tabOrders.classList.add('active');
    loadOrders('');
  }
}

// --- Helper para GraphQL ---
async function gqlRequest(query, variables = {}) {
  const res = await fetch(`${API_URL}/graphql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`
    },
    body: JSON.stringify({ query, variables })
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

// --- Gestión de Usuarios ---
async function loadUsers() {
  const query = `
    query {
      users {
        id
        nombre
        email
        role
      }
    }
  `;
  try {
    const data = await gqlRequest(query);
    renderUsers(data.users);
  } catch (err) {
    mostrarMensaje(err.message, 'error');
  }
}

function renderUsers(users) {
  const tbody = document.getElementById('users-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  users.forEach(u => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${u.id}</td>
      <td>${u.nombre}</td>
      <td>${u.email}</td>
      <td>${u.role}</td>
      <td>
        <button class="action-btn btn-role" onclick="toggleRole('${u.id}')">Cambiar Rol</button>
        <button class="action-btn btn-delete" onclick="deleteUser('${u.id}')">Eliminar</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function toggleRole(id) {
  const query = `
    mutation ToggleUserRole($id: ID!) {
      toggleUserRole(id: $id) {
        id
        role
      }
    }
  `;
  try {
    await gqlRequest(query, { id });
    mostrarMensaje('Rol actualizado', 'ok');
    loadUsers();
  } catch (err) {
    mostrarMensaje(err.message, 'error');
  }
}

async function deleteUser(id) {
  if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
  const query = `
    mutation DeleteUser($id: ID!) {
      deleteUser(id: $id)
    }
  `;
  try {
    await gqlRequest(query, { id });
    mostrarMensaje('Usuario eliminado', 'ok');
    loadUsers();
  } catch (err) {
    mostrarMensaje(err.message, 'error');
  }
}

// --- Gestión de Pedidos ---
async function loadOrders(status) {
  const query = `
    query Orders($status: String) {
      orders(status: $status) {
        id
        total
        status
        createdAt
        user {
          nombre
          email
        }
      }
    }
  `;
  const vars = status ? { status } : {};
  try {
    const data = await gqlRequest(query, vars);
    renderOrders(data.orders);
  } catch (err) {
    mostrarMensaje(err.message, 'error');
  }
}

function renderOrders(orders) {
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';
  orders.forEach(o => {
    const date = new Date(parseInt(o.createdAt)).toString() === 'Invalid Date' ? new Date(o.createdAt).toLocaleString() : new Date(parseInt(o.createdAt)).toLocaleString();
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${o.id}</td>
      <td>${o.user ? o.user.nombre : 'Usuario eliminado'}</td>
      <td>$${o.total.toFixed(2)}</td>
      <td class="${o.status === 'COMPLETED' ? 'status-completed' : 'status-pending'}">${o.status}</td>
      <td>${date}</td>
      <td>
        <button class="action-btn btn-view" onclick="viewOrder('${o.id}')">Ver Detalle</button>
      </td>
    `;
    tbody.appendChild(tr);
  });
}

async function viewOrder(id) {
  const query = `
    query Order($id: ID!) {
      order(id: $id) {
        id
        total
        status
        items {
          product {
            nombre
            precio
          }
          quantity
          price
        }
        user {
          nombre
          email
        }
      }
    }
  `;
  try {
    const data = await gqlRequest(query, { id });
    openModal(data.order);
  } catch (err) {
    mostrarMensaje(err.message, 'error');
  }
}

function openModal(order) {
  const modal = document.getElementById('order-modal');
  const content = document.getElementById('order-detail-content');
  
  let itemsHtml = '<ul style="list-style:none; padding:0;">';
  order.items.forEach(item => {
    const prodName = item.product ? item.product.nombre : 'Producto eliminado';
    itemsHtml += `
      <li style="border-bottom:1px solid #eee; padding:5px 0;">
        ${prodName} x ${item.quantity} - <strong>$${(item.price * item.quantity).toFixed(2)}</strong>
      </li>
    `;
  });
  itemsHtml += '</ul>';

  const nextStatus = order.status === 'PENDING' ? 'COMPLETED' : 'PENDING';
  const btnText = order.status === 'PENDING' ? 'Marcar como Completado' : 'Marcar como Pendiente';

  content.innerHTML = `
    <p><strong>ID:</strong> ${order.id}</p>
    <p><strong>Usuario:</strong> ${order.user ? order.user.nombre + ' (' + order.user.email + ')' : 'Desconocido'}</p>
    <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
    <p><strong>Estado:</strong> ${order.status}</p>
    <h3>Productos:</h3>
    ${itemsHtml}
    <div style="margin-top:20px; text-align:right;">
      <button class="primary" onclick="updateStatus('${order.id}', '${nextStatus}')">${btnText}</button>
    </div>
  `;
  
  modal.style.display = 'block';
}

function closeModal() {
  document.getElementById('order-modal').style.display = 'none';
}

async function updateStatus(id, status) {
  const query = `
    mutation UpdateStatus($id: ID!, $status: String!) {
      updateOrderStatus(id: $id, status: $status) {
        id
        status
      }
    }
  `;
  try {
    await gqlRequest(query, { id, status });
    mostrarMensaje('Estado actualizado', 'ok');
    closeModal();
    // Recargar la lista actual (simulamos clic en el filtro actual o cargamos todos)
    loadOrders(''); 
  } catch (err) {
    mostrarMensaje(err.message, 'error');
  }
}

// Carga inicial
if (document.body.dataset.page === 'admin') {
  loadUsers();
}
