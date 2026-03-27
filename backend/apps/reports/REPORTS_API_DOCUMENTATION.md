# Reports Module API Documentation

## Overview

The Reports Module provides comprehensive reporting endpoints for all inventory-related data. Reports include summaries, detailed breakdowns, filtering capabilities, and aggregations for better data analysis.

## Base URL

All endpoints are prefixed with `/api/v1/reports/`

## Authentication

All endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Common Query Parameters

All report endpoints support the following query parameters for filtering:

| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `school_id` | Integer | Filter by school ID | `?school_id=1` |
| `start_date` | Date | Filter from date (YYYY-MM-DD) | `?start_date=2026-01-01` |
| `end_date` | Date | Filter to date (YYYY-MM-DD) | `?end_date=2026-03-31` |
| `status` | String | Filter by status (active, inactive, pending) | `?status=active` |
| `category_id` | Integer | Filter by category (Item reports) | `?category_id=1` |
| `supplier_id` | Integer | Filter by supplier | `?supplier_id=1` |

## Report Endpoints

### 1. Category Report
**Endpoint:** `GET /api/v1/reports/categories/`

Returns summary and detailed breakdown of all item categories with stock analysis.

**Query Parameters:**
- `school_id` - Filter by school
- `status` - Filter by status (active/inactive)

**Response Example:**
```json
{
  "summary": {
    "total_categories": 5,
    "total_items": 25,
    "total_stock_value": "15000.00",
    "total_items_count": "500.00",
    "active_categories": 5
  },
  "details": [
    {
      "category_id": 1,
      "category_name": "Electronics",
      "description": "Electronic equipment",
      "status": "active",
      "total_items": 8,
      "total_stock_units": "120.00",
      "total_stock_value": "3600.00",
      "avg_unit_price": "30.00",
      "created_at": "2026-01-15T10:30:00Z"
    }
  ],
  "filters_applied": {
    "status": "active"
  }
}
```

---

### 2. Store Report
**Endpoint:** `GET /api/v1/reports/stores/`

Returns summary and detailed breakdown of all stores with storage utilization metrics.

**Query Parameters:**
- `school_id` - Filter by school
- `status` - Filter by status

**Response Example:**
```json
{
  "summary": {
    "total_stores": 3,
    "total_items_stored": 25,
    "total_storage_value": "8500.00",
    "active_stores": 3,
    "total_transactions": 125
  },
  "details": [
    {
      "store_id": 1,
      "store_name": "Main Store",
      "location": "Building A",
      "status": "active",
      "total_items": 20,
      "total_stock_units": "450.00",
      "total_stock_value": "8500.00",
      "total_receives": 45,
      "total_issues": 30,
      "total_sales": 10,
      "created_at": "2026-01-10T09:15:00Z"
    }
  ],
  "filters_applied": {}
}
```

---

### 3. Supplier Report
**Endpoint:** `GET /api/v1/reports/suppliers/`

Returns supplier performance metrics, purchase history, and delivery analysis.

**Query Parameters:**
- `school_id` - Filter by school
- `status` - Filter by status
- `start_date` - Filter purchase records from date
- `end_date` - Filter purchase records to date
- `supplier_id` - Filter by specific supplier

**Response Example:**
```json
{
  "summary": {
    "total_suppliers": 8,
    "total_purchases": 156,
    "total_purchase_value": "45000.00",
    "active_suppliers": 7,
    "avg_delivery_time": 5
  },
  "details": [
    {
      "supplier_id": 1,
      "supplier_name": "ABC Supplies",
      "contact_person": "John Doe",
      "phone": "+1-555-0123",
      "email": "john@abcsupplies.com",
      "status": "active",
      "total_purchases": 28,
      "total_purchase_value": "8500.00",
      "total_items_purchased": "450.00",
      "pending_orders": 2,
      "avg_rating": "4.50",
      "created_at": "2025-06-01T10:00:00Z"
    }
  ],
  "filters_applied": {
    "start_date": "2026-01-01",
    "end_date": "2026-03-31"
  }
}
```

---

### 4. Item Report
**Endpoint:** `GET /api/v1/reports/items/`

Comprehensive inventory item report with stock levels, reorder analysis, and usage trends.

**Query Parameters:**
- `school_id` - Filter by school
- `status` - Filter item status
- `category_id` - Filter by category
- `start_date` - Filter transactions from date
- `end_date` - Filter transactions to date

**Response Features:**
- Low stock alerts
- Out of stock indicators
- Stock value per item
- Total received, issued, and sold quantities

**Response Example:**
```json
{
  "summary": {
    "total_items": 25,
    "total_stock_units": "1250.00",
    "total_stock_value": "37500.00",
    "low_stock_items": 3,
    "out_of_stock_items": 1,
    "total_categories": 5
  },
  "details": [
    {
      "item_id": 1,
      "item_code": "ITEM-001",
      "item_name": "Laptop",
      "category_name": "Electronics",
      "unit": "piece",
      "status": "active",
      "current_stock": "45.00",
      "reorder_level": "20.00",
      "unit_cost": "800.00",
      "stock_value": "36000.00",
      "total_received": "100.00",
      "total_issued": "30.00",
      "total_sold": "25.00",
      "status_indicator": "Normal",
      "created_at": "2025-01-01T00:00:00Z"
    }
  ],
  "filters_applied": {
    "category_id": 1
  }
}
```

