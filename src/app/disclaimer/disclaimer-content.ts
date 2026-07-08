import type { Lang } from "../landing-content";

const content: Record<Lang, {
  kicker: string;
  title: string;
  notAffiliatedTitle: string;
  notAffiliatedBody: string;
  noRefundsTitle: string;
  noRefundsBody: string;
  technicalSupportTitle: string;
  technicalSupportBody: string;
  contentAccuracyTitle: string;
  contentAccuracyBody: string;
  contactTitle: string;
  contactBody: string;
}> = {
  hi: {
    kicker: "कानूनी सूचना",
    title: "डिस्क्लेमर व नीतियाँ",
    notAffiliatedTitle: "MPPEB से असंबद्ध",
    notAffiliatedBody:
      "ExamsExpress एक स्वतंत्र, निजी तौर पर संचालित प्रैक्टिस प्लेटफ़ॉर्म है। हम मध्य प्रदेश कर्मचारी चयन बोर्ड (MPPEB) से किसी भी प्रकार संबद्ध, अनुमोदित या जुड़े हुए नहीं हैं। हमारे मॉक टेस्ट, MPPEB की सार्वजनिक रूप से उपलब्ध आधिकारिक अधिसूचनाओं में वर्णित पैटर्न और सिलेबस के आधार पर, स्वतंत्र रूप से केवल प्रैक्टिस के उद्देश्य से बनाए गए हैं। प्रामाणिक परीक्षा जानकारी, एडमिट कार्ड और परिणाम के लिए हमेशा MPPEB की आधिकारिक वेबसाइट और अधिसूचनाओं को ही देखें।",
    noRefundsTitle: "एक बार का भुगतान, कोई रिफंड नहीं",
    noRefundsBody:
      "ExamsExpress पर सभी टेस्ट पैकेज एक बार की डिजिटल खरीद हैं। खरीदने के बाद, किसी पैकेज को रिफंड, एक्सचेंज या रद्द नहीं किया जा सकता — चाहे आप अपने स्कोर से असंतुष्ट हों, अपना मन बदल लें, या एक्सपायर होने से पहले अपने सभी टेस्ट उपयोग न करें। चूंकि टेस्ट कंटेंट तक पहुंच खरीद के तुरंत बाद मिल जाती है, इसे किसी भी अन्य डिजिटल-गुड्स खरीद की तरह ही माना जाता है। हम सुझाव देते हैं कि पैकेज खरीदने से पहले प्लेटफ़ॉर्म को परखने के लिए अपना फ्री टेस्ट इस्तेमाल करें।",
    technicalSupportTitle: "तकनीकी समस्या सहायता",
    technicalSupportBody:
      "यदि आपको किसी पेड परीक्षा के दौरान सक्रिय रूप से टेस्ट देते समय कोई वास्तविक तकनीकी समस्या आती है — उदाहरण के लिए प्लेटफ़ॉर्म क्रैश हो जाए, फ़्रीज़ हो जाए, या किसी तरह विफल हो जाए जिससे आपका अटेम्प्ट बर्बाद हो जाए — तो 24 घंटे के भीतर support@examsexpress.in पर अपने रजिस्टर्ड मोबाइल नंबर, टेस्ट के नाम और समस्या के संक्षिप्त विवरण के साथ संपर्क करें। हम इसकी समीक्षा करेंगे और अपने विवेक से, आपका अटेम्प्ट या क्रेडिट बहाल कर सकते हैं। यह चैनल केवल सक्रिय परीक्षा के दौरान प्लेटफ़ॉर्म/तकनीकी विफलताओं के लिए है — यह आपके प्रदर्शन, प्रश्नों की कठिनाई, या मन बदलने के आधार पर रिफंड अनुरोधों के लिए नहीं है।",
    contentAccuracyTitle: "कंटेंट की सटीकता",
    contentAccuracyBody:
      "हम MPPEB के प्रकाशित परीक्षा पैटर्न से मेल खाने के लिए उचित सावधानी बरतते हैं, लेकिन हम यह गारंटी नहीं देते कि मॉक कंटेंट वास्तविक MPPEB परीक्षा से बिल्कुल मेल खाएगा। इन टेस्ट को आधिकारिक सिलेबस और अध्ययन सामग्री के साथ एक प्रैक्टिस सहायता के रूप में उपयोग करें, उसके विकल्प के रूप में नहीं।",
    contactTitle: "संपर्क",
    contactBody: "किसी भी अन्य प्रश्न के लिए: support@examsexpress.in",
  },
  en: {
    kicker: "Legal Notice",
    title: "Disclaimer & Policies",
    notAffiliatedTitle: "Not Affiliated with MPPEB",
    notAffiliatedBody:
      "ExamsExpress is an independent, privately-run practice platform. We are not affiliated with, endorsed by, or connected in any way to the Madhya Pradesh Employees Selection Board (MPPEB) or any government body. Our mock tests are created independently, based on the pattern and syllabus described in MPPEB's publicly available official notifications, for practice purposes only. Always refer to MPPEB's official website and notifications for authoritative exam information, admit cards, and results.",
    noRefundsTitle: "One-Time Purchase, No Refunds",
    noRefundsBody:
      "All test packages on ExamsExpress are one-time digital purchases. Once purchased, a package cannot be refunded, exchanged, or cancelled — including if you are dissatisfied with your score, change your mind, or do not use all your tests before they expire. Since access to test content is granted instantly on purchase, this is treated the same as any other digital-goods purchase. We recommend using your free test to evaluate the platform before buying a package.",
    technicalSupportTitle: "Technical Issue Support",
    technicalSupportBody:
      "If you face a genuine technical problem while actively taking a paid exam — for example the platform crashes, freezes, or otherwise fails in a way that costs you your attempt — contact us at support@examsexpress.in within 24 hours, with your registered mobile number, the test name, and a brief description of the issue. We will review it and, at our discretion, may restore your attempt or credit. This channel is only for platform/technical failures during an active exam — it is not for refund requests based on your performance, difficulty of questions, or change of mind.",
    contentAccuracyTitle: "Content Accuracy",
    contentAccuracyBody:
      "We take reasonable care to match MPPEB's published exam pattern, but we do not guarantee mock content will exactly match the actual MPPEB exam. Use these tests as a practice aid alongside, not a replacement for, the official syllabus and study material.",
    contactTitle: "Contact",
    contactBody: "For any other queries: support@examsexpress.in",
  },
};

export default content;
