import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const C = { bg: '#0a0f1e', card: '#111827', border: '#1e2d45', accent: '#00d4ff', accent2: '#7c3aed', green: '#10b981', red: '#ef4444', yellow: '#f59e0b', text: '#e2e8f0', muted: '#64748b' };

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

const Field = ({ label, field, type = 'number', span = 1, value, onChange }) => (
  <div style={{ gridColumn: `span ${span}` }}>
    <label style={{ color: C.muted, fontSize: 11, display: 'block', marginBottom: 6, letterSpacing: 0.5, fontFamily: 'monospace' }}>{label}</label>
    <div style={{ display: 'flex', background: '#ffffff08', border: `1px solid ${C.border}`, borderRadius: 10, overflow: 'hidden' }}>
      {type === 'number' && <span style={{ padding: '0 10px', color: C.muted, fontSize: 13, borderRight: `1px solid ${C.border}`, display: 'flex', alignItems: 'center' }}>₹</span>}
      <input type={type} value={value} onChange={onChange}
        style={{ background: 'none', border: 'none', padding: '10px 12px', color: C.text, fontSize: 14, width: '100%', outline: 'none' }} />
    </div>
  </div>
);

export default function UploadBill() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [form, setForm] = useState({
    month: 'February', year: new Date().getFullYear(),
    basic_pay: '', hra: '', da: '', ta: '', special_allowance: '',
    pf: '', professional_tax: '', tds_deducted: '',
    is_metro: true, regime: 'new',
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ocrStatus, setOcrStatus] = useState(null);
  const inputRef = useRef();
  const navigate = useNavigate();

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const simulateScan = () => {
    setScanning(true);
    let p = 0;
    const iv = setInterval(() => {
      p += Math.random() * 15;
      if (p >= 100) { p = 100; clearInterval(iv); setTimeout(() => { setScanning(false); setStep(2); }, 400); }
      setProgress(Math.min(p, 100));
    }, 150);
  };

  const extractNumbersFromText = (text) => {
    // Simple regex to find numbers (handles both formats: 50,000 and 50000)
    const numbers = [];
    const regex = /(\d{1,3}(?:,\d{3})*|\d+)(?:\.\d{2})?/g;
    const matches = text.match(regex);
    return matches ? matches.map(m => parseFloat(m.replace(/,/g, ''))) : [];
  };

  const parseSalaryComponents = (text) => {
    // Parse OCR text to extract salary components
    const extracted = {};
    
    // Patterns that match various formats in salary slips
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
        /provident.*?fund.*?pf.*?([0-9,]+\.?\d*)/i,  // Flexible: allows any chars between words
        /pf.*?([0-9,]+\.?\d*)/i,  // PF followed by any chars then number
        /provident\s+fund\s+pf\s+([0-9,]+\.?\d*)/i,
        /provident\s+fund[\s{]*pf[\s}]*[\s:]*([0-9,]+\.?\d*)/i,
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
    
    Object.entries(patterns).forEach(([field, regexList]) => {
      console.log(`\n[PARSE] Attempting to extract: ${field}`);
      for (let i = 0; i < regexList.length; i++) {
        const regex = regexList[i];
        const match = text.match(regex);
        console.log(`  Pattern ${i+1}/${regexList.length}: ${regex.source.substring(0, 50)}... → ${match ? 'MATCH: ' + match[1] : 'NO MATCH'}`);
        if (match && match[1]) {
          const value = parseFloat(match[1].replace(/,/g, ''));
          if (value > 0) {
            extracted[field] = value;
            console.log(`  ✓ EXTRACTED ${field}: ${value}`);
            break;
          }
        }
      }
    });
    
    return extracted;
  };

  const handleScanAndExtract = async () => {
    // Step 1 → Step 2: Upload file and extract values
    if (!file) {
      setError('Please select a file to scan');
      return;
    }

    setLoading(true); setError(''); setOcrStatus(null);
    try {
      const fd = new FormData();
      fd.append('month', form.month);
      fd.append('year', form.year);
      fd.append('basic_pay', 0);
      fd.append('hra', 0);
      fd.append('da', 0);
      fd.append('ta', 0);
      fd.append('special_allowance', 0);
      fd.append('pf', 0);
      fd.append('professional_tax', 0);
      fd.append('tds_deducted', 0);
      fd.append('is_metro', form.is_metro);
      fd.append('regime', form.regime);
      fd.append('bill_file', file);
      
      const { data } = await api.post('/salary/upload/', fd);
      setResult(data);
      setOcrStatus(data.ocr);
      
      // Auto-fill extracted fields from OCR
      if (data.bill?.ocr_raw_text) {
        console.log('===============================================');
        console.log('RAW OCR TEXT FROM BACKEND:');
        console.log('===============================================');
        console.log(data.bill.ocr_raw_text);
        console.log('===============================================');
        
        const extracted = parseSalaryComponents(data.bill.ocr_raw_text);
        console.log('EXTRACTED FIELDS:', extracted);
        
        if (Object.keys(extracted).length > 0) {
          setForm(prev => ({ ...prev, ...extracted }));
          console.log('Form updated with:', extracted);
        } else {
          console.warn('NO FIELDS EXTRACTED FROM OCR TEXT');
        }
      }
      
      // Go to step 2 to allow user to review/edit extracted values
      setStep(2);
    } catch (e) {
      const errorMsg = e.response?.data?.error || 
                       Object.values(e.response?.data || {}).flat()[0] || 
                       'Upload failed';
      setError(errorMsg);
      console.error('Scan error:', e.response?.data);
    } finally { setLoading(false); }
  };

  const handleCalculateTax = async () => {
    // Step 2 → Step 3: Validate form and calculate tax
    const salaryFields = ['basic_pay', 'hra', 'da', 'ta', 'special_allowance', 'pf', 'professional_tax', 'tds_deducted'];
    const emptyFields = salaryFields.filter(field => !form[field] || form[field] === '');
    
    if (emptyFields.length > 0) {
      setError(`Please fill in: ${emptyFields.join(', ')}`);
      return;
    }

    setLoading(true); setError(''); 
    try {
      // If we have a stored bill result, recalculate tax for that bill
      if (result?.bill?.id) {
        const { data } = await api.post(`/salary/bills/${result.bill.id}/recalculate/`, {
          regime: form.regime,
        });
        setResult(prev => ({ ...prev, tax_result: data.tax_result }));
      } else {
        // Otherwise, create new submission with calculated values
        const fd = new FormData();
        const submitData = {
          month: form.month,
          year: form.year,
          basic_pay: parseFloat(form.basic_pay) || 0,
          hra: parseFloat(form.hra) || 0,
          da: parseFloat(form.da) || 0,
          ta: parseFloat(form.ta) || 0,
          special_allowance: parseFloat(form.special_allowance) || 0,
          pf: parseFloat(form.pf) || 0,
          professional_tax: parseFloat(form.professional_tax) || 0,
          tds_deducted: parseFloat(form.tds_deducted) || 0,
          is_metro: form.is_metro,
          regime: form.regime,
        };
        
        Object.entries(submitData).forEach(([k, v]) => fd.append(k, v));
        const { data } = await api.post('/salary/upload/', fd);
        setResult(data);
      }
      
      // Go to step 3 to show results
      setStep(3);
    } catch (e) {
      const errorMsg = e.response?.data?.error || 
                       Object.values(e.response?.data || {}).flat()[0] || 
                       'Calculation failed';
      setError(errorMsg);
      console.error('Tax calc error:', e.response?.data);
    } finally { setLoading(false); }
  };

  const handleClaim = async () => {
    try {
      await api.post(`/salary/bills/${result.bill.id}/claim/`, { reason: `Excess TDS for ${form.month} ${form.year}` });
      navigate('/my-claims');
    } catch (e) { setError(e.response?.data?.error || 'Claim failed'); }
  };

  const r = result?.tax_result;
  const fmt = n => `₹${Math.abs(Number(n || 0)).toLocaleString('en-IN')}`;
  const statusColor = { match: C.green, excess: C.yellow, short: C.red };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px' }}>
      {/* Step indicator */}
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 40, gap: 0 }}>
        {['Upload', 'Enter Data', 'Results'].map((label, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < 2 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: step > i + 1 ? C.green : step === i + 1 ? `linear-gradient(135deg, ${C.accent}, ${C.accent2})` : C.border,
                fontSize: 12, fontWeight: 700, color: step >= i + 1 ? '#fff' : C.muted, transition: 'all 0.3s ease',
                boxShadow: step === i + 1 ? `0 4px 12px rgba(0, 212, 255, 0.3)` : 'none',
              }}>{step > i + 1 ? '✓' : i + 1}</div>
              <span style={{ color: step === i + 1 ? C.text : C.muted, fontSize: 12, marginTop: 6, fontWeight: 600, transition: 'all 0.3s ease' }}>{label}</span>
            </div>
            {i < 2 && <div style={{ flex: 1, height: 2, background: step > i + 1 ? C.green : C.border, margin: '0 12px', marginBottom: 18, transition: 'all 0.3s ease' }} />}
          </div>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: C.text, marginBottom: 8, fontWeight: 800, letterSpacing: -0.5 }}>Upload Salary Slip</h2>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 28, fontWeight: 500 }}>Upload your payslip PDF/image for OCR extraction</p>

          <div onClick={() => !file && inputRef.current.click()}
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); setFile(e.dataTransfer.files[0]); }}
            style={{ border: `2.5px dashed ${dragging ? C.accent : file ? C.green : C.border}`, borderRadius: 18, padding: '56px 28px',
              textAlign: 'center', cursor: file ? 'default' : 'pointer', background: dragging ? `${C.accent}0a` : file ? `${C.green}08` : '#ffffff03', transition: 'all 0.3s ease', boxShadow: dragging ? `0 0 24px ${C.accent}40` : 'none' }}>
            <input ref={inputRef} type="file" accept=".pdf,image/*" style={{ display: 'none' }} onChange={e => setFile(e.target.files[0])} />
            {!file ? (<>
              <div style={{ fontSize: 48, marginBottom: 14 }}>📄</div>
              <p style={{ color: C.text, fontWeight: 700, fontSize: 16, margin: '0 0 6px' }}>Drop salary slip here</p>
              <p style={{ color: C.muted, fontSize: 13, margin: 0 }}>PDF, JPG, PNG supported • Max 10 MB</p>
            </>) : (<>
              <div style={{ fontSize: 44, marginBottom: 12 }}>✅</div>
              <p style={{ color: C.green, fontWeight: 700, fontSize: 15, margin: '0 0 4px' }}>{file.name}</p>
              <p style={{ color: C.muted, fontSize: 13, margin: '0 0 12px' }}>{(file.size / 1024).toFixed(1)} KB</p>
              <button onClick={e => { e.stopPropagation(); setFile(null); }} style={{ background: 'none', border: `1.5px solid ${C.border}`, color: C.muted, borderRadius: 9, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 600, transition: 'all 0.3s ease' }} onMouseEnter={e => { e.target.style.borderColor = C.accent; e.target.style.color = C.accent; }} onMouseLeave={e => { e.target.style.borderColor = C.border; e.target.style.color = C.muted; }}>Remove File</button>
            </>)}
          </div>

          {scanning && (
            <div style={{ marginTop: 24, background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: 20, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span style={{ color: C.text, fontSize: 13, fontFamily: 'monospace', fontWeight: 600 }}>
                  {progress < 40 ? 'Parsing document...' : progress < 75 ? 'Running OCR...' : 'Extracting fields...'}
                </span>
                <span style={{ color: C.accent, fontFamily: 'monospace', fontSize: 13, fontWeight: 700 }}>{Math.round(progress)}%</span>
              </div>
              <div style={{ background: C.border, borderRadius: 50, height: 6 }}>
                <div style={{ background: `linear-gradient(90deg, ${C.accent}, ${C.accent2})`, width: `${progress}%`, height: '100%', borderRadius: 50, transition: 'width 0.2s ease-out', boxShadow: `0 0 12px ${C.accent}80` }} />
              </div>
            </div>
          )}

          {!scanning && (
            <div style={{ display: 'flex', gap: 14, marginTop: 24 }}>
              <button onClick={() => setStep(2)} style={{ flex: 1, padding: 14, background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, color: C.text, cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.3s ease' }} onMouseEnter={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 4px 12px rgba(0, 212, 255, 0.2)`; }} onMouseLeave={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}>
                Skip → Enter Manually
              </button>
              <button onClick={file ? handleScanAndExtract : () => setStep(2)} disabled={loading} style={{
                flex: 1, padding: 14, background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
                border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1,
                transition: 'all 0.3s ease', boxShadow: `0 4px 16px rgba(0, 212, 255, 0.3)`,
              }} onMouseEnter={e => !loading && (e.target.style.transform = 'translateY(-2px)', e.target.style.boxShadow = `0 8px 24px rgba(0, 212, 255, 0.4)`)} onMouseLeave={e => (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = `0 4px 16px rgba(0, 212, 255, 0.3)`)}>
                {loading ? '⏳ Processing...' : file ? '🔍 Scan & Extract' : 'Continue →'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Form */}
      {step === 2 && (
        <div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: C.text, marginBottom: 8, fontWeight: 800, letterSpacing: -0.5 }}>Enter Salary Details</h2>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 28, fontWeight: 500 }}>Verify or manually fill in the salary components</p>
          
          {/* OCR Status Message */}
          {ocrStatus && (
            <div style={{ background: ocrStatus.success ? `${C.green}12` : `${C.yellow}12`, border: `1.5px solid ${ocrStatus.success ? C.green : C.yellow}`, borderRadius: 14, padding: '16px 18px', marginBottom: 24, display: 'flex', gap: 14, alignItems: 'center', boxShadow: `0 4px 12px ${ocrStatus.success ? C.green : C.yellow}20` }}>
              <span style={{ fontSize: 22 }}>{ocrStatus.success ? '✅' : '📋'}</span>
              <div>
                <p style={{ color: ocrStatus.success ? C.green : C.yellow, fontWeight: 700, margin: 0, fontSize: 13 }}>
                  {ocrStatus.success ? 'Bill scanned successfully' : 'Manual entry mode'}
                </p>
                <p style={{ color: C.muted, fontSize: 12, marginTop: 4, fontWeight: 500 }}>{ocrStatus.message}</p>
              </div>
            </div>
          )}

          <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: 28, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ color: C.muted, fontSize: 11, display: 'block', marginBottom: 8, letterSpacing: 0.8, fontFamily: 'monospace', fontWeight: 600, textTransform: 'uppercase' }}>MONTH</label>
                <select value={form.month} onChange={e => handleChange('month', e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', background: '#ffffff08', border: `1.5px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: 'none', transition: 'all 0.3s ease', cursor: 'pointer', fontWeight: 500 }}
                  onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 12px rgba(0, 212, 255, 0.2)`; }}
                  onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}>
                  {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label style={{ color: C.muted, fontSize: 11, display: 'block', marginBottom: 8, letterSpacing: 0.8, fontFamily: 'monospace', fontWeight: 600, textTransform: 'uppercase' }}>YEAR</label>
                <input type="number" value={form.year} onChange={e => handleChange('year', e.target.value)}
                  style={{ width: '100%', padding: '12px 14px', background: '#ffffff08', border: `1.5px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 14, outline: 'none', transition: 'all 0.3s ease', fontWeight: 500 }}
                  onFocus={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 0 12px rgba(0, 212, 255, 0.2)`; }}
                  onBlur={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }} />
              </div>

              <div style={{ gridColumn: 'span 2' }}>
                <p style={{ color: C.green, fontSize: 11, fontFamily: 'monospace', letterSpacing: 1, margin: '8px 0 12px', fontWeight: 700, textTransform: 'uppercase' }}>EARNINGS</p>
              </div>
              <Field label="BASIC PAY" field="basic_pay" value={form.basic_pay} onChange={e => handleChange('basic_pay', e.target.value)} />
              <Field label="HRA" field="hra" value={form.hra} onChange={e => handleChange('hra', e.target.value)} />
              <Field label="DEARNESS ALLOWANCE" field="da" value={form.da} onChange={e => handleChange('da', e.target.value)} />
              <Field label="TRAVEL ALLOWANCE" field="ta" value={form.ta} onChange={e => handleChange('ta', e.target.value)} />
              <Field label="SPECIAL ALLOWANCE" field="special_allowance" value={form.special_allowance} onChange={e => handleChange('special_allowance', e.target.value)} span={2} />

              <div style={{ gridColumn: 'span 2' }}>
                <p style={{ color: C.red, fontSize: 11, fontFamily: 'monospace', letterSpacing: 1, margin: '8px 0 12px', fontWeight: 700, textTransform: 'uppercase' }}>DEDUCTIONS</p>
              </div>
              <Field label="PF DEDUCTED" field="pf" value={form.pf} onChange={e => handleChange('pf', e.target.value)} />
              <Field label="PROFESSIONAL TAX" field="professional_tax" value={form.professional_tax} onChange={e => handleChange('professional_tax', e.target.value)} />
              <Field label="TDS DEDUCTED (AS PER SLIP)" field="tds_deducted" value={form.tds_deducted} onChange={e => handleChange('tds_deducted', e.target.value)} span={2} />

              <div style={{ gridColumn: 'span 2', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ color: C.muted, fontSize: 11, display: 'block', marginBottom: 8, letterSpacing: 0.8, fontFamily: 'monospace', fontWeight: 600, textTransform: 'uppercase' }}>TAX REGIME</label>
                  <div style={{ display: 'flex', background: '#ffffff08', border: `1.5px solid ${C.border}`, borderRadius: 10, overflow: 'hidden', transition: 'all 0.3s ease' }}>
                    {['new', 'old'].map(r => (
                      <button key={r} onClick={() => handleChange('regime', r)} style={{
                        flex: 1, padding: '12px', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700,
                        background: form.regime === r ? `linear-gradient(135deg, ${C.accent}, ${C.accent2})` : 'transparent',
                        color: form.regime === r ? '#fff' : C.muted, transition: 'all 0.3s ease',
                      }}>{r === 'new' ? 'New Regime' : 'Old Regime'}</button>
                    ))}
                  </div>
                </div>
                <div style={{ width: 140 }}>
                  <label style={{ color: C.muted, fontSize: 11, display: 'block', marginBottom: 8, letterSpacing: 0.8, fontFamily: 'monospace', fontWeight: 600, textTransform: 'uppercase' }}>METRO CITY</label>
                  <button onClick={() => handleChange('is_metro', !form.is_metro)} style={{
                    width: '100%', padding: '12px 16px', borderRadius: 10, border: `1.5px solid ${C.border}`, cursor: 'pointer', fontSize: 13, fontWeight: 700,
                    background: form.is_metro ? `${C.accent}20` : '#ffffff08', color: form.is_metro ? C.accent : C.muted, transition: 'all 0.3s ease',
                  }} onMouseEnter={e => { e.target.style.borderColor = C.accent; }} onMouseLeave={e => { e.target.style.borderColor = form.is_metro ? C.accent : C.border; }}>{form.is_metro ? '✓ Metro' : 'Non-Metro'}</button>
                </div>
              </div>
            </div>
          </div>

          {error && <p style={{ color: C.red, fontSize: 13, marginTop: 18, background: '#ef44441a', padding: '12px 14px', borderRadius: 10, border: `1px solid #ef444440` }}>⚠ {error}</p>}

          <div style={{ display: 'flex', gap: 14, marginTop: 24 }}>
            <button onClick={() => setStep(1)} style={{ padding: '14px 22px', background: 'none', border: `1.5px solid ${C.border}`, borderRadius: 12, color: C.muted, cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.3s ease' }} onMouseEnter={e => { e.target.style.borderColor = C.accent; e.target.style.color = C.accent; }} onMouseLeave={e => { e.target.style.borderColor = C.border; e.target.style.color = C.muted; }}>← Back</button>
            <button onClick={handleCalculateTax} disabled={loading} style={{
              flex: 1, padding: 14, background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
              border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', opacity: loading ? 0.7 : 1,
              transition: 'all 0.3s ease', boxShadow: `0 4px 16px rgba(0, 212, 255, 0.3)`,
            }} onMouseEnter={e => !loading && (e.target.style.transform = 'translateY(-2px)', e.target.style.boxShadow = `0 8px 24px rgba(0, 212, 255, 0.4)`)} onMouseLeave={e => (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = `0 4px 16px rgba(0, 212, 255, 0.3)`)}>
              {loading ? '⏳ Calculating...' : '🔍 Calculate Tax →'}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {step === 3 && r && (
        <div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: C.text, marginBottom: 8, fontWeight: 800, letterSpacing: -0.5 }}>Tax Analysis Report</h2>
          <p style={{ color: C.muted, fontSize: 14, marginBottom: 28, fontWeight: 500 }}>{form.month} {form.year} · {r.regime === 'new' ? 'New' : 'Old'} Regime</p>

          {/* Status Banner */}
          <div style={{ background: `${statusColor[r.status]}12`, border: `1.5px solid ${statusColor[r.status]}`, borderRadius: 16, padding: '20px 22px', marginBottom: 28, display: 'flex', gap: 16, alignItems: 'center', boxShadow: `0 4px 16px ${statusColor[r.status]}20` }}>
            <span style={{ fontSize: 32 }}>{r.status === 'match' ? '✅' : r.status === 'excess' ? '⚠️' : '🚨'}</span>
            <div>
              <p style={{ color: statusColor[r.status], fontWeight: 800, margin: 0, fontSize: 15 }}>{r.status_label}</p>
              <p style={{ color: C.muted, fontSize: 13, marginTop: 6, fontWeight: 500 }}>
                {r.status === 'match' ? 'TDS in your slip matches computed amount.'
                  : r.status === 'excess' ? `${fmt(r.discrepancy)} extra deducted — eligible for reimbursement.`
                  : `${fmt(r.discrepancy)} short — may be recovered in future months.`}
              </p>
            </div>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 24 }}>
            {[
              ['GROSS MONTHLY', fmt(r.gross_monthly), C.accent],
              ['ANNUAL INCOME', fmt(r.gross_annual), C.text],
              ['TAXABLE INCOME', fmt(r.taxable_income), C.yellow],
              ['ANNUAL TAX + CESS', fmt(r.total_tax_annual), C.red],
            ].map(([label, val, color]) => (
              <div key={label} style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 14, padding: '18px 20px', transition: 'all 0.3s ease', cursor: 'default' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = color; e.currentTarget.style.boxShadow = `0 4px 12px ${color}30`; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.boxShadow = 'none'; }}>
                <p style={{ color: C.muted, fontSize: 11, fontFamily: 'monospace', letterSpacing: 0.5, margin: '0 0 8px', fontWeight: 600, textTransform: 'uppercase' }}>{label}</p>
                <p style={{ color, fontSize: 22, fontWeight: 800, margin: 0, fontFamily: 'monospace' }}>{val}</p>
              </div>
            ))}
          </div>

          {/* Breakdown table */}
          <div style={{ background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 16, padding: '24px', marginBottom: 24, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)' }}>
            <p style={{ color: C.accent, fontSize: 11, fontFamily: 'monospace', letterSpacing: 1, margin: '0 0 16px', fontWeight: 700, textTransform: 'uppercase' }}>TDS COMPARISON</p>
            {[
              ['Income Tax', fmt(r.income_tax), C.text],
              ['Cess (4%)', fmt(r.cess), C.text],
              ['Monthly TDS Required', fmt(r.monthly_tds_required), C.accent, true],
              ['TDS in Slip', fmt(r.tds_deducted), C.text],
              ['Discrepancy', `${r.discrepancy >= 0 ? '+' : '-'}${fmt(r.discrepancy)}`, statusColor[r.status], true],
            ].map(([label, val, color, bold]) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: `1px solid ${C.border}20`, fontWeight: bold ? 700 : 500 }}>
                <span style={{ color: bold ? C.text : C.muted, fontSize: 14 }}>{label}</span>
                <span style={{ color, fontFamily: 'monospace', fontSize: 14, fontWeight: bold ? 700 : 600 }}>{val}</span>
              </div>
            ))}
          </div>

          {r.status === 'excess' && (
            <div style={{ background: `${C.yellow}12`, border: `1.5px solid ${C.yellow}`, borderRadius: 16, padding: '20px 22px', marginBottom: 24, boxShadow: `0 4px 16px ${C.yellow}20` }}>
              <p style={{ color: C.yellow, fontWeight: 800, margin: '0 0 8px', fontSize: 15 }}>💰 File Reimbursement Claim</p>
              <p style={{ color: C.muted, fontSize: 13, margin: '0 0 16px', fontWeight: 500 }}>Eligible to claim back {fmt(r.discrepancy)} excess TDS deducted.</p>
              <button onClick={handleClaim} style={{ background: C.yellow, border: 'none', borderRadius: 11, padding: '12px 24px', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: 14, transition: 'all 0.3s ease', boxShadow: `0 4px 12px ${C.yellow}40` }} onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = `0 6px 16px ${C.yellow}60`; }} onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = `0 4px 12px ${C.yellow}40`; }}>
                Raise Claim →
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: 14 }}>
            <button onClick={() => navigate('/my-bills')} style={{ flex: 1, padding: 14, background: C.card, border: `1.5px solid ${C.border}`, borderRadius: 12, color: C.text, cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.3s ease' }} onMouseEnter={e => { e.target.style.borderColor = C.accent; e.target.style.boxShadow = `0 4px 12px rgba(0, 212, 255, 0.2)`; }} onMouseLeave={e => { e.target.style.borderColor = C.border; e.target.style.boxShadow = 'none'; }}>
              View My Bills
            </button>
            <button onClick={() => { setStep(1); setFile(null); setResult(null); setProgress(0); }} style={{
              flex: 1, padding: 14, background: `linear-gradient(135deg, ${C.accent}, ${C.accent2})`,
              border: 'none', borderRadius: 12, color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all 0.3s ease',
              boxShadow: `0 4px 16px rgba(0, 212, 255, 0.3)`,
            }} onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = `0 8px 24px rgba(0, 212, 255, 0.4)`; }} onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = `0 4px 16px rgba(0, 212, 255, 0.3)`; }}>+ Upload Another</button>
          </div>
        </div>
      )}
    </div>
  );
}