---

### 5. Receive (Purchase) Report
**Endpoint:** `GET /api/v1/reports/receives/` or `/api/v1/reports/purchases/`

Detailed purchase receipt transactions with line-item breakdown.

**Query Parameters:**
- `school_id` - Filter by school
- `status` - Filter receipt status
- `start_date` - Filter from date
- `end_date` - Filter to date
- `supplier_id` - Filter by supplier

**Response Features:**
- Transaction-level details
- Line-item level breakdown
- Total quantities and values
- Supplier information

**Response Example:**
```json
{
  "summary": {
    "total_receives": 45,
    "total_quantity_received": "2250.00",
    "total_purchase_value": "67500.00",
    "avg_quantity_per_receive": "50.00",
    "total_suppliers": 8,
    "total_stores": 3
  },
  "details": [
    {
      "receive_id": 1,
      "receive_number": "RCV-2026-001",
      "supplier_name": "ABC Supplies",
      "store_name": "Main Store",
      "receive_date": "2026-03-20",
      "total_items": 4,
      "total_quantity": "100.00",
      "total_value": "3000.00",
      "status": "received",
      "created_by": "admin",
      "created_at": "2026-03-20T10:30:00Z"
    }
  ],
  "line_items": [
    {
      "item_code": "ITEM-001",
      "item_name": "Laptop",
      "quantity": "25.00",
      "unit_cost": "800.00",
      "total_cost": "20000.00",
      "receive_date": "2026-03-20"
    }
  ],
  "filters_applied": {
    "start_date": "2026-01-01"
  }
}
```

---

### 6. Issue (Distribution) Report
**Endpoint:** `GET /api/v1/reports/issues/` or `/api/v1/reports/distributions/`

Item distribution/issue transactions with recipient tracking.

**Query Parameters:**
- `school_id` - Filter by school
- `status` - Filter issue status
- `start_date` - Filter from date
- `end_date` - Filter to date

**Response Features:**
- Distribution by recipient
- Line-item breakdown
- Distribution trends
- Total values per issue

**Response Example:**
```json
{
  "summary": {
    "total_issues": 30,
    "total_quantity_issued": "450.00",
    "total_issue_value": "10800.00",
    "avg_quantity_per_issue": "15.00",
    "total_recipients": 12,
    "total_items_distributed": 18
  },
  "details": [
    {
      "issue_id": 1,
      "issue_number": "ISS-2026-001",
      "issue_date": "2026-03-15",
      "recipient_name": "Department A",
      "store_name": 1,
      "total_items": 3,
      "total_quantity": "25.00",
      "total_value": "600.00",
      "status": "issued",
      "created_by": "admin",
      "created_at": "2026-03-15T14:00:00Z"
    }
  ],
  "line_items": [
    {
      "item_code": "ITEM-005",
      "item_name": "Printer Paper",
      "quantity": "100.00",
      "unit_cost": "0.50",
      "total_cost": "50.00",
      "issue_date": "2026-03-15"
    }
  ],
  "filters_applied": {}
}
```

---

### 7. Sales Report
**Endpoint:** `GET /api/v1/reports/sales/`

Sales transaction reports with revenue analysis and customer tracking.

**Query Parameters:**
- `school_id` - Filter by school
- `status` - Filter sale status
- `start_date` - Filter from date
- `end_date` - Filter to date
- `payment_status` - Filter by payment status (paid/pending)

**Response Features:**
- Revenue summaries
- Customer analysis
- Sales trends
- Line-item breakdown

**Response Example:**
```json
{
  "summary": {
    "total_sales": 15,
    "total_quantity_sold": "350.00",
    "total_sales_value": "10500.00",
    "avg_transaction_value": "700.00",
    "total_items_sold": 12,
    "total_customers": 8
  },
  "details": [
    {
      "sale_id": 1,
      "sale_number": "SAL-2026-001",
      "sale_date": "2026-03-18",
      "customer_name": "Customer XYZ",
      "store_name": "Main Store",
      "total_items": 2,
      "total_quantity": "50.00",
      "total_value": "1500.00",
      "payment_status": "paid",
      "status": "completed",
      "created_by": "salesman1",
      "created_at": "2026-03-18T16:30:00Z"
    }
  ],
  "line_items": [
    {
      "item_code": "ITEM-001",
      "item_name": "Laptop",
      "category_name": "Electronics",
      "quantity": "2.00",
      "unit_price": "750.00",
      "total_price": "1500.00",
      "sale_date": "2026-03-18"
    }
  ],
  "filters_applied": {
    "start_date": "2026-03-01",
    "end_date": "2026-03-31"
  }
}
```

---

### 8. Inventory Dashboard
**Endpoint:** `GET /api/v1/reports/dashboard/` or `/api/v1/reports/overview/`

