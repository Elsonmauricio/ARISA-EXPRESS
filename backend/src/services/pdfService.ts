// backend/src/services/pdfService.ts
import PDFDocument from 'pdfkit';

export async function generatePDF(data: any[]): Promise<Buffer> {
  return new Promise((resolve) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    
    doc.fontSize(20).text('Arisa Express - Relatório', { align: 'center' });
    doc.moveDown();
    
    data.forEach((item, index) => {
      doc.fontSize(10).text(`${index + 1}. ${item.trackingCode} - ${item.status}`);
    });
    
    doc.end();
  });
}