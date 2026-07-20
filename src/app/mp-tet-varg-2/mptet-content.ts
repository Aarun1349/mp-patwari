import type { Lang } from "../landing-content";

// Content blocks for the MP TET Varg 2 SEO pages. Kept as data (not JSX) so the
// same server-rendered renderer can emit crawlable HTML for every page and the
// lang toggle stays a thin client island. See StaticSeoPage.tsx.
export type Block =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "table"; head: string[]; rows: string[][] };

export type SeoPage = {
  kicker: string;
  title: string;
  intro: string;
  blocks: Block[];
};

// ---- Shared pattern facts (single source of truth, reused across pages) ----
// Verified 2026-07 from MPESB-aligned prep sources. The subject-vs-pedagogy
// split is reported differently by different portals, so every page attributes
// the pattern and tells candidates to confirm with the official MPESB
// notification — same honest framing the Patwari pages already use.

export const mptetLanding: Record<Lang, {
  eyebrow: string;
  h1: string;
  lede: string;
  ctaPrimary: string;
  ctaPattern: string;
  ctaSyllabus: string;
  highlightsTitle: string;
  highlights: { k: string; v: string }[];
  subjectsTitle: string;
  subjectsLede: string;
  subjects: { name: string; live: boolean }[];
  liveBadge: string;
  soonBadge: string;
  faqTitle: string;
  faqs: { q: string; a: string }[];
  disclaimer: string;
}> = {
  hi: {
    eyebrow: "MP TET वर्ग 2 · 2026",
    h1: "MP TET वर्ग 2 गणित मॉक टेस्ट 2026",
    lede:
      "MPESB वर्ग 2 शिक्षक भर्ती परीक्षा जैसा ऑनलाइन मॉक टेस्ट — वही 100 प्रश्न, वही 2 घंटे, कोई नेगेटिव मार्किंग नहीं। पहला फुल टेस्ट बिल्कुल मुफ़्त, बिना कार्ड डिटेल के।",
    ctaPrimary: "फ्री मॉक टेस्ट शुरू करें →",
    ctaPattern: "एग्ज़ाम पैटर्न देखें",
    ctaSyllabus: "पूरा सिलेबस देखें",
    highlightsTitle: "एक नज़र में परीक्षा",
    highlights: [
      { k: "कुल प्रश्न", v: "100" },
      { k: "कुल अंक", v: "100" },
      { k: "अवधि", v: "2 घंटे" },
      { k: "नेगेटिव मार्किंग", v: "नहीं" },
    ],
    subjectsTitle: "विषय",
    subjectsLede:
      "वर्ग 2 में उम्मीदवार एक विषय चुनते हैं। हम गणित से शुरुआत कर रहे हैं — बाक़ी विषय जल्द जोड़े जा रहे हैं।",
    subjects: [
      { name: "गणित (Mathematics)", live: true },
      { name: "विज्ञान (Science)", live: false },
      { name: "सामाजिक विज्ञान (Social Science)", live: false },
      { name: "हिंदी (Hindi)", live: false },
      { name: "अंग्रेज़ी (English)", live: false },
      { name: "संस्कृत (Sanskrit)", live: false },
    ],
    liveBadge: "उपलब्ध",
    soonBadge: "जल्द",
    faqTitle: "अक्सर पूछे जाने वाले सवाल",
    faqs: [
      {
        q: "MP TET वर्ग 2 में कितने प्रश्न और कितने अंक होते हैं?",
        a: "आधिकारिक अधिसूचना के अनुसार परीक्षा में 100 प्रश्न, 100 अंक और 2 घंटे की अवधि होती है, और कोई नेगेटिव मार्किंग नहीं होती। परीक्षा कंप्यूटर आधारित (CBT) होती है।",
      },
      {
        q: "क्या MP TET वर्ग 2 में नेगेटिव मार्किंग है?",
        a: "उपलब्ध जानकारी के अनुसार वर्ग 2 परीक्षा में नेगेटिव मार्किंग नहीं है — हर सही उत्तर पर 1 अंक मिलता है और ग़लत उत्तर पर कोई अंक नहीं कटता।",
      },
      {
        q: "क्या पहला मॉक टेस्ट मुफ़्त है?",
        a: "हां, हर अकाउंट को एक फुल-लेंथ फ्री मॉक टेस्ट मिलता है — वही इंटरफ़ेस, टाइमर और नियम जो पेड टेस्ट में हैं, बिना कोई कार्ड डिटेल दिए।",
      },
      {
        q: "क्या यह MPESB की आधिकारिक परीक्षा या वेबसाइट है?",
        a: "नहीं। ExamsExpress एक स्वतंत्र प्रैक्टिस प्लेटफ़ॉर्म है और MPESB से संबद्ध नहीं है। हमारे टेस्ट सिर्फ़ आधिकारिक अधिसूचना में बताए गए पैटर्न व सिलेबस पर आधारित हैं। ताज़ा व सटीक जानकारी के लिए esb.mp.gov.in देखें।",
      },
    ],
    disclaimer:
      "ExamsExpress एक स्वतंत्र प्रैक्टिस प्लेटफ़ॉर्म है, MPESB से असंबद्ध। परीक्षा पैटर्न, तिथियाँ व पात्रता की पुष्टि के लिए आधिकारिक वेबसाइट esb.mp.gov.in अवश्य देखें।",
  },
  en: {
    eyebrow: "MP TET Varg 2 · 2026",
    h1: "MP TET Varg 2 Maths Mock Test 2026",
    lede:
      "Online mock tests that replicate the MPESB Varg 2 teacher exam — the same 100 questions, the same 2 hours, no negative marking. Your first full test is completely free, no card required.",
    ctaPrimary: "Start Free Mock Test →",
    ctaPattern: "View Exam Pattern",
    ctaSyllabus: "View Full Syllabus",
    highlightsTitle: "The exam at a glance",
    highlights: [
      { k: "Total Questions", v: "100" },
      { k: "Total Marks", v: "100" },
      { k: "Duration", v: "2 hours" },
      { k: "Negative Marking", v: "None" },
    ],
    subjectsTitle: "Subjects",
    subjectsLede:
      "Varg 2 candidates choose one subject. We're launching with Mathematics — the other subjects are being added shortly.",
    subjects: [
      { name: "Mathematics", live: true },
      { name: "Science", live: false },
      { name: "Social Science", live: false },
      { name: "Hindi", live: false },
      { name: "English", live: false },
      { name: "Sanskrit", live: false },
    ],
    liveBadge: "Available",
    soonBadge: "Soon",
    faqTitle: "Frequently Asked Questions",
    faqs: [
      {
        q: "How many questions and marks are there in MP TET Varg 2?",
        a: "Per the official notification, the exam has 100 questions, 100 marks and a 2-hour duration, with no negative marking. It is a computer-based test (CBT).",
      },
      {
        q: "Is there negative marking in MP TET Varg 2?",
        a: "As per available information, there is no negative marking in the Varg 2 exam — every correct answer earns 1 mark and no marks are deducted for a wrong answer.",
      },
      {
        q: "Is the first mock test free?",
        a: "Yes. Every account gets one full-length free mock test — the same interface, timer and rules as the paid tests, with no card details required.",
      },
      {
        q: "Is this the official MPESB exam or website?",
        a: "No. ExamsExpress is an independent practice platform and is not affiliated with MPESB. Our tests are based only on the pattern and syllabus described in the official notification. For the latest and accurate information, visit esb.mp.gov.in.",
      },
    ],
    disclaimer:
      "ExamsExpress is an independent practice platform, not affiliated with MPESB. Always confirm the exam pattern, dates and eligibility on the official website esb.mp.gov.in.",
  },
};

