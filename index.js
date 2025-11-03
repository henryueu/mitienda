// 1. Cargar las variables de entorno (del archivo .env)
require('dotenv').config();

// 2. Importar las librerías
const express = require('express');
const { Pool } = require('pg'); // Importar el conector de PostgreSQL

// 3. Crear la aplicación Express
const app = express();
// Usar el puerto de Render o el 3000 si es local
const port = process.env.PORT || 3000;

// 4. Configurar la conexión a la Base de Datos
console.log('La URL de conexión es:', process.env.DATABASE_URL);
// 'Pool' maneja múltiples conexiones eficientemente.
const pool = new Pool({
connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
  // ---------------------------------
});

// 5. Crear una ruta de prueba (Homepage)
app.get('/', (req, res) => {
  res.send('¡API de la Tienda de Don José funcionando!');
});

// 6. ***** ¡LA RUTA DE PRUEBA DE CONEXIÓN! *****
// Vamos a crear un endpoint para LEER todas las categorías
app.get('/api/categorias', async (req, res) => {
  try {
    // 1. Pedirle al 'pool' una conexión
    const client = await pool.connect();
    
    // 2. Usar la conexión para hacer una consulta SQL
    const result = await client.query('SELECT * FROM CATEGORIA');
    
    // 3. Devolver los resultados como JSON
    res.json(result.rows);
    
    // 4. Liberar la conexión de vuelta al 'pool'
    client.release();

  } catch (err) {
    // Si algo sale mal, enviar un error
    console.error(err);
    res.status(500).send('Error al conectar con la base de datos: ' + err.message);
  }
});

// 7. Iniciar el servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});