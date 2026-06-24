import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigned";
import { logService } from "./log.service";

const s3Client = new S3Client({
  region: process.env.S3_REGION ?? "us-east-1",
  endpoint: process.env.S3_ENDPOINT,
  forcePathStyle: true,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY ?? "",
    secretAccessKey: process.env.S3_SECRET_KEY ?? "",
  },
});

const BUCKET_NAME = process.env.S3_BUCKET ?? "arya-ide-storage";
const PRESIGNED_URL_EXPIRY = 3600;

export interface UploadResult {
  key: string;
  bucket: string;
  size: number;
  contentType: string;
  url: string;
}

export interface StorageMetadata {
  contentType?: string;
  metadata?: Record<string, string>;
}

export const storageService = {
  async upload(
    key: string,
    body: Buffer | Uint8Array | string,
    metadata?: StorageMetadata
  ): Promise<UploadResult> {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: body,
      ContentType: metadata?.contentType ?? "application/octet-stream",
      Metadata: metadata?.metadata,
    });

    await s3Client.send(command);

    const size = typeof body === "string" ? Buffer.byteLength(body) : body.byteLength;

    await logService.info("storage.upload", { key, size });

    return {
      key,
      bucket: BUCKET_NAME,
      size,
      contentType: metadata?.contentType ?? "application/octet-stream",
      url: `s3://${BUCKET_NAME}/${key}`,
    };
  },

  async download(key: string) {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const response = await s3Client.send(command);

    if (!response.Body) {
      throw new Error("Empty response body");
    }

    const chunks: Uint8Array[] = [];
    const stream = response.Body.transformToWebStream();
    const reader = stream.getReader();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
    }

    const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;

    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }

    return {
      body: Buffer.from(result),
      contentType: response.ContentType ?? "application/octet-stream",
      contentLength: response.ContentLength ?? 0,
      metadata: response.Metadata,
    };
  },

  async delete(key: string) {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
    await logService.info("storage.delete", { key });

    return { deleted: true, key };
  },

  async getPresignedUrl(key: string, expiresIn?: number): Promise<string> {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: expiresIn ?? PRESIGNED_URL_EXPIRY,
    });

    return url;
  },

  async getUploadPresignedUrl(
    key: string,
    contentType: string,
    expiresIn?: number
  ): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType,
    });

    const url = await getSignedUrl(s3Client, command, {
      expiresIn: expiresIn ?? PRESIGNED_URL_EXPIRY,
    });

    return url;
  },

  async exists(key: string): Promise<boolean> {
    try {
      const command = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      await s3Client.send(command);
      return true;
    } catch {
      return false;
    }
  },

  async getMetadata(key: string) {
    try {
      const command = new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const response = await s3Client.send(command);

      return {
        contentType: response.ContentType,
        contentLength: response.ContentLength,
        lastModified: response.LastModified,
        metadata: response.Metadata,
      };
    } catch {
      return null;
    }
  },
};
