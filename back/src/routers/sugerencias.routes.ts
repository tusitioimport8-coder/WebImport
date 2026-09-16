import SugerenciaController from "../controllers/SugerenciasController.js";
import { Router } from "express";
import { authMiddleware } from "../middlewares/AuthMiddleware.js";
const router = Router();

router.post("/agregar", authMiddleware, (req, res) =>
  SugerenciaController.agregarSugerencia(req, res),
);

router.get("/obtener", authMiddleware, (req, res) =>
  SugerenciaController.obtenerSugerencias(req, res),
);

export default router;
