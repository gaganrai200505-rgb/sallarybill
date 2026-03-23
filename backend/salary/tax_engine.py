"""
SalaryLens Tax Engine
Computes income tax under Old and New Regime (India 2024-25)
"""

def calculate_hra_exemption(basic, hra_received, metro=True):
    """HRA exemption = min of 3 conditions (Old Regime only)"""
    actual_hra = hra_received
    percent_basic = basic * 0.5 if metro else basic * 0.4
    # Assuming rent > 10% basic for simplicity; in production, take rent input
    rent_less_10 = hra_received * 0.9
    return min(actual_hra, percent_basic, rent_less_10)


def compute_tax_new_regime(taxable_income):
    """New Tax Regime slabs 2024-25"""
    slabs = [
        (300000, 0.00),
        (400000, 0.05),
        (300000, 0.10),
        (200000, 0.15),
        (300000, 0.20),
        (float('inf'), 0.30),
    ]
    tax = 0
    remaining = max(0, taxable_income - 300000)
    for slab_size, rate in slabs[1:]:
        if remaining <= 0:
            break
        taxable_in_slab = min(remaining, slab_size)
        tax += taxable_in_slab * rate
        remaining -= taxable_in_slab
    return tax


def compute_tax_old_regime(taxable_income):
    """Old Tax Regime slabs"""
    if taxable_income <= 250000:
        return 0
    elif taxable_income <= 500000:
        return (taxable_income - 250000) * 0.05
    elif taxable_income <= 1000000:
        return 12500 + (taxable_income - 500000) * 0.20
    else:
        return 112500 + (taxable_income - 1000000) * 0.30


def calculate_full_tax(data, regime='new'):
    """
    data = {
        basic_pay, hra, da, ta, special_allowance,
        pf, professional_tax, tds_deducted, metro (bool)
    }
    """
    basic = float(data.get('basic_pay', 0))
    hra = float(data.get('hra', 0))
    da = float(data.get('da', 0))
    ta = float(data.get('ta', 0))
    special = float(data.get('special_allowance', 0))
    pf = float(data.get('pf', 0))
    prof_tax = float(data.get('professional_tax', 0))
    tds_deducted = float(data.get('tds_deducted', 0))
    metro = data.get('metro', True)

    gross_monthly = basic + hra + da + ta + special
    gross_annual = gross_monthly * 12
    net_monthly = gross_monthly - pf - prof_tax - tds_deducted

    if regime == 'new':
        standard_deduction = 75000
        taxable_income = max(0, gross_annual - standard_deduction)
        income_tax = compute_tax_new_regime(taxable_income)
    else:
        hra_exemption = calculate_hra_exemption(basic * 12, hra * 12, metro)
        standard_deduction = 50000
        pf_deduction = min(pf * 12, 150000)
        prof_tax_annual = prof_tax * 12
        taxable_income = max(0, gross_annual - hra_exemption - standard_deduction - pf_deduction - prof_tax_annual)
        income_tax = compute_tax_old_regime(taxable_income)

    cess = income_tax * 0.04
    total_tax_annual = income_tax + cess
    monthly_tds_required = round(total_tax_annual / 12, 2)

    discrepancy = round(tds_deducted - monthly_tds_required, 2)

    if abs(discrepancy) < 200:
        status = 'match'
        status_label = 'TDS is Accurate'
    elif discrepancy > 0:
        status = 'excess'
        status_label = 'Excess TDS Deducted'
    else:
        status = 'short'
        status_label = 'Short TDS Deducted'

    return {
        'gross_monthly': round(gross_monthly, 2),
        'gross_annual': round(gross_annual, 2),
        'net_monthly': round(net_monthly, 2),
        'taxable_income': round(taxable_income, 2),
        'income_tax': round(income_tax, 2),
        'cess': round(cess, 2),
        'total_tax_annual': round(total_tax_annual, 2),
        'monthly_tds_required': monthly_tds_required,
        'tds_deducted': tds_deducted,
        'discrepancy': discrepancy,
        'status': status,
        'status_label': status_label,
        'regime': regime,
        'salary_breakdown': {
            'basic_pay': basic,
            'hra': hra,
            'da': da,
            'ta': ta,
            'special_allowance': special,
        },
        'deductions': {
            'pf': pf,
            'professional_tax': prof_tax,
            'tds_deducted': tds_deducted,
        }
    }
