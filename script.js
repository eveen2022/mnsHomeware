const form = document.getElementById('product-form');
const labelContainer = document.getElementById('label-container');
const allProducts = [];
const LABEL_LIMIT = 150;

form.addEventListener('submit', function (e) {
    e.preventDefault();

    if (allProducts.length >= LABEL_LIMIT) {
        alert(`⚠️ Maximum limit of ${LABEL_LIMIT} labels reached. Cannot add more. Reduce the product amount to 150 or less to add more products.`);
        return;
    }

    const name = document.getElementById('product-name').value.trim();
    const price = document.getElementById('product-price').value.trim();

    if (!name || !price) return;

    addProduct(name, price);
    form.reset();
});

document.getElementById('excel-file').addEventListener('change', function (e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        rows.forEach((row, index) => {
            if (index === 0 || !row[0] || !row[1]) return;
            const [name, price] = row;
            addProduct(name, price);
        });
    };
    reader.readAsArrayBuffer(file);
});

function addProduct(name, price) {
    allProducts.push({ name, price });
    localStorage.setItem('shelfProducts', JSON.stringify(allProducts));
    renderLabels();
}

function renderLabels() {
    labelContainer.innerHTML = '';
    allProducts.forEach(({ name, price }) => {
        const label = document.createElement('div');
        label.className = 'label';
        label.innerHTML = `<div>${name}</div><div><strong>Rs. ${parseFloat(price).toFixed(2)}</strong></div>`;
        labelContainer.appendChild(label);
    });
}

function generatePDF() {
    const pdfName = document.getElementById("pdfName").value.trim();

    // Remove old container if exists
    const existingPDFContainer = document.getElementById('pdfContainer');
    if (existingPDFContainer) {
        existingPDFContainer.remove();
    }

    if (allProducts.length > LABEL_LIMIT) {
        alert(`⚠️ You can only generate PDFs for up to ${LABEL_LIMIT} labels.`);
        return;
    }

    if (allProducts.length === 0) {
        alert("⚠️ Cannot generate PDF. No products have been added.");
        return;
    }

    if (!pdfName) {
        alert("Please enter a name for the PDF file before downloading.");
        return;
    }

    const labelsPerPage = 20;
    const chunked = [];

    for (let i = 0; i < allProducts.length; i += labelsPerPage) {
        chunked.push(allProducts.slice(i, i + labelsPerPage));
    }

    const pdfContainer = document.createElement('div');
    pdfContainer.id = 'pdfContainer';
    pdfContainer.style.background = '#fff';
    pdfContainer.style.padding = '0';
    pdfContainer.style.margin = '0';
    pdfContainer.style.width = '100%';
    pdfContainer.style.overflow = 'hidden';
    document.body.appendChild(pdfContainer);

    chunked.forEach((batch) => {
        const page = document.createElement('div');
        page.className = 'pdf-page';

        const grid = document.createElement('div');
        grid.className = 'pdf-grid';

        batch.forEach(({ name, price }) => {
            const label = document.createElement('div');
            label.className = 'label';
            label.innerHTML = `
                <div class="product-name">${name.toUpperCase()}</div>
                <img src="divider.svg" class="svg-line" alt="divider">
                <div class="price">Rs. ${parseFloat(price).toFixed(2)}</div>
            `;
            grid.appendChild(label);
        });

        page.appendChild(grid);
        pdfContainer.appendChild(page);
    });

    // Wait for DOM to render properly
    setTimeout(() => {
        html2pdf().set({
            margin: 0,
            filename: pdfName + '.pdf',
            pagebreak: { mode: ['avoid-all'] },
            image: { type: 'png' },
            html2canvas: { scale: 1.5, useCORS: true },
            jsPDF: { unit: 'cm', format: 'a4', orientation: 'landscape' }
        }).from(pdfContainer).save().then(() => {
            pdfContainer.remove();

            progressBar.style.width = "100%";
            progressBar.textContent = "100%";

            setTimeout(() => {
                progressWrapper.style.display = "none";
                progressBar.style.width = "0%";
                progressBar.textContent = "0%";
            }, 1000);
        });
    }, 200); // DOM reflow delay

    const progressWrapper = document.getElementById("pdf-progress-wrapper");
    const progressBar = document.getElementById("pdf-progress-bar");

    const labelCount = allProducts.length;
    const estimatedTimeMs = Math.max(3000, labelCount * 30);
    let progress = 0;
    let startTime = Date.now();

    progressWrapper.style.display = "block";
    progressBar.style.width = "0%";
    progressBar.textContent = "0%";

    const updateProgress = () => {
        const elapsed = Date.now() - startTime;
        progress = Math.min(100, Math.floor((elapsed / estimatedTimeMs) * 100));
        progressBar.style.width = progress + "%";
        progressBar.textContent = progress + "%";

        if (progress < 100) {
            requestAnimationFrame(updateProgress);
        }
    };
    requestAnimationFrame(updateProgress);
}


