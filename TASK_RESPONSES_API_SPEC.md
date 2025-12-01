# Task Responses API - Implementation Specification

## Overview

This document specifies the API endpoints for fetching task responses from the Klarnow Client Dashboard. These endpoints are designed for use by external systems (e.g., admin dashboard, reporting tools) to retrieve client task responses, attachments, and status updates.

## Base URL

```
https://your-domain.com/api/tasks
```

## Authentication

All endpoints require authentication via one of the following methods:

### Method 1: Header-based (Recommended)
```
X-User-Email: admin@example.com
```

### Method 2: Query Parameter
```
?email=admin@example.com
```

### Method 3: Admin API Key (Future)
```
Authorization: Bearer <admin_api_key>
```

**Note:** Currently uses mock authentication. In production, implement proper admin authentication.

---

## Endpoints

### 1. Get All Tasks with Responses

**Endpoint:** `GET /api/tasks/responses`

**Description:** Fetches all tasks with their responses, attachments, and metadata. Supports filtering and pagination.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | Admin email for authentication |
| `client_id` | string | No | Filter by specific client ID |
| `client_email` | string | No | Filter by client email |
| `status` | string | No | Filter by task status (PENDING, IN_PROGRESS, COMPLETED, CANCELLED) |
| `type` | string | No | Filter by task type (UPLOAD_FILE, SEND_INFO, PROVIDE_DETAILS, REVIEW, OTHER) |
| `has_responses` | boolean | No | Filter tasks that have responses (true) or no responses (false) |
| `date_from` | string | No | Filter tasks created after this date (ISO 8601 format) |
| `date_to` | string | No | Filter tasks created before this date (ISO 8601 format) |
| `limit` | number | No | Number of results per page (default: 50, max: 100) |
| `offset` | number | No | Number of results to skip (default: 0) |

**Example Request:**
```bash
GET /api/tasks/responses?email=admin@example.com&status=COMPLETED&has_responses=true&limit=20
```

