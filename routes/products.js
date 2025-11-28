// routes/products.js
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    // IMPORTANTE: usamos las columnas reales de tu tabla
    // id, title, description, price, image
    const [products] = await db.query(
      'SELECT id, title, description, price, image FROM products'
    );

    // 'products' se envía a views/index.ejs
    res.render('index', { products });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error al cargar productos');
    res.render('index', { products: [] });
  }
});

module.exports = router;
