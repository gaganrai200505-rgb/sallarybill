"""
Django management command to verify bill calculations
Usage: python manage.py verify_bill <bill_id>
"""

from django.core.management.base import BaseCommand
from salary.models import SalaryBill
from salary.tax_engine import calculate_full_tax

def format_currency(amount):
    """Format as Indian currency"""
    return f"₹ {amount:,.2f}"

class Command(BaseCommand):
    help = 'Verify tax calculations for a specific bill'

    def add_arguments(self, parser):
        parser.add_argument('bill_id', type=int, help='Bill ID to verify')

    def handle(self, *args, **options):
        bill_id = options['bill_id']
        
        try:
            bill = SalaryBill.objects.get(id=bill_id)
            
            self.stdout.write(f"\n🔍 VERIFYING BILL #{bill_id}")
            self.stdout.write(f"Employee: {bill.employee.get_full_name()}")
            self.stdout.write(f"Month: {bill.month} {bill.year}")
            self.stdout.write(f"Regime: {bill.regime.upper()}")
            
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
            
            # Display input
            self.stdout.write(self.style.SUCCESS("\n📋 INPUT DATA:"))
            self.stdout.write(f"  Basic Pay:          {format_currency(salary_data['basic_pay'])}")
            self.stdout.write(f"  HRA:                {format_currency(salary_data['hra'])}")
            self.stdout.write(f"  DA:                 {format_currency(salary_data['da'])}")
            self.stdout.write(f"  TA:                 {format_currency(salary_data['ta'])}")
            self.stdout.write(f"  Special Allowance:  {format_currency(salary_data['special_allowance'])}")
            self.stdout.write(f"  PF Deducted:        {format_currency(salary_data['pf'])}")
            self.stdout.write(f"  Professional Tax:   {format_currency(salary_data['professional_tax'])}")
            self.stdout.write(f"  TDS Deducted:       {format_currency(salary_data['tds_deducted'])}")
            self.stdout.write(f"  Metro:              {'Yes' if salary_data['metro'] else 'No'}")
            
            # Calculate
            expected = calculate_full_tax(salary_data, bill.regime)
            
            # Display calculations
            self.stdout.write(self.style.SUCCESS("\n📊 CALCULATIONS:"))
            self.stdout.write(f"  Gross Monthly:      {format_currency(expected['gross_monthly'])}")
            self.stdout.write(f"  Gross Annual:       {format_currency(expected['gross_annual'])}")
            self.stdout.write(f"  Taxable Income:     {format_currency(expected['taxable_income'])}")
            self.stdout.write(f"  Income Tax:         {format_currency(expected['income_tax'])}")
            self.stdout.write(f"  Cess (4%):          {format_currency(expected['cess'])}")
            self.stdout.write(f"  Total Tax Annual:   {format_currency(expected['total_tax_annual'])}")
            
            # TDS comparison - MOST IMPORTANT
            self.stdout.write(self.style.SUCCESS("\n💰 TDS COMPARISON (What matters):"))
            
            monthly_tds = expected['monthly_tds_required']
            stored_tds = float(bill.monthly_tds_required)
            match_tds = abs(monthly_tds - stored_tds) < 0.01
            
            discrepancy = expected['discrepancy']
            stored_discrepancy = float(bill.discrepancy)
            match_disc = abs(discrepancy - stored_discrepancy) < 0.01
            
            status_symbol_tds = "✅" if match_tds else "❌"
            status_symbol_disc = "✅" if match_disc else "❌"
            
            self.stdout.write(f"{status_symbol_tds} Monthly TDS Required: {format_currency(monthly_tds)} (Stored: {format_currency(stored_tds)})")
            self.stdout.write(f"{status_symbol_disc} Discrepancy:          {format_currency(discrepancy)} (Stored: {format_currency(stored_discrepancy)})")
            self.stdout.write(f"   Status: {expected['status_label']}")
            
            self.stdout.write("\n" + "="*80)
            
            if match_tds and match_disc:
                self.stdout.write(self.style.SUCCESS("✅ VERIFICATION PASSED! Calculations are accurate."))
            else:
                self.stdout.write(self.style.ERROR("⚠️  VERIFICATION FAILED! Check values above."))
            
            self.stdout.write("="*80 + "\n")
            
        except SalaryBill.DoesNotExist:
            self.stdout.write(self.style.ERROR(f"❌ Bill #{bill_id} not found!"))
