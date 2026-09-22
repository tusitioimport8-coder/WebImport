import { Router } from "express";
import ProductController from "../controllers/ProductController.js";
import { authMiddleware } from "../middlewares/AuthMiddleware.js";
import { handleProductoUpload } from "../middlewares/uploadMiddleware.js";

const router = Router();

// Endpoint: POST /api/productos/product
router.post("/product", handleProductoUpload, (req, res) =>
  ProductController.createProducto(req, res),
);

router.put("/product/:id", authMiddleware, handleProductoUpload, (req, res) =>
  ProductController.updateProducto(req, res),
);

router.delete("/product/:id", authMiddleware, (req, res) =>
  ProductController.deleteProducto(req, res),
);

router.get("/product/:id", (req, res) =>
  ProductController.getProductoPorId(req, res),
);

router.get("/products", (req, res) => ProductController.getProductos(req, res));

export default router;
