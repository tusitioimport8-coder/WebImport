import { Router } from "express";
import Auth from "../controllers/AuthControllers.js";

const router = Router();

router.post("/login", (req, res) => Auth.login(req, res));
router.post("/register", (req, res) => Auth.register(req, res));
router.post("/logout", (req, res) => Auth.logout(req, res));
router.post("/google-auth", (req, res) => Auth.googleAuth(req, res));
router.put("/update-user", (req, res) => Auth.updateUser(req, res));
router.delete("/delete-user", (req, res) => Auth.deleteUser(req, res));
router.get("/check-session", (req, res) => Auth.checkSession(req, res));

export default router;
