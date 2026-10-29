import OrdenControllers from "../controllers/OrdenControllers";
import { authMiddleware } from "../middlewares/AuthMiddleware.js";
import { requireRole } from "../middlewares/RoleMiddleware.js";
import { Router } from "express";

const router = Router();

// GET /api/orden -> Lista todas las ordenes
router.get("/", requireRole("ADMIN"), (req, res) =>
  OrdenControllers.listarPedidos(req, res),
);

// POST /api/orden -> Crea o actualiza una orden (Upsert por identificador)
router.post("/", (req, res) => OrdenControllers.crearPedido(req, res));

// GET /api/orden/:identificador -> Obtiene una orden específica por su identificador
router.get("/:id", (req, res) => OrdenControllers.obtenerPedido(req, res));

// DELETE /api/orden/:identificador -> Elimina una orden específica por su identificador
router.delete("/:id", authMiddleware, (req, res) =>
  OrdenControllers.eliminarPedido(req, res),
);

export default router;
