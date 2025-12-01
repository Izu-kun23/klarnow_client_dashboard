import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
// Cloudinary SDK automatically reads CLOUDINARY_URL from environment if set
// Otherwise, use individual environment variables
if (process.env.CLOUDINARY_URL) {
  // CLOUDINARY_URL format: cloudinary://api_key:api_secret@cloud_name
  // The SDK will automatically parse it, just ensure secure is enabled
  cloudinary.config({
    secure: true
  })
  console.log('[Cloudinary] Configured using CLOUDINARY_URL')
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
  // Fall back to individual environment variables
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
  })
  console.log('[Cloudinary] Configured using individual environment variables')
} else {
  console.warn('[Cloudinary] Not configured - CLOUDINARY_URL or individual credentials not found')
}

export interface CloudinaryUploadResult {
  public_id: string
  secure_url: string
  url: string
  format: string
  width?: number
  height?: number
  bytes: number
  created_at: string
}

/**
 * Upload a file to Cloudinary
 * @param fileBuffer - File buffer from FormData
 * @param folder - Optional folder path in Cloudinary (e.g., 'task-attachments')
 * @param resourceType - 'image', 'raw', 'video', or 'auto'
 */
export async function uploadToCloudinary(
  fileBuffer: Buffer,
  fileName: string,
  folder: string = 'task-attachments',
  resourceType: 'image' | 'raw' | 'video' | 'auto' = 'auto'
): Promise<CloudinaryUploadResult> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        use_filename: true,
        unique_filename: true,
        overwrite: false
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error)
          reject(error)
          return
        }

        if (!result) {
          reject(new Error('Upload failed: No result from Cloudinary'))
          return
        }

        resolve({
          public_id: result.public_id,
          secure_url: result.secure_url,
          url: result.url,
          format: result.format || '',
          width: result.width,
          height: result.height,
          bytes: result.bytes,
          created_at: result.created_at || new Date().toISOString()
        })
      }
    )

    uploadStream.end(fileBuffer)
  })
}

/**
 * Upload multiple files to Cloudinary
 */
export async function uploadMultipleToCloudinary(
  files: Array<{ buffer: Buffer; fileName: string; mimeType: string }>,
  folder: string = 'task-attachments'
): Promise<CloudinaryUploadResult[]> {
  const uploadPromises = files.map(({ buffer, fileName, mimeType }) => {
    // Determine resource type from MIME type
    let resourceType: 'image' | 'raw' | 'video' | 'auto' = 'auto'
    if (mimeType.startsWith('image/')) {
      resourceType = 'image'
    } else if (mimeType.startsWith('video/')) {
      resourceType = 'video'
    } else {
      resourceType = 'raw'
    }

    return uploadToCloudinary(buffer, fileName, folder, resourceType)
  })

  return Promise.all(uploadPromises)
}

/**
 * Delete a file from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<void> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.destroy(publicId, (error, result) => {
      if (error) {
        console.error('Cloudinary delete error:', error)
        reject(error)
        return
      }
      resolve()
    })
  })
}

export { cloudinary }

