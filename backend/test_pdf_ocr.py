import fitz
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageOps
import pytesseract
import os
import io

# Configure Tesseract
os.environ['PATH'] += r';C:\Program Files\Tesseract-OCR'
pytesseract.pytesseract.pytesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

print("Testing PyMuPDF PDF processing...")

# Create a test PDF with content using reportlab
try:
    from reportlab.lib.pagesizes import letter
    from reportlab.pdfgen import canvas
    
    pdf_path = os.path.join('media', 'test_salary.pdf')
    os.makedirs(os.path.dirname(pdf_path), exist_ok=True)
    
    # Create PDF
    c = canvas.Canvas(pdf_path, pagesize=letter)
    c.setFont("Helvetica", 12)
    c.drawString(50, 750, "SALARY SLIP")
    c.drawString(50, 700, "Employee Name: John Doe")
    c.drawString(50, 650, "Basic Pay: 50000")
    c.drawString(50, 600, "HRA: 10000")
    c.drawString(50, 550, "DA: 5000")
    c.drawString(50, 500, "Total Gross: 65000")
    c.save()
    
    print(f"✓ Test PDF created: {pdf_path}")
    
except Exception as e:
    print(f"✗ Failed to create PDF: {e}")
    exit(1)

# Now test PyMuPDF extraction
print("\nTesting PyMuPDF extraction...")
try:
    pdf_document = fitz.open(pdf_path)
    print(f"✓ PDF opened successfully ({len(pdf_document)} pages)")
    
    for page_idx in range(len(pdf_document)):
        page = pdf_document[page_idx]
        print(f"\n  Page {page_idx}:")
        
        # Render page to image
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        img_data = pix.tobytes("ppm")
        img = Image.open(io.BytesIO(img_data))
        print(f"    Image size: {img.size}")
        
        # Preprocess
        processed = img.convert('L')
        processed = processed.filter(ImageFilter.MedianFilter(size=3))
        enhancer = ImageEnhance.Contrast(processed)
        processed = enhancer.enhance(1.8)
        enhancer = ImageEnhance.Sharpness(processed)
        processed = enhancer.enhance(1.2)
        processed = ImageOps.autocontrast(processed, cutoff=5)
        
        # Test OCR
        for psm in [11, 6, 3]:
            config = f'--oem 3 --psm {psm} -l eng'
            text = pytesseract.image_to_string(processed, config=config).strip()
            if text and len(text) > 10:
                print(f"    ✓ PSM {psm}: {len(text)} chars extracted")
                print(f"      Text preview: {text[:60]}...")
                break
        else:
            print(f"    ✗ No text detected")
    
    pdf_document.close()
    print("\n✓ PDF processing complete!")
    
except Exception as e:
    print(f"\n✗ PDF processing error: {e}")
    import traceback
    traceback.print_exc()
