const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const multer = require('multer');

const app = express();
const PORT = 5000;
const DB_FILE = path.join(__dirname, 'db.json');
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Создаем папку uploads, если её нет
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR);
}

// Настройка multer для сохранения файлов в uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOADS_DIR),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(UPLOADS_DIR));

// Создаем "роутер" для API с префиксом /api
const apiRouter = express.Router();

// Функции чтения/записи базы (db.json)
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ products: [], categories: [], users: [] }, null, 2));
  }
  const data = fs.readFileSync(DB_FILE, 'utf8');
  return JSON.parse(data);
}
function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf8');
}

// ======= PRODUCTS =======

// Получить все товары
apiRouter.get('/products', (req, res) => {
  const db = readDB();
  res.json(db.products);
});

// Добавить товар с файлами (images)
apiRouter.post('/products', upload.array('images', 5), (req, res) => {
  const db = readDB();
  const { name, price, description, categoryId, categoryName } = req.body;
  const images = req.files.map(file => `/uploads/${file.filename}`);

  const newProduct = {
    id: Date.now(),
    name,
    price: parseFloat(price),
    description,
    categoryId: parseInt(categoryId),
    categoryName,
    images
  };

  db.products.push(newProduct);
  writeDB(db);
  res.json(newProduct);
});

// Обновить товар с файлами (images)
apiRouter.put('/products/:id', upload.array('images', 5), (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  const index = db.products.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const { name, price, description, categoryId, categoryName } = req.body;
  const newImages = req.files.length > 0 ? req.files.map(file => `/uploads/${file.filename}`) : [];
  const updatedImages = newImages.length > 0 ? [...db.products[index].images, ...newImages].slice(0, 5) : db.products[index].images;

  db.products[index] = {
    ...db.products[index],
    name,
    price: parseFloat(price),
    description,
    categoryId: parseInt(categoryId),
    categoryName,
    images: updatedImages
  };

  writeDB(db);
  res.json(db.products[index]);
});

// Удалить товар
apiRouter.delete('/products/:id', (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  db.products = db.products.filter(p => p.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// ======= CATEGORIES =======

// Получить категории
apiRouter.get('/categories', (req, res) => {
  const db = readDB();
  res.json(db.categories);
});

// Добавить категорию
apiRouter.post('/categories', (req, res) => {
  const db = readDB();
  const newCategory = {
    id: Date.now(),
    ...req.body
  };
  db.categories.push(newCategory);
  writeDB(db);
  res.json(newCategory);
});

// Удалить категорию
apiRouter.delete('/categories/:id', (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  db.categories = db.categories.filter(c => c.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// ======= USERS =======

apiRouter.get('/users', (req, res) => {
  const db = readDB();
  res.json(db.users);
});

// Используем роутер для API с префиксом /api
app.use('/api', apiRouter);

// Отдача React build
app.use(express.static(path.join(__dirname, '..', 'build')));

app.get('*', (req, res) => {
  // Отдаём index.html только если запрос не к /api и не к /uploads
  if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
    return res.status(404).json({ error: 'Not found' });
  }
  res.sendFile(path.join(__dirname, '..', 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
}).on('error', (err) => {
  console.error('Ошибка запуска сервера:', err);
});
