import { Router } from "express";
import { CarritoController } from "../controllers/CarritoControllers.js";
import { authMiddleware } from "../middlewares/AuthMiddleware.js";
import { generarLinkWhatsApp } from "../utils/Messenge.js";
const router = Router();
const carritoController = new CarritoController();

// GET /api/carrito -> Ver carrito completo procesado
router.get("/carrito", authMiddleware, (req, res) =>
  carritoController.obtenerCarrito(req, res),
);

// POST /api/carrito -> Agregar / Incrementar producto
router.post("/carrito", authMiddleware, (req, res) =>
  carritoController.agregarItem(req, res),
);

// PUT /api/carrito/:productoId -> Actualizar cantidad exacta
router.put("/carrito/:productoId", authMiddleware, (req, res) =>
  carritoController.actualizarCantidad(req, res),
);

// DELETE /api/carrito/:productoId -> Eliminar producto individual
router.delete("/carrito/:productoId", authMiddleware, (req, res) =>
  carritoController.eliminarProducto(req, res),
);

// DELETE /api/carrito -> Vaciar el carrito completo
router.delete("/carrito", authMiddleware, (req, res) =>
  carritoController.vaciarCarrito(req, res),
);

router.get("/carrito/whatsapp", (req, res) => generarLinkWhatsApp(req, res));

export default router;
