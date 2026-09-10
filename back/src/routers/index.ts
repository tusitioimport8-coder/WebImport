import { Router } from "express";
import authRoutes from "./auth.routes.js";
import productoRoutes from "./producto.routes.js";
import carritoRoutes from "./carrito.routes.js";
import categoriaRoutes from "./categoria.routes.js";

const router = Router();

// Asignas prefijos limpios
router.use("/auth", authRoutes);
router.use("/productos", productoRoutes);
router.use("/carrito", carritoRoutes);
router.use("/categorias", categoriaRoutes);

export default router;
