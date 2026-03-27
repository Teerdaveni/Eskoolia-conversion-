# Reports Module Implementation Guide

## Overview

The Reports Module provides comprehensive analytics and reporting capabilities for the ERP system. It includes 8 major report types covering all inventory operations with advanced filtering, aggregations, and business intelligence features.

## Implementation Summary

### Architecture

The Reports Module follows a clean architecture pattern:

```
apps/reports/
├── views.py           # 8 report view classes + base class
├── serializers.py     # 20+ report serializers
├── urls.py            # Report endpoints
├── models.py          # Minimal (reports are view-based)
├── admin.py           # Admin configuration
├── tests.py           # Comprehensive test suite
└── REPORTS_API_DOCUMENTATION.md
```

### Key Design Decisions

1. **View-Based Reports**: Reports are generated dynamically from existing data (no separate report database)
2. **Optimized Queries**: Uses `select_related()` and `prefetch_related()` for performance
3. **Multi-Tenancy Support**: All reports respect school-level data isolation
4. **Flexible Filtering**: Comprehensive filtering options (date range, status, category, supplier, etc.)
5. **Summarized + Detailed**: Every report includes both summary and detailed breakdowns
6. **Aggregations**: Uses Django ORM aggregations for efficient calculations

## Report Types

### 1. Category Reports
**Endpoint**: `/api/v1/reports/categories/`

Analyzes inventory by item categories:
- Total categories and items per category
- Stock value by category
- Category-wise averages and totals

**Use Cases**:
- Inventory distribution by category
- Stock value analysis
- Category performance tracking

**Query Optimization**:
```python
categories.select_related('school').prefetch_related('items')
items_in_cat.aggregate(total_stock_units=Sum('current_stock'), ...)
```

---

### 2. Store Reports
**Endpoint**: `/api/v1/reports/stores/`

Analyzes storage and warehouse operations:
- Storage utilization metrics
- Stock levels per store
- Transaction counts (receives, issues, sales)
- Storage costs

**Use Cases**:
- Warehouse management
- Storage capacity planning
- Store performance comparison

**Query Optimization**:
```python
stores.filter(status_filter).select_related('school').prefetch_related('items')
# Count transactions per store
ItemReceive.objects.filter(store__in=stores).count()
```

---

### 3. Supplier Reports
**Endpoint**: `/api/v1/reports/suppliers/`

Tracks supplier performance:
- Purchase history and totals
- Supplier reliability
- Pending orders
- Delivery time analysis
- Supplier ratings

**Use Cases**:
- Vendor performance evaluation
- Purchase order tracking
- Supplier rating management
- Cost analysis

**Query Optimization**:
```python
supplier.receives.filter(receives_filter).aggregate(
    total_receives=Count('id'),
    total_value=Sum(F('quantity') * F('unit_cost'), ...)
)
```

---

### 4. Item Reports
**Endpoint**: `/api/v1/reports/items/`

Comprehensive inventory item analysis:
- Stock levels and reorder status
- Stock values per item
- Low stock and out-of-stock alerts
- Usage trends (received, issued, sold)
- Item categorization

**Features**:
- Status indicators: Normal, Low Stock, Out of Stock
- Reorder level tracking
- Transaction history aggregation

**Query Optimization**:
```python
items.select_related('category', 'store', 'school')
# For each item: sum quantities from transactions
ItemReceiveChild.objects.filter(item=item).aggregate(total=Sum('quantity'))
```

---

### 5. Receive (Purchase) Reports
**Endpoint**: `/api/v1/reports/receives/` or `/api/v1/reports/purchases/`

Analyzes purchase receipts:
- Total purchases and quantities
- Purchase value tracking
- Receive trends
- Supplier-wise breakdown
- Line-item details

**Use Cases**:
- Purchase order reconciliation
- Supplier payment tracking
- Purchase budget analysis
- Audit trail

**Query Optimization**:
```python
receives.select_related('supplier', 'store', 'school', 'created_by')
        .prefetch_related('children')
# Aggregate at transaction level and line-item level
```

---

### 6. Issue (Distribution) Reports
**Endpoint**: `/api/v1/reports/issues/` or `/api/v1/reports/distributions/`

Tracks item distribution:
- Distribution trends
- Recipient tracking
- Issued quantities and values
- Item movement analysis

**Use Cases**:
- Department allocation tracking
- Distribution audits
- Item usage monitoring
- Accountability reports

**Query Optimization**:
```python
issues.select_related('school', 'created_by').prefetch_related('children')
total_recipients = issues.values('recipient_name').distinct().count()
```

