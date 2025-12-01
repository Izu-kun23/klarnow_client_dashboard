import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary } from '@/lib/cloudinary'

/**
 * PUT /api/upload/multiple
 * Uploads multiple files to Cloudinary
 * 
 * Request: multipart/form-data with multiple 'files' fields
 */
export async function PUT(request: NextRequest) {
  try {
    // Check if Cloudinary is configured
    const hasCloudinaryUrl = !!process.env.CLOUDINARY_URL
    const hasIndividualVars = !!(process.env.CLOUDINARY_CLOUD_NAME && 
                                  process.env.CLOUDINARY_API_KEY && 
                                  process.env.CLOUDINARY_API_SECRET)
    
    if (!hasCloudinaryUrl && !hasIndividualVars) {
      console.error('[API PUT /api/upload/multiple] Cloudinary not configured')
      return NextResponse.json(
        { 
          error: 'Cloudinary not configured',
          message: 'Please set CLOUDINARY_URL or individual Cloudinary credentials (CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET) in your .env file.'
        },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]

    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No files provided' },
        { status: 400 }
      )
    }

    // Validate file sizes
    const maxSize = 10 * 1024 * 1024 // 10MB
    for (const file of files) {
      if (file.size > maxSize) {
        return NextResponse.json(
          { error: `File ${file.name} exceeds 10MB limit` },
          { status: 400 }
        )
      }
    }

    // Get folder from query params or FormData
    const { searchParams } = new URL(request.url)
    const folderFromQuery = searchParams.get('folder')
    const folderFromFormData = formData.get('folder') as string | null
    const folder = folderFromQuery || folderFromFormData || 'task-attachments'

    // Convert files to buffers and upload
    const uploadPromises = files.map(async (file) => {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      return uploadToCloudinary(
        buffer,
        file.name,
        folder,
        'auto'
      )
    })

    const results = await Promise.all(uploadPromises)

    console.log(`[API PUT /api/upload/multiple] ${results.length} files uploaded successfully`)

    return NextResponse.json({
      success: true,
      files: results.map(result => ({
        url: result.secure_url,
        public_id: result.public_id,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height
      }))
    })
  } catch (error: any) {
    console.error('[API PUT /api/upload/multiple] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to upload files',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

