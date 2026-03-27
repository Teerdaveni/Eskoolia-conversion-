# Reports Module - Architecture & Structure Reference

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CLIENT (Frontend)                           │
│                      (React/Next.js/Mobile)                         │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ HTTP GET with JWT Token
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    API Gateway & Authentication                     │
│                          (DRF Middleware)                           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ Validated Request
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        REPORTS URLs Router                          │
│              /api/v1/reports/<report_type>/                         │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
        ┌──────────────────────┼──────────────────────┐
        │                      │                      │
        ▼                      ▼                      ▼
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│  Report Views    │  │  Query Builders  │  │  Serializers     │
│   (8 Classes)    │  │   (Filtering)    │  │  (20+ Classes)   │
└──────────────────┘  └──────────────────┘  └──────────────────┘
        │                      │                      │
        └──────────────────────┼──────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Django ORM with   │
                    │  Optimized Queries  │
                    │  (select_related,   │
                    │   prefetch_related, │
                    │   aggregations)     │
                    └─────────────────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   Database Models   │
                    │  (ItemCategory,     │
                    │   ItemStore,        │
                    │   Supplier, Item,   │
                    │   etc.)             │
                    └─────────────────────┘
                               │
                               ▼
┌──────────────────────────────╨─────────────────────────────────────┐
│                        PostgreSQL/SQLite                           │
│                        Database Server                             │
└──────────────────────────────────────────────────────────────────┘
```

## Report Data Flow

```
User Request
    │
    ▼
Filter Extraction
    │ (date_range, status, category_id, supplier_id, school_id)
    ▼
Query Building
    │ (select_related, prefetch_related, filter, aggregate)
    ▼
Database Query Execution
    │ (optimized SQL)
    ▼
Data Aggregation
    │ (count, sum, average, distinct)
    ▼
Response Building
    ├─ Summary Statistics
    ├─ Detailed Records
    ├─ Line Items (if transaction report)
    └─ Filters Applied
    ▼
Serialization
    │ (JSONification)
    ▼
HTTP Response (200 OK)
    │
    ▼
Client Receives Report Data
```

## View Hierarchy

```
BaseReportView (APIView)
├── Permissions: IsAuthenticated
├── Methods:
│   ├── get_school_context()
│   ├── get_date_range()
│   ├── get_status_filter()
│   └── get_common_filters()
│
└── Inheriting Classes:
    ├── CategoryReportView
    ├── StoreReportView
    ├── SupplierReportView
    ├── ItemReportView
    ├── ReceiveReportView
    ├── IssueReportView
    ├── SalesReportView
    └── InventoryDashboardView
```

## Serializer Hierarchy

```
Base Serializer (DRF Serializer)
│
├── Summary Serializers
│   ├── CategorySummarySerializer
│   ├── StoreSummarySerializer
│   ├── SupplierSummarySerializer
│   ├── ItemSummarySerializer
│   ├── ReceiveSummarySerializer
│   ├── IssueSummarySerializer
│   ├── SalesSummarySerializer
│   └── InventorySummarySerializer
│
├── Detail Serializers
│   ├── CategoryDetailSerializer
│   ├── StoreDetailSerializer
│   ├── SupplierDetailSerializer
│   ├── ItemDetailSerializer
│   ├── ReceiveDetailSerializer
│   ├── IssueDetailSerializer
│   └── SalesDetailSerializer
│
├── Line Item Serializers (for transactions)
│   ├── ReceiveItemDetailSerializer
│   ├── IssueItemDetailSerializer
│   └── SalesItemDetailSerializer
│
└── Report Serializers (Combine Summary + Details)
    ├── CategoryReportSerializer
    ├── StoreReportSerializer
    ├── SupplierReportSerializer
    ├── ItemReportSerializer
    ├── ReceiveReportSerializer
    ├── IssueReportSerializer
    ├── SalesReportSerializer
    └── InventoryDashboardSerializer
```

## Report Types & Endpoints

```
CATEGORY REPORTS
└── GET /api/v1/reports/categories/
    │
    ├── Summary: total_categories, total_items, total_stock_value
    │
    └── Details: [
        {category_id, category_name, total_items, total_stock_units, ...}
        ]

