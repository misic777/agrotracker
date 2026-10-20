import { useTranslation } from "react-i18next";
import AuthShell from "./AuthShell";
import Button from "./Button";
import Card from "./Card";

/** Loading screen while the session or household is being checked. */
export function LoadingScreen() {
  const { t } = useTranslation();
  return (
    <AuthShell>
      <p role="status" className="m-0 text-center text-soil-700">
        {t("common.loading")}
      </p>
    </AuthShell>
  );
}

/** Shown when the household can't be loaded, e.g. without internet. */
export function LoadErrorScreen({
  onRetry,
  onSignOut,
}: {
  onRetry: () => void;
  onSignOut: () => void;
}) {
  const { t } = useTranslation();
  return (
    <AuthShell>
      <Card className="flex flex-col gap-4" role="alert">
        <h1 className="m-0 font-display text-2xl font-semibold">
          {t("access.errorTitle")}
        </h1>
        <p className="m-0 text-soil-700">{t("access.errorText")}</p>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={onRetry}>
            {t("access.retry")}
          </Button>
          <Button onClick={onSignOut}>{t("layout.signOut")}</Button>
        </div>
      </Card>
    </AuthShell>
  );
}
