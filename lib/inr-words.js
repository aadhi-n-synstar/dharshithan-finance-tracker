// Indian Rupee Currency to Words Converter
function numberToWordsINR(amount) {
  if (amount === 0 || amount === '0') return 'Zero Rupees Only';
  if (!amount) return '';

  const num = Math.floor(Math.abs(Number(amount)));
  const decimal = Math.round((Math.abs(Number(amount)) - num) * 100);

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertTwoDigits(n) {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
  }

  function convertThreeDigits(n) {
    if (n === 0) return '';
    let str = '';
    if (n >= 100) {
      str += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n > 0) {
      str += convertTwoDigits(n);
    }
    return str.trim();
  }

  // Indian Numbering System: Crores, Lakhs, Thousands, Hundreds
  let crore = Math.floor(num / 10000000);
  let remainder = num % 10000000;
  let lakh = Math.floor(remainder / 100000);
  remainder = remainder % 100000;
  let thousand = Math.floor(remainder / 1000);
  let hundred = remainder % 1000;

  let words = '';

  if (crore > 0) {
    words += convertThreeDigits(crore) + ' Crore ';
  }
  if (lakh > 0) {
    words += convertTwoDigits(lakh) + ' Lakh ';
  }
  if (thousand > 0) {
    words += convertTwoDigits(thousand) + ' Thousand ';
  }
  if (hundred > 0) {
    words += convertThreeDigits(hundred) + ' ';
  }

  words = words.trim();
  if (!words) words = 'Zero';

  let result = words + ' Rupees';
  if (decimal > 0) {
    result += ' and ' + convertTwoDigits(decimal) + ' Paise';
  }
  result += ' Only';

  return result;
}

module.exports = { numberToWordsINR };