STORE REPORTS
└── GET /api/v1/reports/stores/
    │
    ├── Summary: total_stores, total_items_stored, total_storage_value
    │
    └── Details: [
        {store_id, store_name, total_items, total_stock_value, ...}
        ]

SUPPLIER REPORTS
└── GET /api/v1/reports/suppliers/
    │
    ├── Summary: total_suppliers, total_purchases, total_purchase_value
    │
    └── Details: [
        {supplier_id, supplier_name, total_purchases, pending_orders, ...}
        ]

ITEM REPORTS
└── GET /api/v1/reports/items/
    │
    ├── Summary: total_items, total_stock_units, total_stock_value, 
    │           low_stock_items, out_of_stock_items
    │
    └── Details: [
        {item_id, item_code, current_stock, status_indicator, ...}
        ]

RECEIVE REPORTS
└── GET /api/v1/reports/receives/ (or /purchases/)
    │
    ├── Summary: total_receives, total_quantity, total_purchase_value
    │
    ├── Details: [
    │   {receive_id, receive_number, supplier_name, total_quantity, ...}
    │   ]
    │
    └── Line Items: [
        {item_code, item_name, quantity, unit_cost, total_cost}
        ]

ISSUE REPORTS
└── GET /api/v1/reports/issues/ (or /distributions/)
    │
    ├── Summary: total_issues, total_quantity_issued, total_value
    │
    ├── Details: [
    │   {issue_id, issue_number, recipient_name, total_quantity, ...}
    │   ]
    │
    └── Line Items: [
        {item_code, item_name, quantity, unit_cost, total_cost}
        ]

SALES REPORTS
└── GET /api/v1/reports/sales/
    │
    ├── Summary: total_sales, total_quantity_sold, total_sales_value
    │
    ├── Details: [
    │   {sale_id, sale_number, customer_name, total_quantity, ...}
    │   ]
    │
    └── Line Items: [
        {item_code, item_name, quantity, unit_price, total_price}
        ]

INVENTORY DASHBOARD
└── GET /api/v1/reports/dashboard/ (or /overview/)
    │
    ├── Summary: {total_items, total_stores, total_categories, ...}
    │
    ├── Recent Activities: [last 10 transactions]
    │
    ├── Top Items by Value: [top 5 items]
    │
    ├── Top Items by Quantity: [top 5 items]
    │
    ├── Store Distribution: [distribution by store]
    │
    └── Category Distribution: [distribution by category]
```

## Query Optimization Pattern

```
View Method (GET request)
    │
    ▼
Build Base Queryset
    │ .select_related('foreign_key_fields')
    │ .prefetch_related('reverse_relations')
    │
    ▼
Apply Filters
    │ .filter(school=school)
    │ .filter(status_filter)
    │ .filter(date_filters)
    │
    ▼
Execute Aggregations
    │ .aggregate(Sum(...), Count(...), Avg(...))
    │ .values(...).distinct().count()
    │
    ▼
Build Response Data
    │ {summary: {...}, details: [...]}
    │
    ▼
Serialize & Return
    │
    ▼
JSON Response to Client
```

## Filter Flow

```
HTTP Query Parameters
    │
    ├─ start_date, end_date
    ├─ status
    ├─ category_id
    ├─ supplier_id
    ├─ store_id
    └─ school_id
    │
    ▼
BaseReportView Methods
    │
    ├─ get_date_range()        → {start_date_obj, end_date_obj}
    ├─ get_status_filter()     → Q(status=...)
    ├─ get_school_context()    → School instance
    └─ get_common_filters()    → {all_filters}
    │
    ▼
Build Q Objects
    │
    ▼
Apply to Queryset
    │ queryset.filter(q_object1 & q_object2 & ...)
    │
    ▼
Filtered Data
    │
    ▼
Track Applied Filters for Response
    │
    ▼
Response: {..., filters_applied: {start_date, status, ...}}
```

## Database Query Patterns

```
1. SELECT_RELATED (For Foreign Keys)
   ─────────────────────────────────
   receives.select_related('supplier', 'store', 'school')
   │
   └─ Converts N+1 queries to 1 query with JOIN
   
