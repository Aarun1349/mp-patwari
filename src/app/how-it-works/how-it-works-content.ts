import type { Lang } from "../landing-content";

const content: Record<Lang, {
  kicker: string;
  title: string;
  step1Title: string;
  step1Desc: string;
  step2Title: string;
  step2Desc: string;
  step3Title: string;
  step3Desc: string;
  examTitle: string;
  examBullets: string[];
  afterTitle: string;
  afterPre: string;
  afterLinkText: string;
  afterPost: string;
  disclaimerPre: string;
  disclaimerLinkText: string;
}> = {
  hi: {
    kicker: "प्रोसेस",
    title: "यह कैसे काम करता है",
    step1Title: "1. अकाउंट बनाएं",
    step1Desc: "अपने मोबाइल नंबर और वन-टाइम OTP से रजिस्टर करें — कोई पासवर्ड याद रखने की ज़रूरत नहीं।",
    step2Title: "2. अपना फ्री मॉक टेस्ट दें",
    step2Desc:
      "हर अकाउंट को एक फुल-लेंथ फ्री मॉक टेस्ट मिलता है, वही इंटरफ़ेस, टाइमर और नियम जो हमारे पेड टेस्ट में हैं।",
    step3Title: "3. ज़्यादा टेस्ट के लिए पैकेज खरीदें",
    step3Desc: "अपनी तैयारी की ज़रूरत के हिसाब से 5, 10 या 20-टेस्ट पैकेज चुनें।",
    examTitle: "परीक्षा का अनुभव",
    examBullets: [
      "परीक्षा फुलस्क्रीन मोड में चलती है। फुलस्क्रीन से बाहर निकलना, टैब बदलना, या विंडो मिनिमाइज़ करना उल्लंघन (violation) माना जाता है।",
      "3 उल्लंघनों के बाद, आपका अटेम्प्ट अपने-आप लॉक होकर, अब तक दर्ज किए गए उत्तरों के साथ सबमिट हो जाता है।",
      "काउंटडाउन टाइमर हमारे सर्वर द्वारा नियंत्रित होता है, आपके ब्राउज़र से नहीं — टैब बंद करने से घड़ी नहीं रुकती।",
      "समय समाप्त होने पर परीक्षा अपने-आप सबमिट हो जाती है।",
      "आप हर टेस्ट पेपर सिर्फ़ एक बार दे सकते हैं।",
      "परीक्षा के दौरान राइट-क्लिक, टेक्स्ट सिलेक्शन और कॉपी/पेस्ट बंद रहते हैं।",
    ],
    afterTitle: "सबमिट करने के बाद",
    afterPre: "आप तुरंत अपना स्कोर, एक्यूरेसी और सेक्शन-वार ब्रेकडाउन अपने",
    afterLinkText: "प्रैक्टिस हिस्ट्री",
    afterPost: "पेज पर देख पाएंगे।",
    disclaimerPre: "रिफंड और सपोर्ट जानकारी के लिए हमारा",
    disclaimerLinkText: "डिस्क्लेमर व नीतियाँ",
  },
  en: {
    kicker: "Process",
    title: "How It Works",
    step1Title: "1. Create an account",
    step1Desc: "Register with your mobile number and a one-time OTP — no password to remember.",
    step2Title: "2. Take your free mock test",
    step2Desc:
      "Every account gets one full-length free mock test, with the same interface, timer, and rules as our paid tests.",
    step3Title: "3. Buy a package for more tests",
    step3Desc: "Choose a 5, 10, or 20-test package based on how much practice you need.",
    examTitle: "The exam experience",
    examBullets: [
      "The exam runs in fullscreen mode. Exiting fullscreen, switching tabs, or minimizing the window counts as a violation.",
      "After 3 violations, your attempt is automatically locked and submitted with whatever answers you've recorded so far.",
      "The countdown timer is controlled by our server, not your browser — closing the tab does not stop the clock.",
      "The exam auto-submits when time runs out.",
      "You can attempt each test paper only once.",
      "Right-click, text selection, and copy/paste are disabled during the exam.",
    ],
    afterTitle: "After you submit",
    afterPre: "You'll immediately see your score, accuracy, and a section-wise breakdown on your",
    afterLinkText: "practice history",
    afterPost: "page.",
    disclaimerPre: "See our",
    disclaimerLinkText: "Disclaimer & Policies",
  },
};

export default content;
