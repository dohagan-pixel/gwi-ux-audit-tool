import { useState } from "react";

const FF = "'Faktum',-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
const C = {
  pink: "#FF0077", white: "#FFFFFF", black: "#101720", offBlack: "#2A3447",
  grey8: "#526482", grey7: "#7989A6", grey6: "#ABB8CF", grey5: "#CED9EB",
  grey4: "#DFE7F5", grey3: "#EBF1FB", grey2: "#F7FAFF",
};

// Matches the 30 "<Country> Market Report.dc.html" / "-print.dc.html" pairs under
// public/market-reports/ — each deck already has its own internal slide nav + thumbnail
// rail (see public/market-reports/README.txt), this just switches between countries.
const COUNTRIES = [
  "Australia", "Brazil", "Canada", "Chile", "China", "Czech Republic", "Egypt", "France",
  "Germany", "Greece", "Hong Kong", "Hungary", "Indonesia", "Italy", "Japan", "Malaysia",
  "Morocco", "New Zealand", "Norway", "Philippines", "Saudi Arabia", "South Africa",
  "South Korea", "Spain", "Taiwan", "Thailand", "UAE", "UK", "USA", "Vietnam",
];

export function MarketReportsPage() {
  const [country, setCountry] = useState(COUNTRIES[0]);
  const [printMode, setPrintMode] = useState(false);
  const src = `/market-reports/${country} Market Report${printMode ? "-print" : ""}.dc.html`;

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
          <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.grey7, cursor: "pointer" }}>
            <input type="checkbox" checked={printMode} onChange={function (e) { setPrintMode(e.target.checked); }} />
            Print version
          </label>
        </div>
        <iframe key={src} src={src} title={country + " Market Report"} style={{ flex: 1, border: "none", display: "block", width: "100%" }} />
      </div>
    </div>
  );
}
