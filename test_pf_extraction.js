const text = `TECHVISION SYSTEMS PVT. LTD.

Bangalore, Karnataka - 560001

Priya Sharma EMP-5021
Senior Software Enginee Engineering
ABCPS5678K HOFC Bank

March 2026 XXXX XXXX 7654

SALARY DETAILS
EARNINGS Amount DEDUCTIONS Amount
Basic Pay: 50000 | Provident Fund PF 6000
House Rent Allowance HRA: 22000 | Professional Tax: 250
Oearness Allowance DA 5000 | Income Tax TDS: 4500
Travel Allowance TA: 2500 | Health Insurance: 800
Special Allowance: 5000
Medical Allowance 1500`;

const patterns = {
  basic_pay: [
    /basic\s+pay[\s:]*([0-9,]+\.?\d*)/i,
    /basic\s*pay:?\s+([0-9,]+)/i,
    /basic[\s:]*([0-9,]+\.?\d*)/i,
  ],
  hra: [
    /house\s+rent\s+allowance\s+hra[\s:]*([0-9,]+\.?\d*)/i,
    /house\s+rent\s+allowance\s+\(?\s*hra\s*\)?\s+([0-9,]+\.?\d*)/i,
    /house\s+rent\s+allowance[\s:]*\(?hra\)?[\s:]*([0-9,]+\.?\d*)/i,
    /hra[\s:]*([0-9,]+\.?\d*)/i,
  ],
  da: [
    /(?:dearness|deamess)\s+allowance\s+da[\s:]*([0-9,]+\.?\d*)/i,
    /(?:dearness|deamess)\s+allowance[\s:]*\(?da\)?[\s:]*([0-9,]+\.?\d*)/i,
    /da\s+([0-9,]+\.?\d*)/i,
  ],
  ta: [
    /travel\s+allowance\s+ta[\s:]*([0-9,]+\.?\d*)/i,
    /travel\s+allowance\s+\(?\s*ta\s*\)?\s+([0-9,]+\.?\d*)/i,
    /ta\s*:\s*([0-9,]+\.?\d*)/i,
    /ta[\s:]*([0-9,]+\.?\d*)/i,
  ],
  special_allowance: [
    /special\s+allowance[\s:]*([0-9,]+\.?\d*)/i,
    /special[\s:]*([0-9,]+\.?\d*)/i,
  ],
  pf: [
    /provident\s+fund\s+pf\s+([0-9,]+\.?\d*)/i,
    /provident\s+fund[\s{]*pf[\s}]*[\s:]*([0-9,]+\.?\d*)/i,
    /provident\s+fund[\s:]*\(?pf\)?[\s:]*([0-9,]+\.?\d*)/i,
    /pf\s+([0-9,]+\.?\d*)/i,
    /pf[\s:]*([0-9,]+\.?\d*)/i,
  ],
  professional_tax: [
    /professional\s+tax[\s:]*([0-9,]+\.?\d*)/i,
    /professional\s+tax\s*:\s*([0-9,]+)/i,
    /\bal\s+tax[\s:]*([0-9,]+\.?\d*)/i,
    /pt[\s:]*([0-9,]+\.?\d*)/i,
  ],
  tds_deducted: [
    /income\s+tax\s+tds[\s:]*([0-9,]+\.?\d*)/i,
    /income\s+tax[\s:]*\(?tds\)?[\s:]*([0-9,]+\.?\d*)/i,
    /tds[\s:]*([0-9,]+\.?\d*)/i,
    /income\s+tax[\s:]*([0-9,]+\.?\d*)/i,
  ],
};

const extracted = {};

Object.entries(patterns).forEach(([field, regexList]) => {
  for (const regex of regexList) {
    const match = text.match(regex);
    if (match && match[1]) {
      const value = parseFloat(match[1].replace(/,/g, ''));
      if (value > 0) {
        extracted[field] = value;
        console.log(`✓ ${field}: ${value} (from: ${match[0].substring(0, 40)}...)`);
        break;
      }
    }
  }
});

console.log(`\nTotal extracted: ${Object.keys(extracted).length}/8`);
console.log('Extracted:', extracted);
