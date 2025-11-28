// routes/orders.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const PDFDocument = require('pdfkit');

// Middleware: usuario debe estar logueado
function requireLogin(req, res, next) {
  if (!req.session.user) {
    req.flash('error', 'Debes iniciar sesión para continuar');
    return res.redirect('/login');
  }
  next();
}

/**
 * 1) CREAR ORDEN / COMPRA
 *    Se llama después de /cart/checkout -> redirect('/order')
 */
router.get('/order', requireLogin, async (req, res) => {
  const userId = req.session.user.id;

  // Aquí el carrito es ARREGLO: [ {id, name, price, quantity, ...}, ... ]
  const cartItems = Array.isArray(req.session.cart) ? req.session.cart : [];

  if (!cartItems.length) {
    req.flash('error', 'El carrito está vacío');
    return res.redirect('/cart');
  }

  // Total seguro
  const total = cartItems.reduce((s, it) => {
    const price = Number(it.price) || 0;
    return s + price * it.quantity;
  }, 0);

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Insertar orden
    const [r] = await conn.query(
      'INSERT INTO orders (user_id, total, created_at) VALUES (?, ?, NOW())',
      [userId, total]
    );
    const orderId = r.insertId;

    // Insertar items de la orden
    for (const it of cartItems) {
      const price = Number(it.price) || 0;
      await conn.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)',
        [orderId, it.id, it.quantity, price]
      );
    }

    await conn.commit();

    // Limpiar carrito (arreglo vacío)
    req.session.cart = [];
    req.session.lastOrderId = orderId;

    // Redirigir al ticket PDF
    res.redirect(`/order/${orderId}/ticket`);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    req.flash('error', 'Error al crear la orden');
    res.redirect('/cart');
  } finally {
    conn.release();
  }
});

/**
 * 2) HISTORIAL DE COMPRAS
 */
router.get('/history', requireLogin, async (req, res) => {
  const uid = req.session.user.id;

  try {
    const [orders] = await db.query(
      'SELECT id, total, created_at FROM orders WHERE user_id = ? ORDER BY created_at DESC',
      [uid]
    );

    for (const order of orders) {
      const [items] = await db.query(
        `SELECT oi.quantity,
                oi.price,
                p.title AS name
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         WHERE oi.order_id = ?`,
        [order.id]
      );

      order.items = items.map(it => ({
        ...it,
        price: Number(it.price) || 0
      }));

      order.total = Number(order.total) || 0;
    }

    res.render('history', { orders });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar el historial');
    res.redirect('/');
  }
});

/**
 * 3) TICKET PDF DE UNA ORDEN
 */
router.get('/order/:id/ticket', requireLogin, async (req, res) => {
  const orderId = req.params.id;

  try {
    const [orders] = await db.query(
      'SELECT id, total, created_at FROM orders WHERE id = ? AND user_id = ?',
      [orderId, req.session.user.id]
    );

    if (!orders.length) {
      return res.status(404).send('Orden no encontrada');
    }

    const order = orders[0];

    const [items] = await db.query(
      `SELECT oi.quantity,
              oi.price,
              p.title AS name
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id = ?`,
      [orderId]
    );

    const safeItems = items.map(it => ({
      ...it,
      price: Number(it.price) || 0
    }));
    const total = Number(order.total) || 0;

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=ticket_${orderId}.pdf`
    );

    doc.pipe(res);

    doc.fontSize(18).text('Ticket de compra', { align: 'center' });
    doc.moveDown();

    doc.fontSize(12).text(`Orden: ${orderId}`);
    doc.text(`Usuario: ${req.session.user.name}`);
    doc.text(`Fecha: ${new Date(order.created_at).toLocaleString()}`);
    doc.moveDown();

    safeItems.forEach(it => {
      const lineTotal = it.quantity * it.price;
      doc.text(
        `${it.name} - ${it.quantity} x $${it.price.toFixed(2)} = $${lineTotal.toFixed(2)}`
      );
    });

    doc.moveDown();
    doc.fontSize(14).text(`Total: $${total.toFixed(2)}`, { align: 'right' });

    doc.end();
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
});

module.exports = router;
