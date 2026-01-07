const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// 1. IMPORTAMOS LA CONEXIÓN Y LOS MODELOS
const sequelize = require('./database'); // Un solo punto (Correcto)

// CORRIGE ESTAS LÍNEAS (Usa solo un punto .):
const Categoria = require('./models/Categoria'); 
const Producto = require('./models/Producto');
const Proveedor = require('./models/Proveedor');
const Usuario = require('./models/Usuario');

// Estas parecen estar bien en tu imagen, pero revísalas por si acaso:
const Venta = require('./models/Venta');
const DetalleVenta = require('./models/DetalleVenta');

const app = express();
const port = process.env.PORT || 3000;
const SECRET_KEY = 'mi_secreto_super_seguro'; // En producción usar variable de entorno

app.use(cors());
app.use(express.json());

// 2. VERIFICAR CONEXIÓN Y SINCRONIZAR MODELOS
// ¡OJO! force: true borra las tablas viejas y las crea nuevas corregidas
sequelize.sync({ force: false }) 
  .then(async () => {
    console.log('✅ Base de Datos sincronizada y reparada.');
    
    // ESTO CREA AL ADMIN AUTOMÁTICAMENTE PARA QUE PUEDAS ENTRAR
    await Usuario.findOrCreate({
      where: { username: 'admin_jose' },
      defaults: {
        password_hash: 'test1234',
        rol: 'Administrador'
      }
    });
    console.log('👤 Usuario Admin creado/asegurado.');
  })
  .catch(err => {
    console.error('❌ Error al conectar a la Base de Datos:', err);
  });

// --- RUTA DE PRUEBA ---
app.get('/', (req, res) => {
  res.send('API Tienda Don José funcionando con Sequelize 🚀');
});

// --- 1. LOGIN (Con Sequelize) ---
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    // Buscamos el usuario usando el Modelo
    const user = await Usuario.findOne({ where: { username: username } });

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    // Comparamos contraseñas
    // NOTA: Si en tu BD las contraseñas están en texto plano (como 'test1234'), 
    // usa: if (password !== user.password_hash)
    // Si ya usas hash real, usa: await bcrypt.compare(password, user.password_hash)
    
    // Como en tu prueba anterior usabas texto plano temporalmente:
    const validPassword = (password === user.password_hash); 

    if (!validPassword) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { id: user.id_usuario, rol: user.rol }, 
      SECRET_KEY, 
      { expiresIn: '2h' }
    );

    res.json({ message: 'Login exitoso', token, user: { username: user.username, rol: user.rol } });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en el servidor' });
  }
});

// --- 2. PRODUCTOS (Con Sequelize) ---
app.get('/api/productos', async (req, res) => {
  try {
    // findAll reemplaza a "SELECT * FROM..."
    // include: Categoria -> Hace un JOIN automático para traer el nombre de la categoría
    const productos = await Producto.findAll({
      include: {
        model: Categoria,
        attributes: ['nombre_categoria'] // Solo queremos el nombre
      }
    });
    
    // Aplanamos la respuesta para que el frontend no se rompa (formato { ...producto, nombre_categoria: ... })
    const respuesta = productos.map(p => ({
      id_producto: p.id_producto,
      nombre_producto: p.nombre_producto,
      marca: p.marca,
      precio_venta: p.precio_venta,
      stock: p.stock,
      nombre_categoria: p.Categoria ? p.Categoria.nombre_categoria : 'Sin categoría'
    }));

    res.json(respuesta);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener productos' });
  }
});

app.post('/api/productos', async (req, res) => {
  const { nombre, marca, precio, stock, categoria_id } = req.body;
  try {
    const nuevoProducto = await Producto.create({
      nombre_producto: nombre,
      marca,
      precio_venta: precio,
      stock,
      id_categoria: categoria_id
    });
    res.json(nuevoProducto);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al agregar producto' });
  }
});

// --- 3. CATEGORÍAS (Con Sequelize) ---
app.get('/api/categorias', async (req, res) => {
  try {
    const categorias = await Categoria.findAll();
    res.json(categorias);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener categorías' });
  }
});

app.post('/api/categorias', async (req, res) => {
  const { nombre, descripcion } = req.body;
  try {
    const nuevaCat = await Categoria.create({
      nombre_categoria: nombre,
      descripcion
    });
    res.json(nuevaCat);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear categoría' });
  }
});

// --- 4. PROVEEDORES (Con Sequelize) ---
app.get('/api/proveedores', async (req, res) => {
  try {
    const proveedores = await Proveedor.findAll();
    res.json(proveedores);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener proveedores' });
  }
});

app.post('/api/proveedores', async (req, res) => {
  const { nombre, calle, numero, colonia, cp, telefono } = req.body;
  try {
    const nuevoProv = await Proveedor.create({
      nombre_proveedor: nombre,
      calle, numero, colonia, codigo_postal: cp, telefono
    });
    res.json(nuevoProv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear proveedor' });
  }
});

// --- 5. VENTAS (Con Sequelize y Transacción) ---
app.post('/api/ventas', async (req, res) => {
  const { carrito, monto_total } = req.body;
  
  // Iniciamos una transacción para asegurar que todo se guarde o nada
  const t = await sequelize.transaction();

  try {
    // 1. Crear la Venta
    const venta = await Venta.create({
      monto_total: monto_total
    }, { transaction: t });

    // 2. Crear los Detalles y Actualizar Stock
    for (const item of carrito) {
      // Guardar detalle
      await DetalleVenta.create({
        id_venta: venta.id_venta,
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario
      }, { transaction: t });

      // Descontar stock (IMPORTANTE: Busca el producto y resta)
      const producto = await Producto.findByPk(item.id_producto, { transaction: t });
      if (producto) {
        await producto.decrement('stock', { by: item.cantidad, transaction: t });
      }
    }

    // Si todo salió bien, confirmamos la transacción
    await t.commit();
    res.json({ message: 'Venta registrada con éxito', id_venta: venta.id_venta });

  } catch (err) {
    // Si algo falló, deshacemos todo
    await t.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error al registrar la venta' });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});