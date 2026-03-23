from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
import os

# Create output directory
output_dir = r'backend\media\salary_bills'
os.makedirs(output_dir, exist_ok=True)
pdf_path = os.path.join(output_dir, 'Sample_Slip_Perfect_Format.pdf')

doc = SimpleDocTemplate(pdf_path, pagesize=letter, rightMargin=0.5*inch, leftMargin=0.5*inch, topMargin=0.5*inch, bottomMargin=0.5*inch)
styles = getSampleStyleSheet()
story = []

# Custom styles
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=16,
    textColor=colors.HexColor('#1a1a1a'),
    spaceAfter=6,
    alignment=TA_CENTER,
    fontName='Helvetica-Bold'
)

heading_style = ParagraphStyle(
    'CustomHeading',
    parent=styles['Heading2'],
    fontSize=11,
    textColor=colors.HexColor('#333333'),
    spaceAfter=4,
    fontName='Helvetica-Bold'
)

normal_style = ParagraphStyle(
    'Normal',
    parent=styles['Normal'],
    fontSize=10,
    textColor=colors.HexColor('#000000'),
    spaceAfter=2,
)

# Company Header
story.append(Paragraph("TECHVISION SYSTEMS PVT. LTD.", title_style))
story.append(Paragraph("Bangalore, Karnataka - 560001", normal_style))
story.append(Spacer(1, 0.15*inch))

# Employee Info
employee_data = [
    ['Employee Name', 'Priya Sharma', 'Employee ID', 'EMP-5021'],
    ['Designation', 'Senior Software Engineer', 'Department', 'Engineering'],
    ['PAN', 'ABCPS5678K', 'Bank', 'HDFC Bank'],
    ['Month/Year', 'March 2026', 'Account No.', 'XXXX XXXX 7654'],
]

emp_table = Table(employee_data, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
emp_table.setStyle(TableStyle([
    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('BACKGROUND', (0, 0), (0, -1), colors.HexColor('#e8e8e8')),
    ('BACKGROUND', (2, 0), (2, -1), colors.HexColor('#e8e8e8')),
    ('PADDING', (0, 0), (-1, -1), 6),
]))
story.append(emp_table)
story.append(Spacer(1, 0.2*inch))

# Earnings and Deductions
story.append(Paragraph("SALARY DETAILS", heading_style))

earnings_data = [
    ['EARNINGS', 'Amount', 'DEDUCTIONS', 'Amount'],
    ['Basic Pay:', '50000', 'Provident Fund PF:', '6000'],
    ['House Rent Allowance HRA:', '22000', 'Professional Tax:', '250'],
    ['Dearness Allowance DA:', '5000', 'Income Tax TDS:', '4500'],
    ['Travel Allowance TA:', '2500', 'Health Insurance:', '800'],
    ['Special Allowance:', '5000', '', ''],
    ['Medical Allowance:', '1500', '', ''],
]

earnings_table = Table(earnings_data, colWidths=[2*inch, 1.2*inch, 2*inch, 1.2*inch])
earnings_table.setStyle(TableStyle([
    ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 10),
    ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
    ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#003366')),
    ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
    ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
    ('PADDING', (0, 0), (-1, -1), 8),
    ('FONTNAME', (0, 1), (0, -1), 'Helvetica'),
    ('FONTNAME', (2, 1), (2, -1), 'Helvetica'),
]))
story.append(earnings_table)
story.append(Spacer(1, 0.15*inch))

# Totals
totals_data = [
    ['Total Earnings', '86000', 'Total Deductions', '11550'],
    ['', '', 'Net Pay Take Home', '74450'],
]

totals_table = Table(totals_data, colWidths=[2*inch, 1.2*inch, 2*inch, 1.2*inch])
totals_table.setStyle(TableStyle([
    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
    ('FONTSIZE', (0, 0), (-1, -1), 11),
    ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
    ('BACKGROUND', (0, 0), (1, -1), colors.HexColor('#d4edda')),
    ('BACKGROUND', (2, 0), (3, -1), colors.HexColor('#d4edda')),
    ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
    ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
    ('PADDING', (0, 0), (-1, -1), 8),
]))
story.append(totals_table)
story.append(Spacer(1, 0.2*inch))

# Tax Summary
story.append(Paragraph("TAX COMPUTATION SUMMARY (FY 2025-26 | New Regime)", heading_style))

tax_data = [
    ['Annual Gross Salary', '1032000', 'Standard Deduction', '75000'],
    ['Taxable Income', '957000', 'Income Tax', '45400'],
    ['Cess 4 percent', '1816', 'Total Annual Tax', '47216'],
    ['Monthly TDS Required', '3935', 'TDS Deducted This Month', '4500'],
]

tax_table = Table(tax_data, colWidths=[2*inch, 1.2*inch, 2*inch, 1.2*inch])
tax_table.setStyle(TableStyle([
    ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
    ('FONTSIZE', (0, 0), (-1, -1), 9),
    ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
    ('PADDING', (0, 0), (-1, -1), 6),
    ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
    ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
]))
story.append(tax_table)
story.append(Spacer(1, 0.15*inch))

story.append(Paragraph("This is a computer-generated salary slip and does not require a signature.", normal_style))

# Build PDF
doc.build(story)
print(f"✓ Sample salary slip created successfully!")
print(f"  Location: {pdf_path}")
print(f"\n📊 PDF Contains (All 8 fields):")
print(f"  ✓ Basic Pay: 50,000.00")
print(f"  ✓ HRA: 22,000.00")
print(f"  ✓ DA: 5,000.00")
print(f"  ✓ TA: 2,500.00")
print(f"  ✓ Special Allowance: 5,000.00")
print(f"  ✓ PF: 6,000.00")
print(f"  ✓ Professional Tax: 250.00")
print(f"  ✓ TDS: 4,500.00")
