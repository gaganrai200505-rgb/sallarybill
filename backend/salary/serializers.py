from rest_framework import serializers
from .models import SalaryBill, ReimbursementClaim
from accounts.serializers import UserSerializer


class SalaryBillSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()

    class Meta:
        model = SalaryBill
        fields = '__all__'
        read_only_fields = ['employee', 'uploaded_at', 'gross_monthly',
                            'taxable_income', 'monthly_tds_required',
                            'discrepancy', 'tax_status', 'ocr_raw_text']

    def get_employee_name(self, obj):
        return obj.employee.get_full_name()


class SalaryBillCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = SalaryBill
        fields = ['month', 'year', 'bill_file', 'basic_pay', 'hra', 'da', 'ta',
                  'special_allowance', 'pf', 'professional_tax', 'tds_deducted',
                  'is_metro', 'regime']


class ReimbursementClaimSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    bill_month = serializers.SerializerMethodField()

    class Meta:
        model = ReimbursementClaim
        fields = '__all__'
        read_only_fields = ['employee', 'created_at', 'updated_at']

    def get_employee_name(self, obj):
        return obj.employee.get_full_name()

    def get_bill_month(self, obj):
        return f"{obj.salary_bill.month} {obj.salary_bill.year}"
