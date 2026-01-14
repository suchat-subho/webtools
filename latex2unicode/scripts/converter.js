// LaTeX → Unicode symbols
const greekLower = {
  "\\alpha":"α","\\beta":"β","\\gamma":"γ","\\delta":"δ","\\epsilon":"ε",
  "\\zeta":"ζ","\\eta":"η","\\theta":"θ","\\iota":"ι","\\kappa":"κ",
  "\\lambda":"λ","\\mu":"μ","\\nu":"ν","\\xi":"ξ","\\pi":"π","\\rho":"ρ",
  "\\sigma":"σ","\\tau":"τ","\\upsilon":"υ","\\phi":"φ","\\chi":"χ",
  "\\psi":"ψ","\\omega":"ω"
};
const greekUpper = {
  "\\Gamma":"Γ","\\Delta":"Δ","\\Theta":"Θ","\\Lambda":"Λ",
  "\\Xi":"Ξ","\\Pi":"Π","\\Sigma":"Σ","\\Phi":"Φ",
  "\\Psi":"Ψ","\\Omega":"Ω"
};
const arithmeticOps = {
  "\\times":"×","\\div":"÷","\\pm":"±","\\mp":"∓",
  "\\sqrt":"√","\\infty":"∞"
};
const relations = {
  "\\lt":"<","\\gt":">","\\le":"≤","\\leq":"≤",
  "\\ge":"≥","\\geq":"≥","\\neq":"≠","\\ne":"≠",
  "\\approx":"≈","\\sim":"∼","\\simeq":"≃",
  "\\equiv":"≡","\\cong":"≅",
  "\\ll":"≪","\\gg":"≫"
};
const setTheory = {
  "\\in":"∈","\\notin":"∉","\\ni":"∋",
  "\\subset":"⊂","\\subseteq":"⊆","\\nsubseteq":"⊄",
  "\\supset":"⊃","\\supseteq":"⊇","\\nsupseteq":"⊅",
  "\\cup":"∪","\\cap":"∩","\\setminus":"∖",
  "\\emptyset":"∅","\\varnothing":"∅"
};
const logicProof = {
  "\\forall":"∀","\\exists":"∃",
  "\\therefore":"∴","\\because":"∵",
  "\\implies":"⟹","\\Rightarrow":"⇒","\\Leftrightarrow":"⇔",
  "\\qed":"□"
};
const calculus = {
  "\\sum":"∑","\\prod":"∏","\\int":"∫","\\oint":"∮",
  "\\propto":"∝","\\npropto":"∝̸"
};

const latexToUnicode = {
  ...greekLower,
  ...greekUpper,
  ...arithmeticOps,
  ...relations,
  ...setTheory,
  ...logicProof,
  ...calculus
};


/*
const latexToUnicode = {
    "\\alpha":"α","\\beta":"β","\\gamma":"γ","\\delta":"δ","\\epsilon":"ε",
    "\\zeta":"ζ","\\eta":"η","\\theta":"θ","\\iota":"ι","\\kappa":"κ",
    "\\lambda":"λ","\\mu":"μ","\\nu":"ν","\\xi":"ξ","\\pi":"π","\\rho":"ρ",
    "\\sigma":"σ","\\tau":"τ","\\upsilon":"υ","\\phi":"φ","\\chi":"χ",
    "\\psi":"ψ","\\omega":"ω","\\Gamma":"Γ","\\Delta":"Δ","\\Theta":"Θ",
    "\\Lambda":"Λ","\\Xi":"Ξ","\\Pi":"Π","\\Sigma":"Σ","\\Phi":"Φ",
    "\\Psi":"Ψ","\\Omega":"Ω","\\times":"×","\\div":"÷","\\pm":"±",
    "\\mp":"∓","\\leq":"≤","\\geq":"≥","\\neq":"≠","\\approx":"≈",
    "\\infty":"∞","\\sum":"∑","\\prod":"∏","\\int":"∫","\\sqrt":"√",
    "\\in":"∈","\\notin": "∉", 
    "\\therefore": "∴", "\\because": "∵", "\\implies": "⟹", "\\Rightarrow": "⇒","\\Leftrightarrow":"⇔",
    "\\qed":"□", "\\propto":"∝","\\npropto": "∝",
    "\\subset": "⊂","\\subseteq": "⊆","\\supset": "⊃","\\supseteq": "⊇","\\cup": "∪","\\cap": "∩",
    "\\setminus": "∖", "\\nsubseteq": "⊄", "\\nsupseteq": "⊅",
    "\\emptyset": "∅","\\varnothing": "∅",
    "\\exists": "∃","\\forall": "∀","\\ni": "∋",
    "\\le": "≤", "\\leq": "≤", "\\ge": "≥", "\\geq": "≥","\\neq": "≠",
    "\\ne": "≠","\\approx": "≈","\\sim": "∼","\\simeq": "≃","\\equiv": "≡",
    "\\cong": "≅","\\propto": "∝","\\lt": "<","\\gt": ">","\\ll": "≪","\\gg": "≫"
};
*/



