"use client";

import ReportExplorer from "@/components/reports/ReportExplorer";
import ReportNotFound from "@/components/reports/ReportNotFound";
import { getReportDefinition } from "@/lib/reports-config";

export default function StaffReportPage() {
    const definition = getReportDefinition("staff");
    if (!definition) {
        return <ReportNotFound title="Staff Report" />;
    }
    return <ReportExplorer definition={definition} />;
}

