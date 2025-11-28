// routes/auth.js
const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');

router.get('/login', (req, res) => {
  res.render('login');
});

router.get('/register', (req, res) => {
  res.render('register');
});

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    req.flash('error', 'Todos los campos son obligatorios');
    return res.redirect('/register');
  }
  try {
    const [rows] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
    if (rows.length) {
      req.flash('error', 'El correo ya está registrado');
      return res.redirect('/register');
    }
    const hash = await bcrypt.hash(password, 10);
    await db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hash]);
    req.flash('success', 'Registro exitoso. Inicia sesión.');
    res.redirect('/login');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error en el servidor');
    res.redirect('/register');
  }
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) {
      req.flash('error', 'Usuario no encontrado');
      return res.redirect('/login');
    }
    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      req.flash('error', 'Contraseña incorrecta');
      return res.redirect('/login');
    }
    // safe user session
    req.session.user = { id: user.id, name: user.name, email: user.email };
    if (!req.session.cart) req.session.cart = {}; // cart stored in session
    res.redirect('/');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error en el servidor');
    res.redirect('/login');
  }
});

router.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
