import { NextRequest, NextResponse } from 'next/server'
import { uploadToCloudinary } from '@/lib/cloudinary'

/**
 * POST /api/upload
 * Uploads a file to Cloudinary and returns the URL
 * 
 * Request: multipart/form-data with 'file' field
 * Response: { url: string, public_id: string, ... }
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_URL && 
        (!process.env.CLOUDINARY_CLOUD_NAME || 
         !process.env.CLOUDINARY_API_KEY || 
         !process.env.CLOUDINARY_API_SECRET)) {
      return NextResponse.json(
        { error: 'Cloudinary not configured. Please set CLOUDINARY_URL or individual Cloudinary credentials.' },
        { status: 500 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 10MB limit' },
        { status: 400 }
      )
    }

    // Convert File to Buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Get folder from query params or use default
    const { searchParams } = new URL(request.url)
    const folder = searchParams.get('folder') || 'task-attachments'

    // Upload to Cloudinary
    const result = await uploadToCloudinary(
      buffer,
      file.name,
      folder,
      'auto' // Auto-detect resource type
    )

    console.log(`[API POST /api/upload] File uploaded successfully: ${result.secure_url}`)

    return NextResponse.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height
    })
  } catch (error: any) {
    console.error('[API POST /api/upload] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to upload file',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}


