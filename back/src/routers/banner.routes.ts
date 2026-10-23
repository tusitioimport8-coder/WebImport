import { Router } from "express";
import bannerController from "../controllers/BannerControllers.js";

const router = Router();

// GET /api/banners -> Lista todos los banners
router.get("/", (req, res) => bannerController.listarBanners(req, res));

// POST /api/banners -> Crea o actualiza un banner (Upsert por identificador)
router.post("/", (req, res) => bannerController.guardarBanner(req, res));

export default router;
