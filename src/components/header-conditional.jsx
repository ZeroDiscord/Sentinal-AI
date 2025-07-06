"use client";
import Header from "@/components/header";
import { usePathname } from "next/navigation";
 
export default function HeaderConditional() {
  const pathname = usePathname();
  if (pathname.startsWith("/dashboard")) return null;
  return <Header />;
} 