# HookNorton Developer API Specification

**Version:** 1.0  
**Base URL:** `http://localhost:8080/$$/api` (HTTP) or `https://localhost:8081/$$/api` (HTTPS)  
**Format:** JSON

## Overview

The Developer API provides management and inspection capabilities for the HookNorton webhook testing service. It allows clients to configure routes for the Fake API and inspect incoming request history.

**Key Characteristics:**

- RESTful, JSON-based API
- No authentication required (development/testing use only)
- Automatic persistence to filesystem on configuration changes
- Thread-safe for concurrent access

---

## Table of Contents

1. [Route Configuration Endpoints](#route-configuration-endpoints)
2. [Request History Endpoints](#request-history-endpoints)
3. [System Control Endpoints](#system-control-endpoints)
4. [Data Models](#data-models)
5. [Error Responses](#error-responses)

---

## Route Configuration Endpoints

### List All Routes

**GET** `/$$/api/routes`

Retrieves all configured routes.

**Response:** `200 OK`

```json
{
  "routes": [
    {
      "method": "GET",
      "pathPattern": "/api/users/*",
      "response": {
        "statusCode": 200,
        "headers": {
          "Content-Type": "application/json"
        },
        "body": "{\"users\": []}"
      },
      "enabled": true
    },
    {
      "method": "POST",
      "pathPattern": "/api/orders",
      "response": {
        "statusCode": 201,
        "headers": {
          "Content-Type": "application/json",
          "Location": "/api/orders/123"
        },
        "body": "{\"id\": \"123\", \"status\": \"created\"}"
      },
      "enabled": true
    }
  ]
}
```

---

### Get Specific Route

**GET** `/$$/api/routes/{method}/{urlEncodedPath}`

Retrieves configuration for a specific route identified by HTTP method and URL-encoded path pattern.

**Path Parameters:**

- `method` - HTTP method (GET, POST, PUT, PATCH, DELETE, etc.)
- `urlEncodedPath` - URL-encoded path pattern

**Example:** `/$$/api/routes/GET/%2Fapi%2Fusers%2F%2A`  
(retrieves the GET route for `/api/users/*`)

**Response:** `200 OK`

```json
{
  "method": "GET",
  "pathPattern": "/api/users/*",
  "response": {
    "statusCode": 200,
    "headers": {
      "Content-Type": "application/json"
    },
    "body": "{\"users\": []}"
  },
  "enabled": true
}
```

**Error Response:** `404 Not Found` if route doesn't exist

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.5",
  "title": "Not Found",
  "status": 404,
  "detail": "No route configured for GET /api/users/*",
  "instance": "/$$/api/routes/GET/%2Fapi%2Fusers%2F%2A"
}
```

---

### Create or Update Route

**PUT** `/$$/api/routes/{method}/{urlEncodedPath}`

Creates a new route or replaces an existing route configuration. Changes are automatically persisted to disk.

**Path Parameters:**

- `method` - HTTP method (GET, POST, PUT, PATCH, DELETE, etc.)
- `urlEncodedPath` - URL-encoded path pattern

**Request Body:**

```json
{
  "response": {
    "statusCode": 200,
    "headers": {
      "Content-Type": "application/json",
      "X-Custom-Header": "value"
    },
    "body": "{\"result\": \"success\"}"
  },
  "enabled": true
}
```

**Note:** The `method` and `pathPattern` are derived from the URL path parameters and should not be included in the request body.

**Response:** `200 OK` (route updated) or `201 Created` (new route created)

```json
{
  "method": "POST",
  "pathPattern": "/api/webhooks/*",
  "response": {
    "statusCode": 200,
    "headers": {
      "Content-Type": "application/json",
      "X-Custom-Header": "value"
    },
    "body": "{\"result\": \"success\"}"
  },
  "enabled": true
}
```

**Error Response:** `422 Unprocessable Content` if request body is invalid

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.21",
  "title": "One or more validation errors occurred.",
  "status": 422,
  "detail": "Response statusCode must be between 100 and 599"
}
```

---

### Delete Route

**DELETE** `/$$/api/routes/{method}/{urlEncodedPath}`

Deletes a specific route. Changes are automatically persisted to disk.

**Path Parameters:**

- `method` - HTTP method
- `urlEncodedPath` - URL-encoded path pattern

**Example:** `/$$/api/routes/DELETE/%2Fapi%2Fusers%2F%2A`  
(deletes the DELETE route for `/api/users/*`)

**Response:** `204 No Content`

**Error Response:** `404 Not Found` if route doesn't exist

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.5",
  "title": "Not Found",
  "status": 404,
  "detail": "No route configured for DELETE /api/users/*",
  "instance": "/$$/api/routes/DELETE/%2Fapi%2Fusers%2F%2A"
}
```

---

### Clear All Routes

**DELETE** `/$$/api/routes`

Clears all route configurations and resets to empty state. Changes are automatically persisted to disk.

**Request Body:** None

**Response:** `204 No Content`

---

## Request History Endpoints

### List All Requests

**GET** `/$$/api/requests`

Retrieves a summary list of all captured requests. Returns requests in reverse chronological order (newest first).

**Response:** `200 OK`

```json
{
  "requests": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "timestamp": "2026-02-02T14:35:22.123Z",
      "method": "POST",
      "path": "/api/orders",
      "queryString": "priority=high&source=mobile",
      "bodyExcerpt": "{\"orderId\": \"12345\", \"items\": [{\"productId\": \"ABC\", \"quantity\": 2}, {\"productId\": \"XYZ\", \"quantity\": 1}], \"customer\": {\"name\": \"John Doe\", \"email\": \"john@example.com\"}, \"shippingAddress\": ..."
    },
    {
      "id": "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
      "timestamp": "2026-02-02T14:34:15.456Z",
      "method": "GET",
      "path": "/api/users/123",
      "bodyExcerpt": ""
    },
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "timestamp": "2026-02-02T14:33:08.789Z",
      "method": "PUT",
      "path": "/api/webhooks/notifications",
      "bodyExcerpt": "{\"event\": \"user.created\", \"data\": {\"userId\": \"98765\", \"username\": \"alice\", \"email\": \"alice@example.com\", \"createdAt\": \"2026-02-02T14:33:08Z\"}, \"metadata\": {\"source\": \"registration-service\", \"ve..."
    }
  ],
  "totalCount": 3
}
```

**Field Descriptions:**

- `bodyExcerpt` - First 200 characters of the request body (may be truncated mid-word)
- `totalCount` - Total number of requests in history (limited by configured maximum)

---

### Get Request Details

**GET** `/$$/api/requests/{id}`

Retrieves complete details for a specific captured request.

**Path Parameters:**

- `id` - UUID of the request

**Example:** `/$$/api/requests/550e8400-e29b-41d4-a716-446655440000`

**Response:** `200 OK`

```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "timestamp": "2026-02-02T14:35:22.123Z",
  "method": "POST",
  "path": "/api/orders",
  "queryString": "priority=high&source=mobile",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "User-Agent": "MobileApp/2.1.0",
    "Accept": "application/json",
    "Content-Length": "342"
  },
  "body": "{\"orderId\": \"12345\", \"items\": [{\"productId\": \"ABC\", \"quantity\": 2}, {\"productId\": \"XYZ\", \"quantity\": 1}], \"customer\": {\"name\": \"John Doe\", \"email\": \"john@example.com\"}, \"shippingAddress\": {\"street\": \"123 Main St\", \"city\": \"Springfield\", \"zip\": \"12345\"}}"
}
```

**Field Descriptions:**

- `queryString` - Raw query string from the URL (without leading `?`), empty string if none
- `headers` - All HTTP headers from the request
- `body` - Complete request body as received (subject to configured maximum body size)

**Error Response:** `404 Not Found` if request ID doesn't exist

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.5",
  "title": "Not Found",
  "status": 404,
  "detail": "No request found with ID 550e8400-e29b-41d4-a716-446655440000",
  "instance": "/$$/api/requests/550e8400-e29b-41d4-a716-446655440000"
}
```

