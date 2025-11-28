// routes/cart.js
const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * Asegurar que el carrito exista y sea SIEMPRE un arreglo
 */
function initCart(req) {
  if (!req.session.cart || !Array.isArray(req.session.cart)) {
    req.session.cart = [];
  }
}

/**
 * GET /cart – Ver carrito
 */
router.get('/cart', (req, res) => {
  initCart(req);

  const cartItems = req.session.cart;

  const total = cartItems.reduce((sum, item) => {
    const price = Number(item.price) || 0;
    return sum + price * item.quantity;
  }, 0);

  res.render('cart', { cartItems, total });
});

/**
 * POST /cart/add – Agregar producto al carrito
 */
router.post('/cart/add', async (req, res) => {
  try {
    if (!req.session) {
      return res.status(500).send('Sesión no inicializada');
    }

    initCart(req);

    const productId = req.body.productId;

    if (!productId) {
      req.flash('error', 'Producto inválido');
      return res.redirect('/');
    }

    // Buscar producto en la BD (usa columnas reales)
    const [rows] = await db.query(
      'SELECT id, title, price, image FROM products WHERE id = ?',
      [productId]
    );

    if (rows.length === 0) {
      req.flash('error', 'Producto no encontrado');
      return res.redirect('/');
    }

    const product = rows[0];

    // ¿Ya está en el carrito?
    const existing = req.session.cart.find(item => item.id === product.id);

    if (existing) {
      existing.quantity += 1;
    } else {
      req.session.cart.push({
        id: product.id,
        name: product.title,           // usamos title de la BD
        price: Number(product.price),  // aseguramos número
        image: product.image || null,  // por si luego quieres mostrar en el carrito
        quantity: 1
      });
    }

    req.flash('success', 'Producto agregado al carrito');
    res.redirect('/');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al agregar al carrito');
    res.redirect('/');
  }
});

/**
 * POST /cart/remove – Quitar un producto del carrito
 */
router.post('/cart/remove', (req, res) => {
  initCart(req);

  const productId = Number(req.body.productId);

  req.session.cart = req.session.cart.filter(item => item.id !== productId);

  req.flash('success', 'Producto eliminado del carrito');
  res.redirect('/cart');
});

/**
 * POST /cart/checkout – Realizar compra
 * (solo crea la orden y redirige a /order para que orders.js la procese)
 */
router.post('/cart/checkout', (req, res) => {
  if (!req.session.user) {
    req.flash('error', 'Debes iniciar sesión para comprar');
    return res.redirect('/login');
  }

  // aquí NO tocamos el carrito, solo mandamos a /order
  res.redirect('/order');
});

module.exports = router;
