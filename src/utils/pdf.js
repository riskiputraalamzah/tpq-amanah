let pdfLibs = null;

// jsPDF is by far the largest dependency, so it is only downloaded where a page can export.
export function loadPdfLibs() {
  if (!pdfLibs) {
    pdfLibs = Promise.all([import("jspdf"), import("jspdf-autotable")])
      .then(([jspdf, autotable]) => ({
        jsPDF: jspdf.default,
        autoTable: autotable.default,
      }))
      .catch((error) => {
        pdfLibs = null;
        throw error;
      });
  }
  return pdfLibs;
}
