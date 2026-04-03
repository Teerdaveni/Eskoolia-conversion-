"use client";

import { useEffect, useMemo, useState } from "react";
import { apiRequestWithRefresh } from "@/lib/api-auth";
import { API_BASE_URL } from "@/lib/api";
import { getAccessToken } from "@/lib/auth";
import type { ReportDefinition, ReportFilterField } from "@/lib/reports-config";

type ReportResponse = {
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
  results: Record<string, unknown>[];
};

type LookupSource = NonNullable<ReportFilterField["source"]>;
type LookupItem = Record<string, unknown>;

function toLabel(key: string): string {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

const DEFAULT_FILTER_FIELDS: ReportFilterField[] = [
  { key: "keyword", label: "Keyword", type: "text", placeholder: "Search" },
  { key: "start_date", label: "Start Date", type: "date" },
  { key: "end_date", label: "End Date", type: "date" },
];

const LOOKUP_ENDPOINTS: Record<LookupSource, string> = {
  classes: "/api/v1/core/classes/?page_size=500",
  sections: "/api/v1/core/sections/?page_size=800",
  students: "/api/v1/students/students/?is_active=true&page_size=1000",
  subjects: "/api/v1/core/subjects/?page_size=500",
  exams: "/api/v1/exams/exams/?page_size=500",
  departments: "/api/v1/hr/departments/?page_size=300",
  designations: "/api/v1/hr/designations/?page_size=300",
  staff: "/api/v1/hr/staff/?page_size=1000",
  routes: "/api/v1/core/transport-routes/?page_size=500",
  vehicles: "/api/v1/core/vehicles/?page_size=500",
  books: "/api/v1/library/books/?page_size=500",
  categories: "/api/v1/core/item-categories/?page_size=500",
  suppliers: "/api/v1/core/suppliers/?page_size=500",
  incidents: "/api/v1/behaviour/incidents/?page_size=500",
};

function toStringId(value: unknown): string {
  if (typeof value === "number") return String(value);
  if (typeof value === "string") return value;
  if (value && typeof value === "object" && "id" in value) {
    const maybeId = (value as { id?: unknown }).id;
    if (typeof maybeId === "number") return String(maybeId);
    if (typeof maybeId === "string") return maybeId;
  }
  return "";
}

function normalizeListPayload(payload: unknown): LookupItem[] {
  if (Array.isArray(payload)) {
    return payload as LookupItem[];
  }

  if (payload && typeof payload === "object") {
    const maybeResults = (payload as { results?: unknown }).results;
    if (Array.isArray(maybeResults)) {
      return maybeResults as LookupItem[];
    }
  }

  return [];
}

function displayLabelForSource(source: LookupSource, item: LookupItem): string {
  const name =
    (item.name as string | undefined)
    || (item.title as string | undefined)
    || (item.class_name as string | undefined)
    || (item.section_name as string | undefined)
    || (item.subject_name as string | undefined)
    || (item.book_title as string | undefined)
    || (item.incident_title as string | undefined);

  if (source === "students") {
    const first = (item.first_name as string | undefined) || "";
    const last = (item.last_name as string | undefined) || "";
    const admission = (item.admission_no as string | undefined) || "-";
    const full = `${first} ${last}`.trim();
    return full ? `${full} (${admission})` : `Student ${item.id ?? ""}`;
  }

  if (source === "staff") {
    const first = (item.first_name as string | undefined) || "";
    const last = (item.last_name as string | undefined) || "";
    const staffNo = (item.staff_no as string | undefined) || "-";
    const full = `${first} ${last}`.trim();
    return full ? `${full} (${staffNo})` : `Staff ${item.id ?? ""}`;
  }

  if (source === "vehicles") {
    const vehicleNo = (item.vehicle_no as string | undefined) || (item.number as string | undefined) || "";
    const model = (item.model as string | undefined) || "";
    const text = [vehicleNo, model].filter(Boolean).join(" - ");
    return text || `Vehicle ${item.id ?? ""}`;
  }

  if (source === "incidents") {
    return name || `Incident ${item.id ?? ""}`;
  }

  return name || `${toLabel(String(item.id ?? "item"))} ${item.id ?? ""}`;
}

function getDependencyValue(item: LookupItem, key: string): string {
  if (key === "class_id") {
    return toStringId(item.class_id ?? item.school_class ?? item.current_class ?? item.class);
  }

  if (key === "section_id") {
    return toStringId(item.section_id ?? item.current_section ?? item.section);
  }

  if (key === "department_id") {
    return toStringId(item.department_id ?? item.department);
  }

  if (key === "designation_id") {
    return toStringId(item.designation_id ?? item.designation);
  }

  if (key === "route_id") {
    return toStringId(item.route_id ?? item.transport_route_id ?? item.transport_route);
  }

  return toStringId(item[key]);
}

function createInitialFilters(fields: ReportFilterField[]): Record<string, string> {
  return fields.reduce<Record<string, string>>((acc, field) => {
    if (field.type === "select") {
      acc[field.key] = field.options?.[0]?.value ?? "";
      return acc;
    }

    acc[field.key] = "";
    return acc;
  }, {});
}

export default function ReportExplorer({ definition }: { definition: ReportDefinition }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(0);
  const [lookupOptions, setLookupOptions] = useState<Record<LookupSource, LookupItem[]>>({} as Record<LookupSource, LookupItem[]>);

  const filterFields = useMemo<ReportFilterField[]>(() => {
    return definition.filterFields && definition.filterFields.length > 0
      ? definition.filterFields
      : DEFAULT_FILTER_FIELDS;
  }, [definition.filterFields]);
  const [filters, setFilters] = useState<Record<string, string>>(() => createInitialFilters(filterFields));

  useEffect(() => {
    setFilters(createInitialFilters(filterFields));
  }, [filterFields]);

  useEffect(() => {
    const sources = Array.from(new Set(filterFields.map((field) => field.source).filter(Boolean))) as LookupSource[];
    if (!sources.length) {
      setLookupOptions({} as Record<LookupSource, LookupItem[]>);
      return;
    }

    let isMounted = true;

    const loadLookups = async () => {
      const settled = await Promise.allSettled(
        sources.map(async (source) => {
          const response = await apiRequestWithRefresh<unknown>(LOOKUP_ENDPOINTS[source]);
          return [source, normalizeListPayload(response)] as const;
        }),
      );

      if (!isMounted) return;

      const next: Partial<Record<LookupSource, LookupItem[]>> = {};
      let hasLookupFailure = false;

      settled.forEach((entry) => {
        if (entry.status === "fulfilled") {
          const [source, items] = entry.value;
          next[source] = items;
        } else {
          hasLookupFailure = true;
        }
      });

      setLookupOptions(next as Record<LookupSource, LookupItem[]>);

      if (hasLookupFailure) {
        setError("Unable to load some filter dropdown values.");
      }
    };

    void loadLookups();

    return () => {
      isMounted = false;
    };
  }, [filterFields]);

  const columns = useMemo(() => {
    if (definition.columns && definition.columns.length > 0) {
      return definition.columns;
    }
    if (rows.length === 0) {
      return [];
    }
    return Object.keys(rows[0]).map((key) => ({ key, label: toLabel(key) }));
  }, [definition.columns, rows]);

  const buildQuery = (targetPage: number, exportFormat?: "csv" | "excel" | "pdf") => {
    const params = new URLSearchParams();
    params.set("page", String(targetPage));
    params.set("page_size", "20");

    filterFields.forEach((field) => {
      const value = (filters[field.key] ?? "").trim();
      if (value.length > 0) {
        params.set(field.key, value);
      }
    });

    if (exportFormat) {
      params.set("export", exportFormat);
    }
    return params;
  };

  const loadData = async (targetPage = page) => {
    setLoading(true);
    setError("");
    try {
      const params = buildQuery(targetPage);
      const data = await apiRequestWithRefresh<ReportResponse>(`${definition.endpoint}?${params.toString()}`);
      setRows(data.results || []);
      setPage(data.page || targetPage);
      setTotalPages(data.total_pages || 1);
      setCount(data.count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load report.");
      setRows([]);
      setCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [definition.key]);

  const resetFilters = async () => {
    const initial = createInitialFilters(filterFields);
    setFilters(initial);
    setPage(1);
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("page_size", "20");
      const data = await apiRequestWithRefresh<ReportResponse>(`${definition.endpoint}?${params.toString()}`);
      setRows(data.results || []);
      setTotalPages(data.total_pages || 1);
      setCount(data.count || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reset report filters.");
      setRows([]);
      setCount(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const downloadExport = async (format: "csv" | "excel" | "pdf") => {
    try {
      setError("");
      const token = getAccessToken();
      if (!token) {
        setError("Please login again to export this report.");
        return;
      }
      const params = buildQuery(page, format);
      const response = await fetch(`${API_BASE_URL}${definition.endpoint}?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        throw new Error(`Export failed (${response.status})`);
      }

      const disposition = response.headers.get("content-disposition") || "";
      const match = disposition.match(/filename=\"?([^\";]+)\"?/i);
      const filename = match?.[1] || `${definition.key}.${format === "excel" ? "xlsx" : format}`;

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to export report.");
    }
  };

  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid">
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="m-0 text-2xl">{definition.title}</h1>
            <div className="d-flex gap-8 text-muted-13">
              <span>Dashboard</span>
              <span>/</span>
              <span>Reports</span>
              <span>/</span>
              <span>{definition.title}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0">
          <div className="white-box report-criteria-box">
            <div className="report-criteria-header">
              <h3>Select Criteria</h3>
              <div className="report-export-actions">
                <button
                  type="button"
                  onClick={() => void downloadExport("csv")}
                  className="report-btn report-btn-csv"
                >
                  Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => void downloadExport("excel")}
                  className="report-btn report-btn-excel"
                >
                  Export Excel
                </button>
                <button
                  type="button"
                  onClick={() => void downloadExport("pdf")}
                  className="report-btn report-btn-pdf"
                >
                  Export PDF
                </button>
              </div>
            </div>
            <div className="row align-items-end">
              {filterFields.map((field) => {
                const controlId = `report-filter-${field.key}`;
                const value = filters[field.key] ?? "";
                const dependencyKeys = field.dependsOn ?? [];

                const dynamicSelectOptions = field.source
                  ? (lookupOptions[field.source] ?? [])
                      .filter((item) =>
                        dependencyKeys.every((dependencyKey) => {
                          const selected = (filters[dependencyKey] ?? "").trim();
                          if (!selected) return true;
                          return getDependencyValue(item, dependencyKey) === selected;
                        }),
                      )
                      .map((item) => ({
                        value: toStringId(item.id),
                        label: displayLabelForSource(field.source as LookupSource, item),
                      }))
                  : [];

                const finalOptions = field.options && field.options.length > 0
                  ? field.options
                  : dynamicSelectOptions;

                if (field.type === "select") {
                  return (
                    <div key={field.key} className="col-lg-3 col-md-4 col-sm-6 col-12 report-field">
                      <label htmlFor={controlId}>
                        {field.label}
                      </label>
                      <select
                        id={controlId}
                        value={value}
                        onChange={(event) => {
                          const nextValue = event.target.value;
                          setFilters((prev) => {
                            const next = { ...prev, [field.key]: nextValue };

                            filterFields.forEach((candidate) => {
                              if (candidate.dependsOn?.includes(field.key)) {
                                next[candidate.key] = "";
                              }
                            });

                            return next;
                          });
                        }}
                        className="report-control"
                      >
                        <option value="">{field.placeholder || `Select ${field.label}`}</option>
                        {finalOptions.map((option) => (
                          <option key={`${field.key}-${option.value || "all"}`} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                }

                return (
                  <div key={field.key} className="col-lg-3 col-md-4 col-sm-6 col-12 report-field">
                    <label htmlFor={controlId}>
                      {field.label}
                    </label>
                    <input
                      id={controlId}
                      type={field.type}
                      value={value}
                      onChange={(event) => setFilters((prev) => ({ ...prev, [field.key]: event.target.value }))}
                      placeholder={field.placeholder || field.label}
                      className="report-control"
                    />
                  </div>
                );
              })}

              <div className="col-lg-3 col-md-4 col-sm-6 col-12 report-field report-field-actions">
                <label htmlFor="report-search-action">Actions</label>
                <div className="report-actions report-actions-inline" id="report-search-action">
                <button
                  type="button"
                  onClick={() => void loadData(1)}
                  disabled={loading}
                  className="report-btn report-btn-primary"
                >
                  {loading ? "Loading..." : "Search"}
                </button>
                <button
                  type="button"
                  onClick={() => void resetFilters()}
                  disabled={loading}
                  className="report-btn report-btn-outline"
                >
                  Reset
                </button>
                </div>
              </div>
            </div>

            {error && <div className="mt-2.5 text-[var(--warning)]">{error}</div>}
          </div>

          <div className="white-box report-criteria-box">
            <div className="report-meta">Total Records: {count}</div>

            <div className="report-table-wrap">
              <table className="report-table">
                <thead>
                  <tr>
                    {columns.map((column) => (
                      <th key={column.key}>
                        {column.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx}>
                      {columns.map((column) => (
                        <td key={column.key}>
                          {String((row[column.key] ?? "") as string)}
                        </td>
                      ))}
                    </tr>
                  ))}
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={Math.max(columns.length, 1)}>
                        No data found. Use filters and click Search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="report-pagination">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => void loadData(page - 1)}
                className="report-btn report-btn-outline"
              >
                Previous
              </button>
              <span className="text-[13px] text-[var(--text-muted)]">
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => void loadData(page + 1)}
                className="report-btn report-btn-outline"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
