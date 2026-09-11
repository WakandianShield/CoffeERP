const express = require('express');
const cors = require('cors');
const productRoutes = require('./routes/product.routes');

const app = express();
const PORT = process.env.PORT || 3200;

app.use(cors());
app.use(express.json());


app.listen(PORT, () => {
  console.log(`SERVIDOR EJECUTANDOSE EN EL PUERTO ${PORT}`);
});
