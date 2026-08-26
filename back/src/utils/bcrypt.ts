import bcrypt from "bcrypt";

class UtilBycript {
  constructor() {}

  async hash(passwordPlano: string) {
    const saltRounds = 10;
    return bcrypt.hash(passwordPlano, saltRounds);
  }

  async compare(passwordPlano: string, hashEnBD: string) {
    if (!passwordPlano || !hashEnBD) {
      return false;
    }

    if (passwordPlano === hashEnBD) {
      return true;
    }

    if (typeof hashEnBD === "string" && hashEnBD.startsWith("$2")) {
      return bcrypt.compare(passwordPlano, hashEnBD);
    }

    return false;
  }
}

export default new UtilBycript();
