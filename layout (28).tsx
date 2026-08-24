import AdminShell from "@/components/admin-shell";

export const metadata = { title: "Admin · Learning Point" };

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