// Superscripts and subscripts
const superscripts = {"0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹","+":"⁺","-":"⁻","=":"⁼","(":"⁽",")":"⁾","n":"ⁿ","i":"ⁱ"};
const subscripts = {"0":"₀","1":"₁","2":"₂","3":"₃","4":"₄","5":"₅","6":"₆","7":"₇","8":"₈","9":"₉","+":"₊","-":"₋","=":"₌","(":"₍",")":"₎","a":"ₐ","e":"ₑ","h":"ₕ","i":"ᵢ","j":"ⱼ","k":"ₖ","l":"ₗ","m":"ₘ","n":"ₙ","o":"ₒ","p":"ₚ","r":"ᵣ","s":"ₛ","t":"ₜ","u":"ᵤ","v":"ᵥ","x":"ₓ"};

// Blackboard bold letters (uppercase only)
const mathbbMap = {"A":"𝔸","B":"𝔹","C":"ℂ","D":"𝔻","E":"𝔼","F":"𝔽","G":"𝔾","H":"ℍ","I":"𝕀","J":"𝕁","K":"𝕂","L":"𝕃","M":"𝕄","N":"ℕ","O":"𝕆","P":"ℙ","Q":"ℚ","R":"ℝ","S":"𝕊","T":"𝕋","U":"𝕌","V":"𝕍","W":"𝕎","X":"𝕏","Y":"𝕐","Z":"ℤ"};

// Unicode fractions
const fractionMap = {
    "1/2":"½","1/3":"⅓","2/3":"⅔","1/4":"¼","3/4":"¾",
    "1/5":"⅕","2/5":"⅖","3/5":"⅗","4/5":"⅘",
    "1/6":"⅙","5/6":"⅚",
    "1/8":"⅛","3/8":"⅜","5/8":"⅝","7/8":"⅞"
};


let liveMode = true;

function toggleLiveMode() {
    liveMode = !liveMode;
    document.getElementById("liveToggle").innerText =
        liveMode ? "Live Mode: ON" : "Live Mode: OFF";
}

document.getElementById("urlInput").addEventListener("input", () => {
    if (liveMode) convertToUnicode();
});