export const mptetPattern: Record<Lang, SeoPage> = {
  hi: {
    kicker: "एग्ज़ाम पैटर्न",
    title: "MP TET वर्ग 2 एग्ज़ाम पैटर्न 2026",
    intro:
      "MPESB वर्ग 2 शिक्षक भर्ती परीक्षा कंप्यूटर आधारित (CBT) होती है। नीचे उपलब्ध जानकारी के आधार पर सामान्य पैटर्न दिया गया है — अंतिम पुष्टि के लिए आधिकारिक अधिसूचना (esb.mp.gov.in) अवश्य देखें।",
    blocks: [
      { type: "h2", text: "मुख्य बिंदु" },
      {
        type: "table",
        head: ["विवरण", "जानकारी"],
        rows: [
          ["परीक्षा मोड", "ऑनलाइन (CBT)"],
          ["कुल प्रश्न", "100"],
          ["कुल अंक", "100"],
          ["अवधि", "2 घंटे"],
          ["प्रश्न प्रकार", "बहुविकल्पीय (MCQ), 4 विकल्प"],
          ["नेगेटिव मार्किंग", "नहीं"],
          ["माध्यम", "हिंदी व अंग्रेज़ी"],
        ],
      },
      { type: "h2", text: "विषयवार वेटेज (सामान्य/प्रारंभिक भाग)" },
      {
        type: "p",
        text:
          "उपलब्ध रिपोर्ट्स के अनुसार सामान्य भाग में अंकों का वितरण इस प्रकार बताया जाता है। उम्मीदवार अपने चुने हुए विषय (जैसे गणित) पर विशेष ध्यान दें।",
      },
      {
        type: "table",
        head: ["भाग", "अंक"],
        rows: [
          ["सामान्य ज्ञान एवं समसामयिकी", "20"],
          ["सामान्य हिंदी", "20"],
          ["सामान्य अंग्रेज़ी", "10"],
          ["सामान्य गणित एवं रीज़निंग", "20"],
          ["सामान्य विज्ञान एवं पर्यावरण", "10"],
          ["बाल विकास एवं शिक्षाशास्त्र (Pedagogy)", "20"],
        ],
      },
      {
        type: "p",
        text:
          "इसके अतिरिक्त कुछ स्रोतों के अनुसार चुने गए विषय पर आधारित एक अलग विषय-विशिष्ट भाग भी होता है। सटीक भारांक व संरचना आधिकारिक अधिसूचना में देखें।",
      },
      { type: "h2", text: "तैयारी की सलाह" },
      {
        type: "ul",
        items: [
          "हर टॉपिक के बाद फुल-लेंथ मॉक टेस्ट देकर समय-प्रबंधन जाँचें।",
          "कोई नेगेटिव मार्किंग न होने के कारण कोई प्रश्न खाली न छोड़ें।",
          "कंप्यूटर स्क्रीन पर प्रैक्टिस करें ताकि असली CBT परीक्षा में सहज रहें।",
        ],
      },
    ],
  },
  en: {
    kicker: "EXAM PATTERN",
    title: "MP TET Varg 2 Exam Pattern 2026",
    intro:
      "The MPESB Varg 2 teacher recruitment exam is a computer-based test (CBT). The general pattern below is based on available information — confirm the final details in the official notification (esb.mp.gov.in).",
    blocks: [
      { type: "h2", text: "Key highlights" },
      {
        type: "table",
        head: ["Detail", "Information"],
        rows: [
          ["Exam mode", "Online (CBT)"],
          ["Total questions", "100"],
          ["Total marks", "100"],
          ["Duration", "2 hours"],
          ["Question type", "Multiple choice (MCQ), 4 options"],
          ["Negative marking", "None"],
          ["Medium", "Hindi & English"],
        ],
      },
      { type: "h2", text: "Section-wise weightage (general part)" },
      {
        type: "p",
        text:
          "As per available reports, marks in the general part are distributed as follows. Candidates should give special focus to their chosen subject (e.g. Mathematics).",
      },
      {
        type: "table",
        head: ["Section", "Marks"],
        rows: [
          ["General Knowledge & Current Affairs", "20"],
          ["General Hindi", "20"],
          ["General English", "10"],
          ["General Maths & Reasoning", "20"],
          ["General Science & Environment", "10"],
          ["Child Development & Pedagogy", "20"],
        ],
      },
      {
        type: "p",
        text:
          "Some sources also report a separate subject-specific section based on the chosen subject. Check the official notification for the exact weightage and structure.",
      },
      { type: "h2", text: "Preparation tips" },
      {
        type: "ul",
        items: [
          "Take full-length mocks after each topic to check your time management.",
          "Since there is no negative marking, do not leave any question blank.",
          "Practice on a computer screen so the real CBT exam feels familiar.",
        ],
      },
    ],
  },
};