Real-time inventory health dashboard with overview metrics and recent activities.

**Query Parameters:**
- `school_id` - Filter by school

**Response Features:**
- Overall inventory health metrics
- Recent activities (last 10)
- Top items by value
- Top items by quantity
- Store distribution
- Category distribution

**Response Example:**
```json
{
  "summary": {
    "total_items": 25,
    "total_categories": 5,
    "total_stores": 3,
    "total_suppliers": 8,
    "total_stock_value": "37500.00",
    "low_stock_items": 3,
    "out_of_stock_items": 1,
    "total_receives": 45,
    "total_issues": 30,
    "total_sales": 15,
    "total_purchase_value": "67500.00",
    "total_sales_value": "10500.00"
  },
  "recent_activities": [
    {
      "activity_type": "RECEIVE",
      "activity_id": 1,
      "activity_number": "RCV-2026-045",
      "item_count": 4,
      "quantity": "100.00",
      "value": "3000.00",
      "timestamp": "2026-03-26T14:30:00Z",
      "user": "admin"
    },
    {
      "activity_type": "SALE",
      "activity_id": 1,
      "activity_number": "SAL-2026-015",
      "item_count": 2,
      "quantity": "50.00",
      "value": "1500.00",
      "timestamp": "2026-03-26T13:00:00Z",
      "user": "salesman1"
    }
  ],
  "top_items_by_value": [
    {
      "id": 1,
      "item_code": "ITEM-001",
      "item_name": "Laptop",
      "current_stock": "45.00",
      "unit_cost": "800.00",
      "value": "36000.00"
    }
  ],
  "top_items_by_quantity": [
    {
      "id": 5,
      "item_code": "ITEM-005",
      "item_name": "Printer Paper",
      "current_stock": "1000.00"
    }
  ],
  "store_distribution": [
    {
      "store_name": "Main Store",
      "item_count": 20,
      "total_value": "28500.00"
    }
  ],
  "category_distribution": [
    {
      "category_name": "Electronics",
      "item_count": 8,
      "total_value": "15000.00"
    }
  ]
}
```

---

## Error Responses

All endpoints return appropriate HTTP status codes:

| Status Code | Meaning |
|-------------|---------|
| 200 | Report generated successfully |
| 400 | Invalid parameters or query error |
| 401 | Unauthorized (authentication required) |
| 403 | Forbidden (permission denied) |
| 500 | Server error |

**Error Response Example:**
```json
{
  "error": "Invalid date format. Use YYYY-MM-DD format."
}
```

---

## Filtering Examples

### Example 1: Get items report for current month by category
```
GET /api/v1/reports/items/?category_id=1&start_date=2026-03-01&end_date=2026-03-31
```

### Example 2: Get sales report for March 2026
```
GET /api/v1/reports/sales/?start_date=2026-03-01&end_date=2026-03-31&payment_status=paid
```

### Example 3: Get supplier report for specific school
```
GET /api/v1/reports/suppliers/?school_id=1&status=active
```

### Example 4: Get inventory dashboard overview
```
GET /api/v1/reports/dashboard/?school_id=1
```

---

## Key Features

### 1. Optimized Queries
- Uses `select_related()` for foreign keys
- Uses `prefetch_related()` for reverse relations
- Minimizes database queries using aggregations

### 2. Flexible Filtering
- Date range filtering for all transaction reports
- Status-based filtering
- Category, supplier, and store filtering
- School-level multi-tenancy support

### 3. Comprehensive Data
- Summary statistics with aggregations
- Detailed transaction breakdowns
- Line-item details
- Applied filters tracking

### 4. Business Intelligence
- Low stock and out-of-stock alerts
- Top items analysis
- Distribution analytics
- Recent activity tracking
- Revenue and purchase value metrics

---

## Usage in Frontend

### Template for Fetching Reports

```javascript
// Example: Fetch Item Report
async function fetchItemReport(filters = {}) {
  const params = new URLSearchParams();
  if (filters.categoryId) params.append('category_id', filters.categoryId);
  if (filters.startDate) params.append('start_date', filters.startDate);
  if (filters.endDate) params.append('end_date', filters.endDate);
  if (filters.status) params.append('status', filters.status);

  const response = await fetch(`/api/v1/reports/items/?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
}

// Usage
const report = await fetchItemReport({
  categoryId: 1,
  startDate: '2026-01-01',
  endDate: '2026-03-31',
});
```

---

## Performance Considerations

1. **Large Date Ranges**: For large date ranges, consider splitting requests
2. **School-level Filtering**: Always provide school_id for multi-tenant systems
3. **Pagination**: Frontend should implement pagination for detailed report lists (100+ items)
4. **Caching**: Consider caching reports that don't change frequently

---

## Future Enhancements

- [ ] Export to CSV/Excel
- [ ] PDF report generation
- [ ] Scheduled report emails
- [ ] Custom report builder
- [ ] Report templates
- [ ] Data visualization endpoints
- [ ] Forecast/trend analysis
- [ ] Comparative period analysis

---

## Support

For issues or feature requests related to reports, please contact the development team or create an issue in the project repository.
