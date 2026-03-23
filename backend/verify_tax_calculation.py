#!/usr/bin/env python3
"""
Tax Calculation Verification Tool
Compare expected vs actual results for uploaded bills
"""

import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'salarylens.settings')
django.setup()

from salary.models import SalaryBill
from salary.tax_engine import calculate_full_tax

def format_currency(amount):
    """Format as Indian currency"""
    return f"₹ {amount:,.2f}"

def verify_calculation(salary_data, regime='new'):
    """Verify tax calculation with detailed breakdown"""
    print("\n" + "="*80)
    print("TAX CALCULATION VERIFICATION")
    print("="*80)
    
    # Display input
    print("\n📋 INPUT DATA:")
    print(f"  Basic Pay:          {format_currency(salary_data['basic_pay'])}")
    print(f"  HRA:                {format_currency(salary_data['hra'])}")
    print(f"  DA:                 {format_currency(salary_data['da'])}")
    print(f"  TA:                 {format_currency(salary_data['ta'])}")
    print(f"  Special Allowance:  {format_currency(salary_data['special_allowance'])}")
    print(f"  PF Deducted:        {format_currency(salary_data['pf'])}")
    print(f"  Professional Tax:   {format_currency(salary_data['professional_tax'])}")
    print(f"  TDS Deducted:       {format_currency(salary_data['tds_deducted'])}")
    print(f"  Metro:              {'Yes' if salary_data.get('metro', True) else 'No'}")
    print(f"  Regime:             {regime.upper()}")
    
    # Calculate
    result = calculate_full_tax(salary_data, regime)
    
    # Display calculations
    print("\n📊 CALCULATIONS:")
    print(f"  Gross Monthly:      {format_currency(result['gross_monthly'])}")
    print(f"  Gross Annual:       {format_currency(result['gross_annual'])}")
    print(f"  Taxable Income:     {format_currency(result['taxable_income'])}")
    print(f"  Income Tax:         {format_currency(result['income_tax'])}")
    print(f"  Cess (4%):          {format_currency(result['cess'])}")
    print(f"  Total Tax Annual:   {format_currency(result['total_tax_annual'])}")
    
    # TDS comparison
    print("\n💰 TDS COMPARISON:")
    print(f"  Monthly TDS Required: {format_currency(result['monthly_tds_required'])}")
    print(f"  TDS Deducted:         {format_currency(result['tds_deducted'])}")
    print(f"  Discrepancy:          {format_currency(result['discrepancy'])}")
    print(f"  Status:               {result['status_label']}")
    
    print("\n" + "="*80 + "\n")
    
    return result

def verify_bill_from_db(bill_id):
    """Verify a specific bill from the database"""
    try:
        bill = SalaryBill.objects.get(id=bill_id)
        
        print(f"\n🔍 VERIFYING BILL #{bill_id}")
        print(f"Employee: {bill.employee.get_full_name()}")
        print(f"Month: {bill.month} {bill.year}")
        print(f"Regime: {bill.regime.upper()}")
        
        # Prepare data for calculation
        salary_data = {
            'basic_pay': float(bill.basic_pay),
            'hra': float(bill.hra),
            'da': float(bill.da),
            'ta': float(bill.ta),
            'special_allowance': float(bill.special_allowance),
            'pf': float(bill.pf),
            'professional_tax': float(bill.professional_tax),
            'tds_deducted': float(bill.tds_deducted),
            'metro': bill.is_metro,
        }
        
        # Calculate expected result
        expected = verify_calculation(salary_data, bill.regime)
        
        # Compare with stored result
        print("\n📊 COMPARISON (Expected vs Stored in DB):")
        print("-" * 80)
        
        fields_to_compare = [
            ('Gross Monthly', 'gross_monthly'),
            ('Gross Annual', 'gross_annual'),
            ('Taxable Income', 'taxable_income'),
            ('Income Tax', 'income_tax'),
            ('Cess', 'cess'),
            ('Total Tax Annual', 'total_tax_annual'),
            ('Monthly TDS Required', 'monthly_tds_required'),
            ('TDS Deducted', 'tds_deducted'),
            ('Discrepancy', 'discrepancy'),
        ]
        
        all_match = True
        for label, field in fields_to_compare:
            expected_val = expected[field]
            stored_val = float(getattr(bill, field, 0))
            
            match = "✅" if abs(expected_val - stored_val) < 0.01 else "❌"
            if abs(expected_val - stored_val) >= 0.01:
                all_match = False
            
            print(f"{match} {label:30} | Expected: {format_currency(expected_val):15} | Stored: {format_currency(stored_val):15}")
        
        print("-" * 80)
        
        if all_match:
            print("\n✅ ALL VALUES MATCH! Calculation is correct.")
        else:
            print("\n⚠️  MISMATCH DETECTED! Check the values above.")
        
        print("\n" + "="*80 + "\n")
        
        return expected
        
    except SalaryBill.DoesNotExist:
        print(f"❌ Bill #{bill_id} not found in database!")
        return None

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) > 1:
        bill_id = int(sys.argv[1])
        verify_bill_from_db(bill_id)
    else:
        # Show all bills
        print("\n" + "="*80)
        print("AVAILABLE BILLS FOR VERIFICATION")
        print("="*80 + "\n")
        
        bills = SalaryBill.objects.all().order_by('-id')
        if bills.exists():
            for bill in bills[:10]:  # Show last 10
                print(f"📄 Bill #{bill.id} | {bill.employee.get_full_name()} | " \
                      f"{bill.month} {bill.year} | {bill.regime.upper()} | " \
                      f"TDS: {format_currency(bill.tds_deducted)}")
            
            print("\n💡 To verify a specific bill, run:")
            print(f"   python verify_tax_calculation.py <bill_id>")
            print(f"\n   Example: python verify_tax_calculation.py {bills.first().id}\n")
        else:
            print("No bills found in database!")
        
        print("="*80 + "\n")

