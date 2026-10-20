import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import Button from "../../components/Button";
import Card from "../../components/Card";
import ConfirmDialog from "../../components/ConfirmDialog";
import {
  CheckIcon,
  CopyIcon,
  RefreshIcon,
  ShareIcon,
} from "../../components/icons";
import Avatar from "../../components/Avatar";
import PageHeader from "../../components/PageHeader";
import { useFormat } from "../../lib/format";
import { formatInviteCode } from "../../lib/inviteCode";
import {
  householdErrorKey,
  useHousehold,
  useHouseholdMembers,
  useRegenerateInviteCode,
} from "./household";

/** Household settings: the invite code and the list of members. */
export default function HouseholdPage() {
  const { t } = useTranslation();
  const { status } = useAuth();
  const { data: household } = useHousehold();

  // The demo has no household; RequireAccess guarantees one otherwise.
  if (status !== "signedIn" || !household) return <Navigate to="/" replace />;

  return (
    <>
      <PageHeader
        title={household.name}
        subtitle={t("household.page.subtitle")}
      />
      <InviteCard code={household.inviteCode} />
      <MembersCard householdId={household.id} />
    </>
  );
}

function InviteCard({ code }: { code: string }) {
  const { t } = useTranslation();
  const regenerate = useRegenerateInviteCode();
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const formatted = formatInviteCode(code);
  const appUrl = window.location.origin + import.meta.env.BASE_URL;
  const message = t("household.page.shareMessage", {
    url: appUrl,
    code: formatted,
  });
  const canShare = typeof navigator.share === "function";

  async function copy() {
    try {
      await navigator.clipboard.writeText(formatted);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard blocked: the code is still visible to copy by hand.
    }
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="m-0 font-display text-xl font-semibold">
          {t("household.page.inviteTitle")}
        </h2>
        <p className="m-0 max-w-[62ch] text-soil-700">
          {t("household.page.inviteText")}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <code
          aria-label={t("household.page.codeLabel")}
          className="rounded-field border border-leaf-200 bg-leaf-50 px-4 py-2.5 font-mono text-2xl font-semibold tracking-[0.12em] text-leaf-800"
        >
          {formatted}
        </code>
        <Button onClick={copy}>
          {copied ? <CheckIcon size={18} /> : <CopyIcon size={18} />}
          {copied ? t("household.page.copied") : t("household.page.copy")}
        </Button>
        {canShare && (
          <Button
            onClick={() =>
              navigator.share({ text: message }).catch(() => {
                // Closing the share sheet is not an error.
              })
            }
          >
            <ShareIcon size={18} />
            {t("household.page.share")}
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 border-t border-sand-200 pt-4">
        <Button
          variant="ghost"
          onClick={() => setConfirming(true)}
          disabled={regenerate.isPending}
          className="px-2"
        >
          <RefreshIcon size={18} />
          {t("household.page.regenerate")}
        </Button>
        <span className="text-sm text-soil-700">
          {regenerate.isError
            ? t(householdErrorKey(regenerate.error))
            : t("household.page.regenerateHint")}
        </span>
      </div>

      {confirming && (
        <ConfirmDialog
          title={t("household.page.confirmTitle")}
          message={t("household.page.confirmMessage")}
          confirmLabel={t("household.page.regenerate")}
          onConfirm={() => regenerate.mutate()}
          onClose={() => setConfirming(false)}
        />
      )}
    </Card>
  );
}

function MembersCard({ householdId }: { householdId: string }) {
  const { t } = useTranslation();
  const f = useFormat();
  const { user } = useAuth();
  const members = useHouseholdMembers(householdId);

  return (
    <Card className="flex flex-col gap-2">
      <h2 className="m-0 mb-1 font-display text-xl font-semibold">
        {t("household.page.membersTitle")}
      </h2>
      {members.isPending && (
        <p className="m-0 text-soil-700">{t("common.loading")}</p>
      )}
      {members.isError && (
        <p className="m-0 text-clay-800">{t("household.errors.generic")}</p>
      )}
      {members.data && (
        <ul className="m-0 list-none p-0">
          {members.data.map((m) => (
            <li
              key={m.userId}
              className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-sand-200 py-3"
            >
              <Avatar name={m.name ?? m.email ?? "?"} />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="font-bold">
                  {m.name ?? m.email}
                  {m.userId === user?.id && (
                    <span className="font-medium text-soil-700">
                      {" "}
                      {t("household.page.you")}
                    </span>
                  )}
                </span>
                {m.name && m.email && (
                  <span className="truncate text-sm text-soil-700">
                    {m.email}
                  </span>
                )}
              </div>
              <span className="basis-full pl-14 text-sm text-soil-700 sm:basis-auto sm:pl-0">
                {t("household.page.memberSince", {
                  date: f.date(m.joinedAt.slice(0, 10)),
                })}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
