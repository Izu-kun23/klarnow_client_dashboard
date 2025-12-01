# Cloudinary Setup Guide

## Overview

This application uses Cloudinary for file uploads, including task response attachments, onboarding form files (logos, photos), and other document uploads.

## Prerequisites

1. Create a Cloudinary account at https://cloudinary.com
2. Get your Cloudinary credentials from the dashboard

## Environment Variables

Add the following to your `.env` file. You can use either method:

### Method 1: Single CLOUDINARY_URL (Recommended)

```env
CLOUDINARY_URL=cloudinary://api_key:api_secret@cloud_name
```

Example:
```env
CLOUDINARY_URL=cloudinary://123456789012345:abcdefghijklmnopqrstuvwxyz@your-cloud-name
```

### Method 2: Individual Variables

```env
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

**Important:** 
- Never commit these credentials to version control. Keep them in `.env` (which should be in `.gitignore`).
- If both `CLOUDINARY_URL` and individual variables are set, `CLOUDINARY_URL` takes precedence.

## Installation

Cloudinary is already installed. If you need to reinstall:

```bash
npm install cloudinary
```

## Configuration

The Cloudinary configuration is in `src/lib/cloudinary.ts`. It automatically reads from environment variables.

## Usage

### Upload Single File

```typescript
import { uploadToCloudinary } from '@/lib/cloudinary'

const fileBuffer = Buffer.from(fileData)
const result = await uploadToCloudinary(
  fileBuffer,
  'filename.pdf',
  'task-attachments', // folder
  'auto' // resource type: 'image', 'raw', 'video', or 'auto'
)

console.log(result.secure_url) // Use this URL
```

### Upload via API

**Endpoint:** `POST /api/upload`

```javascript
const formData = new FormData()
formData.append('file', fileInput.files[0])

const response = await fetch('/api/upload?folder=task-attachments/task-123', {
  method: 'POST',
  body: formData
})

const data = await response.json()
console.log(data.url) // Cloudinary URL
```

### Upload Multiple Files

**Endpoint:** `PUT /api/upload/multiple`

```javascript
const formData = new FormData()
files.forEach(file => {
  formData.append('files', file)
})

const response = await fetch('/api/upload/multiple?folder=task-attachments/task-123', {
  method: 'PUT',
  body: formData
})

const data = await response.json()
console.log(data.files) // Array of uploaded file info
```

## File Organization

Files are organized in Cloudinary folders:
- `task-attachments/{task_id}/` - Task response attachments
- `onboarding/logos/` - Client logos
- `onboarding/photos/` - Brand photos
- `onboarding/documents/` - Other onboarding documents

## File Limits

- **Maximum file size:** 10MB per file
- **Supported formats:** All file types (auto-detected)
- **Storage:** Cloudinary free tier includes 25GB storage

## Security

1. **API Keys:** Keep Cloudinary API keys secure in environment variables
2. **Upload Presets:** Consider using unsigned upload presets for client-side uploads
3. **Access Control:** Configure Cloudinary access restrictions as needed
4. **File Validation:** Validate file types and sizes before upload

## Cloudinary Dashboard

Access your Cloudinary dashboard at:
- URL: https://console.cloudinary.com
- View uploaded files, manage storage, configure settings

## Troubleshooting

### Error: "Cloudinary not configured"
- Check that all three environment variables are set
- Restart your development server after adding env vars

### Error: "File size exceeds limit"
- Maximum file size is 10MB
- Compress files or use Cloudinary's transformation API

### Files not appearing
- Check Cloudinary dashboard
- Verify folder path is correct
- Check file permissions in Cloudinary settings

## Production Considerations

1. **CDN:** Cloudinary automatically provides CDN URLs
2. **Optimization:** Enable automatic image optimization
3. **Transformations:** Use Cloudinary transformations for thumbnails, resizing, etc.
4. **Backup:** Configure Cloudinary backups if needed
5. **Monitoring:** Set up Cloudinary usage alerts

## Example: Image Transformation

Cloudinary URLs support transformations:

```
Original: https://res.cloudinary.com/cloud/image/upload/v123/file.jpg
Thumbnail: https://res.cloudinary.com/cloud/image/upload/w_200,h_200,c_fill/v123/file.jpg
Optimized: https://res.cloudinary.com/cloud/image/upload/q_auto,f_auto/v123/file.jpg
```

## Support

- Cloudinary Documentation: https://cloudinary.com/documentation
- Cloudinary Support: https://support.cloudinary.com

