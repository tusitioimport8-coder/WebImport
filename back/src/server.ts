import app from "./utils/middleware.js";
import apiRouter from "./routers/index.js";

const PORT = process.env.PORT || 5000;
// Rutas REST
app.use("/api", apiRouter);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
