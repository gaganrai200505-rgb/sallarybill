#!/usr/bin/env python3
"""Generate a sample salary slip PDF with embedded text for fast extraction."""

from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from datetime import datetime

# Create PDF
pdf_path = "Sample_Salary_Slip.pdf"
doc = SimpleDocTemplate(pdf_path, pagesize=letter, topMargin=0.5*inch, bottomMargin=0.5*inch)
story = []
styles = getSampleStyleSheet()

# Title
title_style = ParagraphStyle(
    'CustomTitle',
    parent=styles['Heading1'],
    fontSize=16,
    textColor=colors.black,
    spaceAfter=12,
    alignment=1  # Center
)
story.append(Paragraph("TECHVISION SYSTEMS PVT. LTD.", title_style))
story.append(Paragraph("SALARY SLIP - March 2026", title_style))
story.append(Spacer(1, 0.2*inch))

# Employee Info
info_data = [
    ["Employee Name:", "John Doe", "Employee ID:", "EMP001"],
    ["Department:", "Software Engineering", "Designation:", "Senior Engineer"],
    ["PAN:", "AAAPD5055K", "Month:", "March 2026"],
]
info_table = Table(info_data, colWidths=[1.5*inch, 2*inch, 1.5*inch, 2*inch])
info_table.setStyle(TableStyle([
    ('FONT', (0, 0), (-1, -1), 'Helvetica', 10),
    ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
]))
story.append(info_table)
story.append(Spacer(1, 0.2*inch))

# Salary Details
earnings_data = [
    ["EARNINGS", "", "DEDUCTIONS", ""],
    ["Basic Pay", "50000", "Provident Fund PF", "6000"],
    ["House Rent Allowance HRA", "22000", "Professional Tax", "250"],
    ["Dearness Allowance DA", "5000", "Income Tax TDS", "4500"],
    ["Travel Allowance TA", "2500", "", ""],
    ["Special Allowance", "0", "", ""],
]

salary_table = Table(earnings_data, colWidths=[2.5*inch, 1.2*inch, 2.5*inch, 1.2*inch])
salary_table.setStyle(TableStyle([
    ('FONT', (0, 0), (-1, -1), 'Helvetica', 10),
    ('FONT', (0, 0), (-1, 0), 'Helvetica-Bold', 11),
    ('BACKGROUND', (0, 0), (-1, 0), colors.lightgrey),
    ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
    ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
    ('PADDING', (0, 0), (-1, -1), 8),
]))
story.append(salary_table)
story.append(Spacer(1, 0.15*inch))

# Summary
summary_data = [
    ["Total Earnings", "79500", "Total Deductions", "10750"],
    ["", "", "Net Pay Take Home", "68750"],
]
summary_table = Table(summary_data, colWidths=[2.5*inch, 1.2*inch, 2.5*inch, 1.2*inch])
summary_table.setStyle(TableStyle([
    ('FONT', (0, 0), (-1, -1), 'Helvetica-Bold', 10),
    ('BACKGROUND', (0, 0), (-1, -1), colors.lightgrey),
    ('GRID', (0, 0), (-1, -1), 1, colors.black),
    ('ALIGN', (1, 0), (1, -1), 'RIGHT'),
    ('ALIGN', (3, 0), (3, -1), 'RIGHT'),
    ('PADDING', (0, 0), (-1, -1), 8),
]))
story.append(summary_table)

# Build PDF
doc.build(story)
print(f"✓ Sample salary slip PDF generated: {pdf_path}")
