"use client";

import { useState } from "react";
import { useCrypto } from "@/components/providers/crypto-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { Button } from "@minnjii/dx-kit/ui/button";
import { Input } from "@minnjii/dx-kit/ui/input";
import { Label } from "@minnjii/dx-kit/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@minnjii/dx-kit/ui/card";
import { Lock, Eye, EyeOff, KeyRound } from "lucide-react";

type Mode = "password" | "setup" | "recovery";

export function LockScreen() {
  const { isSetup, setup, unlock, recoverWithKey } = useCrypto();
  const { t } = useLanguage();

  const [mode, setMode] = useState<Mode>(isSetup ? "password" : "setup");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [recoveryKeyInput, setRecoveryKeyInput] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newConfirm, setNewConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const resetFields = () => {
    setPassword("");
    setConfirmPassword("");
    setRecoveryKeyInput("");
    setNewPassword("");
    setNewConfirm("");
    setError("");
  };

  // ── Setup ──────────────────────────────────────────────────
  const handleSetup = async () => {
    if (password.length < 4) {
      setError(t("lock.errMinLength"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("lock.errMismatch"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      await setup(password);
    } catch {
      setError(t("lock.errSetup"));
    } finally {
      setLoading(false);
    }
  };

  // ── Unlock ─────────────────────────────────────────────────
  const handleUnlock = async () => {
    setLoading(true);
    setError("");
    try {
      const ok = await unlock(password);
      if (!ok) setError(t("lock.errWrong"));
    } catch {
      setError(t("lock.errUnlock"));
    } finally {
      setLoading(false);
    }
  };

  // ── Recovery ───────────────────────────────────────────────
  const handleRecover = async () => {
    const trimmed = recoveryKeyInput.trim();
    if (!trimmed) {
      setError(t("lock.errRecoveryEmpty"));
      return;
    }
    if (newPassword.length < 4) {
      setError(t("lock.errNewMinLength"));
      return;
    }
    if (newPassword !== newConfirm) {
      setError(t("lock.errNewMismatch"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const ok = await recoverWithKey(trimmed, newPassword);
      if (!ok) setError(t("lock.errRecoveryInvalid"));
    } catch {
      setError(t("lock.errRecovery"));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "setup") handleSetup();
    else if (mode === "password") handleUnlock();
    else handleRecover();
  };

  return (
    <div className="flex h-screen items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <form onSubmit={handleSubmit}>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              {mode === "recovery" ? (
                <KeyRound className="h-7 w-7 text-primary" />
              ) : (
                <Lock className="h-7 w-7 text-primary" />
              )}
            </div>
            <CardTitle className="text-xl tracking-tight">
              {mode === "setup"
                ? t("lock.setupTitle")
                : mode === "password"
                  ? t("lock.unlockTitle")
                  : t("lock.recoveryTitle")}
            </CardTitle>
            <CardDescription>
              {mode === "setup"
                ? t("lock.setupDesc")
                : mode === "password"
                  ? t("lock.unlockDesc")
                  : t("lock.recoveryDesc")}
            </CardDescription>
          </CardHeader>

          <CardContent className="grid gap-4 pt-[30px]">
            {mode === "recovery" ? (
              <>
                <div className="grid gap-2">
                  <Input
                    id="recovery-key"
                    type="text"
                    value={recoveryKeyInput}
                    onChange={(e) => setRecoveryKeyInput(e.target.value)}
                    placeholder="XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX-XXXX"
                    autoFocus
                    autoComplete="off"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="grid gap-2">
                  <Input
                    id="new-pw"
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="off"
                  />
                </div>
                <div className="grid gap-2">
                  <Input
                    id="new-confirm"
                    type={showPassword ? "text" : "password"}
                    value={newConfirm}
                    onChange={(e) => setNewConfirm(e.target.value)}
                    placeholder="••••••••"
                    autoComplete="off"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-2">
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      autoFocus
                      autoComplete="off"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className="absolute right-1 top-1/2 -translate-y-1/2"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {mode === "setup" && (
                  <div className="grid gap-2">
                    <Input
                      id="confirm"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      autoComplete="off"
                    />
                  </div>
                )}
              </>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}
          </CardContent>

          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? t("lock.processing")
                : mode === "setup"
                  ? t("lock.setupButton")
                  : mode === "password"
                    ? t("lock.unlockButton")
                    : t("lock.recoveryButton")}
            </Button>

            {isSetup && mode === "password" && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="text-muted-foreground"
                onClick={() => {
                  resetFields();
                  setMode("recovery");
                }}
              >
                {t("lock.forgotPassword")}
              </Button>
            )}

            {mode === "recovery" && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="text-muted-foreground"
                onClick={() => {
                  resetFields();
                  setMode("password");
                }}
              >
                {t("lock.backToPassword")}
              </Button>
            )}
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