function convertToUnicode() {
    let input = document.getElementById("urlInput").value;

    // Replace LaTeX symbols
    for (const [key,value] of Object.entries(latexToUnicode)) {
        input = input.split(key).join(value);
    }

    // Fractions: Unicode if common, else superscript numerator + fraction slash + subscript denominator
    input = input.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, (_, num, den) => {
        const key = `${num}/${den}`;
        if (fractionMap[key]) {
            // Common fraction with single Unicode character
            return fractionMap[key];
        } else if (/^\d+$/.test(num) && /^\d+$/.test(den)) {
            // General fraction: superscript numerator + fraction slash + subscript denominator
            const sup = [...num].map(c => superscripts[c] || c).join('');
            const sub = [...den].map(c => subscripts[c] || c).join('');
            return sup + '⁄' + sub;
        } else{ 
            // Non-numeric → multiline fraction
            // Determine fraction bar length (max of numerator/denominator length)
            const len = Math.max(num.length, den.length);
            const bar = '─'.repeat(len);
            // Pad numerator and denominator to match bar length
            const numPadded = num.padStart(Math.floor((len + num.length)/2)).padEnd(len);
            const denPadded = den.padStart(Math.floor((len + den.length)/2)).padEnd(len);
            return `${numPadded}\n${bar}\n${denPadded}`;
        }
    });

    // Square roots
    input = input.replace(/√\{([^}]+)\}/g, (_, content) => `√(${content})`);

    // Superscripts
    input = input.replace(/\^\{([^}]+)\}/g, (_, p1) => [...p1].map(c => superscripts[c]||c).join(''));
    input = input.replace(/\^([^\s^_{}]+)/g, (_, p1) => [...p1].map(c => superscripts[c]||c).join(''));

    // Subscripts
    input = input.replace(/_\{([^}]+)\}/g, (_, p1) => [...p1].map(c => subscripts[c]||c).join(''));
    input = input.replace(/_([^\s^_{}]+)/g, (_, p1) => [...p1].map(c => subscripts[c]||c).join(''));

    // Summation/product/integral with limits
    input = input.replace(/∑_{([^}]+)}\^{([^}]+)}/g, (_, sub, sup) => `∑${toSub(sub)}${toSup(sup)}`);
    input = input.replace(/∏_{([^}]+)}\^{([^}]+)}/g, (_, sub, sup) => `∏${toSub(sub)}${toSup(sup)}`);
    input = input.replace(/∫_{([^}]+)}\^{([^}]+)}/g, (_, sub, sup) => `∫${toSub(sub)}${toSup(sup)}`);

    // Blackboard bold
    input = input.replace(/\\mathbb\{([A-Z])\}/g, (_, letter) => mathbbMap[letter] || letter);
    input = input.replace(/\\\\/g, '\n');

    document.getElementById("status").innerText = input;
}

// Helper functions
function toSup(str){ return [...str].map(c => superscripts[c]||c).join(''); }
function toSub(str){ return [...str].map(c => subscripts[c]||c).join(''); }
function insertAtCursor(text) {
    const input = document.getElementById("urlInput");
    input.focus();

    const start = input.selectionStart;
    const end = input.selectionEnd;

    input.value =
        input.value.slice(0, start) +
        text +
        input.value.slice(end);

    // Move cursor after inserted text
    input.selectionStart = input.selectionEnd = start + text.length;

    // Trigger live conversion if enabled
    if (liveMode) convertToUnicode();
}
//////////////////////////////////////////////////////////////////////////
document.addEventListener("DOMContentLoaded", () => {
    const menuBtn = document.getElementById("menuBtn");
    const modal = document.getElementById("classModal");
    const closeBtn = document.querySelector(".close");
    const Symbols = document.getElementById("Symbols");
    const inputBox = document.getElementById("urlInput");

    inputBox.addEventListener("input", () => {
        if (liveMode) convertToUnicode();
    });

    menuBtn.onclick = () => {
        Symbols.innerHTML = "";
        buildSymbolModal();
        modal.style.display = "block";
    };

    closeBtn.onclick = () => modal.style.display = "none";

    window.onclick = (e) => {
        if (e.target === modal) modal.style.display = "none";
    };

    function buildSymbolModal() {
        addGroup("Greek (lowercase)", greekLower);
        addGroup("Greek (uppercase)", greekUpper);
        addGroup("Arithmetic", arithmeticOps);
        addGroup("Relations", relations);
        addGroup("Set Theory", setTheory);
        addGroup("Logic & Proof", logicProof);
        addGroup("Calculus", calculus);
    }

    function addGroup(title, groupObj) {
        const header = document.createElement("div");
        header.className = "symbol-group";
        header.textContent = title;
        Symbols.appendChild(header);

        for (const latex in groupObj) {
            const item = document.createElement("div");
            item.className = "symbol-item";
            item.innerHTML = `
              <span class="symbol-latex">${latex}</span>
              <span class="symbol-char">${groupObj[latex]}</span>
            `;
            item.onclick = () => insertAtCursor(latex);
            Symbols.appendChild(item);
        }
    }
});
