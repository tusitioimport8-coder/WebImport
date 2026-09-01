export function authMiddleware(req: any, res: any, next: any) {
  // console.log("=================================");
  console.log("[AuthMiddleware] sessionID:", req.sessionID);
  // console.log("[AuthMiddleware] session:", req.session);
  //console.log("[AuthMiddleware] user:", req.session?.user.id);
  // console.log("=================================");

  if (!req.session?.user) {
    return res.status(401).json({
      success: false,
      message: "No autorizado",
    });
  }

  next();
}
