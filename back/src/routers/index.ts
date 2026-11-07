import { Router } from "express";
import authRoutes from "./auth.routes.js";
import productoRoutes from "./producto.routes.js";
import categoriaRoutes from "./categoria.routes.js";
import sugerenciasRoutes from "./sugerencias.routes.js";
import listaDeseoRoutes from "./listaDeseo.routes.js";
import bannerRoutes from "./banner.routes.js";
import OrdenRoute from "./orden.routes.js";
import adminRoutes from "./admin.routes.js";
import { authMiddleware } from "../middlewares/AuthMiddleware.js";
import { requireRole } from "../middlewares/RoleMiddleware.js";

const router = Router();

// Asignas prefijos limpios
router.use("/auth", authRoutes);
router.use("/productos", productoRoutes);
router.use("/categorias", categoriaRoutes);
router.use("/sugerencias", sugerenciasRoutes);
router.use("/lista-deseos", listaDeseoRoutes);
router.use("/banners", bannerRoutes);
router.use("/admin", authMiddleware, requireRole("ADMIN"), adminRoutes);
router.use("/orden", OrdenRoute);
router.get("/ventas-locales", (req, res) => {
  // Lógica para manejar las ventas locales
  console.log("Ventas locales endpoint alcanzado");
  res.status(200).json({ message: "Ventas locales endpoint" });
});

export default router;
