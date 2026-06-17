"use client";

import { usePathname } from "next/navigation";

const AUTH_PATHS = ["/welcome", "/login", "/onboarding"];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuth = AUTH_PATHS.some(p => pathname.startsWith(p));

  if (isAuth) return <>{children}</>;

  return (
    <div className="md:ml-20 xl:ml-56 flex-1 flex flex-col">
      {children}
    </div>
  );
}
