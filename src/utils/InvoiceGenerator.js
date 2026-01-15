import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const InvoiceGenerator = {
    /**
     * Generates a PDF Invoice and returns it as a Data URI (base64 string)
     * @param {Object} transaction - { id, amount, date, description }
     * @param {Object} user - { name, email, address }
     */
    generate: (transaction, user) => {
        const doc = new jsPDF();

        // --- Branding ---
        // Logo (Simulated with text/shape for now, real implementation would use addImage)
        doc.setFillColor(37, 99, 235); // Blue
        doc.rect(0, 0, 210, 40, 'F');

        doc.setFontSize(24);
        doc.setTextColor(255, 255, 255);
        doc.text("CodeKrafts", 14, 25);

        doc.setFontSize(10);
        doc.text("Advertising Platform", 14, 32);

        // --- Invoice Header ---
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(20);
        doc.text("TAX INVOICE", 150, 60, null, 'right');

        doc.setFontSize(10);
        doc.text(`Invoice #: INV-${transaction.id ? transaction.id.slice(0, 8).toUpperCase() : 'DRAFT'}`, 150, 70, null, 'right');
        doc.text(`Date: ${new Date(transaction.date || Date.now()).toLocaleDateString()}`, 150, 75, null, 'right');

        // --- Billed To ---
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text("Billed To:", 14, 70);
        doc.setFont(undefined, 'normal');
        doc.setFontSize(10);

        doc.text(user.name || "Valued Advertiser", 14, 76);
        doc.text(user.email || "", 14, 81);
        if (user.address) doc.text(user.address, 14, 86);

        // --- Table ---
        doc.autoTable({
            startY: 100,
            head: [['Description', 'Qty', 'Unit Price', 'Amount']],
            body: [
                [
                    transaction.description || 'Ad Credits Replenishment',
                    '1',
                    `INR ${transaction.amount}`,
                    `INR ${transaction.amount}`
                ],
            ],
            theme: 'grid',
            headStyles: { fillColor: [37, 99, 235] },
            styles: { fontSize: 10, cellPadding: 5 }
        });

        // --- Total ---
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text(`Total Amount: INR ${transaction.amount}`, 190, finalY, null, 'right');

        // --- Footer ---
        doc.setFontSize(9);
        doc.setFont(undefined, 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text("Thank you for your business!", 105, 270, null, 'center');
        doc.text("This is an electronically generated invoice.", 105, 275, null, 'center');

        return doc;
    },

    /**
     * Returns a Data URI suitable for Email Attachment
     */
    getDataURI: (transaction, user) => {
        const doc = InvoiceGenerator.generate(transaction, user);
        return doc.output('datauristring');
    },

    /**
     * Triggers a browser download
     */
    download: (transaction, user) => {
        const doc = InvoiceGenerator.generate(transaction, user);
        doc.save(`Invoice_${transaction.id || 'Draft'}.pdf`);
    }
};
