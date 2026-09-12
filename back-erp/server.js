const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/product.routes');
const usuarioRoutes = require('./routes/usuario.routes');

const app = express();
const PORT = process.env.PORT || 3200;

app.use(cors());
app.use(express.json());

// ESTA RUTA PERMITE MOSTRAR LAS IMAGENES GUARDADAS.
app.use('/uploads', express.static('uploads'));

// ESTAS RUTAS CONECTAN EL FRONTEND CON PRODUCTOS Y USUARIOS.
app.use('/api/productos', productRoutes);
app.use('/api/usuarios', usuarioRoutes);


app.listen(PORT, () => {
  console.log(`SERVIDOR EJECUTANDOSE EN EL PUERTO ${PORT}`);
});
