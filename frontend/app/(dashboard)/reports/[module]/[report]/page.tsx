"use client";

import ReportExplorer from "@/components/reports/ReportExplorer";
import ReportNotFound from "@/components/reports/ReportNotFound";
import { getReportDefinition } from "@/lib/reports-config";

type PageProps = {
  params: {
    module: string;
    report: string;
  };
};

export default function ModuleReportPage({ params }: PageProps) {
  const definition = getReportDefinition(`${params.module}/${params.report}`);

  if (!definition) {
    return <ReportNotFound title="Report" />;
  }

  return <ReportExplorer definition={definition} />;
}
