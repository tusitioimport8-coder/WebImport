import { Router } from "express";
import Auth from "../controllers/AuthControllers.js";

const router = Router();

router.post("/login", (req, res) => Auth.login(req, res));
router.post("/register", (req, res) => Auth.register(req, res));
router.post("/logout", (req, res) => Auth.logout(req, res));

export default router;