export const mptetSyllabus: Record<Lang, SeoPage> = {
  hi: {
    kicker: "सिलेबस",
    title: "MP TET वर्ग 2 सिलेबस 2026 (गणित सहित)",
    intro:
      "नीचे MP TET वर्ग 2 का विषयवार सिलेबस दिया गया है, जिसमें हमारे पहले लॉन्च विषय — गणित — का विस्तृत टॉपिक-वार सिलेबस शामिल है।",
    blocks: [
      { type: "h2", text: "गणित (Mathematics)" },
      {
        type: "ul",
        items: [
          "संख्या पद्धति (Number System)",
          "प्रतिशत, अनुपात एवं समानुपात",
          "औसत, लाभ-हानि",
          "साधारण एवं चक्रवृद्धि ब्याज",
          "समय एवं कार्य, समय एवं दूरी",
          "पाइप एवं टंकी",
          "लघुत्तम एवं महत्तम समापवर्तक (LCM & HCF)",
          "क्रमचय एवं संचय, प्रायिकता",
          "बीजगणित (Algebra)",
          "ज्यामिति एवं क्षेत्रमिति (Geometry & Mensuration)",
          "सांख्यिकी (Statistics)",
        ],
      },
      { type: "h2", text: "बाल विकास एवं शिक्षाशास्त्र (Pedagogy)" },
      {
        type: "ul",
        items: [
          "बाल विकास की अवधारणाएँ एवं सिद्धांत",
          "अधिगम (Learning) के सिद्धांत",
          "अभिप्रेरणा एवं स्मृति",
          "समावेशी शिक्षा (Inclusive Education)",
          "सृजनात्मकता एवं व्यक्तित्व",
          "मूल्यांकन एवं कक्षा-प्रबंधन",
          "शैक्षिक मनोविज्ञान",
        ],
      },
      { type: "h2", text: "अन्य सामान्य विषय" },
      {
        type: "ul",
        items: [
          "सामान्य ज्ञान एवं समसामयिकी",
          "सामान्य हिंदी — व्याकरण, गद्यांश, समास, पर्यायवाची/विलोम, मुहावरे",
          "सामान्य अंग्रेज़ी — Grammar, Tenses, Voice, Comprehension, Vocabulary",
          "रीज़निंग",
          "सामान्य विज्ञान एवं पर्यावरण",
        ],
      },
      {
        type: "p",
        text:
          "यह सिलेबस उपलब्ध जानकारी पर आधारित है। विस्तृत व आधिकारिक सिलेबस PDF के लिए esb.mp.gov.in देखें।",
      },
    ],
  },
  en: {
    kicker: "SYLLABUS",
    title: "MP TET Varg 2 Syllabus 2026 (incl. Mathematics)",
    intro:
      "Below is the subject-wise MP TET Varg 2 syllabus, including a detailed topic-wise syllabus for our first launch subject — Mathematics.",
    blocks: [
      { type: "h2", text: "Mathematics" },
      {
        type: "ul",
        items: [
          "Number System",
          "Percentage, Ratio & Proportion",
          "Average, Profit & Loss",
          "Simple & Compound Interest",
          "Time & Work, Time & Distance",
          "Pipes & Cistern",
          "LCM & HCF",
          "Permutation & Combination, Probability",
          "Algebra",
          "Geometry & Mensuration",
          "Statistics",
        ],
      },
      { type: "h2", text: "Child Development & Pedagogy" },
      {
        type: "ul",
        items: [
          "Concepts and principles of child development",
          "Theories of learning",
          "Motivation and memory",
          "Inclusive education",
          "Creativity and personality",
          "Assessment and classroom management",
          "Educational psychology",
        ],
      },
      { type: "h2", text: "Other general subjects" },
      {
        type: "ul",
        items: [
          "General Knowledge & Current Affairs",
          "General Hindi — grammar, comprehension, samas, synonyms/antonyms, idioms",
          "General English — grammar, tenses, voice, comprehension, vocabulary",
          "Reasoning",
          "General Science & Environment",
        ],
      },
      {
        type: "p",
        text:
          "This syllabus is based on available information. For the detailed and official syllabus PDF, refer to esb.mp.gov.in.",
      },
    ],
  },
};

