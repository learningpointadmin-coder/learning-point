"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentButton } from "@/components/payment-button";
import { useLang } from "@/components/language-provider";

export type TestRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  test_type: string;
  test_series_id: string | null;
  total_questions: number;
  duration_minutes: number;
};

export function ExamTestList({ tests, examId }: { tests: TestRow[]; examId: string }) {
  const { t: tr } = useLang();
  const [authed, setAuthed] = useState(false);
  const [owned, setOwned] = useState<string[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/my-access")
      .then((r) => r.json())
      .then((d) => {
        setAuthed(!!d.authed);
        setOwned(d.seriesIds || []);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  return (
    <div className="space-y-4">
      {tests.map((t) => {
        const playable = t.total_questions > 0;
        const isPaid = t.test_type !== "free";
        const isOwned = isPaid && t.test_series_id ? owned.includes(t.test_series_id) : false;
        const locked = isPaid && !isOwned;

        return (
          <div
            key={t.id}
            className="bg-surface-1 border border-border-subtle rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 hover:border-border transition-colors"
          >
            <div className="flex-1">
              <div className="flex gap-2 flex-wrap mb-2">
                <Badge variant="neutral" size="sm">{t.test_type.replace(/_/g, " ")}</Badge>
                {playable ? (
                  <Badge variant="brand" size="sm">
                    {t.total_questions} Qs · {t.duration_minutes} min
                  </Badge>
                ) : (
                  <Badge variant="neutral" size="sm">{tr("exam.soon")}</Badge>
                )}
                {locked && (
                  <Badge variant="neutral" size="sm">🔒 Paid</Badge>
                )}
              </div>
              <div className="font-bold text-lg mb-1">{t.name}</div>
              {t.description && <p className="text-sm text-content-secondary">{t.description}</p>}
            </div>

              <div className="shrink-0">
                {!playable ? (
                  <Button variant="secondary" size="sm" disabled>{tr("exam.soon")}</Button>
                ) : locked ? (
                  authed ? (
                    <PaymentButton examId={examId} amountLabel="₹499" label={tr("exam.unlock")} size="sm" />
                  ) : (
                    <Link href={`/login?redirect=/exams`}>
                      <Button variant="primary" size="sm">{tr("exam.loginUnlock")}</Button>
                    </Link>
                  )
                ) : (
                  <Link href={`/test/${t.slug}`}>
                    <Button variant="primary" size="sm">{tr("exam.start")}</Button>
                  </Link>
                )}
              </div>
          </div>
        );
      })}
      {!loaded && <p className="text-sm text-content-muted">Loading tests…</p>}
    </div>
  );
}