**Response Format:**
```json
{
  "tasks": [
    {
      "id": "task-uuid",
      "client_id": "client-uuid",
      "client_name": "John Doe",
      "client_email": "john@example.com",
      "title": "Upload brand logo",
      "description": "Please upload your brand logo file",
      "type": "UPLOAD_FILE",
      "status": "COMPLETED",
      "due_date": "2024-01-15T00:00:00Z",
      "completed_at": "2024-01-14T10:30:00Z",
      "created_at": "2024-01-10T09:00:00Z",
      "updated_at": "2024-01-14T10:30:00Z",
      "created_by": "admin-user-id",
      "responses": [
        {
          "text": "I've uploaded the logo file. Please let me know if you need anything else.",
          "created_at": "2024-01-14T10:30:00Z",
          "created_by": "john@example.com"
        }
      ],
      "attachments": [
        {
          "name": "logo.png",
          "url": "https://storage.example.com/files/logo.png",
          "uploaded_at": "2024-01-14T10:30:00Z"
        }
      ],
      "metadata": {
        "responses": [
          {
            "text": "I've uploaded the logo file...",
            "created_at": "2024-01-14T10:30:00Z",
            "created_by": "john@example.com"
          }
        ],
        "attachments": [
          {
            "name": "logo.png",
            "url": "https://storage.example.com/files/logo.png"
          }
        ]
      }
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

---

### 2. Get Responses for a Specific Task

**Endpoint:** `GET /api/tasks/[task_id]/responses`

**Description:** Fetches all responses and attachments for a specific task.

**Path Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `task_id` | string | Yes | The UUID of the task |

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | Admin email for authentication |

**Example Request:**
```bash
GET /api/tasks/abc123-def456-ghi789/responses?email=admin@example.com
```

**Response Format:**
```json
{
  "task": {
    "id": "abc123-def456-ghi789",
    "client_id": "client-uuid",
    "client_name": "John Doe",
    "client_email": "john@example.com",
    "title": "Upload brand logo",
    "description": "Please upload your brand logo file",
    "type": "UPLOAD_FILE",
    "status": "COMPLETED",
    "due_date": "2024-01-15T00:00:00Z",
    "completed_at": "2024-01-14T10:30:00Z",
    "created_at": "2024-01-10T09:00:00Z",
    "updated_at": "2024-01-14T10:30:00Z"
  },
  "responses": [
    {
      "id": "response-1",
      "text": "I've uploaded the logo file. Please let me know if you need anything else.",
      "created_at": "2024-01-14T10:30:00Z",
      "created_by": "john@example.com",
      "attachments": [
        {
          "name": "logo.png",
          "url": "https://storage.example.com/files/logo.png",
          "uploaded_at": "2024-01-14T10:30:00Z"
        }
      ]
    },
    {
      "id": "response-2",
      "text": "I've also included the logo in different formats.",
      "created_at": "2024-01-14T11:00:00Z",
      "created_by": "john@example.com",
      "attachments": []
    }
  ],
  "total_responses": 2
}
```

---

### 3. Get All Responses Across All Tasks

**Endpoint:** `GET /api/tasks/responses/all`

**Description:** Fetches all responses across all tasks, useful for activity feeds or reporting.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | Admin email for authentication |
| `client_id` | string | No | Filter by specific client ID |
| `client_email` | string | No | Filter by client email |
| `date_from` | string | No | Filter responses after this date (ISO 8601 format) |
| `date_to` | string | No | Filter responses before this date (ISO 8601 format) |
| `limit` | number | No | Number of results per page (default: 50, max: 100) |
| `offset` | number | No | Number of results to skip (default: 0) |

**Example Request:**
```bash
GET /api/tasks/responses/all?email=admin@example.com&date_from=2024-01-01T00:00:00Z&limit=30
```

**Response Format:**
```json
{
  "responses": [
    {
      "id": "response-1",
      "task_id": "task-uuid-1",
      "task_title": "Upload brand logo",
      "client_id": "client-uuid",
      "client_name": "John Doe",
      "client_email": "john@example.com",
      "text": "I've uploaded the logo file.",
      "created_at": "2024-01-14T10:30:00Z",
      "created_by": "john@example.com",
      "attachments": [
        {
          "name": "logo.png",
          "url": "https://storage.example.com/files/logo.png"
        }
      ]
    },
    {
      "id": "response-2",
      "task_id": "task-uuid-2",
      "task_title": "Provide brand colors",
      "client_id": "client-uuid",
      "client_name": "John Doe",
      "client_email": "john@example.com",
      "text": "Here are our brand colors: #8359ee, #000000",
      "created_at": "2024-01-13T14:20:00Z",
      "created_by": "john@example.com",
      "attachments": []
    }
  ],
  "pagination": {
    "total": 125,
    "limit": 30,
    "offset": 0,
    "has_more": true
  }
}
```

---

### 4. Get Task Statistics

**Endpoint:** `GET /api/tasks/statistics`

**Description:** Returns aggregated statistics about tasks and responses.

**Query Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `email` | string | Yes | Admin email for authentication |
| `client_id` | string | No | Filter by specific client ID |
| `date_from` | string | No | Filter tasks created after this date |
| `date_to` | string | No | Filter tasks created before this date |

**Example Request:**
```bash
GET /api/tasks/statistics?email=admin@example.com&date_from=2024-01-01T00:00:00Z
```

**Response Format:**
```json
{
  "total_tasks": 150,
  "tasks_by_status": {
    "PENDING": 45,
    "IN_PROGRESS": 30,
    "COMPLETED": 70,
    "CANCELLED": 5
  },
  "tasks_by_type": {
    "UPLOAD_FILE": 50,
    "SEND_INFO": 40,
    "PROVIDE_DETAILS": 35,
    "REVIEW": 20,
    "OTHER": 5
  },
  "total_responses": 320,
  "tasks_with_responses": 95,
  "tasks_without_responses": 55,
  "average_response_time_hours": 24.5,
  "total_attachments": 180
}
```

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message",
  "details": "Additional error details (development only)"
}
```

### Common Error Codes

| Status Code | Description |
|-------------|-------------|
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Missing or invalid authentication |
| 404 | Not Found - Task or resource not found |
| 500 | Internal Server Error - Server error |

**Example Error Response:**
```json
{
  "error": "Unauthorized - email required",
  "details": null
}
```

---

## Data Models

### Task Object
```typescript
interface Task {
  id: string
  client_id: string
  client_name?: string
  client_email?: string
  title: string
  description: string | null
  type: 'UPLOAD_FILE' | 'SEND_INFO' | 'PROVIDE_DETAILS' | 'REVIEW' | 'OTHER'
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED'
  due_date: string | null // ISO 8601
  completed_at: string | null // ISO 8601
  created_at: string // ISO 8601
  updated_at: string // ISO 8601
  created_by: string | null
  responses: TaskResponse[]
  attachments: Attachment[]
  metadata: {
    responses?: TaskResponse[]
    attachments?: Attachment[]
  }
}
```

### TaskResponse Object
```typescript
interface TaskResponse {
  id?: string
  text: string
  created_at: string // ISO 8601
  created_by: string // Client email
  attachments?: Attachment[]
}
```

### Attachment Object
```typescript
interface Attachment {
  name: string
  url: string
  uploaded_at?: string // ISO 8601
  size?: number // bytes
  type?: string // MIME type
}
```

---

## Implementation Notes

### 1. Response Storage

