/**
 * Generates an SVG Data URL representing a realistic synthetic clinical prescription.
 * Contains the 5 benchmark medicines corresponding to the demo pharmacies.
 */
export function generateSyntheticPrescriptionDataUrl(): string {
  const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1100" width="800" height="1100">
  <defs>
    <style>
      .header-title { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 24px; font-weight: bold; fill: #0D47A1; }
      .header-sub { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; fill: #546E7A; }
      .rx-symbol { font-family: 'Times New Roman', serif; font-size: 48px; font-style: italic; font-weight: bold; fill: #1565C0; }
      .rx-item-name { font-family: 'Courier New', Courier, monospace; font-size: 18px; font-weight: bold; fill: #1A237E; }
      .rx-item-desc { font-family: 'Courier New', Courier, monospace; font-size: 14px; fill: #37474F; }
      .watermark { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 42px; font-weight: 900; fill: #E8EAF6; }
      .label-text { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; font-weight: bold; fill: #78909C; }
      .val-text { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 13px; font-weight: 600; fill: #263238; }
    </style>
  </defs>

  <!-- Paper background -->
  <rect width="800" height="1100" fill="#FCFDFF" rx="16" />
  <rect x="20" y="20" width="760" height="1060" fill="none" stroke="#CFD8DC" stroke-width="2" rx="12" />

  <!-- Security Watermark -->
  <text x="400" y="580" text-anchor="middle" transform="rotate(-30 400 580)" class="watermark">MEDIRUSH CLINICAL DEMO</text>

  <!-- Clinic Header -->
  <g transform="translate(60, 70)">
    <circle cx="30" cy="30" r="28" fill="#E3F2FD" />
    <path d="M 30 14 L 30 46 M 14 30 L 46 30" stroke="#1565C0" stroke-width="6" stroke-linecap="round" />
    <text x="75" y="25" class="header-title">DR. ARVIND RAO, MD (GEN. MEDICINE)</text>
    <text x="75" y="44" class="header-sub">Reg No: KMC-74892 • CityCare Health Centre, Indiranagar, Bengaluru</text>
    <text x="75" y="60" class="header-sub">Phone: +91 80 2520 1122 • Clinic Hours: 9:00 AM – 7:30 PM</text>
  </g>

  <!-- Dividing Line -->
  <line x1="50" y1="160" x2="750" y2="160" stroke="#1565C0" stroke-width="3" />

  <!-- Patient Details Bar -->
  <rect x="50" y="175" width="700" height="60" fill="#F4F7FC" rx="8" stroke="#E2E8F0" />
  <text x="70" y="198" class="label-text">PATIENT NAME:</text>
  <text x="175" y="198" class="val-text">Isha Sharma (Female / 26 Yrs)</text>
  <text x="520" y="198" class="label-text">DATE:</text>
  <text x="570" y="198" class="val-text">Today (Acute Episode)</text>

  <text x="70" y="222" class="label-text">DIAGNOSIS:</text>
  <text x="175" y="222" class="val-text">Acute Upper Respiratory Infection with High-Grade Fever &amp; Gastritis</text>
  <text x="520" y="222" class="label-text">WEIGHT:</text>
  <text x="580" y="222" class="val-text">58 kg</text>

  <!-- Rx Symbol -->
  <text x="60" y="300" class="rx-symbol">&#8478;</text>

  <!-- Prescribed Medicines Section -->
  <!-- 1. Dolo 650 -->
  <g transform="translate(70, 340)">
    <circle cx="8" cy="8" r="4" fill="#1565C0" />
    <text x="25" y="14" class="rx-item-name">Tab. Dolo 650 mg</text>
    <text x="520" y="14" class="rx-item-name">[Qty: 10 Tabs]</text>
    <text x="25" y="36" class="rx-item-desc">Sig: 1 tablet TDS (1-0-1) after food x 3 days for fever/bodyache</text>
  </g>
  <line x1="70" y1="395" x2="730" y2="395" stroke="#ECEFF1" stroke-width="1" />

  <!-- 2. Pantoprazole 40 -->
  <g transform="translate(70, 420)">
    <circle cx="8" cy="8" r="4" fill="#1565C0" />
    <text x="25" y="14" class="rx-item-name">Cap. Pantoprazole 40 mg</text>
    <text x="520" y="14" class="rx-item-name">[Qty: 10 Caps]</text>
    <text x="25" y="36" class="rx-item-desc">Sig: 1 capsule OD (1-0-0) empty stomach 30 mins before breakfast</text>
  </g>
  <line x1="70" y1="475" x2="730" y2="475" stroke="#ECEFF1" stroke-width="1" />

  <!-- 3. Azithromycin 500 -->
  <g transform="translate(70, 500)">
    <circle cx="8" cy="8" r="4" fill="#1565C0" />
    <text x="25" y="14" class="rx-item-name">Tab. Azithromycin 500 mg</text>
    <text x="520" y="14" class="rx-item-name">[Qty: 5 Tabs]</text>
    <text x="25" y="36" class="rx-item-desc">Sig: 1 tablet OD (0-0-1) at night after food x 5 days (complete course)</text>
  </g>
  <line x1="70" y1="555" x2="730" y2="555" stroke="#ECEFF1" stroke-width="1" />

  <!-- 4. ORS Sachet -->
  <g transform="translate(70, 580)">
    <circle cx="8" cy="8" r="4" fill="#1565C0" />
    <text x="25" y="14" class="rx-item-name">ORS / Electral Sachet</text>
    <text x="520" y="14" class="rx-item-name">[Qty: 2 Sachets]</text>
    <text x="25" y="36" class="rx-item-desc">Sig: Dissolve 1 sachet in 1 liter boiled and cooled water. Sip throughout day</text>
  </g>
  <line x1="70" y1="635" x2="730" y2="635" stroke="#ECEFF1" stroke-width="1" />

  <!-- 5. Cetirizine 10 -->
  <g transform="translate(70, 660)">
    <circle cx="8" cy="8" r="4" fill="#1565C0" />
    <text x="25" y="14" class="rx-item-name">Tab. Cetirizine 10 mg</text>
    <text x="520" y="14" class="rx-item-name">[Qty: 10 Tabs]</text>
    <text x="25" y="36" class="rx-item-desc">Sig: 1 tablet OD (0-0-1) at bedtime for rhinitis / allergy relief</text>
  </g>
  <line x1="70" y1="715" x2="730" y2="715" stroke="#ECEFF1" stroke-width="1" />

  <!-- Advice Box -->
  <rect x="50" y="750" width="700" height="110" fill="#FFFDE7" rx="8" stroke="#FFF59D" />
  <text x="70" y="775" class="label-text" fill="#F57F17">GENERAL ADVICE / INSTRUCTIONS:</text>
  <text x="70" y="800" class="val-text">• Adequate fluid intake (3+ liters/day). Complete full antibiotic course.</text>
  <text x="70" y="822" class="val-text">• Review in clinic after 5 days or immediately if dyspnea / high fever persists.</text>
  <text x="70" y="844" class="val-text">• Rest strictly for 48 hours. Monitor temperature every 6 hours.</text>

  <!-- Doctor Signature & Stamp -->
  <g transform="translate(520, 920)">
    <path d="M 20 50 Q 60 10 100 40 T 170 30" fill="none" stroke="#0D47A1" stroke-width="2.5" />
    <text x="35" y="75" class="val-text" font-size="14">Dr. Arvind Rao, MD</text>
    <text x="35" y="92" class="header-sub" font-size="11">Consultant Physician (KMC #74892)</text>
    <rect x="15" y="25" width="180" height="80" fill="none" stroke="#90CAF9" stroke-dasharray="4,4" rx="4" />
  </g>

  <!-- Footer Disclaimer -->
  <line x1="50" y1="1020" x2="750" y2="1020" stroke="#CFD8DC" stroke-width="1" />
  <text x="400" y="1045" text-anchor="middle" class="header-sub" font-size="11">
    Standard Hospital Prescription Format • Valid for Dispensing across Accredited Pharmacies
  </text>
</svg>
`;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

/**
 * Returns the same prescription data as plain text for Gemini text-mode extraction.
 * Used when the demo SVG is loaded (no actual image bytes needed).
 */
export function getDemoPrescriptionText(): string {
  return `
DR. ARVIND RAO, MD (GEN. MEDICINE)
Reg No: KMC-74892 | CityCare Health Centre, Indiranagar, Bengaluru

PATIENT NAME: Isha Sharma (Female / 26 Yrs)
DATE: Today (Acute Episode)
DIAGNOSIS: Acute Upper Respiratory Infection with High-Grade Fever & Gastritis

Rx:

1. Tab. Dolo 650 mg
   Qty: 10 Tabs
   Sig: 1 tablet TDS (1-0-1) after food x 3 days for fever/bodyache

2. Cap. Pantoprazole 40 mg
   Qty: 10 Caps
   Sig: 1 capsule OD (1-0-0) empty stomach 30 mins before breakfast

3. Tab. Azithromycin 500 mg
   Qty: 5 Tabs
   Sig: 1 tablet OD (0-0-1) at night after food x 5 days (complete course)

4. ORS / Electral Sachet
   Qty: 2 Sachets
   Sig: Dissolve 1 sachet in 1 liter boiled and cooled water. Sip throughout day.

5. Tab. Cetirizine 10 mg
   Qty: 10 Tabs
   Sig: 1 tablet OD (0-0-1) at bedtime for rhinitis / allergy relief

GENERAL ADVICE:
- Adequate fluid intake (3+ liters/day). Complete full antibiotic course.
- Review in clinic after 5 days.

Dr. Arvind Rao, MD | Consultant Physician (KMC #74892)
`.trim();
}
