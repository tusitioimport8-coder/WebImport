import { Router } from "express";
import adminController from "../controllers/AdminControllers.js";
import AdminController from "../controllers/AdminControllers.js";

// import { verificarAdminMiddleware } from "../middlewares/authMiddleware.js"; // Opcional si ya tienes el middleware de roles

const router = Router();

// Aplicar middlewares de autenticación y rol de admin si los tienes:
// router.use(verificarAuth, verificarAdminMiddleware);

router.get("/usuarios", (req, res) => adminController.listarUsuarios(req, res));
router.patch("/usuarios/:id/rol", (req, res) =>
  adminController.actualizarRol(req, res),
);

export default router;
