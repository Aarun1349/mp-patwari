// One-off script: builds the Free Mock Test as an .xlsx buffer and runs it
// through the real upload pipeline (parseAndImportQuestions), exactly as if
// a teacher had uploaded it via /upload. Not part of the app — delete after use.
import * as XLSX from "xlsx";
import { prisma } from "../src/lib/prisma";
import { parseAndImportQuestions } from "../src/lib/exam/importQuestions";

type Row = {
  section_code: string;
  question_text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_option: "A" | "B" | "C" | "D";
  marks: number;
  negative_marks: number;
};

const MARKS = 2;
const NEG = 0.5; // 1/4th of marks, matches negativeMarkingRatio 0.25 on the paper

function q(
  section_code: string,
  question_text: string,
  options: [string, string, string, string],
  correct_option: "A" | "B" | "C" | "D"
): Row {
  const [option_a, option_b, option_c, option_d] = options;
  return { section_code, question_text, option_a, option_b, option_c, option_d, correct_option, marks: MARKS, negative_marks: NEG };
}

const rows: Row[] = [
  // ---------- GK (20) ----------
  q("GK", 'भारत के संविधान की प्रस्तावना में "पंथनिरपेक्ष" और "समाजवादी" शब्द किस संशोधन द्वारा जोड़े गए?', ["42वां", "44वां", "52वां", "61वां"], "A"),
  q("GK", "मध्य प्रदेश की राजधानी क्या है?", ["इंदौर", "भोपाल", "ग्वालियर", "जबलपुर"], "B"),
  q("GK", "भारत के राष्ट्रपति का चुनाव किसके द्वारा होता है?", ["आम जनता", "लोकसभा सदस्य", "निर्वाचक मंडल", "सर्वोच्च न्यायालय"], "C"),
  q("GK", "मध्य प्रदेश का राज्य पशु कौन सा है?", ["बाघ", "बारहसिंगा", "चीतल", "चिंकारा"], "B"),
  q("GK", "भारत में प्रवाह की दृष्टि से सबसे लंबी नदी कौन सी है?", ["यमुना", "ब्रह्मपुत्र", "गंगा", "गोदावरी"], "C"),
  q("GK", "खजुराहो के मंदिर मध्य प्रदेश के किस जिले में स्थित हैं?", ["छतरपुर", "रीवा", "सतना", "पन्ना"], "A"),
  q("GK", "भारतीय संविधान सभा के अध्यक्ष कौन थे?", ["जवाहरलाल नेहरू", "डॉ. राजेंद्र प्रसाद", "डॉ. बी.आर. अंबेडकर", "सरदार पटेल"], "B"),
  q("GK", "मध्य प्रदेश में साँची का स्तूप मुख्यतः किस धर्म से संबंधित है?", ["जैन", "हिंदू", "बौद्ध", "सिख"], "C"),
  q("GK", "भारत का राष्ट्रीय पक्षी कौन सा है?", ["मोर", "कबूतर", "तोता", "बाज़"], "A"),
  q("GK", 'मध्य प्रदेश के किस शहर को "झीलों की नगरी" (सिटी ऑफ लेक्स) कहा जाता है?', ["इंदौर", "भोपाल", "जबलपुर", "ग्वालियर"], "B"),
  q("GK", "स्वतंत्र भारत में पहला आम चुनाव किस वर्ष हुआ था?", ["1947", "1950", "1951-52", "1955"], "C"),
  q("GK", "क्षेत्रफल की दृष्टि से मध्य प्रदेश का सबसे बड़ा जिला कौन सा माना जाता है?", ["इंदौर", "छिंदवाड़ा", "भोपाल", "जबलपुर"], "B"),
  q("GK", "भारत रत्न सम्मान की शुरुआत किस वर्ष हुई थी?", ["1950", "1954", "1962", "1971"], "B"),
  q("GK", "मध्य प्रदेश की सबसे लंबी नदी कौन सी है?", ["ताप्ती", "नर्मदा", "चंबल", "क्षिप्रा"], "B"),
  q("GK", '"करो या मरो" (भारत छोड़ो आंदोलन) का नारा किसने दिया था?', ["सुभाष चंद्र बोस", "महात्मा गांधी", "भगत सिंह", "लाल बहादुर शास्त्री"], "B"),
  q("GK", "कान्हा राष्ट्रीय उद्यान मुख्यतः मध्य प्रदेश के किस जिले में स्थित है?", ["मंडला", "शहडोल", "बालाघाट", "सिवनी"], "A"),
  q("GK", "भारत के संविधान में मूल रूप से कुल कितने भाग (Parts) थे?", ["22", "25", "26", "12"], "A"),
  q("GK", "मध्य प्रदेश राज्य स्थापना दिवस कब मनाया जाता है?", ["1 नवंबर", "26 जनवरी", "15 अगस्त", "1 मई"], "A"),
  q("GK", "भारत का सबसे ऊँचा पर्वत शिखर कौन सा है?", ["कंचनजंघा", "नंदा देवी", "K2", "धौलागिरि"], "A"),
  q("GK", "पंचायती राज व्यवस्था को संवैधानिक दर्जा किस संशोधन द्वारा दिया गया?", ["72वां", "73वां", "74वां", "76वां"], "B"),

  // ---------- MATH_REASONING (20) ----------
  q("MATH_REASONING", "15 का 20% कितना होता है?", ["2", "3", "4", "5"], "B"),
  q("MATH_REASONING", "यदि किसी वस्तु का क्रय मूल्य ₹500 है और उसे ₹600 में बेचा जाता है, तो लाभ प्रतिशत क्या होगा?", ["10%", "15%", "20%", "25%"], "C"),
  q("MATH_REASONING", "एक संख्या का 3/4 भाग 24 है, तो वह संख्या क्या है?", ["28", "30", "32", "36"], "C"),
  q("MATH_REASONING", "दो संख्याओं का अनुपात 3:5 है और उनका योग 40 है। बड़ी संख्या क्या है?", ["15", "20", "25", "30"], "C"),
  q("MATH_REASONING", "यदि A:B = 2:3 और B:C = 4:5 है, तो A:B:C क्या होगा?", ["8:12:15", "2:3:5", "4:6:5", "8:15:12"], "A"),
  q("MATH_REASONING", "श्रृंखला को पूरा करें: 2, 6, 12, 20, 30, ?", ["40", "42", "44", "36"], "B"),
  q("MATH_REASONING", "यदि 5 आदमी किसी काम को 12 दिन में पूरा करते हैं, तो 6 आदमी उसी काम को कितने दिन में पूरा करेंगे?", ["8", "9", "10", "11"], "C"),
  q("MATH_REASONING", "एक ट्रेन 60 किमी/घंटा की चाल से 3 घंटे में कितनी दूरी तय करेगी?", ["150 किमी", "180 किमी", "200 किमी", "210 किमी"], "B"),
  q("MATH_REASONING", "यदि किसी संख्या को 5 से गुणा करके 8 जोड़ा जाए तो परिणाम 48 आता है, वह संख्या क्या है?", ["6", "7", "8", "9"], "C"),
  q("MATH_REASONING", "साधारण ब्याज पर ₹1000 की राशि 2 वर्ष में 10% वार्षिक दर से कितना ब्याज देगी?", ["₹100", "₹150", "₹200", "₹250"], "C"),
  q("MATH_REASONING", 'कोडिंग-डिकोडिंग: यदि CAT को "DBU" लिखा जाता है, तो DOG को कैसे लिखा जाएगा?', ["EPH", "EPI", "FQH", "EQH"], "A"),
  q("MATH_REASONING", "राम, श्याम का पिता है और मोहन, श्याम का भाई है। मोहन का राम से क्या संबंध है?", ["पिता", "पुत्र", "भाई", "चाचा"], "B"),
  q("MATH_REASONING", "पुस्तक : पढ़ना :: भोजन : ?", ["पकाना", "खाना", "बेचना", "खरीदना"], "B"),
  q("MATH_REASONING", "विषम शब्द चुनें:", ["त्रिभुज", "वर्ग", "वृत्त", "आयत"], "C"),
  q("MATH_REASONING", "यदि किसी घड़ी में ठीक 3 बजे हैं, तो घंटे की सुई और मिनट की सुई के बीच का कोण क्या होगा?", ["60°", "90°", "75°", "45°"], "B"),
  q("MATH_REASONING", "एक वर्ग की भुजा 6 सेमी है, तो उसका क्षेत्रफल क्या होगा?", ["24 वर्ग सेमी", "30 वर्ग सेमी", "36 वर्ग सेमी", "42 वर्ग सेमी"], "C"),
  q("MATH_REASONING", "यदि किसी संख्या का वर्ग 144 है, तो वह संख्या क्या है?", ["10", "11", "12", "14"], "C"),
  q("MATH_REASONING", "100 में से 35% घटाने पर क्या शेष बचेगा?", ["55", "60", "65", "70"], "C"),
  q("MATH_REASONING", "श्रृंखला पूरी करें: A, C, E, G, ?", ["H", "I", "J", "K"], "B"),
  q("MATH_REASONING", "यदि 8 पेन की कीमत ₹96 है, तो 5 पेन की कीमत क्या होगी?", ["₹50", "₹55", "₹60", "₹65"], "C"),

  // ---------- HINDI (15) ----------
  q("HINDI", '"अग्नि" का पर्यायवाची शब्द चुनें:', ["जल", "पावक", "पवन", "गगन"], "B"),
  q("HINDI", '"दिन" का विलोम शब्द है:', ["रात", "प्रकाश", "सुबह", "शाम"], "A"),
  q("HINDI", '"जो कठिनाई से प्राप्त हो" के लिए एक शब्द है:', ["दुर्लभ", "सुलभ", "अलभ्य", "दुष्प्राप्य"], "D"),
  q("HINDI", '"राम ने रावण को मारा" वाक्य में रेखांकित शब्द "राम" में कौन सा कारक है?', ["कर्ता", "कर्म", "करण", "संप्रदान"], "A"),
  q("HINDI", '"नाक में दम करना" मुहावरे का अर्थ है:', ["परेशान करना", "खुश होना", "चुप रहना", "डरना"], "A"),
  q("HINDI", '"सूर्य" का पर्यायवाची शब्द नहीं है:', ["भास्कर", "दिनकर", "रजनीश", "आदित्य"], "C"),
  q("HINDI", '"विद्यालय" शब्द का सही संधि विच्छेद है:', ["विद्या+आलय", "विद्य+आलय", "विद्या+लय", "विद्यालय+अ"], "A"),
  q("HINDI", '"काला अक्षर भैंस बराबर" मुहावरे का अर्थ है:', ["बहुत पढ़ा-लिखा होना", "बिल्कुल अनपढ़ होना", "चालाक होना", "ईमानदार होना"], "B"),
  q("HINDI", "निम्नलिखित में से शुद्ध वर्तनी चुनें:", ["आशीर्वाद", "आशिर्वाद", "आर्शीवाद", "आशीर्वाध"], "A"),
  q("HINDI", '"जिसे जाना न जा सके" के लिए एक शब्द है:', ["अगम्य", "अज्ञेय", "अनजान", "अपरिचित"], "B"),
  q("HINDI", '"हिमालय" शब्द में कौन सा समास है?', ["तत्पुरुष", "द्वंद्व", "बहुव्रीहि", "कर्मधारय"], "A"),
  q("HINDI", '"बड़ा" शब्द का स्त्रीलिंग रूप क्या है?', ["बड़ी", "बड़ा", "बड़े", "बड़ाई"], "A"),
  q("HINDI", '"पानी" शब्द का तत्सम रूप क्या है?', ["जल", "पय", "नीर", "वारि"], "A"),
  q("HINDI", "काव्यशास्त्र में परंपरागत रूप से रस के कितने प्रकार माने गए हैं?", ["7", "8", "9", "10"], "C"),
  q("HINDI", '"श्याम रोज़ स्कूल जाता है" — इस वाक्य में क्रिया का काल क्या है?', ["भूतकाल", "वर्तमानकाल", "भविष्यकाल", "कोई नहीं"], "B"),

  // ---------- ENGLISH (15) ----------
  q("ENGLISH", 'Choose the correct synonym of "Happy":', ["Sad", "Joyful", "Angry", "Tired"], "B"),
  q("ENGLISH", 'Choose the correct antonym of "Ancient":', ["Old", "Modern", "Historic", "Ordinary"], "B"),
  q("ENGLISH", "Fill in the blank: She ___ to the market yesterday.", ["go", "goes", "went", "going"], "C"),
  q("ENGLISH", "Identify the correctly spelled word:", ["Recieve", "Receive", "Receve", "Receeve"], "B"),
  q("ENGLISH", 'One word substitution: "A person who cannot read or write" is called:', ["Illiterate", "Literate", "Illegal", "Ignorant"], "A"),
  q("ENGLISH", 'Choose the correct article: "___ honest man is respected everywhere."', ["A", "An", "The", "No article"], "B"),
  q("ENGLISH", 'Identify the tense: "He has completed his homework."', ["Present Simple", "Present Perfect", "Past Perfect", "Future Perfect"], "B"),
  q("ENGLISH", "Choose the correctly punctuated sentence:", ["what is your name", "What is your name?", "What is your name!", "What, is your name?"], "B"),
  q("ENGLISH", 'Choose the plural form of "Child":', ["Childs", "Childes", "Children", "Childrens"], "C"),
  q("ENGLISH", 'Fill in the blank with the correct preposition: "The book is ___ the table."', ["in", "on", "at", "by"], "B"),
  q("ENGLISH", 'Choose the correct passive voice of "She writes a letter."', ["A letter is written by her", "A letter was written by her", "A letter is being written by her", "A letter has written by her"], "A"),
  q("ENGLISH", 'Identify the correct comparative degree: "This box is ___ than that one."', ["heavy", "heavier", "heaviest", "more heavy"], "B"),
  q("ENGLISH", 'Choose the correct meaning of the idiom "Break the ice":', ["To start a conversation", "To break something", "To end a relationship", "To freeze water"], "A"),
  q("ENGLISH", 'Choose the correct question tag: "You are coming, ___?"', ["are you", "aren't you", "isn't it", "don't you"], "B"),
  q("ENGLISH", 'Identify the noun in the sentence: "The dog barked loudly."', ["barked", "loudly", "dog", "the"], "C"),

  // ---------- COMPUTER (15) ----------
  q("COMPUTER", "CPU का पूर्ण रूप क्या है?", ["Central Processing Unit", "Central Program Unit", "Computer Processing Unit", "Central Processor Utility"], "A"),
  q("COMPUTER", "निम्न में से कौन इनपुट डिवाइस है?", ["प्रिंटर", "मॉनिटर", "कीबोर्ड", "स्पीकर"], "C"),
  q("COMPUTER", "RAM का पूर्ण रूप क्या है?", ["Random Access Memory", "Read Access Memory", "Random Active Memory", "Read Only Memory"], "A"),
  q("COMPUTER", "MS Word किस प्रकार का सॉफ्टवेयर है?", ["ऑपरेटिंग सिस्टम", "वर्ड प्रोसेसिंग सॉफ्टवेयर", "एंटीवायरस", "डेटाबेस"], "B"),
  q("COMPUTER", "इंटरनेट पर किसी वेबसाइट के पते को क्या कहते हैं?", ["HTML", "URL", "HTTP", "ISP"], "B"),
  q("COMPUTER", "कंप्यूटर की स्थायी (नॉन-वोलेटाइल) मेमोरी कौन सी है?", ["RAM", "ROM", "Cache", "Register"], "B"),
  q("COMPUTER", "फ़ाइल को स्थायी रूप से (Recycle Bin में भेजे बिना) हटाने के लिए किस कुंजी संयोजन का प्रयोग होता है?", ["Delete", "Shift+Delete", "Backspace", "Ctrl+Delete"], "B"),
  q("COMPUTER", "निम्न में से कौन आउटपुट डिवाइस है?", ["माउस", "स्कैनर", "मॉनिटर", "कीबोर्ड"], "C"),
  q("COMPUTER", "MS Excel में किसी पंक्ति और स्तंभ के मिलन बिंदु को क्या कहते हैं?", ["टेबल", "सेल", "फ़ील्ड", "रो"], "B"),
  q("COMPUTER", "कंप्यूटर वायरस से बचाव के लिए सामान्यतः क्या प्रयोग किया जाता है?", ["एंटीवायरस", "फ़ायरवॉल", "दोनों A और B", "कोई नहीं"], "C"),
  q("COMPUTER", "WWW का पूर्ण रूप क्या है?", ["World Wide Web", "World Web Wide", "Wide World Web", "Web World Wide"], "A"),
  q("COMPUTER", "किसी दस्तावेज़ को सुरक्षित (Save) करने के लिए किस शॉर्टकट कुंजी का प्रयोग होता है?", ["Ctrl+P", "Ctrl+S", "Ctrl+C", "Ctrl+V"], "B"),
  q("COMPUTER", "निम्न में से कौन एक ऑपरेटिंग सिस्टम है?", ["MS Word", "Windows", "Photoshop", "Excel"], "B"),
  q("COMPUTER", "ईमेल पते में किस चिन्ह का प्रयोग होता है?", ["#", "@", "&", "%"], "B"),
  q("COMPUTER", "1 बाइट में कितने बिट्स होते हैं?", ["4", "8", "16", "32"], "B"),

  // ---------- RURAL_ECONOMY (15) ----------
  q("RURAL_ECONOMY", "पंचायती राज व्यवस्था को संवैधानिक दर्जा किस वर्ष प्राप्त हुआ (73वां संशोधन प्रभावी हुआ)?", ["1989", "1992", "1993", "1996"], "C"),
  q("RURAL_ECONOMY", "पंचायती राज व्यवस्था में सामान्यतः कितने स्तर होते हैं?", ["2", "3", "4", "5"], "B"),
  q("RURAL_ECONOMY", "ग्राम पंचायत के प्रधान को क्या कहा जाता है?", ["सरपंच", "प्रधानमंत्री", "कलेक्टर", "विधायक"], "A"),
  q("RURAL_ECONOMY", "पंचायती राज व्यवस्था का सबसे निचला स्तर कौन सा है?", ["जिला पंचायत", "जनपद पंचायत", "ग्राम पंचायत", "ब्लॉक पंचायत"], "C"),
  q("RURAL_ECONOMY", "मध्य प्रदेश में पंचायती राज व्यवस्था के तहत जिला स्तर की संस्था को क्या कहा जाता है?", ["जिला परिषद", "जिला पंचायत", "जिला समिति", "जिला बोर्ड"], "B"),
  q("RURAL_ECONOMY", "73वें संविधान संशोधन अधिनियम से पंचायतों से संबंधित कौन सी अनुसूची जोड़ी गई?", ["10वीं", "11वीं", "12वीं", "9वीं"], "B"),
  q("RURAL_ECONOMY", "मनरेगा (MGNREGA) के तहत एक ग्रामीण परिवार को वर्ष में न्यूनतम कितने दिन के रोजगार की गारंटी है?", ["50 दिन", "100 दिन", "150 दिन", "200 दिन"], "B"),
  q("RURAL_ECONOMY", "73वें संविधान संशोधन के अनुसार पंचायतों में महिलाओं के लिए न्यूनतम आरक्षण कितना निर्धारित है?", ["25%", "30%", "33%", "50%"], "C"),
  q("RURAL_ECONOMY", "ग्रामीण अर्थव्यवस्था में प्राथमिक क्षेत्र (Primary Sector) के अंतर्गत कौन सी गतिविधि आती है?", ["कृषि", "बैंकिंग", "शिक्षा", "परिवहन"], "A"),
  q("RURAL_ECONOMY", "जनपद पंचायत (मध्यवर्ती स्तर) के प्रधान को क्या कहा जाता है?", ["सरपंच", "अध्यक्ष", "मुखिया", "प्रमुख"], "B"),
  q("RURAL_ECONOMY", "भारत में पंचायती राज व्यवस्था की सिफारिश सबसे पहले किस समिति ने की थी?", ["अशोक मेहता समिति", "बलवंत राय मेहता समिति", "एल.एम. सिंघवी समिति", "जी.वी.के. राव समिति"], "B"),
  q("RURAL_ECONOMY", '"प्रधानमंत्री ग्राम सड़क योजना" मुख्यतः किस क्षेत्र से संबंधित है?', ["सिंचाई", "ग्रामीण सड़क निर्माण", "शिक्षा", "स्वास्थ्य"], "B"),
  q("RURAL_ECONOMY", "पंचायती राज व्यवस्था में जिला पंचायत के प्रधान को क्या कहा जाता है?", ["अध्यक्ष", "सरपंच", "कलेक्टर", "मुख्य कार्यपालन अधिकारी"], "A"),
  q("RURAL_ECONOMY", "किस योजना के तहत ग्रामीण क्षेत्रों में पात्र परिवारों को पक्का आवास उपलब्ध कराया जाता है?", ["प्रधानमंत्री आवास योजना (ग्रामीण)", "उज्ज्वला योजना", "जन धन योजना", "स्वच्छ भारत मिशन"], "A"),
  q("RURAL_ECONOMY", "सहकारी समितियाँ ग्रामीण अर्थव्यवस्था को मुख्यतः किस क्षेत्र में सहयोग देती हैं?", ["ऋण एवं विपणन", "शिक्षा", "स्वास्थ्य", "मनोरंजन"], "A"),
];

