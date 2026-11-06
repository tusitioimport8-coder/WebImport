import { Router } from "express";
import presupuestoController from "../controllers/PresupuestoController.js";
import { authMiddleware } from "../middlewares/AuthMiddleware.js";
import { requireRole } from "../middlewares/RoleMiddleware.js";

const router = Router();

// 🔒 Seguridad: Exigir sesión activa y que el usuario sea 'F_ventas' o 'ADMIN'
router.use(requireRole("ADMIN", "F_VENTAS"));
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

router.get("/:id", (req, res) =>
  presupuestoController.obtenerPresupuestoPorId(req, res),
);

router.delete("/:id", (req, res) =>
  presupuestoController.eliminarPresupuesto(req, res),
);

export default router;
