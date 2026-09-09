import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeScannerState } from "html5-qrcode";
import { Link } from "react-router-dom";
import {
  ScanLine,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  Camera,
  CameraOff,
  RotateCcw,
  LogOut,
  KeyRound,
  LayoutDashboard,
} from "lucide-react";
import { api, getErrorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { StatusBadge } from "../components/StatusBadge";
import type { ApiResponse, ScanResultData, ScannerDashboardData, AttendanceStatus } from "../types";

const READER_ELEMENT_ID = "qr-reader";

const PUNCTUALITY_STYLES = {
  CEPAT: "bg-sky-100 text-sky-700 border-sky-300",
  TEPAT_WAKTU: "bg-emerald-100 text-emerald-700 border-emerald-300",
  TERLAMBAT: "bg-amber-100 text-amber-700 border-amber-300",
} as const;

const PUNCTUALITY_LABELS = {
  CEPAT: "Datang Cepat",
  TEPAT_WAKTU: "Tepat Waktu",
  TERLAMBAT: "Terlambat",
} as const;

type CameraState = "starting" | "ready" | "error" | "stopped";

interface Props {
  scannerOnly?: boolean;
}

export default function ScanPage({ scannerOnly = false }: Props) {
  const { user, logout } = useAuth();
  const html5QrRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);

  const [cameraState, setCameraState] = useState<CameraState>("starting");
  const [cameraError, setCameraError] = useState<string | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ScanResultData | null>(null);
  const [resultError, setResultError] = useState<string | null>(null);

  const [manualToken, setManualToken] = useState("");
  const [now, setNow] = useState(new Date());
  const [scannerCounts, setScannerCounts] = useState<ScannerDashboardData["counts"] | null>(null);

  useEffect(() => {
    if (!scannerOnly) return;
    const fetchCounts = () => {
      api
        .get<ApiResponse<ScannerDashboardData>>("/dashboard/scanner")
        .then((res) => setScannerCounts(res.data.data.counts))
        .catch(() => {});
    };
    fetchCounts();
    const interval = window.setInterval(fetchCounts, 5000);
    return () => window.clearInterval(interval);
  }, [scannerOnly]);

  // Jam berjalan (hanya tampilan, keputusan status tetap dari server).
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const html5QrCode = new Html5Qrcode(READER_ELEMENT_ID, { verbose: false });
    html5QrRef.current = html5QrCode;

    html5QrCode
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (decodedText) => handleDecoded(decodedText),
        () => {
          /* frame tanpa QR terdeteksi - abaikan, ini dipanggil terus-menerus */
        }
      )
      .then(() => {
        if (cancelled) {
          // Komponen sudah unmount SEBELUM start() selesai (mis. navigasi cepat / hot-reload) —
          // langsung matikan kamera yang baru saja menyala supaya tidak "bocor" menyala terus.
          html5QrCode
            .stop()
            .then(() => html5QrCode.clear())
            .catch(() => {});
          return;
        }
        setCameraState("ready");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setCameraState("error");
        setCameraError(
          err instanceof Error
            ? err.message
            : "Tidak dapat mengakses kamera. Pastikan izin kamera diaktifkan."
        );
      });

    return () => {
      cancelled = true;
      // Hanya panggil stop() kalau scanner benar-benar sudah berjalan (state SCANNING).
      // Memanggil stop() saat start() belum selesai adalah penyebab error "transition not
      // allowed" pada html5-qrcode yang bisa meng-crash komponen — bagian .then() di atas
      // yang akan membereskan kamera begitu start() selesai kalau ternyata sudah di-cancel.
      if (html5QrCode.getState() === Html5QrcodeScannerState.SCANNING) {
        html5QrCode
          .stop()
          .then(() => html5QrCode.clear())
          .catch(() => {
            /* sudah berhenti duluan, aman diabaikan */
          });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDecoded(token: string) {
    if (isProcessingRef.current) return; // cegah trigger ganda dari frame berikutnya
    isProcessingRef.current = true;
    setIsProcessing(true);
    setResult(null);
    setResultError(null);

    try {
      await html5QrRef.current?.pause(true);
    } catch {
      /* ignore jika scanner belum sempat jalan */
    }

    await submitToken(token);
  }

  async function submitToken(token: string) {
    setIsProcessing(true);
    setResult(null);
    setResultError(null);

    try {
      const res = await api.post<ApiResponse<ScanResultData>>("/attendance/scan", { token });
      setResult(res.data.data);
    } catch (err) {
      setResultError(getErrorMessage(err));
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
    }
  }

  async function handleManualSubmit() {
    const token = manualToken.trim();
    if (!token || isProcessingRef.current) return;
    isProcessingRef.current = true;
    setManualToken("");
    try {
      await html5QrRef.current?.pause(true);
    } catch {
      /* kamera mungkin belum aktif — aman diabaikan */
    }
    await submitToken(token);
  }

  async function resumeScanning() {
    setResult(null);
    setResultError(null);
    try {
      await html5QrRef.current?.resume();
    } catch {
      /* jika resume gagal (mis. instance sudah berhenti), abaikan */
    }
  }

  useEffect(() => {
    if (!result && !resultError) return;

    const timeoutId = window.setTimeout(() => {
      void resumeScanning();
    }, 2000);

    return () => window.clearTimeout(timeoutId);
  }, [result, resultError]);

  const showOverlay = isProcessing || result || resultError;

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600">
            <ScanLine className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Scan Absensi QR</p>
            <p className="text-xs text-white/50">{user?.fullName}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-sm text-white/60 sm:block">
            {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          </span>
          {!scannerOnly && <Link
            to={user?.role === "SUPER_ADMIN" ? "/dashboard/admin" : "/dashboard/guru"}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20"
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </Link>}
          <button
            onClick={logout}
            className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-1.5 text-xs font-medium hover:bg-white/20"
          >
            <LogOut className="h-3.5 w-3.5" />
            Keluar
          </button>
        </div>
      </header>

      {scannerOnly && scannerCounts && (
        <section className="mx-auto grid max-w-md grid-cols-2 gap-2 px-4 pt-4 sm:grid-cols-3">
          {(["HADIR", "TERLAMBAT", "IZIN", "SAKIT", "ALFA", "DISPENSASI"] as AttendanceStatus[]).map((status) => (
            <div key={status} className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-center">
              <p className="text-2xl font-bold">{scannerCounts[status]}</p>
              <p className="text-[10px] font-medium uppercase text-white/60">{status}</p>
            </div>
          ))}
        </section>
      )}

      <main className="mx-auto flex max-w-md flex-col gap-4 px-4 py-6">
        {/* Status kamera */}
        {cameraState === "starting" && (
          <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2 text-sm text-white/70">
            <Loader2 className="h-4 w-4 animate-spin" />
            Membuka kamera...
          </div>
        )}
        {cameraState === "error" && (
          <div className="flex items-start gap-2 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-300">
            <CameraOff className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div>
              <p className="font-medium">Kamera tidak tersedia</p>
              <p className="text-xs text-red-300/80">{cameraError}</p>
              <p className="mt-1 text-xs text-red-300/80">
                Gunakan input token manual di bawah sebagai alternatif.
              </p>
            </div>
          </div>
        )}
        {cameraState === "ready" && !showOverlay && (
          <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-300">
            <Camera className="h-4 w-4" />
            Kamera siap — arahkan ke QR Code siswa
          </div>
        )}

        {/* Area kamera */}
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black shadow-xl">
          <div id={READER_ELEMENT_ID} className="w-full" />

          {/* Overlay hasil scan: loading / success / error */}
          {showOverlay && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 p-4">
              {isProcessing && (
                <div className="flex flex-col items-center gap-3 text-center">
                  <Loader2 className="h-10 w-10 animate-spin text-brand-400" />
                  <p className="text-sm text-white/70">Memvalidasi & menyimpan absensi...</p>
                </div>
              )}

              {!isProcessing && result && (
                <div className="w-full max-w-xs rounded-xl bg-white p-5 text-slate-900 shadow-2xl">
                  {result.punctuality && (
                    <div className={`mb-3 rounded-lg border px-3 py-2 text-center text-base font-bold ${PUNCTUALITY_STYLES[result.punctuality]}`}>
                      {PUNCTUALITY_LABELS[result.punctuality]}
                    </div>
                  )}
                  <div className="mb-3 flex justify-center">
                    {result.duplicate ? (
                      <AlertTriangle className="h-12 w-12 text-amber-500" />
                    ) : (
                      <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                    )}
                  </div>
                  <p className="text-center text-sm font-medium text-slate-500">
                    {result.message}
                  </p>
                  <div className="my-3 border-t border-dashed" />
                  <p className="text-center text-lg font-bold">{result.student.fullName}</p>
                  <p className="text-center text-sm text-slate-500">
                    Kelas {result.student.class.name} · {result.student.major.code}
                  </p>
                  <p className="mt-1 text-center text-xs text-slate-400">NISN: {result.student.nisn}</p>
                  <div className="mt-3 flex flex-col items-center gap-1">
                    <StatusBadge status={result.status} />
                    {result.checkInTime && (
                      <p className="text-xs text-slate-400">
                        Jam scan:{" "}
                        {new Date(result.checkInTime).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                          second: "2-digit",
                        })}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={resumeScanning}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Lanjutkan Scan
                  </button>
                </div>
              )}

              {!isProcessing && resultError && (
                <div className="w-full max-w-xs rounded-xl bg-white p-5 text-slate-900 shadow-2xl">
                  <div className="mb-3 flex justify-center">
                    <AlertTriangle className="h-12 w-12 text-red-500" />
                  </div>
                  <p className="text-center text-sm font-semibold text-red-600">QR/Kode Tidak Dikenali</p>
                  <p className="mt-1 text-center text-sm text-slate-500">{resultError}</p>
                  <button
                    onClick={resumeScanning}
                    className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-900"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Coba Lagi
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Fallback input manual token */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-3">
          <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-white/60">
            <KeyRound className="h-3.5 w-3.5" />
            Input token manual (jika kamera tidak tersedia)
          </p>
          <div className="flex gap-2">
            <input
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleManualSubmit()}
              placeholder="SIAP-XXXXXXXX-XXXXX"
              className="flex-1 rounded-lg border border-white/10 bg-white/10 px-3 py-2 text-sm text-white placeholder:text-white/30 outline-none focus:border-brand-400"
            />
            <button
              onClick={handleManualSubmit}
              disabled={isProcessing || !manualToken.trim()}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Proses
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
