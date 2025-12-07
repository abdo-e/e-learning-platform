const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

/**
 * Generate a certificate PDF for course completion
 * @param {string} userName - Name of the user
 * @param {string} courseTitle - Title of the course
 * @param {Date} completionDate - Date of completion
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generateCertificate(userName, courseTitle, completionDate) {
    return new Promise((resolve, reject) => {
        try {
            // Create a new PDF document
            const doc = new PDFDocument({
                size: 'A4',
                layout: 'landscape',
                margins: { top: 50, bottom: 50, left: 50, right: 50 }
            });

            // Buffer to store PDF
            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfBuffer = Buffer.concat(buffers);
                resolve(pdfBuffer);
            });
            doc.on('error', reject);

            // Certificate design
            const pageWidth = doc.page.width;
            const pageHeight = doc.page.height;

            // Border
            doc.lineWidth(10);
            doc.strokeColor('#4F46E5'); // Primary color
            doc.rect(30, 30, pageWidth - 60, pageHeight - 60).stroke();

            doc.lineWidth(3);
            doc.strokeColor('#EC4899'); // Accent color
            doc.rect(40, 40, pageWidth - 80, pageHeight - 80).stroke();

            // Header
            doc.fontSize(48)
                .fillColor('#4F46E5')
                .font('Helvetica-Bold')
                .text('CERTIFICATE', 0, 100, {
                    align: 'center',
                    width: pageWidth
                });

            doc.fontSize(24)
                .fillColor('#6B7280')
                .font('Helvetica')
                .text('OF COMPLETION', 0, 160, {
                    align: 'center',
                    width: pageWidth
                });

            // Decorative line
            doc.moveTo(pageWidth / 2 - 100, 200)
                .lineTo(pageWidth / 2 + 100, 200)
                .strokeColor('#EC4899')
                .lineWidth(2)
                .stroke();

            // Main content
            doc.fontSize(16)
                .fillColor('#374151')
                .font('Helvetica')
                .text('This is to certify that', 0, 240, {
                    align: 'center',
                    width: pageWidth
                });

            doc.fontSize(36)
                .fillColor('#1F2937')
                .font('Helvetica-Bold')
                .text(userName, 0, 280, {
                    align: 'center',
                    width: pageWidth
                });

            doc.fontSize(16)
                .fillColor('#374151')
                .font('Helvetica')
                .text('has successfully completed the course', 0, 340, {
                    align: 'center',
                    width: pageWidth
                });

            doc.fontSize(28)
                .fillColor('#4F46E5')
                .font('Helvetica-Bold')
                .text(courseTitle, 0, 380, {
                    align: 'center',
                    width: pageWidth
                });

            // Date
            const formattedDate = new Date(completionDate).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            doc.fontSize(14)
                .fillColor('#6B7280')
                .font('Helvetica')
                .text(`Completed on ${formattedDate}`, 0, 450, {
                    align: 'center',
                    width: pageWidth
                });

            // Footer
            doc.fontSize(12)
                .fillColor('#9CA3AF')
                .font('Helvetica-Oblique')
                .text('Coficab E-Learning Platform', 0, pageHeight - 80, {
                    align: 'center',
                    width: pageWidth
                });

            // Signature line
            const signatureY = pageHeight - 140;
            doc.moveTo(pageWidth / 2 - 150, signatureY)
                .lineTo(pageWidth / 2 + 150, signatureY)
                .strokeColor('#D1D5DB')
                .lineWidth(1)
                .stroke();

            doc.fontSize(10)
                .fillColor('#6B7280')
                .font('Helvetica')
                .text('Authorized Signature', 0, signatureY + 10, {
                    align: 'center',
                    width: pageWidth
                });

            // Finalize PDF
            doc.end();

        } catch (error) {
            reject(error);
        }
    });
}

module.exports = { generateCertificate };
