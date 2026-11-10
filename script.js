
/* =================================
   PDF.JS CONFIGURATION
================================= */

pdfjsLib.GlobalWorkerOptions.workerSrc =
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

const PDF_PATH = "./book.pdf";

const bookElement = document.getElementById("book");
const reader = document.getElementById("reader");
const loading = document.getElementById("loading");
const loadingText = document.getElementById("loadingText");
const errorMessage = document.getElementById("errorMessage");

const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const pageInfo = document.getElementById("pageInfo");
const fullscreenBtn = document.getElementById("fullscreenBtn");

let pageFlip = null;
let totalPages = 0;


/* =================================
   RENDER PDF INTO IMAGES
================================= */

async function renderPDF() {
  const pdf = await pdfjsLib.getDocument(PDF_PATH).promise;

  totalPages = pdf.numPages;

  const images = [];

  for (let i = 1; i <= totalPages; i++) {

    const page = await pdf.getPage(i);

    // Higher scale gives better reading quality.
    const viewport = page.getViewport({ scale: 1.5 });

    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    await page.render({
      canvasContext: context,
      viewport: viewport
    }).promise;

    // Convert the page into an image.
    const imageURL = canvas.toDataURL("image/jpeg", 0.88);

    images.push(imageURL);

    // Release canvas memory.
    canvas.width = 0;
    canvas.height = 0;

    loadingText.textContent =
      `Loading page ${i} of ${totalPages}...`;
  }

  return images;
}


/* =================================
   UPDATE NAVIGATION
================================= */

function updateNavigation() {
  if (!pageFlip) return;

  const current = pageFlip.getCurrentPageIndex();

  pageInfo.textContent =
    `Page ${current + 1} / ${totalPages}`;

  prevBtn.disabled = current <= 0;
  nextBtn.disabled = current >= totalPages - 1;
}


/* =================================
   INITIALIZE FLIPBOOK
================================= */

async function initializeBook() {
  try {

    loadingText.textContent = "Preparing your book...";

    const images = await renderPDF();

    // Create the page-flip instance.
    pageFlip = new St.PageFlip(bookElement, {

      // Base dimensions of one page.
      width: 550,
      height: 733,

      // Automatically adapt to container.
      size: "stretch",

      minWidth: 250,
      maxWidth: 550,

      minHeight: 330,
      maxHeight: 1100,

      // Responsive orientation.
      usePortrait: true,

      // First page acts as a cover.
      showCover: true,

      // Animation.
      flippingTime: 900,
      drawShadow: true,
      maxShadowOpacity: 0.45,

      // Interaction.
      useMouseEvents: true,
      mobileScrollSupport: false,

      // Automatic sizing.
      autoSize: true,
      startPage: 0
    });

    // Load all PDF pages.
    pageFlip.loadFromImages(images);

    // Show reader.
    loading.style.display = "none";
    reader.hidden = false;

    // Update page counter after initialization.
    pageFlip.on("flip", updateNavigation);
    pageFlip.on("changeOrientation", updateNavigation);

    requestAnimationFrame(updateNavigation);

  } catch (error) {

    console.error("Flipbook error:", error);

    loading.style.display = "none";
    errorMessage.hidden = false;
  }
}


/* =================================
   PREVIOUS / NEXT BUTTONS
================================= */

prevBtn.addEventListener("click", () => {
  if (pageFlip) {
    pageFlip.flipPrev();
  }
});

nextBtn.addEventListener("click", () => {
  if (pageFlip) {
    pageFlip.flipNext();
  }
});


/* =================================
   FULLSCREEN
================================= */

fullscreenBtn.addEventListener("click", async () => {
  try {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  } catch (error) {
    console.error("Fullscreen unavailable:", error);
  }
});


/* =================================
   START
================================= */

initializeBook();
