// ============================================================================
// OCR SERVICE UNIT TESTS (see STEWARD_MASTER_SYSTEM_GUIDE.md - Testing and Quality Assurance)
// ============================================================================
// Tests for Google Cloud Vision OCR functionality

// Shared mock for textDetection
const textDetectionMock = jest.fn();

// Mock the Google Cloud Vision API directly, all instances share the same mock
jest.mock('@google-cloud/vision', () => ({
  ImageAnnotatorClient: jest.fn().mockImplementation(() => ({
    textDetection: textDetectionMock,
  })),
}))

// ============================================================================
// UNIT TESTS (see master guide: Unit Testing Strategy)
// ============================================================================

describe('OCR Service', () => {
  let extractTextFromImage: typeof import('../cloudOcr').extractTextFromImage;
  let imageBufferToBase64: typeof import('../cloudOcr').imageBufferToBase64;

  beforeEach(async () => {
    jest.resetModules();
    // Re-import after resetting modules so the mock is used
    const cloudOcr = await import('@/lib/services/cloudOcr');
    extractTextFromImage = cloudOcr.extractTextFromImage;
    imageBufferToBase64 = cloudOcr.imageBufferToBase64;
    textDetectionMock.mockReset();
  });

  describe('extractTextFromImage', () => {
    it('should extract text from a valid base64 image', async () => {
      // Arrange
      const mockBase64Image = 'data:image/jpeg;base64,mock-image-data'
      const mockOcrResponse = {
        textAnnotations: [
          {
            description: 'Welcome to Chick-fil-A\nTotal: $11.48',
          },
        ],
      }
      textDetectionMock.mockResolvedValue([mockOcrResponse])
      // Act
      const result = await extractTextFromImage(mockBase64Image)
      // Assert
      expect(result).toBe('Welcome to Chick-fil-A\nTotal: $11.48')
    })



    it('should throw error for invalid base64 image', async () => {
      // Arrange
      const invalidBase64Image = 'invalid-base64-data'
      textDetectionMock.mockRejectedValue(new Error('Bad image data'))
      // Act & Assert
      await expect(extractTextFromImage(invalidBase64Image)).rejects.toThrow('Bad image data')
    })

    it('should throw error if no text is detected in OCR response', async () => {
      // Arrange
      const mockBase64Image = 'data:image/jpeg;base64,mock-image-data';
      const mockOcrResponse = {
        textAnnotations: [],
      };
      textDetectionMock.mockResolvedValue([mockOcrResponse]);
      // Act & Assert
      await expect(extractTextFromImage(mockBase64Image)).rejects.toThrow('No text detected in image');
    });
  })

  describe('imageBufferToBase64', () => {
    it('should convert image buffer to base64 data URL', () => {
      // Arrange
      const mockBuffer = Buffer.from('mock-image-data')
      const mimeType = 'image/jpeg'
      // Act
      const result = imageBufferToBase64(mockBuffer, mimeType)
      // Assert
      expect(result).toMatch(/^data:image\/jpeg;base64,/)
      expect(result).toContain('bW9jay1pbWFnZS1kYXRh') // base64 of 'mock-image-data'
    })

    it('should handle different MIME types', () => {
      // Arrange
      const mockBuffer = Buffer.from('test-data')
      const pngMimeType = 'image/png'
      // Act
      const result = imageBufferToBase64(mockBuffer, pngMimeType)
      // Assert
      expect(result).toMatch(/^data:image\/png;base64,/)
    })
  })
}) 