// Enhanced File Upload Security Service
// Addresses: Weak File Upload Security vulnerability from security audit
// Implements comprehensive file validation beyond MIME type checking

// File type signatures (magic bytes) for secure file validation
const FILE_SIGNATURES = {
  // JPEG signatures
  'image/jpeg': [
    [0xFF, 0xD8, 0xFF, 0xE0], // JPEG JFIF
    [0xFF, 0xD8, 0xFF, 0xE1], // JPEG Exif
    [0xFF, 0xD8, 0xFF, 0xE2], // JPEG
    [0xFF, 0xD8, 0xFF, 0xE3], // JPEG
    [0xFF, 0xD8, 0xFF, 0xE8], // JPEG
    [0xFF, 0xD8, 0xFF, 0xDB], // JPEG raw
  ],
  // PNG signature
  'image/png': [
    [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
  ],
  // GIF signatures
  'image/gif': [
    [0x47, 0x49, 0x46, 0x38, 0x37, 0x61], // GIF87a
    [0x47, 0x49, 0x46, 0x38, 0x39, 0x61]  // GIF89a
  ],
  // WebP signature
  'image/webp': [
    [0x52, 0x49, 0x46, 0x46, undefined, undefined, undefined, undefined, 0x57, 0x45, 0x42, 0x50] // RIFF????WEBP
  ]
} as const

interface FileValidationResult {
  isValid: boolean
  detectedMimeType?: string
  errors: string[]
  securityWarnings: string[]
}

export interface FileUploadSecurityConfig {
  maxSize: number
  allowedMimeTypes: string[]
  allowedExtensions: string[]
  enableSignatureValidation: boolean
  enableMalwareScanning?: boolean
  enableMetadataStripping?: boolean
}

export class FileUploadSecurity {
  public readonly config: FileUploadSecurityConfig

  constructor(config: FileUploadSecurityConfig) {
    this.config = config
  }

  /**
   * Comprehensive file validation including signature verification
   */
  async validateFile(file: File, buffer: Buffer): Promise<FileValidationResult> {
    const result: FileValidationResult = {
      isValid: true,
      errors: [],
      securityWarnings: []
    }

    try {
      // 1. Basic validations
      this.validateBasicFileProperties(file, result)
      
      // 2. File signature validation (magic bytes)
      if (this.config.enableSignatureValidation) {
        this.validateFileSignature(buffer, file.type, result)
      }
      
      // 3. File extension validation
      this.validateFileExtension(file.name, result)
      
      // 4. Content analysis for suspicious patterns
      this.analyzeFileContent(buffer, result)
      
      // 5. Metadata analysis
      if (this.config.enableMetadataStripping) {
        await this.analyzeMetadata(buffer, result)
      }
      
      // 6. Size validation
      this.validateFileSize(file.size, result)
      
      // Set final validity
      result.isValid = result.errors.length === 0

    } catch (error) {
      result.isValid = false
      result.errors.push(`File validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return result
  }

  /**
   * Validate basic file properties
   */
  private validateBasicFileProperties(file: File, result: FileValidationResult): void {
    // Check if file exists
    if (!file || file.size === 0) {
      result.errors.push('Empty file provided')
      return
    }

    // Check MIME type against allowlist
    if (!this.config.allowedMimeTypes.includes(file.type)) {
      result.errors.push(`MIME type '${file.type}' not allowed`)
    }

    // Check for suspicious file names
    if (this.containsSuspiciousPatterns(file.name)) {
      result.securityWarnings.push('File name contains suspicious patterns')
    }
  }

  /**
   * Validate file signature (magic bytes) to prevent MIME type spoofing
   */
  private validateFileSignature(buffer: Buffer, declaredMimeType: string, result: FileValidationResult): void {
    const signatures = FILE_SIGNATURES[declaredMimeType as keyof typeof FILE_SIGNATURES]
    
    if (!signatures) {
      result.securityWarnings.push(`No signature validation available for MIME type: ${declaredMimeType}`)
      return
    }

    // Check if buffer matches any of the signatures
    const isValidSignature = signatures.some(signature => 
      this.bufferMatchesSignature(buffer, signature)
    )

    if (!isValidSignature) {
      result.errors.push(`File signature doesn't match declared MIME type '${declaredMimeType}'`)
      
      // Try to detect actual file type
      const detectedType = this.detectFileType(buffer)
      if (detectedType && detectedType !== declaredMimeType) {
        result.detectedMimeType = detectedType
        result.errors.push(`Detected file type '${detectedType}' differs from declared '${declaredMimeType}'`)
      }
    }
  }

  /**
   * Check if buffer matches a file signature
   */
  private bufferMatchesSignature(buffer: Buffer, signature: readonly (number | undefined)[]): boolean {
    if (buffer.length < signature.length) {
      return false
    }

    return signature.every((byte, index) => {
      // undefined in signature means "any byte"
      return byte === undefined || buffer[index] === byte
    })
  }

  /**
   * Detect file type from buffer content
   */
  private detectFileType(buffer: Buffer): string | null {
    for (const [mimeType, signatures] of Object.entries(FILE_SIGNATURES)) {
      if (signatures.some(sig => this.bufferMatchesSignature(buffer, sig))) {
        return mimeType
      }
    }
    return null
  }

  /**
   * Validate file extension
   */
  private validateFileExtension(fileName: string, result: FileValidationResult): void {
    const extension = fileName.toLowerCase().split('.').pop()
    
    if (!extension) {
      result.errors.push('File has no extension')
      return
    }

    if (!this.config.allowedExtensions.includes(extension)) {
      result.errors.push(`File extension '.${extension}' not allowed`)
    }

    // Check for double extensions (potential security risk)
    const parts = fileName.toLowerCase().split('.')
    if (parts.length > 2) {
      result.securityWarnings.push('File has multiple extensions')
    }
  }

  /**
   * Analyze file content for suspicious patterns
   */
  private analyzeFileContent(buffer: Buffer, result: FileValidationResult): void {
    const content = buffer.toString('ascii', 0, Math.min(buffer.length, 1024)) // First 1KB
    
    // Check for executable patterns
    const executablePatterns = [
      'MZ', // PE executable
      '\x7fELF', // ELF executable
      '#!/', // Shell script
      '<script', // JavaScript
      'javascript:', // JavaScript URL
      'vbscript:', // VBScript
      'data:text/html', // Data URL HTML
    ]

    executablePatterns.forEach(pattern => {
      if (content.includes(pattern)) {
        result.errors.push(`File contains executable pattern: ${pattern}`)
      }
    })

    // Check for suspicious metadata or comments
    const suspiciousPatterns = [
      '<?php', // PHP code
      '<%', // ASP code
      '<html', // HTML content
      '<!DOCTYPE html', // HTML document
    ]

    suspiciousPatterns.forEach(pattern => {
      if (content.includes(pattern)) {
        result.securityWarnings.push(`File contains suspicious content pattern: ${pattern}`)
      }
    })
  }

  /**
   * Check for suspicious file name patterns
   */
  private containsSuspiciousPatterns(fileName: string): boolean {
    const suspiciousPatterns = [
      /\.exe$/i,
      /\.bat$/i,
      /\.cmd$/i,
      /\.scr$/i,
      /\.com$/i,
      /\.pif$/i,
      /\.vbs$/i,
      /\.js$/i,
      /\.jar$/i,
      /\.php$/i,
      /\.asp$/i,
      /\.jsp$/i,
      /\.\./,  // Directory traversal
      /\x00/,  // Null bytes
    ]

    return suspiciousPatterns.some(pattern => pattern.test(fileName))
  }

  /**
   * Validate file size
   */
  private validateFileSize(size: number, result: FileValidationResult): void {
    if (size > this.config.maxSize) {
      result.errors.push(`File size ${size} bytes exceeds maximum allowed ${this.config.maxSize} bytes`)
    }

    if (size === 0) {
      result.errors.push('File is empty')
    }
  }

  /**
   * Analyze metadata (placeholder for future implementation)
   */
  private async analyzeMetadata(buffer: Buffer, result: FileValidationResult): Promise<void> {
    // This could be implemented to check for:
    // - GPS coordinates in EXIF data
    // - Personal information in metadata
    // - Hidden data in image files
    result.securityWarnings.push('Metadata analysis not yet implemented')
  }

  /**
   * Placeholder for malware scanning integration
   */
  async scanForMalware(buffer: Buffer): Promise<{ isClean: boolean; threats: string[] }> {
    // This would integrate with a malware scanning service like:
    // - ClamAV
    // - VirusTotal API
    // - AWS GuardDuty
    // - Google Safe Browsing API
    
    console.warn('Malware scanning not implemented - would integrate with security service')
    
    return {
      isClean: true,
      threats: []
    }
  }
}

// Predefined security configurations
export const UPLOAD_SECURITY_CONFIGS = {
  RECEIPT_IMAGES: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as string[],
    allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp'] as string[],
    enableSignatureValidation: true,
    enableMalwareScanning: true,
    enableMetadataStripping: true
  }
}

// Convenience function to create a receipt image validator
export function createReceiptImageValidator(): FileUploadSecurity {
  return new FileUploadSecurity(UPLOAD_SECURITY_CONFIGS.RECEIPT_IMAGES)
}