---

### 7. Sales Reports
**Endpoint**: `/api/v1/reports/sales/`

Revenue and sales analytics:
- Total sales and revenue
- Customer tracking
- Item-wise sales performance
- Payment status tracking
- Sales trends

**Use Cases**:
- Revenue reporting
- Sales performance analysis
- Customer analysis
- Inventory sell-through rates

**Query Optimization**:
```python
sales.select_related('store', 'school', 'created_by')
    .prefetch_related('children')
total_customers = sales.values('customer_name').distinct().count()
```

---

### 8. Inventory Dashboard
**Endpoint**: `/api/v1/reports/dashboard/` or `/api/v1/reports/overview/`

Real-time inventory health overview:
- Overall metrics
- Recent activities (last 10)
- Top items by value and quantity
- Store distribution
- Category distribution

**Features**:
- Real-time status indicators
- Activity feed
- Distribution analytics
- Top performers

**Use Cases**:
- Dashboard displays
- Quick health checks
- Executive summaries
- Mobile app overview

---

## Query Optimization Strategies

### 1. Select Related for Foreign Keys
```python
# Used in almost all views to prevent N+1 queries
receives.select_related('supplier', 'store', 'school', 'created_by')
```

### 2. Prefetch Related for Reverse Relations
```python
# Efficient batch loading of related objects
.prefetch_related('items', 'children')
```

### 3. Aggregations for Calculations
```python
# Efficient database-level aggregations
items_agg = items.aggregate(
    total_stock=Sum('current_stock'),
    total_value=Sum(F('current_stock') * F('unit_cost'), output_field=DecimalField())
)
```

### 4. Distinct Counts
```python
# Efficient counting of unique values
total_suppliers = receives.values('supplier').distinct().count()
```

### 5. F Expressions for Complex Calculations
```python
# Database-level calculations
Sum(F('quantity') * F('unit_cost'), output_field=DecimalField())
```

---

## Filtering Implementation

### Date Range Filtering
```python
def get_date_range(self):
    """Extract date range from query parameters"""
    start_date = self.request.query_params.get('start_date')
    end_date = self.request.query_params.get('end_date')
    
    # Parse and apply to queryset
    if start_date:
        queryset = queryset.filter(created_date__gte=parsed_date)
```

### Status Filtering
```python
def get_status_filter(self):
    """Get status filter from query parameters"""
    status_param = self.request.query_params.get('status')
    return Q(status=status_param) if status_param else Q()
```

### Multi-Tenancy (School) Filtering
```python
def get_school_context(self):
    """Get school from request or user profile"""
    school_id = self.request.query_params.get('school_id')
    if school_id:
        return School.objects.get(id=school_id)
    # Fallback to user's school
    if hasattr(self.request.user, 'profile'):
        return self.request.user.profile.school
```

---

## Response Structure

Every report follows a consistent structure:

```json
{
  "summary": {
    "total_items": 25,
    "total_value": "50000.00",
    ...
  },
  "details": [
    {
      "id": 1,
      "name": "Item",
      "value": "1000.00",
      ...
    }
  ],
  "line_items": [
    {
      "item_code": "ITEM-001",
      "quantity": "10.00",
      ...
    }
  ],
  "filters_applied": {
    "start_date": "2026-01-01",
    "category_id": 1
  }
}
```

---

## Error Handling

All views include comprehensive error handling:

```python
try:
    # Report generation logic
    return Response(serializer.data, status=status.HTTP_200_OK)
except Exception as e:
    return Response(
        {'error': str(e)},
        status=status.HTTP_400_BAD_REQUEST
    )
```

---

## Testing

The module includes comprehensive tests:

```
Test Classes:
├── ReportTestSetup (Base setup)
├── CategoryReportTestCase
├── StoreReportTestCase
├── SupplierReportTestCase
├── ItemReportTestCase
├── ReceiveReportTestCase
├── IssueReportTestCase
├── SalesReportTestCase
├── DashboardTestCase
├── DateRangeFilterTestCase
├── AuthenticationTestCase
└── 20+ individual test methods
```

**Run Tests**:
```bash
python manage.py test apps.reports
```

---

