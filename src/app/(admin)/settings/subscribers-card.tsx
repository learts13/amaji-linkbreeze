"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { chartLocaleTag } from "@/app/(admin)/dashboard/views-chart-inner";
import { formatSubscriberDate } from "@/lib/subscriber-dates";
import { useRouter } from "next/navigation";
import { Mail, Download, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { SubscriberRow } from "@/server/queries";

export function SubscribersCard({
  subscribers,
  emailCaptureEnabled,
  pageId,
}: {
  subscribers: SubscriberRow[];
  emailCaptureEnabled: boolean;
  pageId: number;
}) {
  const t = useTranslations("settings.data");
  const locale = useLocale();
  const router = useRouter();
  const [clearOpen, setClearOpen] = React.useState(false);
  const [clearPending, setClearPending] = React.useState(false);
  const [clearMsg, setClearMsg] = React.useState<string | null>(null);
  const [clearFailed, setClearFailed] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<"all" | "selected">("all");
  const [selectedIds, setSelectedIds] = React.useState<Set<number>>(() => new Set());
  const selectedCount = selectedIds.size;
  const allSelected = subscribers.length > 0 && subscribers.every((s) => selectedIds.has(s.id));

  if (!emailCaptureEnabled) return null;

  const handleDelete = async () => {
    setClearOpen(false);
    setClearPending(true);
    setClearMsg(null);
    setClearFailed(false);
    try {
      const res = await fetch(`/api/subscribers/clear?pageId=${pageId}`, {
        method: "DELETE",
        headers: deleteTarget === "selected" ? { "Content-Type": "application/json" } : undefined,
        body: deleteTarget === "selected" ? JSON.stringify({ ids: [...selectedIds] }) : undefined,
      });
      if (res.ok) {
        setClearMsg(deleteTarget === "selected" ? t("selectedSubscribersDeleted") : t("allSubscribersCleared"));
        setSelectedIds(new Set());
        router.refresh();
      } else {
        setClearMsg(t("subscriberDeleteFailed"));
        setClearFailed(true);
      }
    } catch {
      setClearMsg(t("subscriberDeleteFailed"));
      setClearFailed(true);
    } finally {
      setClearPending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="size-5" />{t("emailSubscribers")}</CardTitle>
        <CardDescription>
          {subscribers.length === 0
            ? t("noSubscribers")
            : t("subscriberCount", { count: subscribers.length })}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {subscribers.length > 0 ? (
          <div className="overflow-hidden rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="w-10 px-3 py-2 text-left font-medium">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      aria-label={t("selectAllSubscribers")}
                      onChange={(event) => setSelectedIds(
                        event.target.checked ? new Set(subscribers.map((s) => s.id)) : new Set(),
                      )}
                    />
                  </th>
                  <th className="px-3 py-2 text-left font-medium">{t("colEmail")}</th>
                  <th className="px-3 py-2 text-left font-medium">{t("colSubscribed")}</th>
                  <th className="px-3 py-2 text-left font-medium">{t("colConsent")}</th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => (
                  <tr key={s.id} className="border-t border-border">
                    <td className="w-10 px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(s.id)}
                        aria-label={`${t("selectSubscriber")} ${s.email}`}
                        onChange={(event) => setSelectedIds((current) => {
                          const next = new Set(current);
                          if (event.target.checked) next.add(s.id);
                          else next.delete(s.id);
                          return next;
                        })}
                      />
                    </td>
                    <td className="px-3 py-2">{s.email}</td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {formatSubscriberDate(s.createdAt, chartLocaleTag(locale))}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {s.consentAt ? t("consentYes") : t("notAvailable")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">{t("subscribersDesc")}</p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- file download, not page navigation */}
          <a
            href={`/api/subscribers/export?pageId=${pageId}`}
            className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Download className="size-4" />{t("exportCsv")}</a>
          {selectedCount > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteTarget("selected");
                setClearOpen(true);
              }}
              disabled={clearPending}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" />
              {t("deleteSelected", { count: selectedCount })}
            </Button>
          ) : null}
          {subscribers.length > 0 ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setDeleteTarget("all");
                setClearOpen(true);
              }}
              disabled={clearPending}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="size-4" />
              {clearPending ? t("clearing") : t("clearAll")}
            </Button>
          ) : null}
        </div>
        {clearMsg ? (
          <p className={clearFailed ? "text-sm text-destructive" : "text-sm text-success"}>
            {clearMsg}
          </p>
        ) : null}
      </CardContent>

      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>{deleteTarget === "selected" ? t("deleteSelectedTitle") : t("clearTitle")}</DialogTitle>
            <DialogDescription>
              {deleteTarget === "selected"
                ? t("deleteConfirmSelected", { count: selectedCount })
                : t("deleteConfirmIcu", { count: subscribers.length })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => setClearOpen(false)}>{t("cancel")}</Button>
            <Button variant="destructive" type="button" onClick={handleDelete}>
              {deleteTarget === "selected" ? t("deleteAction") : t("clear")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