function clearData() {
    // 1. Clear local array and localStorage
    allProducts.length = 0;
    localStorage.removeItem('shelfProducts');
    
    // 2. Clear inputs
    document.getElementById('product-name').value = '';
    document.getElementById('product-price').value = '';
    document.getElementById('pdfName').value = '';
    document.getElementById('excel-file').value = null;

    // 3. Clear cookies
    document.cookie.split(";").forEach(cookie => {
        document.cookie = cookie
            .replace(/^ +/, "")
            .replace(/=.*/, "=;expires=" + new Date(0).toUTCString() + ";path=/");
    });

    // 4. Clear UI
    renderLabels();
}


window.onload = () => {
    const saved = localStorage.getItem('shelfProducts');
    if (saved) {
        const parsed = JSON.parse(saved);
        parsed.forEach(p => allProducts.push(p));
        renderLabels();
    }
};

function renderLabels() {
    const previewWrapper = document.getElementById("label-preview-wrapper");
    previewWrapper.innerHTML = '';

    const labelsPerPage = 20;
    const totalProducts = allProducts.length;
    const totalPages = Math.ceil(totalProducts / labelsPerPage);

    for (let i = 0; i < totalPages; i++) {
        const page = document.createElement('div');
        page.className = 'preview-page';

        const pageItems = allProducts.slice(i * labelsPerPage, (i + 1) * labelsPerPage);
        pageItems.forEach(({ name, price }) => {
            const label = document.createElement('div');
            label.className = 'label';
            label.innerHTML = `
        <div class="product-name">${name.toUpperCase()}</div>
        <img src="divider.svg" class="svg-line" alt="divider">
        <div class="price">Rs. ${parseFloat(price).toFixed(2)}</div>
      `;
            page.appendChild(label);
        });

        previewWrapper.appendChild(page);
    }

    document.getElementById('count-products').innerText = totalProducts;
    document.getElementById('count-labels').innerText = totalProducts;
    document.getElementById('count-pages').innerText = totalPages;
    document.querySelector('button[type="submit"]').disabled = allProducts.length >= LABEL_LIMIT;
}

function handleFile(e) {
    const file = e.target.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });

        let imported = 0;
        const availableSlots = LABEL_LIMIT - allProducts.length;

        // Prepare batch addition (don't call addProduct yet)
        const toAdd = [];

        rows.forEach((row, index) => {
            if (index === 0 || !row[0] || !row[1]) return;
            if (toAdd.length < availableSlots) {
                const [name, price] = row;
                toAdd.push({ name, price });
                imported++;
            }
        });

        // Add the allowed products
        toAdd.forEach(p => addProduct(p.name, p.price));

        // Show warnings
        if (imported === 0) {
            alert(`⚠️ Cannot import. You already reached the maximum of ${LABEL_LIMIT} labels.`);
        } else if (toAdd.length < rows.length - 1) {
            alert(`⚠️ Only ${toAdd.length} products were added. ${LABEL_LIMIT} label limit reached.`);
        }
    };

    reader.readAsArrayBuffer(file);
}




