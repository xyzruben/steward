import vision from '@google-cloud/vision';

/**
 * Extracts text from image using Google Cloud Vision API
 * Handles both URL and base64 image formats for maximum compatibility
 * @see STEWARD_MASTER_SYSTEM_GUIDE.md - OCR Processing, Error Handling
 * @param imageUrl - URL of the image or base64 encoded image
 * @returns Extracted text from the image
 */
export async function extractTextFromImage(imageUrl: string): Promise<string> {
  // Log image type without exposing base64 data (see master guide: Secure Error Handling)
  if (imageUrl.startsWith('data:image/')) {
    console.log('Starting Google Vision API text detection for base64 encoded image');
  } else {
    console.log('Starting Google Vision API text detection for URL:', imageUrl);
  }
  
  try {
    let request: any;
    
    // Check if the URL is a base64 encoded image or a regular URL
    if (imageUrl.startsWith('data:image/')) {
      // Handle base64 encoded images (see master guide: File Processing)
      console.log('Processing base64 encoded image');
      request = {
        image: {
          content: imageUrl.split(',')[1] // Remove data:image/...;base64, prefix
        }
      };
    } else {
      // Handle regular URLs (see master guide: API Integration)
      console.log('Processing image from URL');
      request = {
        image: {
          source: {
            imageUri: imageUrl
          }
        }
      };
    }
    
    // Create the client inside the function for testability
    const client = new vision.ImageAnnotatorClient();
    // Call Google Vision API with appropriate request format
    const [result] = await client.textDetection(request);
    
    console.log('Google Vision API response received');
    console.log('Number of text annotations:', result.textAnnotations?.length || 0);
    
    const detections = result.textAnnotations;
    if (!detections || detections.length === 0) {
      console.log('No text annotations found in the response');
      
      // Log error details without the full result object (which contains base64 data)
      if (result.error) {
        console.log('Google Vision API error:', result.error);
        throw new Error(`Google Vision API error: ${result.error.message}`);
      }
      
      // Log a summary of the result without the full object
      console.log('Result summary:', {
        hasError: !!result.error,
        textAnnotationsCount: result.textAnnotations?.length || 0,
        faceAnnotationsCount: result.faceAnnotations?.length || 0,
        landmarkAnnotationsCount: result.landmarkAnnotations?.length || 0,
        logoAnnotationsCount: result.logoAnnotations?.length || 0,
        labelAnnotationsCount: result.labelAnnotations?.length || 0
      });
      
      throw new Error('No text detected in image');
    }
    
    // The first annotation is the full text
    const extractedText = detections[0].description || '';
    console.log('Extracted text length:', extractedText.length);
    console.log('First 200 characters of extracted text:', extractedText.substring(0, 200));
    
    return extractedText;
  } catch (error) {
    console.error('Google Vision API error:', error);
    throw error;
  }
}

/**
 * Converts image buffer to base64 for Google Vision API processing
 * Used when URL-based processing fails (e.g., with HEIC files)
 * @see STEWARD_MASTER_SYSTEM_GUIDE.md - File Processing, Error Handling
 * @param imageBuffer - Buffer containing image data
 * @param mimeType - MIME type of the image
 * @returns Base64 encoded image string
 */
export function imageBufferToBase64(imageBuffer: Buffer, mimeType: string): string {
  // Validate input parameters (see master guide: Input Validation)
  if (!imageBuffer || imageBuffer.length === 0) {
    throw new Error('Image buffer is empty or invalid');
  }
  
  // Ensure we have a valid MIME type for Google Vision API
  const validMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
  const normalizedMimeType = mimeType.toLowerCase().trim();
  
  if (!validMimeTypes.includes(normalizedMimeType)) {
    console.warn(`Invalid MIME type: ${mimeType}, defaulting to image/jpeg`);
    // Default to JPEG for better Google Vision API compatibility
    mimeType = 'image/jpeg';
  }
  
  // Convert buffer to base64
  const base64 = imageBuffer.toString('base64');
  
  // Validate base64 output
  if (!base64 || base64.length === 0) {
    throw new Error('Failed to convert image buffer to base64');
  }
  
  const dataUrl = `data:${mimeType};base64,${base64}`;
  console.log(`Created base64 data URL with MIME type: ${mimeType}, length: ${dataUrl.length} characters`);
  
  return dataUrl;
} 