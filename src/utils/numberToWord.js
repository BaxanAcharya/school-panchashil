const numberToWords = (number) => {
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
  ];
  const teens = [
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];
  const suffixes = ["", "Thousand", "Million", "Billion", "Trillion"];

  if (number === 0) {
    return "Zero";
  }

  const chunks = [];
  while (number > 0) {
    chunks.push(number % 1000);
    number = Math.floor(number / 1000);
  }

  let words = "";
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (chunk === 0) continue;

    const chunkWords = [];
    const hundreds = Math.floor(chunk / 100);
    const tensAndOnes = chunk % 100;

    if (hundreds > 0) {
      chunkWords.push(ones[hundreds]);
      chunkWords.push("Hundred");
    }

    if (tensAndOnes >= 10 && tensAndOnes <= 19) {
      chunkWords.push(teens[tensAndOnes - 10]);
    } else if (tensAndOnes >= 20) {
      chunkWords.push(tens[Math.floor(tensAndOnes / 10)]);
      chunkWords.push(ones[tensAndOnes % 10]);
    } else if (tensAndOnes > 0) {
      chunkWords.push(ones[tensAndOnes]);
    }

    if (chunkWords.length > 0) {
      words = chunkWords.join(" ") + " " + suffixes[i] + " " + words;
    }
  }

  return words.trim();
};

export default numberToWords;
