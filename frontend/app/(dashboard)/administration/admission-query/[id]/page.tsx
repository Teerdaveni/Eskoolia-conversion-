import { AdmissionFollowUpPanel } from "@/components/admissions/AdmissionFollowUpPanel";

export default function AdmissionFollowUpPage({ params }: { params: { id: string } }) {
  const inquiryId = Number(params.id);
  return <AdmissionFollowUpPanel inquiryId={inquiryId} />;
}
