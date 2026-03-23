import pytesseract
from PIL import Image, ImageDraw, ImageEnhance
import os
import sys

# Add Tesseract to PATH
os.environ['PATH'] += r';C:\Program Files\Tesseract-OCR'

# Configure Tesseract
pytesseract.pytesseract.pytesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# Create a test image with text
img = Image.new('RGB', (800, 300), color='white')
d = ImageDraw.Draw(img)

# Add test text
test_text = "Salary Information\nBasic Pay: 50000\nHRA: 10000\nDA: 5000\nTotal: 65000"
d.text((50, 50), test_text, fill='black')

# Save original test image
test_path = os.path.join('media', 'test_ocr_original.png')
os.makedirs(os.path.dirname(test_path), exist_ok=True)
img.save(test_path)
print(f"Test image saved to: {test_path}")

# Test OCR without preprocessing
print("\n1. Testing OCR without preprocessing:")
try:
    text1 = pytesseract.image_to_string(img, config=r'--oem 3 --psm 6')
    print(f"   Extracted: {repr(text1.strip())}")
    print(f"   Length: {len(text1.strip())} chars")
except Exception as e:
    print(f"   Error: {e}")

# Test OCR with preprocessing
print("\n2. Testing OCR with preprocessing:")
try:
    # Preprocess
    processed = img.convert('L')
    enhancer = ImageEnhance.Contrast(processed)
    processed = enhancer.enhance(1.5)
    enhancer = ImageEnhance.Brightness(processed)
    processed = enhancer.enhance(1.1)
    
    # Save preprocessed image
    processed.save(os.path.join('media', 'test_ocr_processed.png'))
    
    # Extract text
    text2 = pytesseract.image_to_string(processed, config=r'--oem 3 --psm 6')
    print(f"   Extracted: {repr(text2.strip())}")
    print(f"   Length: {len(text2.strip())} chars")
except Exception as e:
    print(f"   Error: {e}")

# Test with different PSM modes
print("\n3. Testing different PSM modes:")
for psm in [3, 4, 6, 11]:
    try:
        config = f'--oem 3 --psm {psm}'
        text = pytesseract.image_to_string(img, config=config)
        print(f"   PSM {psm}: {len(text.strip())} chars - {repr(text.strip()[:50])}")
    except Exception as e:
        print(f"   PSM {psm}: Error - {e}")

print("\n✓ Test complete!")