export const mptetEligibility: Record<Lang, SeoPage> = {
  hi: {
    kicker: "पात्रता",
    title: "MP TET वर्ग 2 पात्रता 2026",
    intro:
      "MP TET वर्ग 2 (माध्यमिक/उच्च प्राथमिक शिक्षक) के लिए सामान्य पात्रता नीचे दी गई है। सटीक शैक्षणिक योग्यता, आयु-सीमा व आरक्षण नियमों के लिए आधिकारिक अधिसूचना अवश्य देखें।",
    blocks: [
      { type: "h2", text: "सामान्य पात्रता" },
      {
        type: "ul",
        items: [
          "मान्यता प्राप्त विश्वविद्यालय से स्नातक (Graduation) या समकक्ष।",
          "संबंधित शिक्षक प्रशिक्षण योग्यता (जैसे B.Ed / D.El.Ed), नियमानुसार।",
          "उम्मीदवार का मध्य प्रदेश का मूल निवासी होना — नियमानुसार।",
        ],
      },
      { type: "h2", text: "महत्वपूर्ण नोट" },
      {
        type: "ul",
        items: [
          "न्यूनतम अंक प्रतिशत, आयु-सीमा व श्रेणी-वार छूट आधिकारिक अधिसूचना के अनुसार लागू होती है।",
          "आवेदन से पहले पात्रता की पुष्टि आधिकारिक वेबसाइट esb.mp.gov.in पर करें।",
        ],
      },
      {
        type: "p",
        text:
          "ExamsExpress केवल प्रैक्टिस मॉक टेस्ट प्रदान करता है; पात्रता व आवेदन आधिकारिक पोर्टल के माध्यम से ही होते हैं।",
      },
    ],
  },
  en: {
    kicker: "ELIGIBILITY",
    title: "MP TET Varg 2 Eligibility 2026",
    intro:
      "General eligibility for MP TET Varg 2 (middle/secondary teacher) is given below. For exact qualifications, age limits and reservation rules, always refer to the official notification.",
    blocks: [
      { type: "h2", text: "General eligibility" },
      {
        type: "ul",
        items: [
          "Graduation or equivalent from a recognized university.",
          "Relevant teacher-training qualification (e.g. B.Ed / D.El.Ed), as per rules.",
          "Domicile of Madhya Pradesh, as per rules.",
        ],
      },
      { type: "h2", text: "Important notes" },
      {
        type: "ul",
        items: [
          "Minimum percentage, age limits and category-wise relaxation apply as per the official notification.",
          "Confirm your eligibility on the official website esb.mp.gov.in before applying.",
        ],
      },
      {
        type: "p",
        text:
          "ExamsExpress only provides practice mock tests; eligibility and applications are handled solely through the official portal.",
      },
    ],
  },
};
