import puppeteer from "puppeteer";
const pdfPath = "public/temp/";
const generatePDF = async (html, outputPath) => {
  // NOTE::browser must be installed in the system to use this
  const CHROME_PATH = process.env.CHROME_PATH || null;

  let browser;
  if (CHROME_PATH) {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
      executablePath: CHROME_PATH,
    });
  } else {
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: true,
    });
  }

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