Responses are stored in the `metadata` JSON field of the `tasks` table:
```json
{
  "responses": [
    {
      "text": "Response text",
      "createdAt": "2024-01-14T10:30:00Z",
      "createdBy": "client@example.com"
    }
  ],
  "attachments": [
    {
      "name": "file.pdf",
      "url": "https://..."
    }
  ]
}
```

### 2. File Uploads

File uploads are handled via Cloudinary:
- Files are uploaded to Cloudinary using `/api/upload` or `/api/upload/multiple` endpoints
- Uploaded file URLs are stored in the `attachments` field
- Files are organized in folders: `task-attachments/{task_id}/`
- Maximum file size: 10MB per file
- Supported formats: Images, PDFs, Documents, Videos (auto-detected)
- Each attachment includes: `name`, `url`, `public_id`, `bytes`, `format`

### 3. Pagination

All list endpoints support pagination:
- Default limit: 50
- Maximum limit: 100
- Use `offset` for pagination: `offset = (page - 1) * limit`

### 4. Date Filtering

Date parameters use ISO 8601 format:
- `2024-01-14T10:30:00Z`
- `2024-01-14` (treated as start of day)

### 5. Authentication

Currently uses mock authentication via email. For production:
- Implement proper admin authentication
- Use JWT tokens or API keys
- Add role-based access control (RBAC)

---

## File Upload Endpoints

### Upload Single File

**Endpoint:** `POST /api/upload`

**Description:** Uploads a single file to Cloudinary and returns the URL.

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with `file` field

**Query Parameters:**
- `folder` (optional): Cloudinary folder path (default: `task-attachments`)

**Example Request:**
```bash
curl -X POST "https://your-domain.com/api/upload?folder=task-attachments/task-123" \
  -H "X-User-Email: client@example.com" \
  -F "file=@document.pdf"
```

**Response:**
```json
{
  "success": true,
  "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/task-attachments/document.pdf",
  "public_id": "task-attachments/document",
  "format": "pdf",
  "bytes": 245678,
  "width": null,
  "height": null
}
```

### Upload Multiple Files

**Endpoint:** `PUT /api/upload/multiple`

**Description:** Uploads multiple files to Cloudinary in a single request.

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with multiple `files` fields

**Query Parameters:**
- `folder` (optional): Cloudinary folder path (default: `task-attachments`)

