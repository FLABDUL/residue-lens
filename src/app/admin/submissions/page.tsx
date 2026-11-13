import { notFound } from "next/navigation";
import { ContentPage } from "@/components/ContentPage";
import { getDatabase } from "@/lib/db";
import { getOptionalUserId } from "@/lib/server-auth";

type Submission = {
  id: string;
  kind: string;
  message: string;
  email: string | null;
  source_path: string | null;
  status: string;
  created_at: Date;
};

export const metadata = { title: "Private submission inbox | Residue Lens", robots: { index: false, follow: false } };

export default async function SubmissionsPage() {
  const userId = await getOptionalUserId();
  const admins = new Set((process.env.ADMIN_USER_IDS ?? "").split(",").map((id) => id.trim()).filter(Boolean));
  const sql = getDatabase();
  if (!userId || !admins.has(userId) || !sql) notFound();
  const submissions = await sql<Submission[]>`
    SELECT id, kind, message, email, source_path, status, created_at
    FROM submissions
    ORDER BY created_at DESC
    LIMIT 250
  `;

  return <ContentPage eyebrow="Private admin" title="Product input inbox" intro="The newest food requests, feedback and Plus-interest submissions stored in the configured database.">
    <p>{submissions.length} most recent submission{submissions.length === 1 ? "" : "s"}. This page is restricted to configured Clerk user IDs.</p>
    <div className="submission-list">{submissions.map((submission) => <article key={submission.id}><div><strong>{submission.kind}</strong><span>{submission.status}</span><time dateTime={submission.created_at.toISOString()}>{submission.created_at.toLocaleString("en-GB")}</time></div><p>{submission.message}</p>{submission.email ? <p><a href={`mailto:${submission.email}`}>{submission.email}</a></p> : null}{submission.source_path ? <small>From {submission.source_path}</small> : null}</article>)}</div>
  </ContentPage>;
}