---

### Clear Request History

**DELETE** `/$$/api/requests`

Removes all captured requests from history. Persisted history is also cleared.

**Request Body:** None

**Response:** `204 No Content`

---

## System Control Endpoints

### Health Check

**GET** `/$$/api/health`

Returns the health status of the service.

**Response:** `200 OK`

```json
{
  "status": "healthy",
  "timestamp": "2026-02-02T14:35:22.123Z"
}
```

---

## Data Models

### RouteConfiguration

Represents a configured route for the Fake API.

```json
{
  "method": string,           // HTTP method (GET, POST, PUT, PATCH, DELETE, etc.)
  "pathPattern": string,      // Path pattern with optional wildcards (e.g., "/api/users/*")
  "response": {
    "statusCode": number,     // HTTP status code (100-599)
    "headers": {              // Response headers (optional, can be empty object)
      string: string
    },
    "body": string           // Response body as string (can be JSON string or plain text)
  },
  "enabled": boolean          // Whether the route is active (optional, defaults to true)
}
```

**Path Pattern Matching Rules:**

- Supports simple glob-style wildcards with `*`
- `*` matches any sequence of characters within a path segment
- Exact match takes precedence
- First matching enabled route wins

**Examples:**

- `/api/users` - Exact match only
- `/api/users/*` - Matches `/api/users/123`, `/api/users/abc`, etc.
- `/api/*/status` - Matches `/api/orders/status`, `/api/users/status`, etc.

