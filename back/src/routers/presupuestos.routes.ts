import { Router } from "express";
import presupuestoController from "../controllers/PresupuestoController.js";
import { authMiddleware } from "../middlewares/AuthMiddleware.js";
import { requireRole } from "../middlewares/RoleMiddleware.js";

const router = Router();

// 🔒 Seguridad: Exigir sesión activa y que el usuario sea 'F_ventas' o 'admin'
router.use(requireRole("admin", "F_ventas"));
// Rutas de Presupuestos / Cotizaciones al Mayor
router.post("/", (req, res) =>
  presupuestoController.crearPresupuesto(req, res),
);
router.get("/", (req, res) =>
  presupuestoController.listarPresupuestos(req, res),
);
router.patch("/:id/estado", (req, res) =>
  presupuestoController.cambiarEstado(req, res),
);

export default router;
