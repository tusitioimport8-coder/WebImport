import categoriaController from "../controllers/CategoriaController";
import { Router } from "express";
import { Response, Request } from "express";

const router = Router();

router.get("/", (req: Request, res: Response) => {
  categoriaController.obtenerCategorias(req, res);
});
router.get("/:id", (req: Request, res: Response) => {
  categoriaController.obtenerCategoriaPorId(req, res);
});
router.post("/", (req: Request, res: Response) => {
  categoriaController.crearCategoria(req, res);
});
router.put("/:id", (req: Request, res: Response) => {
  categoriaController.actualizarCategoria(req, res);
});
router.delete("/:id", (req: Request, res: Response) => {
  categoriaController.eliminarCategoria(req, res);
});

export default router;
