document.getElementById('excel-file').addEventListener('change', function (e) {
    const file = e.target.files[0];

    // Update dropzone UI
    const zone = document.getElementById("upload-zone-text");
    if (file) {
        zone.innerHTML = `
            <i class="bi bi-check-circle-fill fs-2 text-success d-block mb-2"></i>
            <span class="text-success fw-semibold">File Uploaded: ${file.name}</span>
        `;
    } else {
        zone.innerHTML = `
            <i class="bi bi-cloud-upload fs-2 text-secondary d-block mb-2"></i>
            <span class="text-secondary fw-semibold">Click or drag your Excel file here</span>
        `;
    }

    // Continue with Excel reading...
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



function refreshEverything() {
  localStorage.clear();
  sessionStorage.clear();

  document.cookie.split(";").forEach(cookie => {
    document.cookie = cookie
      .replace(/^ +/, "")
      .replace(/=.*/, "=;expires=" + new Date(0).toUTCString() + ";path=/");
  });

  const zone = document.getElementById("upload-zone-text");
  if (zone) {
    zone.innerHTML = `
      <i class="bi bi-cloud-upload fs-2 text-secondary d-block mb-2"></i>
      <span class="text-secondary fw-semibold">Click or drag your Excel file here</span>
    `;
  }

  ['product-name', 'product-price', 'pdfName', 'excel-file'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });

  if (typeof allProducts !== 'undefined') {
    allProducts.length = 0;
  }

  if (typeof renderLabels === 'function') {
    renderLabels();
  }

  location.reload();
}