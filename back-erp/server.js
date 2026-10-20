require("dotenv").config();
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
  throw new Error("Configura JWT_SECRET con al menos 32 caracteres aleatorios");
const { createApp } = require("./app");
createApp().listen(Number(process.env.PORT || 3200), "127.0.0.1", () =>
  console.log(
    "CoffeERP API disponible en el puerto " + (process.env.PORT || 3200),
  ),
);
