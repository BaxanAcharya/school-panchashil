import puppeteer from "puppeteer";
const pdfPath = "public/temp/";
const generatePDF = async (html, outputPath) => {
  // NOTE::browser must be installed in the system to use this
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    headless: "new",
  });
  const page = await browser.newPage();
  await page.setContent(html);

  await page.pdf({
    path: pdfPath + outputPath,
    format: "A4",
    printBackground: true,
  });
  await browser.close();
};
export { generatePDF };
