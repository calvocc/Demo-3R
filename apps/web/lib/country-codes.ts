/**
 * Indicativos de país harcodeados — los ~10 más relevantes del
 * continente americano para esta demo. `dialCode` incluye el "+" para
 * mostrarlo en el selector; al persistir el teléfono se concatena sin
 * el "+" junto con el número local (mismo formato que espera wa.me,
 * ver apps/web/lib/whatsapp.ts).
 */
export interface CountryCode {
  iso: string;
  flag: string;
  name: string;
  dialCode: string;
}

export const AMERICAN_COUNTRY_CODES: CountryCode[] = [
  { iso: "US", flag: "🇺🇸", name: "Estados Unidos", dialCode: "+1" },
  { iso: "MX", flag: "🇲🇽", name: "México", dialCode: "+52" },
  { iso: "CO", flag: "🇨🇴", name: "Colombia", dialCode: "+57" },
  { iso: "AR", flag: "🇦🇷", name: "Argentina", dialCode: "+54" },
  { iso: "BR", flag: "🇧🇷", name: "Brasil", dialCode: "+55" },
  { iso: "CL", flag: "🇨🇱", name: "Chile", dialCode: "+56" },
  { iso: "PE", flag: "🇵🇪", name: "Perú", dialCode: "+51" },
  { iso: "EC", flag: "🇪🇨", name: "Ecuador", dialCode: "+593" },
  { iso: "VE", flag: "🇻🇪", name: "Venezuela", dialCode: "+58" },
  { iso: "PA", flag: "🇵🇦", name: "Panamá", dialCode: "+507" },
];

export const DEFAULT_COUNTRY_CODE = AMERICAN_COUNTRY_CODES[2]; // Colombia
