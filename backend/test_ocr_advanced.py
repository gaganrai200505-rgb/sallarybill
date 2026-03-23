import pytesseract
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter
import os
import sys
import numpy as np

# Add Tesseract to PATH
os.environ['PATH'] += r';C:\Program Files\Tesseract-OCR'

# Configure Tesseract
pytesseract.pytesseract.pytesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

def simulate_scanned_document(img):
    """Simulate a scanned document by adding noise and degrading quality"""
    # Add noise
    img_array = np.array(img)
    noise = np.random.normal(0, 25, img_array.shape)
    img_array = np.clip(img_array + noise, 0, 255).astype(np.uint8)
    
    # Slight rotation
    img = Image.fromarray(img_array)
    img = img.rotate(1, expand=False, fillcolor='white')
    
    return img

# Create test images with varying quality
test_cases = []

# Case 1: Clear text
print("Creating Test Case 1: Clear text...")
img = Image.new('RGB', (800, 400), color='white')
d = ImageDraw.Draw(img)
d.text((50, 50), "SALARY SLIP\n\nBasic Pay: 50000\nHRA: 10000\nDA: 5000\nTotal Gross: 65000", fill='black')
test_cases.append(("clear_text", img))

# Case 2: Small text
print("Creating Test Case 2: Small text...")
img = Image.new('RGB', (800, 400), color='white') 
d = ImageDraw.Draw(img)
d.text((50, 50), "SALARY SLIP\nBasic Pay: 50000\nHRA: 10000\nDA: 5000", fill='black')
img = img.crop((0, 0, 400, 200))  # Smaller
test_cases.append(("small_text", img))

# Case 3: Simulated scan
print("Creating Test Case 3: Simulated scanned document...")
img = Image.new('RGB', (800, 400), color='white')
d = ImageDraw.Draw(img)
d.text((50, 50), "SALARY SLIP\nBasic Pay: 50000\nHRA: 10000\nDA: 5000", fill='black')
img = simulate_scanned_document(img)
test_cases.append(("scanned_document", img))

# Test each case
for name, img in test_cases:
    print(f"\n{'='*60}")
    print(f"Testing: {name}")
    print('='*60)
    
    # Save test image
    test_path = os.path.join('media', f'test_{name}.png')
    os.makedirs(os.path.dirname(test_path), exist_ok=True)
    img.save(test_path)
    print(f"Saved: {test_path}")
    
    # Preprocess
    processed = img.convert('L')
    enhancer = ImageEnhance.Contrast(processed)
    processed = enhancer.enhance(1.5)
    enhancer = ImageEnhance.Brightness(processed)
    processed = enhancer.enhance(1.1)
    
    # Save preprocessed
    processed.save(os.path.join('media', f'test_{name}_preprocessed.png'))
    
    # Test different PSM modes
    best_text = ""
    best_psm = 0
    for psm in [3, 4, 6, 11]:
        try:
            config = f'--oem 3 --psm {psm}'
            text = pytesseract.image_to_string(processed, config=config)
            text = text.strip()
            
            if len(text) > len(best_text):
                best_text = text
                best_psm = psm
                
            print(f"  PSM {psm}: {len(text):3d} chars - {repr(text[:40])}")
        except Exception as e:
            print(f"  PSM {psm}: Error - {e}")
    
    print(f"\n  ✓ Best result (PSM {best_psm}): {len(best_text)} chars")
    if best_text:
        print(f"    Text: {best_text[:80]}...")

print("\n" + "="*60)
print("✓ All tests complete!")
print("="*60)