## API Endpoint Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/reports/categories/` | GET | Category analysis |
| `/api/v1/reports/stores/` | GET | Store/warehouse reports |
| `/api/v1/reports/suppliers/` | GET | Supplier performance |
| `/api/v1/reports/items/` | GET | Item inventory status |
| `/api/v1/reports/receives/` | GET | Purchase receipts |
| `/api/v1/reports/purchases/` | GET | (alias) Purchase receipts |
| `/api/v1/reports/issues/` | GET | Item distribution |
| `/api/v1/reports/distributions/` | GET | (alias) Item distribution |
| `/api/v1/reports/sales/` | GET | Sales transactions |
| `/api/v1/reports/dashboard/` | GET | Inventory overview |
| `/api/v1/reports/overview/` | GET | (alias) Inventory overview |

---

## Usage Examples

### Example 1: Get Item Report with Low Stock
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/v1/reports/items/" | jq '.details[] | select(.status_indicator=="Low Stock")'
```

### Example 2: Get Sales Report for March 2026
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/v1/reports/sales/?start_date=2026-03-01&end_date=2026-03-31"
```

### Example 3: Get Dashboard for Specific School
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/v1/reports/dashboard/?school_id=1"
```

### Example 4: Get Supplier Report
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:8000/api/v1/reports/suppliers/?status=active"
```

---

## Performance Considerations

### 1. Database Query Count
- Category report: ~3-4 queries
- Store report: ~5-6 queries
- Item report: ~4-5 queries (+ per-item queries)
- Dashboard: ~8-10 queries

### 2. Caching Opportunities
For frequently accessed reports:
```python
from django.views.decorators.cache import cache_page

@cache_page(60 * 5)  # Cache for 5 minutes
def get(self, request):
    ...
```

### 3. Pagination (Frontend)
For large reports (100+ items), implement frontend pagination:
```javascript
const pageSize = 50;
const currentPage = 1;
const paginatedData = details.slice(
  (currentPage - 1) * pageSize,
  currentPage * pageSize
);
```

### 4. Asynchronous Processing
For very large datasets, consider async tasks:
```python
from celery import shared_task

@shared_task
def generate_report_async(report_type, filters):
    # Generate report in background
    pass
```

---

## Scalability Features

1. **Efficient Aggregations**: All calculations done at database level
2. **Selective Field Loading**: Only necessary fields selected
3. **Lazy Evaluation**: Querysets evaluated only when needed
4. **Index Optimization**: Indexes on commonly filtered fields (created_at, status, school)
5. **Connection Pooling**: Support for connection pooling in production

---

## Future Enhancements

### Planned Features
- [ ] CSV export endpoint
- [ ] PDF report generation
- [ ] Scheduled email reports
- [ ] Custom report builder
- [ ] Report templates
- [ ] Data visualization API
- [ ] Predictive analytics (forecasting)
- [ ] Comparison (period-over-period)
- [ ] Trend analysis
- [ ] Anomaly detection

### Potential Optimizations
- Redis caching for frequently accessed reports
- Elasticsearch integration for advanced search
- GraphQL for flexible querying
- Report scheduling and delivery
- Webhooks for report automation

---

## Troubleshooting

### Issue: Reports return empty data
**Solution**: Check if school_id is provided and correct in the request

### Issue: Performance is slow
**Solution**: 
1. Add school_id filter to limit dataset
2. Use date range filters to narrow results
3. Consider caching implementation

### Issue: Authorization errors
**Solution**: Ensure JWT token is valid and included in Authorization header

---

## Database Schema Requirements

The reports module requires the following core tables:
- `core_itemcategory`
- `core_itemstore`
- `core_supplier`
- `core_item`
- `core_itemreceive`
- `core_itemreceivechild`
- `core_itemissue`
- `core_itemissuechild`
- `core_itemsell`
- `core_itemsellchild`

Ensure indexes on:
- `created_at` (for date range queries)
- `status` (for status filters)
- `school_id` (for multi-tenancy)

---

## Integration with Frontend

### React/Next.js Integration Example
```javascript
async function fetchReport(reportType, filters = {}) {
  const params = new URLSearchParams(filters);
  const response = await fetch(
    `/api/v1/reports/${reportType}/?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.json();
}

// Usage
const itemReport = await fetchReport('items', {
  category_id: 1,
  start_date: '2026-01-01',
  end_date: '2026-03-31',
});
```

---

## Support & Maintenance

For issues, updates, or new features:
1. Create issue in project repository
2. Reference this documentation
3. Include error logs and reproduction steps
4. Mention affected report type and filters

---

## Version History

### v1.0.0 (Current)
- 8 report types implemented
- Comprehensive filtering
- Aggregation queries
- Test suite included
- Documentation provided

---

## Author & Contributors

Developed by: AI Assistant
Last Updated: March 26, 2026
Version: 1.0.0
