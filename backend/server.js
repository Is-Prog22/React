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
  destination: function (req, file, cb) {
    cb(null, UPLOADS_DIR);
  },
  filename: function (req, file, cb) {
    // Генерируем уникальное имя файла с оригинальным расширением
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

app.use(cors());
app.use(express.json());

// Отдаём файлы из папки uploads по url /uploads/имя_файла
app.use('/uploads', express.static(UPLOADS_DIR));

// Функции чтения/записи базы (db.json)
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    // Если файла нет, создаём с пустой структурой
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
app.get('/products', (req, res) => {
  const db = readDB();
  res.json(db.products);
});

// Добавить товар с файлами (images)
app.post('/products', upload.array('images', 5), (req, res) => {
  const db = readDB();
  const { name, price, description, categoryId, categoryName } = req.body;

  // Пути к загруженным файлам
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
app.put('/products/:id', upload.array('images', 5), (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  const index = db.products.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const { name, price, description, categoryId, categoryName } = req.body;

  // Пути новых загруженных файлов (если есть)
  const newImages = req.files.length > 0 ? req.files.map(file => `/uploads/${file.filename}`) : [];

  // Если пришли новые картинки — дописываем к старым
  const updatedImages = newImages.length > 0
    ? [...db.products[index].images, ...newImages].slice(0, 5)
    : db.products[index].images;

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
app.delete('/products/:id', (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  db.products = db.products.filter(p => p.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// ======= CATEGORIES =======

// Получить категории
app.get('/categories', (req, res) => {
  const db = readDB();
  res.json(db.categories);
});

// Добавить категорию
app.post('/categories', (req, res) => {
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
app.delete('/categories/:id', (req, res) => {
  const db = readDB();
  const id = parseInt(req.params.id);
  db.categories = db.categories.filter(c => c.id !== id);
  writeDB(db);
  res.json({ success: true });
});

// ======= USERS =======

app.get('/users', (req, res) => {
  const db = readDB();
  res.json(db.users);
});

app.listen(PORT, () => {
  console.log(`✅ Сервер запущен на http://localhost:${PORT}`);
});