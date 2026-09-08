import ReactDOM from "react-dom/client";
import App from "./App";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./index.css";

// CATATAN: React.StrictMode sengaja TIDAK dipakai di sini. StrictMode menjalankan efek
// (useEffect) dua kali saat development untuk mendeteksi bug, tapi library kamera
// (html5-qrcode di ScanPage) tidak aman dipanggil dua kali secara cepat pada elemen DOM yang
// sama — kamera masih dalam proses inisialisasi saat instance kedua dibuat, menyebabkan error
// tak tertangani yang meng-crash seluruh aplikasi (tampak sebagai halaman putih kosong).
// ErrorBoundary di bawah tetap dipasang sebagai jaring pengaman untuk error tak terduga lainnya.
ReactDOM.createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
