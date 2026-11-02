import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { createDecipheriv, createCipheriv, randomBytes } from 'crypto';

type EncryptedValue = {
  enc: string;
  iv: string;
  tag: string;
};

function getSecretsKey(): Buffer {
  const raw = process.env.INVOICING_INTEGRATION_SECRETS_KEY_BASE64?.trim();
  if (!raw) {
    throw new ServiceUnavailableException(
      'Missing INVOICING_INTEGRATION_SECRETS_KEY_BASE64',
    );
  }
  let buf: Buffer;
  try {
    buf = Buffer.from(raw, 'base64');
  } catch {
    throw new ServiceUnavailableException(
      'Invalid INVOICING_INTEGRATION_SECRETS_KEY_BASE64',
    );
  }
  if (buf.length !== 32) {
    throw new ServiceUnavailableException(
      'INVOICING_INTEGRATION_SECRETS_KEY_BASE64 must decode to 32 bytes',
    );
  }
  return buf;
}

@Injectable()
export class IntegrationSecretsService {
  encrypt(plainText: string): EncryptedValue {
    const key = getSecretsKey();
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plainText, 'utf8'),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return {
      enc: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
    };
  }

  decrypt(value: EncryptedValue): string {
    const key = getSecretsKey();
    const iv = Buffer.from(value.iv, 'base64');
    const tag = Buffer.from(value.tag, 'base64');
    const enc = Buffer.from(value.enc, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(enc), decipher.final()]);
    return decrypted.toString('utf8');
  }
}

