/**
 * CloudinaryAdapter — default storage provider.
 * PRD Section 3.1.1
 *
 * Binary data NEVER passes through the API server (client-direct upload flow).
 * PRD Section 3.1.3
 */
import { v2 as cloudinary } from 'cloudinary'
import type { IStorageService, UploadOptions, UploadResult, TransformOptions, SignedUploadParams } from '../IStorageService.js'

interface CloudinaryConfig {
  cloudName: string
  apiKey: string
  apiSecret: string
}

export class CloudinaryAdapter implements IStorageService {
  constructor(config: CloudinaryConfig) {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
    })
  }

  async upload(file: Buffer, opts: UploadOptions): Promise<UploadResult> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: opts.folder,
          public_id: opts.fileName,
          resource_type: opts.resourceType ?? 'image',
          tags: opts.tags,
        },
        (error, result) => {
          if (error || !result) return reject(error ?? new Error('Upload failed'))
          resolve({
            publicId: result.public_id,
            url: result.url,
            secureUrl: result.secure_url,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes,
          })
        }
      )
      stream.end(file)
    })
  }

  async delete(publicId: string): Promise<void> {
    await cloudinary.uploader.destroy(publicId)
  }

  async getSignedUrl(publicId: string, expiresIn: number): Promise<string> {
    return cloudinary.utils.private_download_url(publicId, 'jpg', {
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    })
  }

  transform(publicId: string, transforms: TransformOptions): string {
    return cloudinary.url(publicId, {
      width: transforms.width,
      height: transforms.height,
      crop: transforms.crop,
      quality: transforms.quality,
      format: transforms.format,
      secure: true,
    })
  }

  async generateSignedUploadParams(opts: UploadOptions): Promise<SignedUploadParams> {
    const timestamp = Math.round(Date.now() / 1000)
    const paramsToSign = { folder: opts.folder, timestamp }
    const signature = cloudinary.utils.api_sign_request(paramsToSign, cloudinary.config().api_secret!)

    return {
      signature,
      timestamp,
      cloudName: cloudinary.config().cloud_name!,
      apiKey: cloudinary.config().api_key!,
      folder: opts.folder,
    }
  }
}
