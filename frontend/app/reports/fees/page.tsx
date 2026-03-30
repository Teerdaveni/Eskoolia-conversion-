"use client";

import ReportExplorer from "@/components/reports/ReportExplorer";
import ReportNotFound from "@/components/reports/ReportNotFound";
import { getReportDefinition } from "@/lib/reports-config";

export default function FeesReportPage() {
    const definition = getReportDefinition("fees");
    if (!definition) {
        return <ReportNotFound title="Fees Report" />;
    }
    return <ReportExplorer definition={definition} />;
}