---

### RequestSummary

Summary information about a captured request (used in list view).

```json
{
  "id": string,              // UUID v7
  "timestamp": string,       // ISO 8601 timestamp (UTC with time offset)
  "method": string,          // HTTP method
  "path": string,            // Request path (without query string)
  "queryString": "string",   // Raw query string (empty if none, no leading "?")
  "bodyExcerpt": string      // First 200 characters of body (may be empty)
}
```

---

### RequestRecord

Complete information about a captured request.

```json
{
  "id": string,              // UUID v7
  "timestamp": string,       // ISO 8601 timestamp (UTC with time offset)
  "method": string,          // HTTP method
  "path": string,            // Request path (without query string)
  "queryString": string,     // Raw query string (empty if none, no leading "?")
  "headers": {               // All request headers
    string: string
  },
  "body": string            // Complete request body (subject to size limit)
}
```

---

## Error Responses

All error responses conform to [RFC 9457 Problem Details for HTTP APIs](https://www.rfc-editor.org/rfc/rfc9457.html).

### Problem Details Format

```json
{
  "type": string,           // URI reference identifying the problem type (required)
  "title": string,          // Short, human-readable summary of the problem type (required)
  "status": number,         // HTTP status code (required)
  "detail": string,         // Human-readable explanation specific to this occurrence (required)
  "instance": string        // URI reference identifying this specific occurrence (optional)
}
```

**Field Descriptions:**

- `type` - A URI that identifies the problem type.
- `title` - A short summary that describes the problem type. Should be the same for all occurrences of the same problem
  type.
- `status` - The HTTP status code for this occurrence.
- `detail` - A detailed explanation specific to this particular occurrence of the problem.
- `instance` - A URI that identifies the specific occurrence of the problem (e.g., the request path). Optional.

**Content-Type:** Error responses use `application/problem+json` content type.

### Common HTTP Status Codes

- `200 OK` - Successful GET or PUT (update) request
- `201 Created` - Successful PUT request that created a new resource
- `204 No Content` - Successful DELETE or reset operation
- `400 Bad Request` - Malformed JSON, invalid syntax.
- `404 Not Found` - Requested resource doesn't exist
- `422 Unprocessable Content` - Valid JSON but semantic/validation errors.
- `500 Internal Server Error` - Unexpected server error

### Example Error Responses

#### 422 Unprocessable Content - Invalid Status Code

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.21",
  "title": "One or more validation errors occurred.",
  "status": 422,
  "detail": "Response statusCode must be between 100 and 599",
  "instance": "/$$/api/routes/POST/%2Fapi%2Fwebhooks"
}
```

#### 422 Unprocessable Content - Invalid Method

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.21",
  "title": "One or more validation errors occurred.",
  "status": 422,
  "detail": "HTTP method must be one of: GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS",
  "instance": "/$$/api/routes/INVALID/%2Fapi%2Fusers"
}
```

