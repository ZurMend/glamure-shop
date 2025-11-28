const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const bodyParser = require('body-parser');

const app = express();

// Railway te da el puerto en process.env.PORT
const PORT = process.env.PORT || 3000;

/**
 * 1. CONFIGURACIÓN DEL STORE DE SESIÓN
 *    ⚠️ Importante: usar las mismas variables que en db.js
 */
const sessionOptions = {
  host: process.env.MYSQLHOST || 'localhost',
  port: process.env.MYSQLPORT ? Number(process.env.MYSQLPORT) : 3306,
  user: process.env.MYSQLUSER || 'root',
  password: process.env.MYSQLPASSWORD || '',
  database: process.env.MYSQLDATABASE || 'shopping_db'
};

const sessionStore = new MySQLStore(sessionOptions);


/**
 * 2. CONFIG EXPRESS
 */
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

/**
 * 3. SESIONES
 */
app.use(session({
  key: 'session_cookie_name',
  secret: 'una_clave_secreta_aqui',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 2 }
}));


app.use(flash());

/**
 * 4. VARIABLES GLOBALES PARA VISTAS
 */
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.messages = req.flash();
  next();
});

/**
 * 5. RUTAS
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
 * 6. INICIAR SERVER
 */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
