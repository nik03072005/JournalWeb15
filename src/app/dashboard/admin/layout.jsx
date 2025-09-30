import { AdminSidebar } from "@/components/dashboards/AdminDashboardLayout";


export default function Layout({ children }) {
  return (
    <AdminSidebar>
      {children}
    </AdminSidebar>
  );
}