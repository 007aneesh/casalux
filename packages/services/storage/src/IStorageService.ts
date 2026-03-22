/**
 * IStorageService — Service Bus Interface for file/media storage.
 * PRD Section 3.1
 *
 * All storage operations go through this interface.
 * Swap provider by changing the adapter in apps/api/src/container.ts.
 */

export interface UploadOptions {
  folder: 'listings' | 'hosts' | 'avatars'
  fileName?: string
  resourceType?: 'image' | 'video' | 'raw'
  tags?: string[]
}

export interface UploadResult {
  publicId: string      // Provider-agnostic internal ID
  url: string           // CDN-delivered public URL
  secureUrl: string
  width?: number
  height?: number
  format: string
  bytes: number
}

export interface TransformOptions {
  width?: number
  height?: number
  crop?: string
  quality?: number | 'auto'
  format?: string
}

export interface SignedUploadParams {
  signature: string
  timestamp: number
  cloudName: string
  apiKey: string
  folder: string
}

export interface IStorageService {
  upload(file: Buffer, options: UploadOptions): Promise<UploadResult>
  delete(publicId: string): Promise<void>
  getSignedUrl(publicId: string, expiresIn: number): Promise<string>
  transform(publicId: string, transforms: TransformOptions): string
  generateSignedUploadParams(options: UploadOptions): Promise<SignedUploadParams>
}
