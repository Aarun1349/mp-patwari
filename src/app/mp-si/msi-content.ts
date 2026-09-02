import type { Lang } from "../landing-content";
import type { ExamLandingContent } from "@/components/ExamSeoLanding";

// MP Police SI / Subedar 2026 (MPESB) landing content.
// Prelims pattern verified from MPESB-aligned prep sources (Sept 2026): 100 MCQ,
// 120 min, NO negative marking, qualifying. The exact per-section marks split is
// reported differently across portals, so the page states the confirmed facts and
// points candidates to the official MPESB notification (esb.mp.gov.in).

export const msiLanding: Record<Lang, ExamLandingContent> = {
  hi: {
    eyebrow: "MP पुलिस SI / सूबेदार · प्रीलिम्स · 2026",
    heroTitlePre: "MP SI / सूबेदार की ",
    heroTitleAccent: "असली परीक्षा जैसी",
    heroTitlePost: " तैयारी यहीं करें",
    lede:
      "MPESB SI / सूबेदार भर्ती 2026 की अधिसूचना जारी — 9 सितंबर से आवेदन। प्रीलिम्स जैसा ऑनलाइन मॉक टेस्ट: वही 100 प्रश्न, वही 2 घंटे, कोई नेगेटिव मार्किंग नहीं। पहला फुल टेस्ट बिल्कुल मुफ़्त, बिना कार्ड डिटेल के।",
    ctaPrimary: "फ्री मॉक टेस्ट शुरू करें →",
    ctaGhost: "एग्ज़ाम पैटर्न देखें",
    stats: [
      { value: "100", label: "कुल प्रश्न" },
      { value: "100", label: "कुल अंक" },
      { value: "2 घं.", label: "अवधि" },
      { value: "₹0", label: "पहला टेस्ट" },
    ],
    admitCard: {
      t1: "PRACTICE HALL TICKET",
      t2: "अभ्यास प्रवेश पत्र",
      name: "उम्मीदवार का नाम",
      role: "MP SI / सूबेदार · प्रीलिम्स",
      rows: [
        { label: "परीक्षा", value: "PRELIMS MOCK 01" },
        { label: "कुल प्रश्न", value: "100" },
        { label: "कुल अंक", value: "100" },
        { label: "अवधि", value: "120 MIN" },
        { label: "नेगेटिव मार्किंग", value: "नहीं" },
      ],
      stamp: "फ्री टेस्ट",
    },
    subjectsKicker: "मॉक टेस्ट",
    subjectsTitle: "फ्री प्रीलिम्स मॉक टेस्ट",
    subjectsSub:
      "SI / सूबेदार प्रीलिम्स पैटर्न पर बने फुल-लेंथ मॉक — बिल्कुल मुफ़्त, असली CBT इंटरफ़ेस के साथ।",
    subjects: [
      { name: "फ्री प्रीलिम्स मॉक 1", live: true },
      { name: "फ्री प्रीलिम्स मॉक 2", live: true },
    ],
    liveBadge: "उपलब्ध",
    soonBadge: "जल्द आ रहा है",
    startCta: "फ्री टेस्ट दें →",
    patternKicker: "एग्ज़ाम पैटर्न",
    patternTitle: "हर मॉक प्रीलिम्स पैटर्न पर बना है",
    patternSubjectHeader: "विवरण",
    patternWeightHeader: "जानकारी",
    patternRows: [
      { subject: "परीक्षा मोड", weight: "ऑनलाइन (CBT)" },
      { subject: "कुल प्रश्न", weight: "100" },
      { subject: "कुल अंक", weight: "100" },
      { subject: "अवधि", weight: "2 घंटे" },
      { subject: "नेगेटिव मार्किंग", weight: "नहीं" },
    ],
    patternBig: "100",
    patternNote:
      "प्रीलिम्स क्वालिफाइंग है (अंक अंतिम चयन में नहीं जुड़ते)। विषय: सामान्य ज्ञान, सामान्य विज्ञान, गणित एवं तर्कशक्ति, सामान्य हिंदी, समसामयिकी, कंप्यूटर, म.प्र. सामान्य ज्ञान। विषयवार अंक-वितरण व मेन्स पैटर्न (नेगेटिव मार्किंग सहित) की पुष्टि के लिए आधिकारिक अधिसूचना esb.mp.gov.in देखें।",
    whyKicker: "क्यों ज़रूरी है",
    whyTitle: "सिर्फ़ पढ़ाई काफ़ी नहीं — असली परीक्षा जैसा अभ्यास ज़रूरी है",
    whyCards: [
      {
        icon: "क",
        title: "कंप्यूटर स्क्रीन की आदत",
        desc: "असली CBT परीक्षा में पहली बार माउस से आंसर सेलेक्ट न करें — यहाँ पहले से अभ्यास हो जाता है।",
      },
      {
        icon: "स",
        title: "समय का सही बँटवारा",
        desc: "100 प्रश्न, 2 घंटे — असली टाइमर के साथ अभ्यास से पता चलता है कि किस भाग में कितना समय देना है।",
      },
      {
        icon: "रि",
        title: "कमज़ोर टॉपिक पकड़ें",
        desc: "हर टेस्ट के बाद सेक्शन-वाइज़ स्कोर और कमज़ोर टॉपिक सामने आते हैं, अगली तैयारी उसी हिसाब से करें।",
      },
    ],
    faqKicker: "सवाल-जवाब",
    faqTitle: "अक्सर पूछे जाने वाले सवाल",
    faqs: [
      {
        q: "MP SI / सूबेदार प्रीलिम्स में कितने प्रश्न और कितने अंक होते हैं?",
        a: "उपलब्ध जानकारी के अनुसार प्रीलिम्स में 100 प्रश्न, 100 अंक और 2 घंटे की अवधि होती है, और इसमें कोई नेगेटिव मार्किंग नहीं होती। परीक्षा कंप्यूटर आधारित (CBT) होती है।",
      },
      {
        q: "क्या प्रीलिम्स में नेगेटिव मार्किंग है?",
        a: "उपलब्ध जानकारी के अनुसार प्रीलिम्स में नेगेटिव मार्किंग नहीं है और यह क्वालिफाइंग होती है। मेन्स परीक्षा में नेगेटिव मार्किंग (1/3) लागू होती है — पुष्टि के लिए आधिकारिक अधिसूचना देखें।",
      },
      {
        q: "क्या पहला मॉक टेस्ट मुफ़्त है?",
        a: "हां, हर अकाउंट को फुल-लेंथ फ्री मॉक टेस्ट मिलते हैं — वही इंटरफ़ेस, टाइमर और नियम, बिना कोई कार्ड डिटेल दिए।",
      },
      {
        q: "क्या यह MPESB की आधिकारिक परीक्षा या वेबसाइट है?",
        a: "नहीं। ExamsExpress एक स्वतंत्र प्रैक्टिस प्लेटफ़ॉर्म है और MPESB से संबद्ध नहीं है। हमारे टेस्ट सिर्फ़ आधिकारिक अधिसूचना में बताए गए पैटर्न पर आधारित हैं। ताज़ा जानकारी के लिए esb.mp.gov.in देखें।",
      },
    ],
    finalTitle: "आज ही अपना पहला MP SI प्रीलिम्स मॉक टेस्ट दें",
    finalDesc: "बिल्कुल मुफ़्त, बिना कार्ड डिटेल के, सिर्फ़ 5 मिनट में शुरू करें।",
    finalCta: "फ्री मॉक टेस्ट शुरू करें →",
    disclaimer:
      "ExamsExpress एक स्वतंत्र प्रैक्टिस प्लेटफ़ॉर्म है, MPESB से असंबद्ध। परीक्षा पैटर्न, तिथियाँ व पात्रता की पुष्टि के लिए आधिकारिक वेबसाइट esb.mp.gov.in अवश्य देखें।",
  },
  en: {
    eyebrow: "MP Police SI / Subedar · Prelims · 2026",
    heroTitlePre: "Prepare for MP SI / Subedar on the ",
    heroTitleAccent: "real exam interface",
    heroTitlePost: "",
    lede:
      "The MPESB SI / Subedar 2026 notification is out — applications from 9 September. Online Prelims-pattern mock tests: the same 100 questions, the same 2 hours, no negative marking. Your first full test is completely free, no card required.",
    ctaPrimary: "Start Free Mock Test →",
    ctaGhost: "View Exam Pattern",
    stats: [
      { value: "100", label: "Questions" },
      { value: "100", label: "Marks" },
      { value: "2 hr", label: "Duration" },
      { value: "₹0", label: "First Test" },
    ],
    admitCard: {
      t1: "PRACTICE HALL TICKET",
      t2: "Practice Admit Card",
      name: "Candidate Name",
      role: "MP SI / Subedar · Prelims",
      rows: [
        { label: "Exam", value: "PRELIMS MOCK 01" },
        { label: "Questions", value: "100" },
        { label: "Total Marks", value: "100" },
        { label: "Duration", value: "120 MIN" },
        { label: "Negative Marking", value: "None" },
      ],
      stamp: "FREE TEST",
    },
    subjectsKicker: "MOCK TESTS",
    subjectsTitle: "Free Prelims mock tests",
    subjectsSub:
      "Full-length mocks built on the SI / Subedar Prelims pattern — completely free, on a real CBT interface.",
    subjects: [
      { name: "Free Prelims Mock 1", live: true },
      { name: "Free Prelims Mock 2", live: true },
    ],
    liveBadge: "Available",
    soonBadge: "Coming soon",
    startCta: "Take free test →",
    patternKicker: "EXAM PATTERN",
    patternTitle: "Every mock follows the Prelims pattern",
    patternSubjectHeader: "Detail",
    patternWeightHeader: "Information",
    patternRows: [
      { subject: "Exam mode", weight: "Online (CBT)" },
      { subject: "Total questions", weight: "100" },
      { subject: "Total marks", weight: "100" },
      { subject: "Duration", weight: "2 hours" },
      { subject: "Negative marking", weight: "None" },
    ],
    patternBig: "100",
    patternNote:
      "Prelims is qualifying (marks don't count toward final selection). Subjects: General Knowledge, General Science, Maths & Reasoning, General Hindi, Current Affairs, Computer, MP GK. For the exact section-wise marks and the Mains pattern (which has negative marking), confirm on the official MPESB notification at esb.mp.gov.in.",
    whyKicker: "WHY IT MATTERS",
    whyTitle: "Studying isn't enough — you need real exam-like practice",
    whyCards: [
      {
        icon: "1",
        title: "Get used to the screen",
        desc: "Don't select answers with a mouse for the first time in the real CBT exam — practice it here beforehand.",
      },
      {
        icon: "2",
        title: "Manage your time",
        desc: "100 questions, 2 hours — practicing with a real timer shows how much time each section really needs.",
      },
      {
        icon: "3",
        title: "Find weak topics",
        desc: "Get section-wise scores and weak topics after every test, and plan your next round accordingly.",
      },
    ],
    faqKicker: "FAQ",
    faqTitle: "Frequently Asked Questions",
    faqs: [
      {
        q: "How many questions and marks are there in MP SI / Subedar Prelims?",
        a: "Per available information, Prelims has 100 questions, 100 marks and a 2-hour duration, with no negative marking. It is a computer-based test (CBT).",
      },
      {
        q: "Is there negative marking in Prelims?",
        a: "Per available information, there is no negative marking in Prelims and it is qualifying. The Mains exam does have negative marking (1/3). Confirm on the official notification.",
      },
      {
        q: "Is the first mock test free?",
        a: "Yes. Every account gets full-length free mock tests — the same interface, timer and rules, with no card details required.",
      },
      {
        q: "Is this the official MPESB exam or website?",
        a: "No. ExamsExpress is an independent practice platform and is not affiliated with MPESB. Our tests are based only on the pattern described in the official notification. For the latest information, visit esb.mp.gov.in.",
      },
    ],
    finalTitle: "Take your first MP SI Prelims mock test today",
    finalDesc: "Completely free, no card required, get started in just 5 minutes.",
    finalCta: "Start Free Mock Test →",
    disclaimer:
      "ExamsExpress is an independent practice platform, not affiliated with MPESB. Always confirm the exam pattern, dates and eligibility on the official website esb.mp.gov.in.",
  },
};
