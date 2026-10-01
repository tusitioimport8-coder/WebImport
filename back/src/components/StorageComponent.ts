import {
  S3Client,
  PutObjectCommand,
  HeadBucketCommand,
  CreateBucketCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export enum StorageFolder {
  PRODUCTO_IMAGEN = "productos/imagenes",
  PRODUCTO_VIDEO = "productos/videos",
  USUARIO_AVATAR = "usuarios/avatars",
}

export class StorageService {
  private s3: S3Client;
  private bucketName: string;
  private publicUrlPrefix: string;

  constructor() {
    // 1. Obtención de variables idéntica al script de prueba
    this.bucketName =
      process.env.AWS_BUCKET_NAME ||
      process.env.S3_BUCKET_NAME ||
      "mi-tienda-local";

    const endpoint =
      process.env.AWS_ENDPOINT_URL_S3 ||
      process.env.S3_ENDPOINT ||
      "http://localhost:9090";

    const region =
      process.env.AWS_REGION || process.env.S3_REGION || "us-east-1";

    const accessKeyId =
      process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY_ID || "test";

    const secretAccessKey =
      process.env.AWS_SECRET_ACCESS_KEY ||
      process.env.S3_SECRET_ACCESS_KEY ||
      "test";

    // Prefijo para construir la URL pública final
    this.publicUrlPrefix = `${endpoint}/${this.bucketName}`;

    // 2. S3Client forzando pathStyle de manera explícita (como en el script)
    this.s3 = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
      forcePathStyle: true, // FORZADO SIEMPRE A TRUE
    });

    // 3. Verificación automática del bucket en segundo plano
    this.asegurarBucket();
  }

  private async asegurarBucket(): Promise<void> {
    try {
      await this.s3.send(new HeadBucketCommand({ Bucket: this.bucketName }));
    } catch {
      try {
        await this.s3.send(
          new CreateBucketCommand({ Bucket: this.bucketName }),
        );
        console.log(`✅ Bucket "${this.bucketName}" verificado/creado.`);
      } catch (error) {
        console.error("⚠️ No se pudo asegurar el bucket:", error);
      }
    }
  }

  async generarPresignedUrl(
    nombreOriginal: string,
    tipoMime: string,
    carpeta: StorageFolder | string,
  ) {
    const extension = nombreOriginal.split(".").pop();
    const nombreUnico = `${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${extension}`;
    const objectKey = `${carpeta}/${nombreUnico}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: objectKey,
      ContentType: tipoMime,
    });

    // La URL firmada incluirá automáticamente /nombre-bucket/gracias a forcePathStyle: true
    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 });
    const publicUrl = `${this.publicUrlPrefix}/${objectKey}`;

    return { uploadUrl, publicUrl, objectKey };
  }
}

export default new StorageService();
