import { Router } from "express";
import ProductController from "../controllers/ProductController.js";
import { authMiddleware } from "../middlewares/AuthMiddleware.js";
import { solicitarPresignedUrl } from "../middlewares/uploadMiddleware.js";

const router = Router();

// Endpoint: POST /api/productos/product
router.post("/", (req, res) => ProductController.createProducto(req, res));

router.put("/:id", authMiddleware, (req, res) =>
  ProductController.updateProducto(req, res),
);

router.delete("/:id", authMiddleware, (req, res) =>
  ProductController.deleteProducto(req, res),
);

router.get("/:id", (req, res) => ProductController.getProductoPorId(req, res));

router.get("/", (req, res) => ProductController.getProductos(req, res));

router.post("/upload-url", solicitarPresignedUrl);

export default router;
