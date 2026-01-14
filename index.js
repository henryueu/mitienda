const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const sequelize = require('./database'); 
const Categoria = require('./models/Categoria'); 
const Producto = require('./models/Producto');
const Proveedor = require('./models/Proveedor');
const Usuario = require('./models/Usuario');

const Venta = require('./models/Venta');
const DetalleVenta = require('./models/DetalleVenta');

const app = express();
const port = process.env.PORT || 3000;
const SECRET_KEY = 'mi_secreto_super_seguro'; 

Producto.hasMany(DetalleVenta, { foreignKey: 'id_producto' });
DetalleVenta.belongsTo(Producto, { foreignKey: 'id_producto' });

// Relación Categoria <-> Producto (La que arregló el "Sin categoría")
Categoria.hasMany(Producto, { foreignKey: 'id_categoria' });
Producto.belongsTo(Categoria, { foreignKey: 'id_categoria' });

app.use(cors());
app.use(express.json());

app.get('/api/ventas-recientes', async (req, res) => {
  try {
    const ventas = await Venta.findAll({
      limit: 10,
      order: [['fecha_venta', 'DESC']],
      include: [{
        model: DetalleVenta,
        include: [Producto] // Trae el nombre del producto
      }]
    });
    
    const respuesta = ventas.map(v => ({
      id_venta: v.id_venta,
      fecha: v.fecha_venta,
      total: v.total_venta,
      // Usamos opcionales (?.) para evitar errores si algo viene nulo
      productos: v.DetalleVentas?.map(d => 
        `${d.cantidad}x ${d.Producto?.nombre_producto || 'Producto'}`
      ).join(', ') || 'Sin detalles'
    }));

    res.json(respuesta);
  } catch (err) {
    console.error("ERROR CRÍTICO BACKEND:", err); // Esto aparecerá en los logs de Render
    res.status(500).json({ error: 'Error interno al obtener historial' });
  }
});

// --- RUTAS PARA REPORTES TEMPORALES (HOY Y SEMANA) ---

// 1. Obtener el total de ventas del día actual (Corte de caja)
app.get('/api/reporte-hoy', async (req, res) => {
    try {
        // Filtramos por la fecha actual usando el motor de PostgreSQL
        const [results] = await sequelize.query(`
            SELECT COALESCE(SUM(monto_total), 0) as total_hoy 
            FROM venta 
            WHERE fecha::date = CURRENT_DATE
        `);
        res.json(results[0]);
    } catch (error) {
        console.error('Error en reporte diario:', error);
        res.status(500).json({ error: 'Error al obtener ventas de hoy' });
    }
});

// 2. Obtener la tendencia de los últimos 7 días (Gráfica de líneas)
app.get('/api/reporte-semanal', async (req, res) => {
    try {
        // Consultamos la VISTA que creamos anteriormente en Neon
        const [results] = await sequelize.query('SELECT * FROM reporte_ventas_semanal');
        res.json(results);
    } catch (error) {
        console.error('Error en reporte semanal:', error);
        res.status(500).json({ error: 'Error al obtener tendencia semanal' });
    }
});

// --- RUTAS DE REPORTES PARA EL DASHBOARD ---

// 1. Endpoint para la gráfica de "Top 5 Productos más Vendidos"
app.get('/api/reporte-top-ventas', async (req, res) => {
    try {
        // Consultamos la VISTA que creamos anteriormente en Neon
        const [results] = await sequelize.query('SELECT * FROM reporte_top_ventas');
        res.json(results);
    } catch (error) {
        console.error('Error en reporte top ventas:', error);
        res.status(500).json({ error: 'Error al obtener el top de ventas' });
    }
});

// 2. Endpoint para los cuadros de "Datos Importantes" (KPIs)
app.get('/api/reporte-kpis', async (req, res) => {
    try {
        // Obtenemos el total de dinero y el número de ventas directamente
        const [results] = await sequelize.query(`
            SELECT 
                COUNT(*) as total_transacciones,
                COALESCE(SUM(monto_total), 0) as total_ingresos
            FROM venta
        `);
        // Enviamos solo la primera fila con los totales
        res.json(results[0]);
    } catch (error) {
        console.error('Error en reporte KPIs:', error);
        res.status(500).json({ error: 'Error al obtener indicadores financieros' });
    }
});

// Ruta para obtener los datos de la Vista de stock bajo (reporte para la gráfica)
app.get('/api/reporte-stock', async (req, res) => {
    try {
        // Usamos la instancia de sequelize para consultar la vista que creaste en Neon
        const [results] = await sequelize.query('SELECT * FROM reporte_inventario_critico');
        res.json(results);
    } catch (error) {
        console.error('Error al obtener el reporte de stock:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// VERIFICAR CONEXIÓN Y SINCRONIZAR MODELOS
sequelize.sync({ force: false }) 
  .then(async () => {
    console.log('✅ Base de Datos sincronizada y reparada.');
    
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

app.get('/', (req, res) => {
  res.send('API Tienda Don José funcionando con Sequelize 🚀');
});

// LOGIN 
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    
    const user = await Usuario.findOne({ where: { username: username } });

    if (!user) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

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

// PRODUCTOS 
app.get('/api/productos', async (req, res) => {
  try {
    const productos = await Producto.findAll({
      include: {
        model: Categoria,
        attributes: ['nombre_categoria'] 
      }
    });
    
    const respuesta = productos.map(p => {
      // Intentamos obtener el nombre buscando en 'Categoria' o 'categoria'
      const cat = p.Categoria || p.categoria;
      
      return {
        id_producto: p.id_producto,
        nombre_producto: p.nombre_producto,
        marca: p.marca,
        precio_venta: p.precio_venta,
        stock: p.stock,
        // --- LOS DOS CAMBIOS CLAVE ---
        id_categoria: p.id_categoria, // 1. Faltaba pasar este ID al frontend
        nombre_categoria: cat ? cat.nombre_categoria : 'Sin categoría' // 2. Verificación robusta
      };
    });

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

// CATEGORÍAS 
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

// PROVEEDORES
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

// VENTAS
app.post('/api/ventas', async (req, res) => {
  const { carrito, monto_total } = req.body;
  

  const t = await sequelize.transaction();

  try {
    // Crear la Venta
    const venta = await Venta.create({
      monto_total: monto_total
    }, { transaction: t });


    for (const item of carrito) {

      await DetalleVenta.create({
        id_venta: venta.id_venta,
        id_producto: item.id_producto,
        cantidad: item.cantidad,
        precio_unitario: item.precio_unitario
      }, { transaction: t });

    }

    await t.commit();
    res.json({ message: 'Venta registrada con éxito', id_venta: venta.id_venta });

  } catch (err) {

    await t.rollback();
    console.error(err);
    res.status(500).json({ error: 'Error al registrar la venta' });
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en el puerto ${port}`);
});