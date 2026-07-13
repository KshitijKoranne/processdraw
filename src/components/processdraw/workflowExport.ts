import { A4_PAGE_HEIGHT, SVG_WIDTH } from "./constants";

const EXPORT_SCALE = 2;

function sanitizeFilename(name: string) {
  const cleaned = name.trim().replace(/[^a-zA-Z0-9 _-]+/g, "").replace(/\s+/g, "_");
  return cleaned || "ProcessDraw_Diagram";
}

function drawWatermark(ctx: CanvasRenderingContext2D, pages: number, text: string) {
  ctx.save();
  ctx.scale(EXPORT_SCALE, EXPORT_SCALE);
  ctx.font = "700 64px Times New Roman, Times, serif";
  ctx.fillStyle = "rgba(120, 120, 120, 0.16)";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (let page = 0; page < pages; page++) {
    const cx = SVG_WIDTH / 2;
    const cy = page * A4_PAGE_HEIGHT + A4_PAGE_HEIGHT / 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(-Math.PI / 4);
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
  ctx.restore();
}

export async function exportDiagramCanvas({
  svg,
  layout,
  asPdf,
  name = "",
  watermark,
  showToast,
}: {
  svg: SVGSVGElement | null;
  layout: any;
  asPdf: boolean;
  name?: string;
  watermark?: string;
  showToast: (message: string) => void;
}) {
  if (!svg) return;

  const data = new XMLSerializer().serializeToString(svg);
  const image = new Image();
  const url = URL.createObjectURL(new Blob([data], { type: "image/svg+xml" }));
  const filename = sanitizeFilename(name);

  image.onerror = () => {
    URL.revokeObjectURL(url);
    showToast("Export failed — could not render the diagram");
  };

  image.onload = async () => {
    try {
      const canvas = document.createElement("canvas");
      canvas.width = SVG_WIDTH * EXPORT_SCALE;
      canvas.height = layout.height * EXPORT_SCALE;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      if (watermark) drawWatermark(ctx, layout.pages, watermark);

      if (asPdf) {
        const { default: jsPDF } = await import("jspdf");
        const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [SVG_WIDTH, A4_PAGE_HEIGHT] });
        for (let page = 0; page < layout.pages; page++) {
          if (page) pdf.addPage([SVG_WIDTH, A4_PAGE_HEIGHT]);
          pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, -page * A4_PAGE_HEIGHT, SVG_WIDTH, layout.height);
        }
        pdf.save(`${filename}.pdf`);
      } else {
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        link.download = `${filename}.png`;
        link.click();
      }

      showToast(asPdf ? "PDF exported" : "PNG exported");
    } catch (error) {
      console.error("Export failed:", error);
      showToast("Export failed — please try again");
    } finally {
      URL.revokeObjectURL(url);
    }
  };

  image.src = url;
}
