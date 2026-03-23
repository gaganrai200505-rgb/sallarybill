from django.db import models
from accounts.models import User


class SalaryBill(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending Review'),
        ('under_review', 'Under Review'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    ]

    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='salary_bills')
    month = models.CharField(max_length=20)
    year = models.IntegerField()
    bill_file = models.FileField(upload_to='salary_bills/', null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Earnings
    basic_pay = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    hra = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    da = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    ta = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    special_allowance = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    # Deductions
    pf = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    professional_tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tds_deducted = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    is_metro = models.BooleanField(default=True)
    ocr_raw_text = models.TextField(blank=True)

    # Computed fields (stored after calculation)
    regime = models.CharField(max_length=10, default='new')
    gross_monthly = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    taxable_income = models.DecimalField(max_digits=12, decimal_places=2, null=True)
    monthly_tds_required = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    discrepancy = models.DecimalField(max_digits=10, decimal_places=2, null=True)
    tax_status = models.CharField(max_length=10, blank=True)

    reviewer = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='reviewed_bills'
    )
    review_note = models.TextField(blank=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-uploaded_at']

    def __str__(self):
        return f"{self.employee.get_full_name()} - {self.month}/{self.year}"


class ReimbursementClaim(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('manager_approved', 'Manager Approved'),
        ('finance_approved', 'Finance Approved'),
        ('rejected', 'Rejected'),
        ('settled', 'Settled'),
    ]

    salary_bill = models.OneToOneField(SalaryBill, on_delete=models.CASCADE, related_name='claim')
    employee = models.ForeignKey(User, on_delete=models.CASCADE, related_name='claims')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    reason = models.TextField()
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    manager = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True,
        related_name='managed_claims'
    )
    manager_note = models.TextField(blank=True)
    manager_actioned_at = models.DateTimeField(null=True, blank=True)

    finance_note = models.TextField(blank=True)
    finance_actioned_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Claim by {self.employee.get_full_name()} - ₹{self.amount}"
