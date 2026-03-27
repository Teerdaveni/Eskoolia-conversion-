# Reports Module - Quick Start Guide

## Installation & Setup

### Step 1: App is Already Registered
The reports app is already added to `INSTALLED_APPS` in `config/settings/base.py`:
```python
INSTALLED_APPS = [
    ...
    "apps.reports",
]
```

### Step 2: URLs are Already Configured
The report URLs are included in `config/urls.py`:
```python
path("api/v1/reports/", include("apps.reports.urls")),
```

### Step 3: No Migrations Needed
Reports are view-based and don't require database migrations.

## Quick API Tests

### 1. Get Authentication Token
```bash
curl -X POST http://localhost:8000/api/v1/auth/token/ \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin"}'
```

Response:
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

### 2. Test Category Report
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/reports/categories/
```

### 3. Test Item Report with Filters
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:8000/api/v1/reports/items/?start_date=2026-01-01&end_date=2026-03-31"
```

### 4. Test Dashboard
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/v1/reports/dashboard/
```

## Available Endpoints

| Endpoint | Description | Filters |
|----------|-------------|---------|
| `/api/v1/reports/categories/` | Category analysis | status |
| `/api/v1/reports/stores/` | Store/warehouse reports | status |
| `/api/v1/reports/suppliers/` | Supplier performance | status, date range |
| `/api/v1/reports/items/` | Inventory items | status, category_id, date range |
| `/api/v1/reports/receives/` | Purchase receipts | status, supplier_id, date range |
| `/api/v1/reports/issues/` | Item distribution | status, date range |
| `/api/v1/reports/sales/` | Sales transactions | status, date range |
| `/api/v1/reports/dashboard/` | Inventory overview | (none) |

## Common Filters

### Date Range
```bash
?start_date=2026-01-01&end_date=2026-03-31
```

### Status
```bash
?status=active
```

### Category (Items Report)
```bash
?category_id=1
```

### Supplier (Supplier & Receive Reports)
```bash
?supplier_id=1
```

### School (Multi-tenant)
```bash
?school_id=1
```

## Example Requests

### Get All Categories
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/v1/reports/categories/
```

### Get Low Stock Items
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/v1/reports/items/ | \
  jq '.details[] | select(.status_indicator=="Low Stock")'
```

### Get Sales for March 2026
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:8000/api/v1/reports/sales/?start_date=2026-03-01&end_date=2026-03-31"
```

### Get Supplier Performance
```bash
curl -H "Authorization: Bearer TOKEN" \
  "http://localhost:8000/api/v1/reports/suppliers/?status=active"
```

### Get Dashboard Overview
```bash
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:8000/api/v1/reports/dashboard/
```

## Response Structure

All reports follow a consistent structure:

```json
{
  "summary": {
    "total_items": 25,
    "total_value": "50000.00"
  },
  "details": [
    {
      "id": 1,
      "name": "Item",
      "value": "1000.00"
    }
  ],
  "line_items": [...],
  "filters_applied": {
    "start_date": "2026-01-01"
  }
}
```

## Frontend Integration

### JavaScript Fetch Example
```javascript
async function generateReport(reportType, filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await fetch(
    `/api/v1/reports/${reportType}/?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  const data = await response.json();
  return data;
}

// Usage
const itemReport = await generateReport('items', {
  category_id: 1,
  start_date: '2026-01-01',
  end_date: '2026-03-31',
});

console.log('Total Items:', itemReport.summary.total_items);
console.log('Stock Value:', itemReport.summary.total_stock_value);
```

### React Hook Example
```javascript
import { useEffect, useState } from 'react';

export function useReport(reportType, filters = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const params = new URLSearchParams(filters);
        const response = await fetch(
          `/api/v1/reports/${reportType}/?${params}`,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          }
        );
        const json = await response.json();
        setData(json);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [reportType, filters]);

  return { data, loading, error };
}

// Usage
export function ItemReportPage() {
  const { data, loading } = useReport('items', { category_id: 1 });

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h2>Item Report</h2>
      <p>Total Items: {data.summary.total_items}</p>
      <p>Stock Value: ${data.summary.total_stock_value}</p>
      <table>
        <tbody>
          {data.details.map(item => (
            <tr key={item.item_id}>
              <td>{item.item_code}</td>
              <td>{item.current_stock}</td>
              <td>${item.stock_value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

## Running Tests

### Run All Report Tests
```bash
python manage.py test apps.reports
```

### Run Specific Test Class
```bash
python manage.py test apps.reports.tests.ItemReportTestCase
```

### Run with Verbose Output
```bash
python manage.py test apps.reports -v 2
```

## Troubleshooting

### Q: Getting 401 Unauthorized
**A**: Ensure you have a valid JWT token. Get one from `/api/v1/auth/token/`

### Q: Reports return empty data
**A**: Check if you have data in the system. Create test data first:
```bash
python manage.py shell
>>> from apps.core.models import ItemCategory
>>> ItemCategory.objects.create(category_name="Test")
```

### Q: Getting 400 Bad Request
**A**: Check date format. Use `YYYY-MM-DD` format for dates.

### Q: Slow response times
**A**: Use filters to narrow down results, especially date ranges and school_id.

## Next Steps

1. **Read Full Documentation**: See [REPORTS_API_DOCUMENTATION.md](REPORTS_API_DOCUMENTATION.md)
2. **Implementation Details**: See [README.md](README.md)
3. **Run Tests**: `python manage.py test apps.reports`
4. **Build Frontend**: Create UI components to display reports
5. **Add Caching**: Implement Redis caching for performance
6. **Export Features**: Add CSV/PDF export functionality

## File Locations

```
apps/reports/
├── views.py                          # 8 report view classes
├── serializers.py                    # Report serializers
├── urls.py                           # URL routes
├── tests.py                          # Test suite (20+ tests)
├── models.py                         # (empty - view-based)
├── admin.py                          # Admin config
├── README.md                         # Full documentation
├── REPORTS_API_DOCUMENTATION.md      # API details
└── QUICK_START.md                    # This file
```

## Key Features

✅ 8 Report Types
- Category Reports
- Store Reports
- Supplier Reports
- Item Reports
- Receive/Purchase Reports
- Issue/Distribution Reports
- Sales Reports
- Inventory Dashboard

✅ Advanced Filtering
- Date Range Filtering
- Status Filtering
- Category/Supplier/Store Filtering
- Multi-tenancy (School) Support

✅ Data Aggregations
- Count aggregations
- Sum aggregations
- Average calculations
- Distinct value counting

✅ Performance Optimized
- Select_related for FK queries
- Prefetch_related for reverse queries
- Database-level aggregations
- Minimal N+1 queries

✅ Comprehensive Testing
- 11 test classes
- 20+ test methods
- Authentication tests
- Filter tests
- Calculation verification

## API Documentation Reference

Full API documentation is available in [REPORTS_API_DOCUMENTATION.md](REPORTS_API_DOCUMENTATION.md)

Key sections:
- All 8 endpoints documented
- Query parameters explained
- Example requests and responses
- Error handling guide
- Performance considerations
- Frontend integration examples

## Support

For detailed help, refer to the full documentation files in this directory.
