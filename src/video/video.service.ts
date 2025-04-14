import { Injectable } from '@nestjs/common';
import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class VideoService {
  generateSignedUrl(filename: string) {
    // Get credentials and params
    const cloudfrontUrl = process.env.AWS_CLOUDFRONT_URL;
    const keyPairId = process.env.AWS_KEY_PAIR_ID;
    const privateKeyPath = process.env.AWS_PRIVATE_KEY_PATH;
    const expiresIn = parseInt(
      process.env.SIGNED_URL_EXPIRES_IN_SECONDS || '300',
    );
    // Get generated private key
    const privateKey = fs.readFileSync(
      path.resolve(privateKeyPath || ''),
      'utf8',
    );
    // Generate a signed URL from AWS pointing to Cloudfront
    const signedUrl = getSignedUrl({
      url: `${cloudfrontUrl}/${filename}`,
      keyPairId: keyPairId || '',
      privateKey,
      dateLessThan: new Date(Date.now() + expiresIn * 1000).toISOString(),
    });
    // Return
    return { url: signedUrl };
  }
}
