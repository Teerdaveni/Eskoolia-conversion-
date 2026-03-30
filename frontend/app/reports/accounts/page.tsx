"use client";

import ReportExplorer from "@/components/reports/ReportExplorer";
import ReportNotFound from "@/components/reports/ReportNotFound";
import { getReportDefinition } from "@/lib/reports-config";

export default function AccountsReportPage() {
    const definition = getReportDefinition("accounts");
    if (!definition) {
        return <ReportNotFound title="Accounts Report" />;
    }
    return <ReportExplorer definition={definition} />;
}

