interface LayoutOptions {
  title: string;
  accentColor: string; // warna header sesuai jenis event
  bodyHtml: string; // konten utama (sudah berupa HTML, mis. dari template event)
}

/**
 * Kerangka email konsisten untuk semua notifikasi SIAP SMKN 2 PADANG.
 * Table-based layout agar tetap tampil rapi di client email lama (Gmail, Outlook, dll).
 */
export function renderEmailLayout({ title, accentColor, bodyHtml }: LayoutOptions): string {
  return `<!doctype html>
<html lang="id">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f1f5f9;font-family:'Segoe UI',Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f1f5f9;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <tr>
              <td style="background-color:${accentColor};padding:20px 28px;">
                <p style="margin:0;color:#ffffff;font-size:13px;letter-spacing:0.5px;text-transform:uppercase;opacity:0.85;">
                  SIAP SMKN 2 PADANG
                </p>
                <p style="margin:4px 0 0;color:#ffffff;font-size:18px;font-weight:700;">
                  ${title}
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;color:#1e293b;font-size:14px;line-height:1.6;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:16px 28px;background-color:#f8fafc;border-top:1px solid #e2e8f0;">
                <p style="margin:0;color:#94a3b8;font-size:12px;">
                  Email ini dikirim otomatis oleh Sistem Informasi Absensi & Pemantauan Siswa
                  (SIAP) SMKN 2 Padang. Mohon tidak membalas email ini. Jika ada pertanyaan,
                  silakan hubungi wali kelas atau pihak sekolah secara langsung.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

export function infoRow(label: string, value: string): string {
  return `<tr>
    <td style="padding:4px 0;color:#64748b;width:120px;">${label}</td>
    <td style="padding:4px 0;color:#0f172a;font-weight:600;">${value}</td>
  </tr>`;
}

export function infoTable(rowsHtml: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0;font-size:13px;">${rowsHtml}</table>`;
}
