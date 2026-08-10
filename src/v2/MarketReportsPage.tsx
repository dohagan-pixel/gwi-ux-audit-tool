import { useState } from "react";

const FF = "'Faktum',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const C = {
  pink: "#FF0077", white: "#FFFFFF", black: "#101720", offBlack: "#2A3447",
  grey8: "#526482", grey7: "#7989A6", grey6: "#ABB8CF", grey5: "#CED9EB",
  grey4: "#DFE7F5", grey3: "#EBF1FB", grey2: "#F7FAFF",
};

// Matches the 30 "<Country> Market Report.dc.html" pairs under public/market-reports/ —
// each deck already has its own internal slide nav + thumbnail rail (see
// public/market-reports/README.txt), this just switches between countries.
const COUNTRIES = [
  "Australia", "Brazil", "Canada", "Chile", "China", "Czech Republic", "Egypt", "France",
  "Germany", "Greece", "Hong Kong", "Hungary", "Indonesia", "Italy", "Japan", "Malaysia",
  "Morocco", "New Zealand", "Norway", "Philippines", "Saudi Arabia", "South Africa",
  "South Korea", "Spain", "Taiwan", "Thailand", "UAE", "UK", "USA", "Vietnam",
];

// Google Drive file IDs from the shared "Market Trends" folder, one PDF per country.
// NOTE: the Drive file behind "Spain" is actually named "spain-korea.pdf" in that folder —
// mapped here by its alphabetical position (between south-korea and taiwan) since that
// matches the country list, but worth double-checking the PDF's actual content is Spain's.
const COUNTRY_PDF_IDS: Record<string, string> = {
  Australia: "1kOCn6vWPYAmkK4rydr8RLH2PD8q2Qub8",
  Brazil: "1wtdF6rIK067W_u3lG5Twpr89lBU4YM9j",
  Canada: "1xUF-fgqFuRd9y1twpZft1IrLIUO0EAsm",
  Chile: "1AGmN23L6qYY3PzYvuM-YnUsV189r0ILY",
  China: "1hjuggU69hU3HscGAFF-cxiqpqtmhEAOt",
  "Czech Republic": "1ZXSgQ7pSmYkPJ6p4xHEfpn58bMTvHroU",
  Egypt: "1Fi9qSrPKemNGU-yxrRYHO9RbaZgZzxyj",
  France: "1UzpEmbBj9XC0EYA34rhKcSZaGhXeg89O",
  Germany: "126dIKGu_Al6gltyp9RAeNrwHPeH5Injc",
  Greece: "149j9MIVofswKhFShQ7AKCsa6fsFw2rf8",
  "Hong Kong": "1mlRMWSQRcXQShcrVpa0J5qGEzWn7sWuw",
  Hungary: "1PeE8FkTwamaV8-HMS_M-da4XOBYPeNUB",
  Indonesia: "124l5T5YTg2e6jTZfZDAvM2hbctmDQzqc",
  Italy: "1bQp0JMjBJv4KDSEi0YQUaAa5ucaU76bH",
  Japan: "1zIMIWj0_LtrbsSrH2nbIGTia7A9wOLKy",
  Malaysia: "1v7pY5xDCGSW1dUDV9wOOdTT3Zu3EX-CB",
  Morocco: "1PcLZIwi7o19X0n9Fycfwurmcw62Qk0Vm",
  "New Zealand": "1lNFSHxN2pYgxGm59bUG7_sXRlF8SeGTk",
  Norway: "1l9rDW5PTwP6VR2FLqgdPeEOdM6UdXJwI",
  Philippines: "1UDC82Nj_UWQEeHCH1n-wGcnbLuC89wX4",
  "Saudi Arabia": "1jqqq2NiU8r48xoM8QGPnaThnAicBJqf6",
  "South Africa": "18THZy0BINx3t8jmgzVGyPgbaZk0Q3LPQ",
  "South Korea": "1NXmdL2lJGTlivfcZccIYsDNtfnT0qxua",
  Spain: "1wJY-A5l8fWF4UJhLEGCroUQdTZTgzYmL",
  Taiwan: "1IrD9tNiv8prWQHdJr8zzenppdBtzTFLG",
  Thailand: "1hvcBD-SwIUC4v6bAW3iomHr_-Y3BdRQJ",
  UAE: "14DBMn10bKPbu2LqT4hl2zeF2-vylTSsR",
  UK: "1PCZMvyP3RH-UfnuxTRb-8udLTswufbmN",
  USA: "1bxCauG_4gBCyoc4dSx1CFxWgDSOu4UPG",
  Vietnam: "1AzoIiKxDWE3y6cI1cv7lRanE2rGxIXhW",
};

export function MarketReportsPage() {
  const [country, setCountry] = useState(COUNTRIES[0]);
  const src = `/market-reports/${country} Market Report.dc.html`;
  const pdfId = COUNTRY_PDF_IDS[country];
  const pdfHref = pdfId ? `https://drive.google.com/uc?export=download&id=${pdfId}` : undefined;

  return (
    <div style={{ display: "flex", height: "100%", overflow: "hidden", fontFamily: FF }}>
      <div style={{ width: 220, flexShrink: 0, borderRight: "1px solid " + C.grey4, overflowY: "auto", padding: "16px 8px", background: C.grey2 }}>
        <div style={{ padding: "0 8px 12px", fontSize: 11, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.grey7 }}>
          {COUNTRIES.length} Markets
        </div>
        {COUNTRIES.map(function (c) {
          var active = country === c;
          return (
            <button
              key={c}
              onClick={function () { setCountry(c); }}
              style={{
                display: "block", width: "100%", textAlign: "left", padding: "8px 10px",
                borderRadius: 8, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 600,
                marginBottom: 2, background: active ? C.pink : "transparent",
                color: active ? C.white : C.grey8,
              }}
            >
              {c}
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", borderBottom: "1px solid " + C.grey4, flexShrink: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: C.black }}>{country} Market Report</div>
          <div style={{ flex: 1 }} />
          {pdfHref && (
            <a
              href={pdfHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 700,
                color: C.white, background: C.pink, padding: "7px 14px", borderRadius: 8,
                textDecoration: "none",
              }}
            >
              Download PDF
            </a>
          )}
        </div>
        <iframe key={src} src={src} title={country + " Market Report"} style={{ flex: 1, border: "none", display: "block", width: "100%" }} />
      </div>
    </div>
  );
}
