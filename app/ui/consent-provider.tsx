"use client";

import { ReactNode, useEffect, useState } from "react";
import ConsentModal from "./consent-modal";
import { useAuth } from "@/lib/auth-context";

export function ConsentProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [showConsent, setShowConsent] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || !isAuthenticated) return;

    const hasConsent = localStorage.getItem("dataCollectionConsent");
    if (!hasConsent) {
      setShowConsent(true);
    }
  }, [isAuthenticated, isMounted]);

  const handleAccept = () => {
    localStorage.setItem("dataCollectionConsent", "true");
    localStorage.setItem("consentDate", new Date().toISOString());
    setShowConsent(false);
  };

  if (!isMounted) return children;

  return (
    <>
      <ConsentModal isOpen={showConsent} onAccept={handleAccept} />
      {children}
    </>
  );
}