#### 422 Unprocessable Content - Missing Required Field

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.21",
  "title": "One or more validation errors occurred.",
  "status": 422,
  "detail": "Response configuration is required",
  "instance": "/$$/api/routes/GET/%2Fapi%2Fusers"
}
```

#### 404 Not Found - Route

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.5",
  "title": "Not Found",
  "status": 404,
  "detail": "No route configured for GET /api/users/*",
  "instance": "/$$/api/routes/GET/%2Fapi%2Fusers%2F%2A"
}
```

#### 404 Not Found - Request

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.5.5",
  "title": "Not Found",
  "status": 404,
  "detail": "No request found with ID 550e8400-e29b-41d4-a716-446655440000",
  "instance": "/$$/api/requests/550e8400-e29b-41d4-a716-446655440000"
}
```

#### 500 Internal Server Error

```json
{
  "type": "https://tools.ietf.org/html/rfc9110#section-15.6.1",
  "title": "Internal Server Error",
  "status": 500,
  "detail": "An unexpected error occurred while processing the request"
}
```

### Problem Type URIs

The problem type URIs should link to the corresponding section of RFC9110 as in the examples above.

---

## URL Encoding Examples

Since route paths may contain special characters (including wildcards), they must be URL-encoded when used in API endpoints.

| Original Path      | URL-Encoded Path            | Full Endpoint Example                              |
| ------------------ | --------------------------- | -------------------------------------------------- |
| `/api/users`       | `%2Fapi%2Fusers`            | `/$$/api/routes/GET/%2Fapi%2Fusers`            |
| `/api/users/*`     | `%2Fapi%2Fusers%2F%2A`      | `/$$/api/routes/GET/%2Fapi%2Fusers%2F%2A`      |
| `/webhooks/github` | `%2Fwebhooks%2Fgithub`      | `/$$/api/routes/POST/%2Fwebhooks%2Fgithub`     |
| `/api/*/status`    | `%2Fapi%2F%2A%2Fstatus`     | `/$$/api/routes/GET/%2Fapi%2F%2A%2Fstatus`     |

**Note:** Most HTTP clients and programming languages provide built-in URL encoding functions:

- JavaScript: `encodeURIComponent()`
- Python: `urllib.parse.quote()`
- C#: `Uri.EscapeDataString()`
- Java: `URLEncoder.encode()`

---

## Persistence Behavior

### Automatic Persistence

Route configuration changes are **automatically persisted** to the filesystem when:

- A route is created via PUT
- A route is updated via PUT
- A route is deleted via DELETE
- All routes are cleared via DELETE `/api/routes`

Request history is **automatically persisted** when:

- New requests are captured by the Fake API
- History is cleared via DELETE `/api/requests`

### Persistence Location

- Route configurations: `./data/config` (relative to application directory)
- Request history: `./data/history` (relative to application directory)

### Concurrency

All persistence operations are thread-safe. Concurrent requests are handled correctly without data corruption.

---

## Notes

1. **No Authentication:** This API has no authentication mechanism and is intended for local development/testing use
   only.

2. **Bounded History:** Request history is capped at a configurable maximum (N requests). When the limit is reached,
   oldest requests are evicted in FIFO order.

3. **Body Size Limit:** Request bodies are subject to a configurable maximum size. Bodies exceeding this limit are
   truncated.

4. **Content Negotiation:** All endpoints accept and return `application/json` content type. Error responses use
   `application/problem+json` as specified in RFC 9457.

5. **CORS:** The Developer API may need CORS headers enabled to support browser-based clients accessing from different
   ports.
