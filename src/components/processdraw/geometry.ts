import { A4_PAGE_HEIGHT, CANVAS_CENTER_X, SIDE_GAP, VERTICAL_GAP } from "./constants";
import type { ArrowAnnotations, Block, Side, SideItem } from "./types";

export function wrapText(text = "", max = 24) {
  return text.split("\n").flatMap((paragraph) => {
    const words = paragraph.trim().split(/\s+/).filter(Boolean);
    const output: string[] = [];
    let line = "";

    words.forEach((word) => {
      if (line && `${line} ${word}`.length > max) {
        output.push(line);
        line = word;
      } else {
        line = line ? `${line} ${word}` : word;
      }
    });

    if (line) output.push(line);
    return output.length ? output : [""];
  });
}

export function blockDimensions(text: string, max = 24, minWidth = 180) {
  const lines = wrapText(text, max);
  return {
    lines,
    width: Math.max(minWidth, Math.max(...lines.map((line) => line.length)) * 8.4 + 58),
    height: lines.length * 18 + 34,
  };
}

export function sideDimensions(text: string) {
  const lines = wrapText(text, 22);
  return {
    lines,
    width: Math.max(110, Math.max(...lines.map((line) => line.length)) * 7.4 + 24),
    height: lines.length * 18 + 16,
  };
}

export function sideStackHeight(items: SideItem[]) {
  return items.reduce((sum, item, index) => sum + sideDimensions(item.text).height + (index ? 12 : 0), 0);
}

export function buildDiagramLayout(blocks: Block[], annotations: ArrowAnnotations) {
  let y = 56;
  const positions: any[] = [];

  blocks.forEach((block, index) => {
    const main = blockDimensions(block.text);
    const height = Math.max(
      main.height,
      sideStackHeight(block.leftItems) + 28,
      sideStackHeight(block.rightItems) + 28,
    );

    if (Math.floor((y + height + 34) / A4_PAGE_HEIGHT) > Math.floor(y / A4_PAGE_HEIGHT) && y > 34) {
      y = (Math.floor(y / A4_PAGE_HEIGHT) + 1) * A4_PAGE_HEIGHT + 34;
    }

    const blockX = CANVAS_CENTER_X - main.width / 2;
    const blockY = y;

    const placeSide = (items: SideItem[], side: Side) => {
      let itemY = blockY + (height - sideStackHeight(items)) / 2;
      return items.map((item, itemIndex) => {
        const dimensions = sideDimensions(item.text);
        const output = {
          ...dimensions,
          item,
          itemIndex,
          x: side === "left" ? blockX - SIDE_GAP - dimensions.width : blockX + main.width + SIDE_GAP,
          y: itemY,
          centerY: itemY + dimensions.height / 2,
        };
        itemY += dimensions.height + 12;
        return output;
      });
    };

    positions.push({
      block,
      index,
      blockX,
      blockY,
      width: main.width,
      height,
      lines: main.lines,
      left: placeSide(block.leftItems, "left"),
      right: placeSide(block.rightItems, "right"),
    });

    const annotation = annotations[index];
    y += height + VERTICAL_GAP + (annotation ? Math.max(annotation.left?.length || 0, annotation.right?.length || 0) * 8 : 0);
  });

  const height = Math.max(A4_PAGE_HEIGHT, y + 52);
  return {
    positions,
    height,
    pages: Math.max(1, Math.ceil(height / A4_PAGE_HEIGHT)),
  };
}
