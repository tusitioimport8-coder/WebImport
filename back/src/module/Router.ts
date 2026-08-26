import express from "express";
import { authMiddleware } from "./Middleware.js";
import Auth from "./Auth.js";
import BO from "./ImportBO.js";

const router = express.Router();

// ==========================================
// AUTENTICACIÓN
// ==========================================

router.post("/login", async (req, res) => {
  await Auth.login(req, res);
});

router.post("/register", async (req, res) => {
  await Auth.register(req, res);
});

router.post("/logout", async (req, res) => {
  await Auth.logout(req, res);
});

export default router;
