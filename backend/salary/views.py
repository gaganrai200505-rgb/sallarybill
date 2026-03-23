from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone
from .models import SalaryBill, ReimbursementClaim
from .serializers import (SalaryBillSerializer, SalaryBillCreateSerializer,
                           ReimbursementClaimSerializer)
from .tax_engine import calculate_full_tax
import pytesseract
from PIL import Image, ImageEnhance, ImageFilter, ImageOps
import io
import os
import fitz  # PyMuPDF for PDF processing
import logging
import platform

# Configure pytesseract path for Tesseract OCR
if platform.system() == 'Windows':
    os.environ['PATH'] += r';C:\Program Files\Tesseract-OCR'
    pytesseract.pytesseract.pytesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

logger = logging.getLogger(__name__)


def preprocess_image_for_ocr(image):
    """
    Preprocess image to improve OCR accuracy using PIL.
    Optimized for salary documents and scanned PDFs.
    """
    try:
        # Ensure image is in RGB
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # First upscale if image is too small
        width, height = image.size
        if width < 400 or height < 300:
            scale = max(400 / width, 300 / height)
            new_width = int(width * scale)
            new_height = int(height * scale)
            image = image.resize((new_width, new_height), Image.LANCZOS)
            logger.info(f"Upscaled image from {width}x{height} to {new_width}x{new_height}")
        
        # Convert to grayscale
        gray = image.convert('L')
        
        # Apply bilateral filter to reduce noise while keeping edges
        # Using PIL's filter approximation
        gray = gray.filter(ImageFilter.MedianFilter(size=3))
        
        # Enhance contrast for better text visibility
        enhancer = ImageEnhance.Contrast(gray)
        gray = enhancer.enhance(1.8)
        
        # Enhance sharpness slightly
        enhancer = ImageEnhance.Sharpness(gray)
        gray = enhancer.enhance(1.2)
        
        # Mild brightness adjustment for dark documents
        enhancer = ImageEnhance.Brightness(gray)
        gray = enhancer.enhance(1.0)
        
        # Use autocontrast for better text extraction
        gray = ImageOps.autocontrast(gray, cutoff=5)
        
        logger.debug(f"Preprocessing complete: {width}x{height} -> {gray.size}")
        return gray
    except Exception as e:
        logger.warning(f"Image preprocessing failed: {e}")
        return image