2. PREFETCH_RELATED (For Reverse Relations)
   ──────────────────────────────────────────
   categories.prefetch_related('items')
   │
   └─ Batch loads related objects in separate query
   
3. AGGREGATIONS (For Calculations)
   ──────────────────────────────
   items.aggregate(
       total=Sum('current_stock'),
       value=Sum(F('current_stock') * F('unit_cost'))
   )
   │
   └─ Performs calculations at database level
   
4. VALUES_DISTINCT (For Unique Counts)
   ──────────────────────────────────
   receives.values('supplier').distinct().count()
   │
   └─ Counts unique suppliers efficiently
```

## Authentication Flow

```
HTTP Request
    │
    ├─ Authorization Header
    │  └─ "Bearer eyJ0eXAiOiJKV1Q..."
    │
    ▼
JWT Token Validation
    │ (DRF SimpleJWT)
    │
    ▼
User Extraction
    │ request.user = authenticated User
    │
    ▼
Permission Check
    │ IsAuthenticated
    │ ├─ True  → Continue to view
    │ └─ False → Return 401 Unauthorized
    │
    ▼
School Context
    │ ├─ From query param ?school_id=1
    │ ├─ OR from request.user.profile.school
    │ └─ Used for data isolation
    │
    ▼
Execute Report View
```

## Error Handling

```
Report Execution
    │
    ▼
Try Block
    │
    ├─ Success
    │  └─ Response 200 OK {data}
    │
    └─ Exception Caught
       │
       ├─ Invalid Filter → 400 Bad Request {error: "..."}
       ├─ Auth Failed    → 401 Unauthorized
       ├─ Permission     → 403 Forbidden
       └─ Server Error   → 500 Server Error {error: "..."}
```

## Response Structure

```json
{
  "summary": {
    "metric1": value1,
    "metric2": value2,
    "metric3": value3
  },
  "details": [
    {
      "id": 1,
      "name": "Record 1",
      "value": "X"
    },
    {
      "id": 2,
      "name": "Record 2",
      "value": "Y"
    }
  ],
  "line_items": [
    {
      "item_code": "ITEM-001",
      "quantity": "10.00",
      "value": "1000.00"
    }
  ],
  "filters_applied": {
    "start_date": "2026-01-01",
    "status": "active"
  }
}
```

## File Structure

```
reports/
├── __init__.py                           (1 line)
├── apps.py                               (5 lines)
├── models.py                             (6 lines)
├── admin.py                              (3 lines)
├── views.py                              (~800 lines)
│   └── 9 Classes (1 base + 8 reports)
├── serializers.py                        (~400 lines)
│   └── 20+ Serializer classes
├── urls.py                               (~20 lines)
│   └── 11 URL patterns
├── tests.py                              (~500 lines)
│   └── 11 test classes, 20+ test methods
├── QUICK_START.md                        (~200 lines)
├── README.md                             (~400 lines)
├── REPORTS_API_DOCUMENTATION.md          (~600 lines)
└── IMPLEMENTATION_SUMMARY.md             (~400 lines)
```

## Statistics

```
Code Quality:
  Total Lines of Code:     ~1,500
  View Classes:            9 (1 base + 8 reports)
  Serializer Classes:      20+
  Test Classes:            11
  Test Methods:            20+
  URL Endpoints:           11

Features:
  Report Types:            8
  Filter Options:          6+
  Response Components:     3 (summary, details, line_items)
  Serializer Types:        3 (summary, detail, combined)

Documentation:
  Implementation Guide:    ~400 lines
  API Documentation:       ~600 lines
  Quick Start:             ~200 lines
  Summary:                 ~400 lines
  Total:                   ~1,600 lines

Testing:
  Test Coverage:           All 8 reports
  Test Methods:            20+ comprehensive tests
  Filtering Tests:         Date range, status, multi-tenant
  Authentication Tests:    Token validation
```

---

This reference guide provides a complete architectural overview of the Reports Module implementation.
