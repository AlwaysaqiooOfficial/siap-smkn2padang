import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import LoginPage from "./pages/LoginPage";
import StudentQrPage from "./pages/StudentQrPage";
import AddStudentPage from "./pages/AddStudentPage";
import TeacherManagementPage from "./pages/TeacherManagementPage";
import AddClassPage from "./pages/AddClassPage";
import AttendanceReportPage from "./pages/AttendanceReportPage";
import WaliKelasDashboardPage from "./pages/WaliKelasDashboardPage";
import GuruDashboardPage from "./pages/GuruDashboardPage";
import SiswaDashboardPage from "./pages/SiswaDashboardPage";
import OrangTuaDashboardPage from "./pages/OrangTuaDashboardPage";
import NotFoundPage from "./pages/NotFoundPage";

// Code-splitting untuk 2 halaman dengan dependency terberat (html5-qrcode & recharts) —
// supaya halaman lain (login, dashboard guru/siswa/ortu, dst) tidak ikut memuat library
// yang tidak mereka perlukan. Mengurangi ukuran bundle awal secara signifikan.
const ScanPage = lazy(() => import("./pages/ScanPage"));
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"));

function PageLoader() {
  return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
    </div>
  );
}

// BUG LAMA yang diperbaiki di sini: sebelumnya SISWA & ORANG_TUA jatuh ke fallback
// `/students/qr`, padahal halaman itu hanya boleh diakses SUPER_ADMIN/WALI_KELAS —
// akibatnya siswa/orang tua yang login selalu mendarat di layar "Akses ditolak".
// Sekarang setiap role diarahkan ke dashboard miliknya sendiri secara eksplisit.
function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  switch (user.role) {
    case "SUPER_ADMIN":
      return <Navigate to="/dashboard/admin" replace />;
    case "WALI_KELAS":
      return <Navigate to="/dashboard/wali-kelas" replace />;
    case "GURU":
      return <Navigate to="/dashboard/guru" replace />;
    case "SCANNER":
      return <Navigate to="/scanner" replace />;
    case "SISWA":
      return <Navigate to="/dashboard/siswa" replace />;
    case "ORANG_TUA":
      return <Navigate to="/dashboard/orang-tua" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
              <Route path="/scan" element={<ScanPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["SCANNER"]} />}>
              <Route path="/scanner" element={<ScanPage scannerOnly />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "GURU", "WALI_KELAS"]} />}>
              <Route path="/students/qr" element={<StudentQrPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "GURU"]} />}>
              <Route path="/students/add" element={<AddStudentPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN"]} />}>
              <Route path="/dashboard/admin" element={<AdminDashboardPage />} />
              <Route path="/management/classes" element={<AddClassPage />} />
              <Route path="/management/teachers" element={<TeacherManagementPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["WALI_KELAS"]} />}>
              <Route path="/dashboard/wali-kelas" element={<WaliKelasDashboardPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["SUPER_ADMIN", "GURU"]} />}>
              <Route path="/dashboard/guru" element={<GuruDashboardPage />} />
              <Route path="/reports/attendance" element={<AttendanceReportPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["SISWA"]} />}>
              <Route path="/dashboard/siswa" element={<SiswaDashboardPage />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={["ORANG_TUA"]} />}>
              <Route path="/dashboard/orang-tua" element={<OrangTuaDashboardPage />} />
            </Route>

            <Route path="/" element={<RootRedirect />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