class UploadSalaryBillView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SalaryBillCreateSerializer(data=request.data)
        if serializer.is_valid():
            bill = serializer.save(employee=request.user)
            ocr_success = False
            ocr_message = "Manual entry"

            # Run OCR if file uploaded
            if bill.bill_file:
                try:
                    file_path = bill.bill_file.path
                    text = ""
                    
                    # Handle PDF files
                    if file_path.lower().endswith('.pdf'):
                        try:
                            # Use PyMuPDF for PDF processing (no Poppler required)
                            pdf_document = fitz.open(file_path)
                            text = ""
                            
                            # Try to extract from first few pages
                            for page_idx in range(min(3, len(pdf_document))):
                                page = pdf_document[page_idx]
                                
                                # Render page to image
                                pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2x zoom for better OCR
                                img_data = pix.tobytes("ppm")
                                img = Image.open(io.BytesIO(img_data))
                                
                                processed_img = preprocess_image_for_ocr(img)
                                
                                # Try PSM 11 first, then PSM 6
                                for psm in [11, 6, 3]:
                                    custom_config = f'--oem 3 --psm {psm} -l eng'
                                    page_text = pytesseract.image_to_string(processed_img, config=custom_config)
                                    page_text = page_text.strip()
                                    
                                    if page_text and len(page_text) > 10:
                                        text = page_text
                                        logger.info(f"PDF page {page_idx} PSM {psm}: {len(text)} chars extracted")
                                        break
                                
                                if text:
                                    break
                            
                            pdf_document.close()
                            ocr_message = f"Extracted from PDF ({len(pdf_document)} pages)" if text else "No text detected"
                            logger.info(f"PDF final result: {len(text)} chars extracted")
                        except Exception as pdf_err:
                            logger.error(f"PDF conversion failed: {pdf_err}", exc_info=True)
                            ocr_message = "PDF extraction unavailable"
                    else:
                        # Handle image files
                        try:
                            img = Image.open(file_path)
                            processed_img = preprocess_image_for_ocr(img)
                            
                            # Try PSM 11 first, then PSM 6
                            text = ""
                            for psm in [11, 6, 3]:
                                custom_config = f'--oem 3 --psm {psm} -l eng'
                                page_text = pytesseract.image_to_string(processed_img, config=custom_config)
                                page_text = page_text.strip()
                                
                                if page_text and len(page_text) > 10:
                                    text = page_text
                                    logger.info(f"Image PSM {psm}: {len(text)} chars")
                                    break
                            
                            ocr_message = "Extracted from image" if text else "No text detected"
                            logger.info(f"Image final result: {len(text)} chars")
                        except Exception as img_err:
                            logger.error(f"Image OCR failed: {img_err}", exc_info=True)
                            ocr_message = "Image extraction unavailable"
                    
                    if text.strip():
                        bill.ocr_raw_text = text
                        ocr_success = True
                        logger.info(f"OCR successful - {len(text)} characters extracted")
                    else:
                        bill.ocr_raw_text = "No text found in document"
                        ocr_message = "No text detected in document"
                        logger.warning(f"OCR returned no text for file: {file_path}")
                        
                        # Save the image for debugging
                        try:
                            if file_path.lower().endswith('.pdf'):
                                debug_img = images[0] if images else None
                            else:
                                debug_img = img
                            
                            if debug_img:
                                debug_path = file_path.replace('.pdf', '_debug.png').replace('.', '_debug.')
                                if isinstance(debug_img, Image.Image):
                                    debug_img.save(debug_path)
                                logger.warning(f"Debug image saved to: {debug_path}")
                        except Exception as debug_err:
                            logger.warning(f"Failed to save debug image: {debug_err}")
                        
                except Exception as e:
                    logger.error(f"OCR processing error: {e}", exc_info=True)
                    bill.ocr_raw_text = f"OCR error: {str(e)}"
                    ocr_message = "Document processing failed"

            # Compute tax
            data = {
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
            result = calculate_full_tax(data, bill.regime)

            bill.gross_monthly = result['gross_monthly']
            bill.taxable_income = result['taxable_income']
            bill.monthly_tds_required = result['monthly_tds_required']
            bill.discrepancy = result['discrepancy']
            bill.tax_status = result['status']
            bill.save()

            return Response({
                'bill': SalaryBillSerializer(bill).data,
                'tax_result': result,
                'ocr': {
                    'success': ocr_success,
                    'message': ocr_message
                }
            }, status=201)
        return Response(serializer.errors, status=400)


class RecalculateTaxView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            bill = SalaryBill.objects.get(pk=pk, employee=request.user)
        except SalaryBill.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        regime = request.data.get('regime', bill.regime)
        data = {
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
        result = calculate_full_tax(data, regime)
        bill.regime = regime
        bill.gross_monthly = result['gross_monthly']
        bill.taxable_income = result['taxable_income']
        bill.monthly_tds_required = result['monthly_tds_required']
        bill.discrepancy = result['discrepancy']
        bill.tax_status = result['status']
        bill.save()

        return Response({'tax_result': result})


class MyBillsView(generics.ListAPIView):
    serializer_class = SalaryBillSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return SalaryBill.objects.filter(employee=self.request.user)


class BillDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = SalaryBillSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['manager', 'finance']:
            return SalaryBill.objects.all()
        return SalaryBill.objects.filter(employee=user)


class AllBillsView(generics.ListAPIView):
    serializer_class = SalaryBillSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['manager', 'finance']:
            return SalaryBill.objects.all()
        return SalaryBill.objects.filter(employee=user)


class ReviewBillView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role not in ['manager', 'finance']:
            return Response({'error': 'Unauthorized'}, status=403)
        try:
            bill = SalaryBill.objects.get(pk=pk)
        except SalaryBill.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        action = request.data.get('action')
        note = request.data.get('note', '')

        if action == 'approve':
            bill.status = 'approved'
        elif action == 'reject':
            bill.status = 'rejected'
        elif action == 'review':
            bill.status = 'under_review'
        else:
            return Response({'error': 'Invalid action'}, status=400)

        bill.reviewer = request.user
        bill.review_note = note
        bill.reviewed_at = timezone.now()
        bill.save()
        return Response(SalaryBillSerializer(bill).data)


class CreateClaimView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, bill_pk):
        try:
            bill = SalaryBill.objects.get(pk=bill_pk, employee=request.user)
        except SalaryBill.DoesNotExist:
            return Response({'error': 'Bill not found'}, status=404)

        if bill.tax_status != 'excess':
            return Response({'error': 'No excess TDS found — claim not applicable'}, status=400)

        if hasattr(bill, 'claim'):
            return Response({'error': 'Claim already exists for this bill'}, status=400)

        claim = ReimbursementClaim.objects.create(
            salary_bill=bill,
            employee=request.user,
            amount=abs(float(bill.discrepancy)),
            reason=request.data.get('reason', f'Excess TDS deducted for {bill.month} {bill.year}')
        )
        return Response(ReimbursementClaimSerializer(claim).data, status=201)


class MyClaimsView(generics.ListAPIView):
    serializer_class = ReimbursementClaimSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return ReimbursementClaim.objects.filter(employee=self.request.user)


class AllClaimsView(generics.ListAPIView):
    serializer_class = ReimbursementClaimSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role in ['manager', 'finance']:
            return ReimbursementClaim.objects.all()
        return ReimbursementClaim.objects.filter(employee=user)


class ActionClaimView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            claim = ReimbursementClaim.objects.get(pk=pk)
        except ReimbursementClaim.DoesNotExist:
            return Response({'error': 'Not found'}, status=404)

        user = self.request.user
        action = request.data.get('action')
        note = request.data.get('note', '')

        if user.role == 'manager' and action == 'approve':
            claim.status = 'manager_approved'
            claim.manager = user
            claim.manager_note = note
            claim.manager_actioned_at = timezone.now()
        elif user.role == 'finance' and action == 'approve':
            claim.status = 'finance_approved'
            claim.finance_note = note
            claim.finance_actioned_at = timezone.now()
        elif user.role == 'finance' and action == 'settle':
            claim.status = 'settled'
            claim.finance_actioned_at = timezone.now()
        elif action == 'reject':
            claim.status = 'rejected'
            if user.role == 'manager':
                claim.manager_note = note
                claim.manager_actioned_at = timezone.now()
            else:
                claim.finance_note = note
                claim.finance_actioned_at = timezone.now()
        else:
            return Response({'error': 'Invalid action or permission'}, status=400)

        claim.save()
        return Response(ReimbursementClaimSerializer(claim).data)


class DashboardStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.role in ['manager', 'finance']:
            bills = SalaryBill.objects.all()
            claims = ReimbursementClaim.objects.all()
        else:
            bills = SalaryBill.objects.filter(employee=user)
            claims = ReimbursementClaim.objects.filter(employee=user)

        return Response({
            'total_bills': bills.count(),
            'pending_bills': bills.filter(status='pending').count(),
            'approved_bills': bills.filter(status='approved').count(),
            'total_claims': claims.count(),
            'pending_claims': claims.filter(status='pending').count(),
            'settled_claims': claims.filter(status='settled').count(),
            'total_discrepancy': sum(abs(float(b.discrepancy or 0)) for b in bills if b.tax_status == 'excess'),
        })
