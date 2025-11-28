// app.js
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const bodyParser = require('body-parser');

const app = express();

// Railway te da el puerto en process.env.PORT
const PORT = process.env.PORT || 3000;

/**
 * 1. CONFIG EXPRESS
 */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Body parser
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/**
 * 2. SESIONES (SIN MySQLStore)
 *    Usamos el store en memoria para que no falle en Railway.
 */
app.use(session({
  key: 'session_cookie_name',
  secret: 'una_clave_secreta_aqui',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 2 } // 2 horas
}));

app.use(flash());

/**
 * 3. VARIABLES GLOBALES PARA VISTAS
 */
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.messages = req.flash();
  next();
});

/**
 * 4. RUTAS
 */
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const orderRoutes = require('./routes/orders');

app.use('/', productRoutes);
app.use('/', authRoutes);
app.use('/', cartRoutes);
app.use('/', orderRoutes);

/**
 * 5. INICIAR SERVER
 */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