async function main() {
  if (rows.length !== 100) {
    throw new Error(`Expected 100 questions, got ${rows.length}`);
  }
  const bySection = new Map<string, number>();
  for (const r of rows) bySection.set(r.section_code, (bySection.get(r.section_code) ?? 0) + 1);
  console.log("Section breakdown:", Object.fromEntries(bySection));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Questions");
  const buffer: Buffer = XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });

  const uploader = process.env.SEED_UPLOADER_PHONE
    ? await prisma.user.upsert({
        where: { phone: process.env.SEED_UPLOADER_PHONE },
        update: {},
        create: { phone: process.env.SEED_UPLOADER_PHONE, name: "Content Team" },
      })
    : await prisma.user.findFirst({ orderBy: { createdAt: "asc" } });
  if (!uploader) {
    throw new Error("No user rows exist yet to attribute this upload to. Sign in once first, or set SEED_UPLOADER_PHONE.");
  }

  let paper = await prisma.paper.findFirst({ where: { isFree: true } });
  if (!paper) {
    const maxSequence = await prisma.paper.aggregate({ _max: { sequenceNo: true } });
    paper = await prisma.paper.create({
      data: {
        title: "MP Patwari Free Mock Test 01",
        sequenceNo: (maxSequence._max.sequenceNo ?? 0) + 1,
        isFree: true,
        totalQuestions: 100,
        totalMarks: 200,
        durationMinutes: 180,
        negativeMarkingRatio: 0.25,
        isActive: true,
      },
    });
    console.log("Created paper:", paper.id, paper.title);
  } else {
    console.log("Using existing free paper:", paper.id, paper.title);
  }

  const result = await parseAndImportQuestions(buffer, paper.id, uploader.id, "free-mock-test-01.xlsx");
  console.log("Import result:", result);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
