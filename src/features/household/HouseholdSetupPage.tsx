import { useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import AuthShell from "../../components/AuthShell";
import Button from "../../components/Button";
import Card from "../../components/Card";
import { Field } from "../../components/form";
import { LoadingScreen } from "../../components/FullPageMessage";
import { inputClass } from "../../components/inputClass";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";
import { isPlausibleInviteCode } from "../../lib/inviteCode";
import {
  householdErrorKey,
  useCreateHousehold,
  useHousehold,
  useJoinHousehold,
} from "./household";

/** After the first sign-in: create a new household or join an existing one. */
export default function HouseholdSetupPage() {
  const { t } = useTranslation();
  const { status, user, signOut } = useAuth();
  const household = useHousehold();
  useDocumentTitle(t("household.setup.pageTitle"));

  if (status === "loading" || (status === "signedIn" && household.isPending)) {
    return <LoadingScreen />;
  }
  // Only for signed-in users who don't have a household yet.
  if (status !== "signedIn" || household.data) {
    return <Navigate to="/" replace />;
  }

  const firstName = user?.name?.split(" ")[0];

  return (
    <AuthShell wide>
      <div className="flex flex-col gap-2">
        <h1 className="m-0 font-display text-[30px] leading-tight font-semibold">
          {firstName
            ? t("household.setup.title", { name: firstName })
            : t("household.setup.titleNoName")}
        </h1>
        <p className="m-0 max-w-[62ch] text-soil-700">
          {t("household.setup.text")}
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <CreateCard />
        <JoinCard />
      </div>

      <p className="m-0 text-sm text-soil-700">
        {t("household.setup.signedInAs", { email: user?.email ?? "" })}{" "}
        <button
          type="button"
          onClick={() => signOut()}
          className="cursor-pointer border-0 bg-transparent p-0 font-bold text-leaf-700 underline-offset-2 hover:underline"
        >
          {t("layout.signOut")}
        </button>
      </p>
    </AuthShell>
  );
}

function CreateCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const create = useCreateHousehold();
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);

  const missing = name.trim() === "";

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (missing) return;
    create.mutate(name, { onSuccess: () => navigate("/", { replace: true }) });
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="m-0 font-display text-xl font-semibold">
          {t("household.setup.createTitle")}
        </h2>
        <p className="m-0 text-sm text-soil-700">
          {t("household.setup.createText")}
        </p>
      </div>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field
          label={t("household.setup.nameLabel")}
          htmlFor="household-name"
          error={
            touched && missing
              ? t("household.setup.nameRequired")
              : create.isError
                ? t(householdErrorKey(create.error))
                : undefined
          }
        >
          <input
            id="household-name"
            className={inputClass(touched && missing)}
            value={name}
            maxLength={100}
            placeholder={t("household.setup.namePlaceholder")}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Button
          type="submit"
          variant="primary"
          disabled={create.isPending}
          className="self-start"
        >
          {create.isPending ? t("common.saving") : t("household.setup.create")}
        </Button>
      </form>
    </Card>
  );
}

function JoinCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const join = useJoinHousehold();
  const [code, setCode] = useState("");
  const [touched, setTouched] = useState(false);

  const invalid = !isPlausibleInviteCode(code);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (invalid) return;
    join.mutate(code, { onSuccess: () => navigate("/", { replace: true }) });
  }

  return (
    <Card className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="m-0 font-display text-xl font-semibold">
          {t("household.setup.joinTitle")}
        </h2>
        <p className="m-0 text-sm text-soil-700">
          {t("household.setup.joinText")}
        </p>
      </div>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <Field
          label={t("household.setup.codeLabel")}
          htmlFor="invite-code"
          error={
            touched && invalid
              ? t("household.setup.codeInvalid")
              : join.isError
                ? t(householdErrorKey(join.error))
                : undefined
          }
        >
          <input
            id="invite-code"
            className={`${inputClass(touched && invalid)} font-mono tracking-wider uppercase`}
            value={code}
            maxLength={20}
            autoComplete="off"
            spellCheck={false}
            placeholder="A1B2-C3D4-E5F6"
            onChange={(e) => setCode(e.target.value)}
          />
        </Field>
        <Button
          type="submit"
          variant="primary"
          disabled={join.isPending}
          className="self-start"
        >
          {join.isPending ? t("common.saving") : t("household.setup.join")}
        </Button>
      </form>
    </Card>
  );
}
