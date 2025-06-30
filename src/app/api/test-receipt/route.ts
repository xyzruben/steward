import { NextResponse } from 'next/server'

export async function GET() {
  // Create a simple HTML receipt that can be converted to image
  const receiptHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: monospace; padding: 20px; background: white; }
        .receipt { max-width: 300px; border: 1px solid #ccc; padding: 15px; }
        .header { text-align: center; font-weight: bold; margin-bottom: 15px; }
        .item { display: flex; justify-content: space-between; margin: 5px 0; }
        .total { border-top: 1px solid #ccc; margin-top: 10px; padding-top: 10px; font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="receipt">
        <div class="header">STEWARD TEST STORE</div>
        <div>123 Main Street</div>
        <div>Test City, TC 12345</div>
        <div>Tel: (555) 123-4567</div>
        <div style="margin: 10px 0;">Date: ${new Date().toLocaleDateString()}</div>
        <div style="margin: 10px 0;">Receipt #: TEST-001</div>
        <hr>
        <div class="item">
          <span>Test Item 1</span>
          <span>$12.99</span>
        </div>
        <div class="item">
          <span>Test Item 2</span>
          <span>$8.50</span>
        </div>
        <div class="item">
          <span>Test Item 3</span>
          <span>$15.75</span>
        </div>
        <hr>
        <div class="item">
          <span>Subtotal:</span>
          <span>$37.24</span>
        </div>
        <div class="item">
          <span>Tax:</span>
          <span>$2.98</span>
        </div>
        <div class="total">
          <span>TOTAL:</span>
          <span>$40.22</span>
        </div>
        <div style="margin-top: 15px; text-align: center;">
          Thank you for your purchase!
        </div>
      </div>
    </body>
    </html>
  `

  return new NextResponse(receiptHtml, {
    headers: {
      'Content-Type': 'text/html',
    },
  })
} 