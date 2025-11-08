"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";
import { ServiceWorkerProvider } from "./pwa/service-worker-provider";

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <ServiceWorkerProvider />
      {children}
    </SessionProvider>
  );
}