import app from "./utils/middleware.js";
import Router from "./module/Router.js";

const PORT = process.env.PORT || 4000;
// Rutas REST
app.use("/api/import", Router);

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});
