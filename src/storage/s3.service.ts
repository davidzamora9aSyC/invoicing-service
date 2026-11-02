import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private client: S3Client;
  private publicClient: S3Client;

  constructor(private readonly config: ConfigService) {
    const endpoint = this.config.get<string>('S3_ENDPOINT');
    const publicEndpoint = this.config.get<string>('S3_PUBLIC_ENDPOINT') ?? endpoint;
    const region = this.config.get<string>('S3_REGION') ?? 'us-east-1';
    const accessKeyId = this.config.get<string>('S3_ACCESS_KEY');
    const secretAccessKey = this.config.get<string>('S3_SECRET_KEY');
    const forcePathStyle = this.config.get<string>('S3_FORCE_PATH_STYLE') === 'true';
    const credentials = accessKeyId && secretAccessKey ? { accessKeyId, secretAccessKey } : undefined;

    this.client = new S3Client({
      region,
      endpoint: endpoint || undefined,
      forcePathStyle,
      credentials,
    });
    this.publicClient = new S3Client({
      region,
      endpoint: publicEndpoint || undefined,
      forcePathStyle,
      credentials,
    });
  }

  async putObject(params: {
    bucket: string;
    objectKey: string;
    body: Uint8Array;
    contentType?: string;
    metadata?: Record<string, string>;
  }) {
    const command = new PutObjectCommand({
      Bucket: params.bucket,
      Key: params.objectKey,
      Body: params.body,
      ContentType: params.contentType,
      Metadata: params.metadata,
    });
    return this.client.send(command);
  }

  async createViewUrl(params: { bucket: string; objectKey: string; expiresIn: number }) {
    const command = new GetObjectCommand({
      Bucket: params.bucket,
      Key: params.objectKey,
    });
    return getSignedUrl(this.publicClient, command, { expiresIn: params.expiresIn });
  }
}

