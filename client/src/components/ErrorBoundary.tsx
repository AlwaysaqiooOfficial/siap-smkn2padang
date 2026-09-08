import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string | null;
}

/**
 * Menangkap error runtime di seluruh pohon komponen di bawahnya. Tanpa ini, error yang tidak
 * tertangani (mis. dari library pihak ketiga seperti html5-qrcode) akan membuat React
 * meng-unmount seluruh aplikasi — tampak sebagai halaman putih kosong tanpa pesan apa pun.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : "Terjadi kesalahan" };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // eslint-disable-next-line no-console
    console.error("[ErrorBoundary] Terjadi error yang tidak tertangani:", error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, message: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center">
          <AlertTriangle className="h-10 w-10 text-red-500" />
          <p className="text-lg font-semibold text-slate-800">Terjadi kesalahan</p>
          <p className="max-w-sm text-sm text-slate-500">
            Halaman mengalami error tak terduga
            {this.state.message ? `: ${this.state.message}` : "."} Coba muat ulang halaman.
          </p>
          <button
            onClick={this.handleReload}
            className="mt-2 flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
          >
            <RotateCcw className="h-4 w-4" />
            Muat Ulang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
