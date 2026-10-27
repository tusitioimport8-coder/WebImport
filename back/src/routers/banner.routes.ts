import { Router } from "express";
import bannerController from "../controllers/BannerControllers.js";
import { requireRole } from "../middlewares/RoleMiddleware.js";
import { authMiddleware } from "../middlewares/AuthMiddleware.js";

const router = Router();

// GET /api/banners -> Lista todos los banners
router.get("/", (req, res) => bannerController.listarBanners(req, res));

// POST /api/banners -> Crea o actualiza un banner (Upsert por identificador)
router.post("/", authMiddleware, requireRole("MARKETING"), (req, res) =>
  bannerController.guardarBanner(req, res),
);

// GET /api/banners/:identificador -> Obtiene un banner específico por su identificador
router.get("/:identificador", (req, res) =>
  bannerController.obtenerBanner(req, res),
);

// DELETE /api/banners/:identificador -> Elimina un banner específico por su identificador
router.delete(
  "/:identificador",
  authMiddleware,
  requireRole("MARKETING"),
  (req, res) => bannerController.eliminarBanner(req, res),
);

export default router;
