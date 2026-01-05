const QRCode = require('qrcode');

/**
 * Generate VietQR compatible string
 * Format theo chuẩn VietQR EMVCo
 * 
 * @param {Object} options
 * @param {string} options.bankId - Mã ngân hàng (VCB, TCB, VIB, etc.)
 * @param {string} options.accountNumber - Số tài khoản
 * @param {string} options.accountName - Tên chủ tài khoản
 * @param {number} options.amount - Số tiền
 * @param {string} options.description - Nội dung chuyển khoản
 * @param {string} options.template - Template (compact, compact2, qr_only, print)
 */
function generateVietQRString(options) {
  const {
    bankId = 'VCB',
    accountNumber,
    accountName = '',
    amount = 0,
    description = '',
    template = 'compact'
  } = options;

  // VietQR Format: https://www.vietqr.io/
  // Using API.VIETQR.IO for simple integration
  const baseUrl = 'https://img.vietqr.io/image';
  
  // Build URL với params
  let url = `${baseUrl}/${bankId}-${accountNumber}-${template}.png`;
  
  const params = new URLSearchParams();
  if (amount > 0) {
    params.append('amount', amount);
  }
  if (description) {
    params.append('addInfo', description);
  }
  if (accountName) {
    params.append('accountName', accountName);
  }
  
  const paramString = params.toString();
  if (paramString) {
    url += '?' + paramString;
  }
  
  return url;
}

/**
 * Generate VietQR URL
 * Trả về URL của QR code image
 */
exports.generateVietQRUrl = (options) => {
  return generateVietQRString(options);
};

/**
 * Generate QR Code Data URL from VietQR
 * Tạo QR code base64 data URL để embed trực tiếp vào HTML
 */
exports.generateVietQRDataUrl = async (options) => {
  try {
    const vietQRUrl = generateVietQRString(options);
    
    // Generate QR code from URL
    const qrDataUrl = await QRCode.toDataURL(vietQRUrl, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating VietQR:', error);
    throw error;
  }
};

/**
 * Generate QR Code Buffer
 * Trả về buffer để lưu file hoặc gửi response
 */
exports.generateVietQRBuffer = async (options) => {
  try {
    const vietQRUrl = generateVietQRString(options);
    
    const buffer = await QRCode.toBuffer(vietQRUrl, {
      width: 300,
      margin: 2
    });
    
    return buffer;
  } catch (error) {
    console.error('Error generating VietQR buffer:', error);
    throw error;
  }
};

/**
 * Generate simple text QR Code
 * Tạo QR code từ text bất kỳ
 */
exports.generateTextQR = async (text, options = {}) => {
  try {
    const qrDataUrl = await QRCode.toDataURL(text, {
      width: options.width || 300,
      margin: options.margin || 2,
      color: {
        dark: options.darkColor || '#000000',
        light: options.lightColor || '#FFFFFF'
      }
    });
    
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating text QR:', error);
    throw error;
  }
};

/**
 * Generate MoMo QR Code
 * Tạo QR code cho chuyển khoản MoMo
 */
exports.generateMoMoQR = async (options) => {
  const {
    phoneNumber,
    amount = 0,
    description = ''
  } = options;

  // MoMo QR format: phone number + amount + description
  // Sử dụng định dạng đơn giản để app MoMo có thể đọc
  let momoData = `2|99|${phoneNumber}`;
  
  if (amount > 0) {
    momoData += `|${amount}`;
  }
  
  if (description) {
    momoData += `|${description}`;
  }

  try {
    const qrDataUrl = await QRCode.toDataURL(momoData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#A50064',  // MoMo brand color
        light: '#FFFFFF'
      }
    });
    
    return qrDataUrl;
  } catch (error) {
    console.error('Error generating MoMo QR:', error);
    throw error;
  }
};

/**
 * Bank codes mapping
 * Danh sách mã ngân hàng Việt Nam
 */
exports.BANK_CODES = {
  VCB: 'Vietcombank',
  TCB: 'Techcombank',
  VIB: 'VIB',
  MB: 'MB Bank',
  ACB: 'ACB',
  VPB: 'VPBank',
  TPB: 'TPBank',
  STB: 'Sacombank',
  HDB: 'HDBank',
  BIDV: 'BIDV',
  AGR: 'Agribank',
  OCB: 'OCB',
  MSB: 'MSB',
  CTG: 'VietinBank',
  SHB: 'SHB',
  EIB: 'Eximbank',
  SCB: 'SCB',
  VAB: 'VietABank',
  NAB: 'NamABank',
  PGB: 'PGBank',
  VCCB: 'BanViet',
  SEA: 'SeABank',
  ABB: 'ABBANK',
  BAB: 'BacABank',
  DAB: 'DongABank',
  GPB: 'GPBank',
  KLB: 'KienLongBank',
  LVB: 'LienVietPostBank',
  OCB: 'OCB',
  PVB: 'PVcomBank',
  CAKE: 'CAKE',
  TIMO: 'Timo',
  VNPT: 'VNPT Money',
  VIET: 'VietBank'
};
