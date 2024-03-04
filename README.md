# Shiki Service

This service provides an API to produce shiki-twoslash html for a given code snippet.

## API

### `POST /v1/`

#### Request

```json
{
  "code": "const a = 1",
  "lang": "ts",
  "meta": "twoslash", // optional
  "theme": "github-dark" // optional
}
```

#### Response

Responds with html string.
