import * as FileSystem from 'expo-file-system';
import { Contact } from '../types';
import Config from '../config/environment';
import { normalizePhoneNumber } from '../utils/phoneFormatter';

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
}

interface ExtractedCardData {
  detectedCountry?: string;
  countryCode?: string;
  name: string;
  jobTitle: string;
  company: string;
  phones: {
    mobile1?: string;
    mobile2?: string;
    office?: string;
    fax?: string;
  };
  email: string;
  address: string;
  website?: string;
  confidence: number;
}

export class GeminiOCRService {
  private static readonly API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

  /**
   * Process business card image using Gemini 2.5 Flash
   * Combines OCR and intelligent parsing in a single API call
   * Using 2.5 Flash for best performance and accuracy
   */
  static async processBusinessCard(imageUri: string): Promise<Partial<Contact>> {
    try {
      console.log('🚀 Starting Gemini 2.5 Flash OCR processing...');

      // Convert image to base64
      const base64Image = await FileSystem.readAsStringAsync(imageUri, {
        encoding: 'base64' as any,
      });

      // Create the prompt for Gemini
      const prompt = `Analyze this business card image and extract ALL information in a structured format.

CRITICAL REQUIREMENTS:
1. Extract EVERY piece of text visible on the card
2. **FIRST detect the COUNTRY** from the address, language, currency symbols, or company registration details
3. Identify and categorize phone numbers (mobile, office, fax)
4. **AUTOMATICALLY format phone numbers with the CORRECT country code** based on detected country
5. Detect job titles and positions
6. Extract company names including trademark symbols (™, ®, ©)
7. Parse addresses completely
8. Identify emails and websites

Return ONLY a JSON object with this exact structure (no markdown, no explanation):
{
  "detectedCountry": "country name (e.g., Malaysia, Singapore, Taiwan, China, USA)",
  "countryCode": "country calling code (e.g., 60, 65, 886, 86, 1)",
  "name": "person's full name",
  "jobTitle": "job title or position",
  "company": "company name with any symbols",
  "phones": {
    "mobile1": "primary mobile number WITH COUNTRY CODE",
    "mobile2": "secondary mobile if exists WITH COUNTRY CODE",
    "office": "office/landline number WITH COUNTRY CODE",
    "fax": "fax number if exists WITH COUNTRY CODE"
  },
  "email": "email address",
  "address": "complete address",
  "website": "website URL if exists",
  "confidence": 0-100
}

🌍 COUNTRY DETECTION RULES (APPLY FIRST):
1. **Address-based detection:**
   - Malaysia: Look for "Kuala Lumpur", "Selangor", "Johor", "Penang", "KL", "Malaysia", postal codes 5-digits
   - Singapore: Look for "Singapore", postal codes 6-digits, "SG"
   - Taiwan: Look for "台灣", "Taiwan", "ROC", "Taipei", "台北"
   - China: Look for "中国", "China", "PRC", "Beijing", "上海", "深圳"
   - Indonesia: Look for "Indonesia", "Jakarta", "Bali"
   - Thailand: Look for "Thailand", "Bangkok", "ประเทศไทย"
   - USA: Look for state names, ZIP codes, "USA", "United States"

2. **Company registration clues:**
   - Malaysia: "Sdn Bhd", "Bhd"
   - Singapore: "Pte Ltd"
   - Taiwan: "股份有限公司", "Co., Ltd"
   - China: "有限公司", "Limited"

3. **Language/Script clues:**
   - Traditional Chinese (繁體) → Likely Taiwan, Hong Kong, Malaysia
   - Simplified Chinese (简体) → Likely China, Singapore
   - Malay language → Malaysia
   - Thai script → Thailand

4. **Currency symbols:**
   - RM → Malaysia
   - S$ → Singapore
   - NT$ → Taiwan
   - ¥ → China/Japan
   - $ → USA/Singapore/Australia

5. **Default:** If no clear country detected, use Malaysia (+60)

📱 PHONE NUMBER FORMATTING RULES (APPLY AFTER COUNTRY DETECTION):
**CRITICAL: Phone numbers MUST be formatted for WhatsApp compatibility (no + sign, only digits with country code)**

**MALAYSIA (+60):**
- Input: "012-345 6789" → Output: "60123456789" ✅ (WhatsApp ready)
- Input: "016-303 8028" → Output: "60163038028" ✅
- Input: "03-1234 5678" → Output: "6031234567" ✅ (landline)
- Input: "+60 16-303 8028" → Output: "60163038028" ✅
- **Rule:** Remove leading 0, add 60, remove all spaces/dashes/plus signs

**SINGAPORE (+65):**
- Input: "9123 4567" → Output: "6591234567" ✅
- Input: "6234 5678" → Output: "6562345678" ✅ (landline)
- Input: "+65 9123 4567" → Output: "6591234567" ✅
- **Rule:** Add 65, remove all spaces/dashes/plus signs

**TAIWAN (+886):**
- Input: "0912-345-678" → Output: "886912345678" ✅
- Input: "02-2345-6789" → Output: "886223456789" ✅ (Taipei landline)
- Input: "+886-912-345-678" → Output: "886912345678" ✅
- **Rule:** Remove leading 0, add 886, remove all spaces/dashes/plus signs

**CHINA (+86):**
- Input: "138-0013-8000" → Output: "8613800138000" ✅
- Input: "010-12345678" → Output: "861012345678" ✅ (Beijing landline)
- Input: "+86 138-0013-8000" → Output: "8613800138000" ✅
- **Rule:** Remove leading 0 (if mobile), add 86, remove all spaces/dashes/plus signs

**USA/CANADA (+1):**
- Input: "(555) 123-4567" → Output: "15551234567" ✅
- Input: "555-123-4567" → Output: "15551234567" ✅
- Input: "+1 555-123-4567" → Output: "15551234567" ✅
- **Rule:** Add 1, remove all spaces/dashes/parentheses/plus signs

**INDONESIA (+62):**
- Input: "0812-3456-7890" → Output: "628123456789" ✅
- Input: "+62 812-3456-7890" → Output: "628123456789" ✅
- **Rule:** Remove leading 0, add 62, remove all spaces/dashes/plus signs

**THAILAND (+66):**
- Input: "081-234-5678" → Output: "66812345678" ✅
- Input: "+66 81-234-5678" → Output: "66812345678" ✅
- **Rule:** Remove leading 0, add 66, remove all spaces/dashes/plus signs

🎯 FINAL PHONE FORMAT REQUIREMENTS:
1. **NO plus sign (+)** - WhatsApp URLs use numbers only
2. **NO spaces, dashes, dots, or parentheses** - Only digits
3. **Country code FIRST** - e.g., 60123456789, not +60 12-345 6789
4. **Remove ALL leading zeros** after country code
5. **Example outputs:**
   ✅ "60123456789" (Malaysia mobile)
   ✅ "6591234567" (Singapore mobile)
   ✅ "886912345678" (Taiwan mobile)
   ❌ "+60 12-345 6789" (has +, spaces, dashes)
   ❌ "60-123456789" (has dash)
   ❌ "012-345 6789" (missing country code)

EXTRACTION PRIORITY:
1. First, determine the country
2. Then extract phone numbers and apply the correct country code
3. Format ALL phone numbers for WhatsApp (digits only with country code)
4. Extract other fields (name, company, etc.)

ADDITIONAL RULES:
- For missing fields, use empty string ""
- Preserve trademark symbols in company names
- Extract both English and non-English text
- If multiple phone numbers exist without labels, assign the first mobile-looking number to mobile1
- Job titles like CEO, Director, Manager, Co-Founder should go in jobTitle field
- If country cannot be determined, default to Malaysia (60)`;

      // Prepare request body for Gemini
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: prompt
              },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Image
                }
              }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.1, // Low temperature for more consistent extraction
          topK: 1,
          topP: 0.95,
          maxOutputTokens: 2048, // Increased to prevent truncation of JSON response
        },
        safetySettings: [
          {
            category: 'HARM_CATEGORY_HARASSMENT',
            threshold: 'BLOCK_NONE'
          },
          {
            category: 'HARM_CATEGORY_HATE_SPEECH',
            threshold: 'BLOCK_NONE'
          },
          {
            category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
            threshold: 'BLOCK_NONE'
          },
          {
            category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
            threshold: 'BLOCK_NONE'
          }
        ]
      };

      // Make request to Gemini API
      const response = await fetch(`${this.API_URL}?key=${Config.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.text();
        // Silent logging - don't show scary errors to users
        console.log('[Gemini] API unavailable, user can manually enter data');
        throw new Error(`Gemini API failed: ${response.status}`);
      }

      const data: GeminiResponse = await response.json();

      // Debug: Log full response structure
      console.log('🔍 Full Gemini response structure:', JSON.stringify(data, null, 2));

      // Extract the text response from Gemini
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      console.log('📝 Gemini raw response text:', responseText);

      // Parse the JSON response
      let extractedData: ExtractedCardData;
      try {
        // Remove any markdown code blocks if present
        const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        extractedData = JSON.parse(cleanJson);
      } catch (parseError) {
        console.log('[Gemini] Response parsing issue, using fallback extraction');
        console.log('Raw response:', responseText);

        // Fallback: Try to extract data manually if JSON parsing fails
        extractedData = this.fallbackExtraction(responseText);
      }

      console.log('✅ Extracted card data:', extractedData);

      // Validate and clean the extracted data
      const cleanedData = this.validateAndCleanData(extractedData);

      // Get primary phone for backward compatibility
      const primaryPhone = cleanedData.phones.mobile1 ||
                          cleanedData.phones.office ||
                          cleanedData.phones.mobile2 ||
                          cleanedData.phones.fax || '';

      // Return contact data in the expected format
      return {
        name: cleanedData.name,
        company: cleanedData.company,
        jobTitle: cleanedData.jobTitle,
        phone: primaryPhone, // Primary phone for backward compatibility
        phones: cleanedData.phones, // All phone numbers
        email: cleanedData.email,
        address: cleanedData.address,
        imageUrl: imageUri,
      };

    } catch (error) {
      console.log('[Gemini] OCR processing unavailable, user can manually enter contact details');

      // Return empty contact on failure (offline-first approach)
      return {
        name: '',
        company: '',
        jobTitle: '',
        phone: '',
        email: '',
        address: '',
        imageUrl: imageUri,
        phones: {}
      };
    }
  }

  /**
   * Validate and clean extracted data
   */
  private static validateAndCleanData(data: any): ExtractedCardData {
    const detectedCountryCode = data.countryCode || '60'; // Default to Malaysia

    console.log('🌍 Detected Country:', data.detectedCountry || 'Malaysia (default)');
    console.log('📞 Country Code:', detectedCountryCode);

    return {
      detectedCountry: (data.detectedCountry || 'Malaysia').trim(),
      countryCode: detectedCountryCode,
      name: (data.name || '').trim(),
      jobTitle: (data.jobTitle || '').trim(),
      company: (data.company || '').trim(),
      phones: {
        mobile1: this.cleanPhoneNumberWithCountryCode(data.phones?.mobile1 || '', detectedCountryCode),
        mobile2: this.cleanPhoneNumberWithCountryCode(data.phones?.mobile2 || '', detectedCountryCode),
        office: this.cleanPhoneNumberWithCountryCode(data.phones?.office || '', detectedCountryCode),
        fax: this.cleanPhoneNumberWithCountryCode(data.phones?.fax || '', detectedCountryCode),
      },
      email: (data.email || '').toLowerCase().trim(),
      address: (data.address || '').trim(),
      website: (data.website || '').trim(),
      confidence: typeof data.confidence === 'number' ? data.confidence : 85,
    };
  }


  /**
   * Clean and normalize phone number with detected country code
   * Ensures phone numbers are WhatsApp-ready (no + sign, only digits)
   * @param phone - Raw phone number from OCR
   * @param countryCode - Detected country calling code (e.g., '60', '65', '886')
   */
  private static cleanPhoneNumberWithCountryCode(phone: string, countryCode: string): string {
    if (!phone) return '';

    console.log('📱 Cleaning phone:', phone, 'with country code:', countryCode);

    // Gemini should already format the phone correctly, but let's ensure it's clean
    // Remove all non-digit characters
    let cleanNumber = phone.replace(/\D/g, '');

    // If the number already starts with the country code, return as-is
    if (cleanNumber.startsWith(countryCode)) {
      console.log('✅ Phone already has country code:', cleanNumber);
      return cleanNumber;
    }

    // If the number starts with a plus sign followed by country code in original
    // (Gemini might not have cleaned it properly)
    const originalDigits = phone.replace(/[^\d+]/g, '');
    if (originalDigits.startsWith('+' + countryCode)) {
      console.log('✅ Removing + sign from phone:', cleanNumber);
      return cleanNumber;
    }

    // Remove leading zero (common in local phone numbers)
    if (cleanNumber.startsWith('0')) {
      cleanNumber = cleanNumber.substring(1);
    }

    // Add country code
    const finalNumber = countryCode + cleanNumber;
    console.log('✅ Final phone number:', finalNumber);

    return finalNumber;
  }

  /**
   * Fallback extraction if JSON parsing fails
   */
  private static fallbackExtraction(text: string): ExtractedCardData {
    console.log('⚠️ Using fallback extraction method');

    const extracted: ExtractedCardData = {
      name: '',
      jobTitle: '',
      company: '',
      phones: {},
      email: '',
      address: '',
      confidence: 50,
    };

    // Try to extract key-value pairs
    const lines = text.split('\n');

    for (const line of lines) {
      const lower = line.toLowerCase();

      // Extract name
      if (lower.includes('name') && !extracted.name) {
        const match = line.match(/name[:\s]*(.+)/i);
        if (match) extracted.name = match[1].trim();
      }

      // Extract email
      if (!extracted.email) {
        const emailMatch = line.match(/[\w.-]+@[\w.-]+\.\w+/);
        if (emailMatch) extracted.email = emailMatch[0];
      }

      // Extract phone numbers
      const phoneMatch = line.match(/[\+]?[\d][\d\s.\-()]{7,}/);
      if (phoneMatch) {
        const phone = phoneMatch[0];
        if (lower.includes('mobile') || lower.includes('hp')) {
          if (!extracted.phones.mobile1) {
            extracted.phones.mobile1 = phone;
          } else if (!extracted.phones.mobile2) {
            extracted.phones.mobile2 = phone;
          }
        } else if (lower.includes('office') || lower.includes('tel')) {
          extracted.phones.office = phone;
        } else if (lower.includes('fax')) {
          extracted.phones.fax = phone;
        } else if (!extracted.phones.mobile1) {
          extracted.phones.mobile1 = phone;
        }
      }

      // Extract company (look for trademark symbols)
      if ((line.includes('™') || line.includes('®') || line.includes('©')) && !extracted.company) {
        extracted.company = line.trim();
      }

      // Extract job title
      const titleKeywords = ['CEO', 'Director', 'Manager', 'Founder', 'President', 'Executive', 'Officer'];
      for (const keyword of titleKeywords) {
        if (line.includes(keyword) && !extracted.jobTitle) {
          extracted.jobTitle = line.trim();
          break;
        }
      }
    }

    return extracted;
  }

  /**
   * Validate API key by making a test request
   */
  static async validateApiKey(): Promise<boolean> {
    try {
      if (!Config.GEMINI_API_KEY) return false;

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${Config.GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [{ text: 'test' }]
            }]
          })
        }
      );

      return response.ok || response.status === 400; // 400 is expected for test
    } catch {
      return false;
    }
  }

  /**
   * Get service info for debugging
   */
  static getServiceInfo(): { name: string; version: string; model: string } {
    return {
      name: 'Gemini OCR Service',
      version: '2.0',
      model: 'gemini-2.0-flash-exp'
    };
  }
}