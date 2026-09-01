export function authMiddleware(req: any, res: any, next: any) {
  console.log("[AuthMiddleware] request a ruta protegida, session:", req.session?.user);
  if (!req.session.user) {
    return res.status(401).json({
      success: false,
      message: "No autorizado",
    });
  }

  next();
}
