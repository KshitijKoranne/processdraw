import { A4_PAGE_HEIGHT, SVG_WIDTH } from "./constants";

export async function exportDiagramCanvas({
  svg,
  layout,
  asPdf,
  showToast,
}: {
  svg: SVGSVGElement | null;
  layout: any;
  asPdf: boolean;
  showToast: (message: string) => void;
}) {
  if (!svg) return;

  const data = new XMLSerializer().serializeToString(svg);
  const image = new Image();
  const url = URL.createObjectURL(new Blob([data], { type: "image/svg+xml" }));

  image.onload = async () => {
    const canvas = document.createElement("canvas");
    canvas.width = SVG_WIDTH * 2;
    canvas.height = layout.height * 2;
    const ctx = canvas.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);

    if (asPdf) {
      const { default: jsPDF } = await import("jspdf");
      const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [SVG_WIDTH, A4_PAGE_HEIGHT] });
      for (let page = 0; page < layout.pages; page++) {
        if (page) pdf.addPage([SVG_WIDTH, A4_PAGE_HEIGHT]);
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, -page * A4_PAGE_HEIGHT, SVG_WIDTH, layout.height);
      }
      pdf.save("ProcessDraw_Diagram.pdf");
    } else {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = "ProcessDraw_Diagram.png";
      link.click();
    }

    showToast(asPdf ? "PDF exported" : "PNG exported");
  };

  image.src = url;
}
