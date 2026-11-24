```
--- GET EXAMPLE ---
```

// ENDPOINT: /admin/launch-form-tracking/:plan_id
// METHOD: GET
// SERVICE: hc-my-career-api-planning

//QUERYPARAMS:
{
"fiscal_year": 2024,
"user_id": "U00001"
}

//RESP:
{
"launch_form_tracking": [
{
"id": 1452,
"original_file_id": 1577,
"original_file_name": "My Career_launch_form template",
"failed_file_id": 1578,
"failed_file_name": "import_launch_form_attachment_fail",
"status": "Completed",
"total_success": "0",
"total_failed": "1",
"total": 1,
"created_at": "2026-01-10 16:09:00"
}
}

---

```

POST EXAMPLE ---

```

// ENDPOINT: /admin/launch-form
// METHOD: POST
// SERVICE: hc-my-career-api-planning

//BODY | FORM_DATA:
{
"fiscal_year": 2024,
"user_id": "U00001"
"file": *multipart.FilHeader
}

//RESP:
{
"message": "successful"
}

---

```

PUT EXAMPLE ---

```

// ENDPOINT: /admin/launch-form
// METHOD: PUT
// SERVICE: hc-my-career-api-planning

//BODY | FORM_DATA:
{
"fiscal_year": 2024,
"user_id": "U00001"
"file": *multipart.FilHeader
}

//RESP:
{
"message": "successful"
}

---

```

DELETE EXAMPLE ---

```

// ENDPOINT: /admin/launch-form/:form_id
// METHOD: DELETE
// SERVICE: hc-my-career-api-planning

//RESP:
{
"message": "successful"
}
