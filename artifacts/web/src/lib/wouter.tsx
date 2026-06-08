"use client";
import LinkNext from "next/link";
import { usePathname, useRouter, useParams as useNextParams } from "next/navigation";
import { useEffect } from "react";

export function Link({ href, to, children, className, onClick, ...props }: any) {
  return (
    <LinkNext href={href || to || "/"} className={className} onClick={onClick} {...props}>
      {children}
    </LinkNext>
  );
}

export function useLocation(): [string, (url: string) => void] {
  const pathname = usePathname();
  const router = useRouter();
  const setLocation = (url: string) => {
    router.push(url);
  };
  return [pathname || "/", setLocation];
}

export function useParams() {
  const params = useNextParams() || {};
  return params as Record<string, string>;
}

export function Redirect({ to, href }: { to?: string; href?: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(to || href || "/");
  }, [router, to, href]);
  return null;
}
