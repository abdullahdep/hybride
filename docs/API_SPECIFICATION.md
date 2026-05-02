# REST API Specification

## Base URL
```
http://localhost:5000/api
```

## Endpoints

### 1. Classify Messages

**POST** `/classify`

Classify messages using both keyword and AI methods.

#### Request
```json
{
    "messages": [
        "I found this helpful",
        "Good",
        "03215647890"
    ],
    "methods": ["keyword", "ai"]
}
```

#### Response (200 OK)
```json
{
    "status": "success",
    "results": [
        {
            "message": "I found this helpful",
            "keyword": {
                "classification": "academic",
                "confidence": 0.2
            },
            "ai": {
                "classification": "academic",
                "confidence": 0.92
            },
            "final_classification": "academic"
        },
        {
            "message": "Good",
            "keyword": {
                "classification": "non-academic",
                "confidence": 0.95
            },
            "ai": {
                "classification": "non-academic",
                "confidence": 0.88
            },
            "final_classification": "non-academic"
        }
    ]
}
```

### 2. Get Metrics

**GET** `/metrics`

Get performance metrics for both classifiers.

#### Response (200 OK)
```json
{
    "status": "success",
    "metrics": {
        "keyword": {
            "accuracy": 0.82,
            "precision": 0.85,
            "recall": 0.78,
            "f1_score": 0.81
        },
        "ai": {
            "accuracy": 0.88,
            "precision": 0.90,
            "recall": 0.85,
            "f1_score": 0.87
        }
    }
}
```

### 3. Get Keywords

**GET** `/keywords`

Get list of active keyword patterns.

#### Response (200 OK)
```json
{
    "status": "success",
    "keywords": {
        "greeting": ["hi", "hello", "hey", "assalam"],
        "affirmation": ["good", "ok", "done", "yes"],
        "presence": ["present", "here", "attendance"],
        "phone_number": "regex_pattern",
        "whatsapp": "regex_pattern"
    }
}
```

### 4. Add Custom Keyword

**POST** `/keywords`

Add a custom keyword for filtering.

#### Request
```json
{
    "keyword": "custom_term",
    "category": "custom"
}
```

#### Response (200 OK)
```json
{
    "status": "success",
    "message": "Keyword added successfully"
}
```

### 5. Train Model

**POST** `/train`

Train AI classifier with provided dataset.

#### Request
```json
{
    "dataset_path": "dataset/labeled_messages.csv"
}
```

#### Response (200 OK)
```json
{
    "status": "success",
    "training_metrics": {
        "accuracy": 0.88,
        "precision": 0.90,
        "recall": 0.85,
        "f1_score": 0.87
    },
    "test_metrics": {
        "accuracy": 0.85,
        "precision": 0.87,
        "recall": 0.83,
        "f1_score": 0.85
    }
}
```

### 6. Health Check

**GET** `/health`

Check API status and model availability.

#### Response (200 OK)
```json
{
    "status": "ok",
    "model_loaded": true,
    "version": "1.0.0"
}
```

## Error Responses

### 400 Bad Request
```json
{
    "status": "error",
    "message": "Invalid request format",
    "error_code": "INVALID_REQUEST"
}
```

### 404 Not Found
```json
{
    "status": "error",
    "message": "Endpoint not found",
    "error_code": "NOT_FOUND"
}
```

### 500 Internal Server Error
```json
{
    "status": "error",
    "message": "Internal server error",
    "error_code": "SERVER_ERROR"
}
```

## Usage Examples

### Python
```python
import requests

BASE_URL = "http://localhost:5000/api"

# Classify messages
messages = ["Good", "Please explain this concept"]
response = requests.post(f"{BASE_URL}/classify", json={"messages": messages})
print(response.json())

# Get metrics
response = requests.get(f"{BASE_URL}/metrics")
print(response.json())
```

### JavaScript/Fetch
```javascript
const BASE_URL = "http://localhost:5000/api";

// Classify messages
fetch(`${BASE_URL}/classify`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
        messages: ["Good", "Please explain this concept"]
    })
})
.then(r => r.json())
.then(data => console.log(data));
```

### cURL
```bash
# Classify messages
curl -X POST http://localhost:5000/api/classify \
  -H "Content-Type: application/json" \
  -d '{"messages":["Good","Please explain this concept"]}'

# Get metrics
curl http://localhost:5000/api/metrics
```

## Rate Limiting

- **Requests per minute**: 60
- **Batch size limit**: 100 messages per request

## Authentication (Future)

Future versions may require API key authentication:

```
Authorization: Bearer <api_key>
```

## CORS Headers

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```
