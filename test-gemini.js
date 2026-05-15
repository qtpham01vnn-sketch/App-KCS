const normalizeString = (str) => {
    if (!str) return "";
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, " ").replace(/\s+/g, " ").trim();
};

const chatHistory = [
    { role: 'user', text: 'không?' }
];
const userMessage = "Cho tôi xem nội dung gốc của QT.09.02";

const lastUserMsg = chatHistory.filter(m => m.role === 'user').slice(-1).map(m => m.text).join(" ");
const searchContext = `${lastUserMsg} ${userMessage}`;
const keywords = normalizeString(searchContext).split(" ").filter(kw => kw.length >= 2);

console.log("KEYWORDS:", keywords);

const scoreItem = (textNorm) => {
    let score = 0;
    const docWords = new Set(textNorm.split(" "));
    keywords.forEach(kw => { 
        if (docWords.has(kw)) score += 10; 
    });
    if (textNorm.includes(normalizeString(userMessage))) score += 20;
    return score;
};

const doc1 = normalizeString("QT.09.02 ( QT KS SX DC2 GẠCH LÁT )\n1. Mục đích\n2. Phạm vi áp dụng: Phòng KT-CN nội dung gốc");
const doc2 = normalizeString("Một tài liệu khác không liên quan nhưng có nội dung gốc xem");

console.log("Doc1 (QT.09.02) Score:", scoreItem(doc1));
console.log("Doc2 (Khác) Score:", scoreItem(doc2));
