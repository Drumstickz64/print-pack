const cpdf = require("coherentpdf");
const fs = require("fs");
const path = require("path");

const INPUT_DIR = path.join(__dirname, "pdfs");
const OUT_FILE = "out.pdf";

// Constants for configuring stacking behavior when dealing
// with "PowerPoint" (pdfs with pages wider than they are tall)
const STACKING_MARGIN = 40.0;
const STACKING_SPACING = 25.0;
const STACKING_LINEHEIGHT = 2.0;

const NORMALIZE_TO_A4 = true;

main();

function main() {
  const docs = fs.readdirSync(INPUT_DIR).map((file) => {
    console.log(`Processing file: ${file}`);

    const filePath = path.join(INPUT_DIR, file);
    const doc = cpdf.fromFile(filePath, "");

    const numPages = cpdf.pages(doc);
    if (numPages % 2 == 1) {
      const lastPageRange = cpdf.range(numPages, numPages);
      cpdf.padAfter(doc, lastPageRange);
    }

    if (isPowerPoint(doc)) {
      console.info(
        `File '${file}' is likely a PowerPoint, its pages will be stacked`
      );
      stackSlides(doc);
    }

    return doc;
  });

  console.log("Creating output document...");
  const outDoc = cpdf.mergeSimple(docs);

  if (NORMALIZE_TO_A4) {
    cpdf.scaleToFitPaper(
      outDoc,
      cpdf.range(1, cpdf.pages(outDoc)),
      cpdf.a4portrait,
      1.0
    );
  }

  cpdf.toFile(outDoc, OUT_FILE, false, false);

  cpdf.deletePdf(outDoc);
  for (const doc of docs) {
    cpdf.deletePdf(doc);
  }
}

function stackSlides(doc) {
  cpdf.impose(
    doc,
    1.0,
    2.0,
    false,
    false,
    false,
    false,
    false,
    STACKING_MARGIN,
    STACKING_SPACING,
    STACKING_LINEHEIGHT
  );
}

function isPowerPoint(doc) {
  for (let i = 1; i <= cpdf.pages(doc); i++) {
    const mediaBox = cpdf.getMediaBox(doc, i);
    const width = mediaBox[1] - mediaBox[0];
    const height = mediaBox[3] - mediaBox[2];

    if (width <= height) {
      return false;
    }
  }

  return true;
}
