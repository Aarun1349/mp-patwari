import type { Lang } from "../landing-content";

const content: Record<Lang, {
  kicker: string;
  title: string;
  intro1: string;
  intro2: string;
  coverTitle: string;
  subjects: string[];
  disclaimerPre: string;
  disclaimerLinkText: string;
}> = {
  hi: {
    kicker: "परिचय",
    title: "ExamsExpress के बारे में",
    intro1:
      "MP पटवारी भर्ती परीक्षा मध्य प्रदेश कर्मचारी चयन बोर्ड (MPPEB/ESB) द्वारा ऑनलाइन आयोजित की जाती है। कई उम्मीदवारों के लिए यह पहला मौका होता है जब वे कंप्यूटर पर परीक्षा देते हैं — और अनजान इंटरफ़ेस, ऑन-स्क्रीन टाइमर, और माउस से नेविगेशन परीक्षा के दिन कीमती समय बर्बाद कर सकते हैं।",
    intro2:
      "ExamsExpress एक स्वतंत्र प्रैक्टिस प्लेटफ़ॉर्म है जो इसी कमी को पूरा करने के लिए बनाया गया है। हम असली परीक्षा के ऑनलाइन इंटरफ़ेस, टाइमर और नियमों को यथासंभव करीब से दोहराते हैं, ताकि आपका पहला कंप्यूटर-आधारित परीक्षा अनुभव प्रैक्टिस के दौरान हो, परीक्षा के दिन नहीं।",
    coverTitle: "हमारे टेस्ट किन विषयों को कवर करते हैं",
    subjects: [
      "सामान्य ज्ञान",
      "सामान्य गणित एवं रीज़निंग",
      "सामान्य हिंदी",
      "सामान्य अंग्रेज़ी",
      "कंप्यूटर ज्ञान",
      "ग्रामीण अर्थव्यवस्था एवं पंचायती राज",
    ],
    disclaimerPre: "ExamsExpress, MPPEB से संबद्ध नहीं है। अधिक जानकारी के लिए हमारा",
    disclaimerLinkText: "डिस्क्लेमर व नीतियाँ",
  },
  en: {
    kicker: "About",
    title: "About ExamsExpress",
    intro1:
      "The MP Patwari recruitment exam is conducted online by the Madhya Pradesh Employees Selection Board (MPPEB/ESB). For many candidates, this is the first time they take a computer-based exam — and the unfamiliar interface, on-screen timer, and mouse-based navigation can cost valuable time on exam day.",
    intro2:
      "ExamsExpress is an independent practice platform built to close that gap. We replicate the real exam's online interface, timer, and rules as closely as possible, so your first computer-based exam experience happens during practice, not on exam day.",
    coverTitle: "What our tests cover",
    subjects: [
      "General Knowledge",
      "General Math & Reasoning",
      "General Hindi",
      "General English",
      "Computer Knowledge",
      "Rural Economy & Panchayati Raj",
    ],
    disclaimerPre: "ExamsExpress is not affiliated with MPPEB. See our",
    disclaimerLinkText: "Disclaimer & Policies",
  },
};

export default content;
