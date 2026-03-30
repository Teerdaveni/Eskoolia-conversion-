type ReportNotFoundProps = {
  title?: string;
};

export default function ReportNotFound({ title = "Report" }: ReportNotFoundProps) {
  return (
    <div className="legacy-panel">
      <section className="sms-breadcrumb mb-20">
        <div className="container-fluid">
          <div className="flex items-center justify-between">
            <h1 className="m-0 text-2xl">{title}</h1>
            <div className="flex gap-2 text-[13px] text-[var(--text-muted)]">
              <span>Dashboard</span>
              <span>/</span>
              <span>Reports</span>
              <span>/</span>
              <span>{title}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="admin-visitor-area up_st_admin_visitor">
        <div className="container-fluid p-0">
          <div className="white-box rounded-[var(--radius)] border border-[var(--line)] bg-[var(--surface)] p-4">
            <h3 className="m-0 mb-2">Report not found</h3>
            <p className="m-0 text-[13px] text-[var(--text-muted)]">
              This report is not configured yet. Please check the selected report link.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
