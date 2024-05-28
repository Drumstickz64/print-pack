const cpdf = require("coherentpdf");
const fs = require("fs");
const path = require("path");
const readline = require("readline-sync");

const INPUT_DIR = "input";
const OUT_FILE = "out.pdf";

// Constants for configuring stacking behavior when dealing
// with "PowerPoint" (pdfs with pages wider than they are tall)
const STACKING_MARGIN = 40.0;
const STACKING_SPACING = 25.0;
const STACKING_LINEHEIGHT = 2.0;

const NORMALIZE_TO_A4 = true;

try {
  main();
} catch (err) {
  console.error("ERROR: an unexpected error happened: ", err);
  displayExitPrompt(false);
}

function main() {
  if (!fs.existsSync(path.join(__dirname, INPUT_DIR))) {
    console.error(`ERROR: '${INPUT_DIR}' directory not found`);
    displayExitPrompt(false);
    return;
  }

  const files = fs
    .readdirSync(path.join(__dirname, INPUT_DIR))
    .filter((file) => {
      if (path.extname(file) != ".pdf") {
        console.warn(`WARNING: ${file} is not a pdf file, skipping`);
        return false;
      }

      return true;
    });

  if (files.length == 0) {
    console.warn(`WARNING: No pdf files found in the '${INPUT_DIR}' directory`);
    displayExitPrompt(false);
    return;
  }

  const docs = files.map((file, fileIndex) => {
    console.info(`INFO: Processing file: ${file}`);

    const filePath = path.join(INPUT_DIR, file);
    const doc = cpdf.fromFile(filePath, "");

    if (isPowerPoint(doc)) {
      console.info(
        `INFO: File '${file}' is likely a PowerPoint, its pages will be stacked`
      );
      stackSlides(doc);
    }

    const numPages = cpdf.pages(doc);
    const isLastFile = fileIndex == files.length - 1;
    if (numPages % 2 == 1 && !isLastFile) {
      console.info(`INFO: Adding padding page to ${file}`);
      const lastPageRange = cpdf.range(numPages, numPages);
      cpdf.padAfter(doc, lastPageRange);
    }

    return doc;
  });

  console.info("INFO: Creating output document...");
  const outDoc = cpdf.mergeSimple(docs);

  if (NORMALIZE_TO_A4) {
    cpdf.scaleToFitPaper(
      outDoc,
      cpdf.range(1, cpdf.pages(outDoc)),
      cpdf.a4portrait,
      1.0
    );
  }

  cpdf.toFile(outDoc, path.join(__dirname, OUT_FILE), false, false);

  cpdf.deletePdf(outDoc);
  for (const doc of docs) {
    cpdf.deletePdf(doc);
  }

  displayExitPrompt(true);
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

function displayExitPrompt(success) {
  if (success) {
    console.info("\nProcessing completed succesfully!");
  } else {
    console.info("\nProcessing failed!");
  }
  readline.question("\n\npress 'Enter' to exit\n\n");
}