**Example Request:**
```bash
curl -X PUT "https://your-domain.com/api/upload/multiple?folder=task-attachments/task-123" \
  -H "X-User-Email: client@example.com" \
  -F "files=@document1.pdf" \
  -F "files=@image1.png" \
  -F "files=@image2.jpg"
```

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/task-attachments/document1.pdf",
      "public_id": "task-attachments/document1",
      "format": "pdf",
      "bytes": 245678
    },
    {
      "url": "https://res.cloudinary.com/your-cloud/image/upload/v1234567890/task-attachments/image1.png",
      "public_id": "task-attachments/image1",
      "format": "png",
      "bytes": 123456,
      "width": 1920,
      "height": 1080
    }
  ]
}
```

### File Upload Limits

- **Maximum file size:** 10MB per file
- **Supported formats:** All file types (auto-detected by Cloudinary)
- **Storage:** Files are stored in Cloudinary with automatic optimization
- **Organization:** Files are organized in folders by task ID

---

## Example Integration Code

### JavaScript/TypeScript

```typescript
// Upload file to Cloudinary
async function uploadFile(file: File, taskId?: string): Promise<string> {
  const formData = new FormData()
  formData.append('file', file)
  
  const folder = taskId ? `task-attachments/${taskId}` : 'task-attachments'
  const response = await fetch(
    `https://your-domain.com/api/upload?folder=${folder}`,
    {
      method: 'POST',
      body: formData
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.statusText}`)
  }

  const data = await response.json()
  return data.url
}

// Upload multiple files
async function uploadFiles(files: File[], taskId?: string): Promise<string[]> {
  const formData = new FormData()
  files.forEach(file => {
    formData.append('files', file)
  })
  
  const folder = taskId ? `task-attachments/${taskId}` : 'task-attachments'
  const response = await fetch(
    `https://your-domain.com/api/upload/multiple?folder=${folder}`,
    {
      method: 'PUT',
      body: formData
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to upload files: ${response.statusText}`)
  }

  const data = await response.json()
  return data.files.map((f: any) => f.url)
}

// Submit task response with file uploads
async function submitTaskResponse(
  taskId: string,
  responseText: string,
  files: File[],
  clientEmail: string
) {
  // Upload files first
  const fileUrls = files.length > 0 
    ? await uploadFiles(files, taskId)
    : []

  // Create attachments array
  const attachments = fileUrls.map((url, idx) => ({
    name: files[idx].name,
    url: url
  }))

  // Submit response
  const response = await fetch(
    `https://your-domain.com/api/tasks/${taskId}?email=${clientEmail}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Email': clientEmail
      },
      body: JSON.stringify({
        response: responseText,
        attachments: attachments.length > 0 ? attachments : undefined
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to submit response: ${response.statusText}`)
  }

  return await response.json()
}

// Fetch all tasks with responses
async function fetchTasksWithResponses(adminEmail: string, filters?: {
  status?: string
  clientEmail?: string
  hasResponses?: boolean
}) {
  const params = new URLSearchParams({
    email: adminEmail,
    ...(filters?.status && { status: filters.status }),
    ...(filters?.clientEmail && { client_email: filters.clientEmail }),
    ...(filters?.hasResponses !== undefined && { 
      has_responses: filters.hasResponses.toString() 
    })
  })

  const response = await fetch(
    `https://your-domain.com/api/tasks/responses?${params}`,
    {
      headers: {
        'X-User-Email': adminEmail
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch tasks: ${response.statusText}`)
  }

  return await response.json()
}

// Fetch responses for a specific task
async function fetchTaskResponses(taskId: string, adminEmail: string) {
  const response = await fetch(
    `https://your-domain.com/api/tasks/${taskId}/responses?email=${adminEmail}`,
    {
      headers: {
        'X-User-Email': adminEmail
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch task responses: ${response.statusText}`)
  }

  return await response.json()
}

// Usage
const tasks = await fetchTasksWithResponses('admin@example.com', {
  status: 'COMPLETED',
  hasResponses: true
})

console.log(`Found ${tasks.tasks.length} tasks with responses`)
```

### Python

```python
import requests
from typing import Optional, Dict, Any

def fetch_tasks_with_responses(
    admin_email: str,
    status: Optional[str] = None,
    client_email: Optional[str] = None,
    has_responses: Optional[bool] = None
) -> Dict[str, Any]:
    """Fetch all tasks with responses."""
    url = "https://your-domain.com/api/tasks/responses"
    params = {"email": admin_email}
    
    if status:
        params["status"] = status
    if client_email:
        params["client_email"] = client_email
    if has_responses is not None:
        params["has_responses"] = str(has_responses).lower()
    
    headers = {"X-User-Email": admin_email}
    
    response = requests.get(url, params=params, headers=headers)
    response.raise_for_status()
    
    return response.json()

# Usage
tasks = fetch_tasks_with_responses(
    "admin@example.com",
    status="COMPLETED",
    has_responses=True
)
print(f"Found {len(tasks['tasks'])} tasks with responses")
```

---

## Rate Limiting

**Current:** No rate limiting implemented

**Recommended for Production:**
- 100 requests per minute per IP
- 1000 requests per hour per authenticated user
- Return `429 Too Many Requests` with `Retry-After` header

---

## Security Considerations

1. **Authentication**: Implement proper admin authentication (JWT, API keys)
2. **Authorization**: Verify admin has access to requested client data
3. **Input Validation**: Validate all query parameters and filter inputs
4. **SQL Injection**: Use Prisma parameterized queries (already implemented)
5. **CORS**: Configure CORS for allowed origins
6. **Rate Limiting**: Implement rate limiting to prevent abuse
7. **Data Privacy**: Ensure only authorized admins can access client responses

---

## Future Enhancements

1. **Webhooks**: Notify external systems when new responses are added
2. **Real-time Updates**: WebSocket support for live response updates
3. **Export**: CSV/Excel export of task responses
4. **Search**: Full-text search across task responses
5. **Filtering**: Advanced filtering (by date range, client, task type, etc.)
6. **Sorting**: Custom sorting options (by date, status, client, etc.)
7. **Bulk Operations**: Bulk status updates, bulk exports

---

## Testing

### Test Cases

1. **Fetch all tasks with responses**
   ```bash
   curl -X GET "https://your-domain.com/api/tasks/responses?email=admin@example.com" \
     -H "X-User-Email: admin@example.com"
   ```

2. **Filter by status**
   ```bash
   curl -X GET "https://your-domain.com/api/tasks/responses?email=admin@example.com&status=COMPLETED" \
     -H "X-User-Email: admin@example.com"
   ```

3. **Filter by client**
   ```bash
   curl -X GET "https://your-domain.com/api/tasks/responses?email=admin@example.com&client_email=client@example.com" \
     -H "X-User-Email: admin@example.com"
   ```

4. **Get specific task responses**
   ```bash
   curl -X GET "https://your-domain.com/api/tasks/abc123/responses?email=admin@example.com" \
     -H "X-User-Email: admin@example.com"
   ```

5. **Get statistics**
   ```bash
   curl -X GET "https://your-domain.com/api/tasks/statistics?email=admin@example.com" \
     -H "X-User-Email: admin@example.com"
   ```

---

## Support

For questions or issues:
- Check API documentation
- Review error responses for details
- Contact development team

---

**Last Updated:** 2024-01-15
**Version:** 1.0.0

