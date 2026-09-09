import QRCode from "qrcode";

/** Menghasilkan QR code sebagai PNG data URL dari sebuah token/string. */
export async function generateQrImage(data: string): Promise<string> {
  return QRCode.toDataURL(data, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 320,
  });
}
