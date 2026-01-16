import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const InvoiceGenerator = {
    generate: (transaction, user) => {
        // Initialize: 'pt' for points, 'a4' paper
        const doc = new jsPDF('p', 'pt', 'a4');

        // --- THEME CONFIGURATION ---
        const COLOR_INK = [30, 30, 30];       // Charcoal Black
        const COLOR_PAPER = [252, 250, 242];  // Cream/Off-White
        const COLOR_ACCENT = [139, 0, 0];     // Dark Red (Stamp)

        const FONT_SERIF = "times";           // Formal font
        const FONT_MONO = "courier";          // Data/Typewriter font

        // Company Details
        const COMPANY_NAME = "TRUVGO";
        const COMPANY_ADDRESS = "KHAMMAM, Telangana-507163";
        const COMPANY_EMAIL = "varshith@truvgo.me";
        const COMPANY_WEB = "https://codecommunitie.vercel.app/";

        // 1. Background & Border
        doc.setFillColor(...COLOR_PAPER);
        doc.rect(0, 0, 595.28, 841.89, 'F');

        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(1.5);
        doc.rect(20, 20, 555, 800); // Outer border
        doc.setLineWidth(0.5);
        doc.rect(24, 24, 547, 792); // Inner border

        // ---------------------------------------------------------
        // 2. Header (Clean - Name Only)
        // ---------------------------------------------------------
        let cursorY = 70;

        // Company Name
        doc.setTextColor(...COLOR_INK);
        doc.setFont(FONT_SERIF, "bold");
        doc.setFontSize(36);
        doc.text(COMPANY_NAME, 297, cursorY, { align: "center" });

        // Decorative Divider
        cursorY += 20;
        doc.setLineWidth(1.5);
        doc.line(40, cursorY, 555, cursorY); // Thick line across page

        // ---------------------------------------------------------
        // 3. Invoice Meta Data
        // ---------------------------------------------------------
        cursorY += 40;
        const leftColX = 50;
        const rightColX = 350;

        // --- LEFT: BILL TO ---
        doc.setFont(FONT_SERIF, "bold");
        doc.setFontSize(11);
        doc.text("BILLED TO:", leftColX, cursorY);

        doc.setFont(FONT_MONO, "normal");
        doc.setFontSize(10);
        const name = (user.name || "Valued Customer").toUpperCase();
        const email = (user.email || "").toLowerCase();

        doc.text(name, leftColX, cursorY + 15);
        doc.text(email, leftColX, cursorY + 27);

        if (user.address) doc.text(user.address, leftColX, cursorY + 39);
        if (user.gst) doc.text(`GST: ${user.gst}`, leftColX, cursorY + 51);

        // --- RIGHT: INVOICE DETAILS ---
        const dateObj = new Date(transaction.date || Date.now());
        const displayId = transaction.formattedId || `TRUVGO_${transaction.id || Date.now()}`;

        doc.setFont(FONT_SERIF, "bold");
        doc.setFontSize(11);
        doc.text("INVOICE DETAILS:", rightColX, cursorY);

        doc.setFont(FONT_MONO, "normal");
        doc.setFontSize(10);

        // Date
        doc.text(`DATE : ${dateObj.toLocaleDateString('en-GB')}`, rightColX, cursorY + 15);

        // Invoice Number (Wrapped to fix overflow)
        doc.text(`NO.  :`, rightColX, cursorY + 27);

        // Split text logic to keep ID inside the page
        const wrappedId = doc.splitTextToSize(displayId, 180);
        doc.text(wrappedId, rightColX + 45, cursorY + 27);

        // ---------------------------------------------------------
        // 4. Line Items Table
        // ---------------------------------------------------------
        const amount = parseFloat(transaction.amount).toFixed(2);

        doc.autoTable({
            startY: cursorY + 80, // Push down to clear address section
            margin: { left: 40, right: 40 },
            head: [['ITEM DESCRIPTION', 'QTY', 'PRICE', 'TOTAL']],
            body: [
                [
                    (transaction.description || 'Ad Credits Replenishment').toUpperCase(),
                    '1',
                    amount,
                    amount
                ]
            ],
            theme: 'plain',
            styles: {
                font: FONT_MONO,
                fontSize: 10,
                textColor: COLOR_INK,
                cellPadding: 8,
            },
            headStyles: {
                font: FONT_SERIF,
                fontStyle: 'bold',
                fontSize: 10,
                textColor: COLOR_INK,
                lineColor: COLOR_INK,
                lineWidth: { bottom: 1.5, top: 1.5 },
                halign: 'left'
            },
            columnStyles: {
                0: { cellWidth: 'auto' },
                1: { halign: 'center', cellWidth: 50 },
                2: { halign: 'right', cellWidth: 80 },
                3: { halign: 'right', cellWidth: 80 }
            },
            foot: [
                ['', '', 'SUBTOTAL', amount],
                ['', '', 'TAX (0%)', '0.00'],
                ['', '', 'GRAND TOTAL', `INR ${amount}`]
            ],
            footStyles: {
                font: FONT_MONO,
                fontStyle: 'bold',
                halign: 'right',
                textColor: COLOR_INK,
                lineColor: COLOR_INK,
                lineWidth: { top: 1 }
            }
        });

        // ---------------------------------------------------------
        // 5. "PAID" Stamp (Circular & Positioned under Grand Total)
        // ---------------------------------------------------------
        // ---------------------------------------------------------
        // 5. "PAID" Stamp (Circular & Positioned under Grand Total)
        // ---------------------------------------------------------
        const finalY = doc.lastAutoTable.finalY;

        doc.saveGraphicsState();
        // 1. Set Ink Style (Dark Red + Transparency)
        doc.setGState(new doc.GState({ opacity: 0.75 }));
        doc.setTextColor(...COLOR_ACCENT);
        doc.setDrawColor(...COLOR_ACCENT);

        // 2. Calculate Position 
        // We center it perfectly under the last column (Total).
        // The table ends at 555pt (right margin). Last column is ~80pt wide.
        // Center = 555 - (80/2) = 515.
        const stampX = 515;
        const stampY = finalY + 40; // Moved down 40pts to clear the text

        // 3. Draw Double Circles
        doc.setLineWidth(2.5);
        doc.circle(stampX, stampY, 32, 'S'); // Thick Outer Ring

        doc.setLineWidth(1);
        doc.circle(stampX, stampY, 28, 'S'); // Thin Inner Ring

        // 4. Draw Text
        doc.setFont(FONT_MONO, "bold");

        // "PAID" - Center Big
        doc.setFontSize(20);
        // Adjusted Y offset slightly for better visual centering inside the circle
        doc.text("PAID", stampX, stampY + 6, { align: "center", angle: -15 });

        // Date - Smaller below
        doc.setFontSize(8);
        const stampDate = dateObj.toLocaleDateString('en-GB');
        doc.text(stampDate, stampX, stampY + 18, { align: "center", angle: -15 });

        doc.restoreGraphicsState();
        doc.setTextColor(...COLOR_INK); // Reset text color to black for footer

        // ---------------------------------------------------------
        // 6. Footer (System Note + Address)
        // ---------------------------------------------------------
        const pageHeight = doc.internal.pageSize.height;
        let footerY = pageHeight - 80;

        // Divider
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(40, footerY, 555, footerY);

        // System Generation Note
        footerY += 20;
        doc.setFont(FONT_SERIF, "italic");
        doc.setFontSize(9);
        doc.text("This is a system-generated invoice. No signature is required.", 297, footerY, { align: "center" });

        // Address & Contact (Moved to Bottom)
        footerY += 20;
        doc.setFont(FONT_MONO, "normal");
        doc.setFontSize(8);
        doc.setTextColor(80, 80, 80);

        doc.text(COMPANY_ADDRESS.toUpperCase(), 297, footerY, { align: "center" });
        footerY += 10;
        doc.text(`${COMPANY_EMAIL} | ${COMPANY_WEB}`, 297, footerY, { align: "center" });

        return doc;
    },

    getDataURI: (transaction, user) => {
        const doc = InvoiceGenerator.generate(transaction, user);
        return doc.output('datauristring');
    },

    download: (transaction, user) => {
        const doc = InvoiceGenerator.generate(transaction, user);
        const safeId = (transaction.formattedId || transaction.id || 'invoice').replace(/[^a-z0-9]/gi, '_');
        doc.save(`${safeId}.pdf`);
    }
};