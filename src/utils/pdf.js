import pdf from "html-pdf";
const pdfPath = "public/temp/";
const generatePDF = async (html, outputPath) => {
  pdf.create(html, { format: "A4", directory: pdfPath }).toFile(outputPath);
  // const browser = await puppeteer.launch({
  //   args: ["--no-sandbox", "--disable-setuid-sandbox"],
  //   headless: "new",
  // });
  // const page = await browser.newPage();
  // await page.setContent(html);

  // await page.pdf({
  //   path: pdfPath + outputPath,
  //   format: "A4",
  //   printBackground: true,
  // });
  // await browser.close();
};
export { generatePDF };
