// PromptPay QR Code payload generator (EMVCo standard)
// Ref: https://www.bot.or.th/Thai/PaymentSystems/StandardPS/Documents/QR_Payment_Standard.pdf

function formatTLV(tag: string, value: string): string {
  const length = value.length.toString().padStart(2, "0");
  return `${tag}${length}${value}`;
}

function crc16(data: string): string {
  let crc = 0xffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc = crc << 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function generatePromptPayPayload({
  phoneOrTaxId,
  amount,
}: {
  phoneOrTaxId: string;
  amount?: number;
}): string {
  // Clean phone number
  let id = phoneOrTaxId.replace(/[-\s]/g, "");

  // Determine ID type
  let aidTag: string;
  if (id.length >= 13) {
    // Tax ID / National ID
    aidTag = formatTLV("00", "A000000677010112") + formatTLV("01", id);
  } else {
    // Phone number — convert 0x to 66x
    if (id.startsWith("0")) {
      id = "0066" + id.slice(1);
    } else if (!id.startsWith("0066")) {
      id = "0066" + id;
    }
    id = id.padStart(13, "0");
    aidTag = formatTLV("00", "A000000677010111") + formatTLV("01", id);
  }

  let payload = "";
  payload += formatTLV("00", "01"); // Payload Format Indicator
  payload += formatTLV("01", amount ? "12" : "11"); // Static or Dynamic QR
  payload += formatTLV("29", aidTag); // Merchant Account Info (PromptPay)
  payload += formatTLV("53", "764"); // Currency (THB)
  payload += formatTLV("58", "TH"); // Country

  if (amount && amount > 0) {
    payload += formatTLV("54", amount.toFixed(2)); // Amount
  }

  // CRC placeholder
  payload += "6304";
  const checksum = crc16(payload);
  payload = payload.slice(0, -4) + "6304" + checksum;

  return payload;
}
