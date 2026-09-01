import { Router } from "express";
import authRoutes from "./auth.routes.js";
import productoRoutes from "./producto.routes.js";

const router = Router();

// Asignas prefijos limpios
router.use("/auth", authRoutes);
router.use("/productos", productoRoutes);

export default router;
