import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import AuthShell from "../../components/AuthShell";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { AlertIcon } from "../../components/icons";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

const SOURCE_URL = "https://github.com/misic777/agrotracker";

export default function LoginPage() {
  const { t } = useTranslation();
  const { status, canSignIn, signInError, signInWithGoogle, startDemo } =
    useAuth();
  const [redirecting, setRedirecting] = useState(false);
  useDocumentTitle(t("login.title"));

  if (status === "signedIn" || status === "demo") {
    return <Navigate to="/" replace />;
  }

  async function handleGoogle() {
    setRedirecting(true);
    await signInWithGoogle();
    // Only reached if the redirect didn't start (signInError is set).
    setRedirecting(false);
  }

  return (
    <AuthShell>
      <Card className="flex flex-col gap-6 px-7 py-8">
        <div className="flex flex-col gap-2">
          <h1 className="m-0 font-display text-[30px] leading-tight font-semibold">
            {t("login.title")}
          </h1>
          <p className="m-0 text-soil-700">{t("login.tagline")}</p>
        </div>

        {signInError && (
          <div
            role="alert"
            className="flex gap-3 rounded-field border border-clay-200 bg-clay-50 px-4 py-3 text-clay-800"
          >
            <AlertIcon className="mt-0.5 shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="font-bold">{t("login.failed")}</span>
              <span className="text-sm">{signInError}</span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {canSignIn ? (
            <Button
              variant="primary"
              onClick={handleGoogle}
              disabled={redirecting || status === "loading"}
              className="min-h-12 text-base"
            >
              {redirecting ? t("login.redirecting") : t("login.google")}
            </Button>
          ) : (
            <p className="m-0 rounded-field bg-sand-100 px-4 py-3 text-sm text-soil-700">
              {t("login.notConfigured")}
            </p>
          )}
          <p className="m-0 text-sm text-soil-700">{t("login.googleNote")}</p>
        </div>

        <div className="flex items-center gap-3 text-sm text-soil-600">
          <span className="h-px flex-1 bg-sand-300" />
          {t("login.or")}
          <span className="h-px flex-1 bg-sand-300" />
        </div>

        <div className="flex flex-col gap-2">
          <Button onClick={startDemo} className="min-h-12 text-base">
            {t("login.demo")}
          </Button>
          <p className="m-0 text-sm text-soil-700">{t("login.demoNote")}</p>
        </div>
      </Card>

      <p className="m-0 text-center text-sm text-soil-700">
        <a href={SOURCE_URL} target="_blank" rel="noreferrer">
          {t("login.source")}
        </a>
      </p>
    </AuthShell>
  );
}
