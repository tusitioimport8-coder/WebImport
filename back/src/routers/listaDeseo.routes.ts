import ListaDeseoController from "../controllers//ListaDeseoControllers.js";
import { Response, Request } from "express";
import { Router } from "express";
import { authMiddleware } from "../middlewares/AuthMiddleware.js";

const router = Router();

router.get("/", authMiddleware, (req: Request, res: Response) => {
  ListaDeseoController.obtenerOCrearLista(req, res);
});
router.get("/publica/:token", authMiddleware, (req: Request, res: Response) => {
  ListaDeseoController.obtenerPorToken(req, res);
});
router.post("/item", authMiddleware, (req: Request, res: Response) => {
  ListaDeseoController.agregarItem(req, res);
});
router.delete("/item", authMiddleware, (req: Request, res: Response) => {
  ListaDeseoController.eliminarItem(req, res);
});
router.put("/item/comprado", authMiddleware, (req: Request, res: Response) => {
  ListaDeseoController.marcarComprado(req, res);
});

export default router;
