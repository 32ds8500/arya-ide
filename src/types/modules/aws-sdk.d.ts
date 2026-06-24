declare module '@aws-sdk/client-s3' {
  export class S3Client {
    constructor(options?: any);
    send(command: any): Promise<any>;
  }
  export class PutObjectCommand {
    constructor(input: any);
  }
  export class GetObjectCommand {
    constructor(input: any);
  }
  export class DeleteObjectCommand {
    constructor(input: any);
  }
  export class HeadObjectCommand {
    constructor(input: any);
  }
  export class ListObjectsV2Command {
    constructor(input: any);
  }
}
declare module '@aws-sdk/s3-request-presigned' {
  export function getSignedUrl(client: any, command: any, options?: any): Promise<string>;
}
