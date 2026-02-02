const spacingCommands = {
    "\\quad":  "    ",      // 4 spaces
    "\\qquad": "        "   // 8 spaces
};


// ================= LaTeX → Unicode Maps =================

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

const accents = {
  "\\hat": "\u0302",        // ̂  combining circumflex
  "\\bar": "\u0304",        // ̄  combining macron
  "\\vec": "\u20D7",        // ⃗  combining right arrow above
  "\\dot": "\u0307",        // ̇  combining dot above
  "\\ddot": "\u0308",       // ̈  combining diaeresis
  "\\tilde": "\u0303",      // ̃  combining tilde
  "\\underline": "\u0332"   // ̲  combining low line
};

// Footnote marks
const footnoteMarks = {
  "\\ast":"*","\\dagger":"†","\\ddagger":"‡",
  "\\S":"§","\\P":"¶","\\parallel":"‖",
  "\\asterism":"⁂","\\bullet":"•","\\reference":"※",
  "\\lowast":"⁎","\\star":"⋆"
};


// Blackboard bold letters (uppercase only)
const mathbbMap = {"A":"𝔸","B":"𝔹","C":"ℂ","D":"𝔻","E":"𝔼","F":"𝔽","G":"𝔾","H":"ℍ","I":"𝕀","J":"𝕁","K":"𝕂","L":"𝕃","M":"𝕄","N":"ℕ","O":"𝕆","P":"ℙ","Q":"ℚ","R":"ℝ","S":"𝕊","T":"𝕋","U":"𝕌","V":"𝕍","W":"𝕎","X":"𝕏","Y":"𝕐","Z":"ℤ"};

// Calligraphic
const mathcalMap = {
  "A":"𝒜","B":"ℬ","C":"𝒞","D":"𝒟","E":"ℰ","F":"ℱ","G":"𝒢",
  "H":"ℋ","I":"ℐ","J":"𝒥","K":"𝒦","L":"ℒ","M":"ℳ","N":"𝒩",
  "O":"𝒪","P":"𝒫","Q":"𝒬","R":"ℛ","S":"𝒮","T":"𝒯","U":"𝒰",
  "V":"𝒱","W":"𝒲","X":"𝒳","Y":"𝒴","Z":"𝒵"
};

// handwritten-style
const mathscriptMap = {
  "A":"𝓐","B":"𝓑","C":"𝓒","D":"𝓓","E":"𝓔","F":"𝓕","G":"𝓖",
  "H":"𝓗","I":"𝓘","J":"𝓙","K":"𝓚","L":"𝓛","M":"𝓜","N":"𝓝",
  "O":"𝓞","P":"𝓟","Q":"𝓠","R":"𝓡","S":"𝓢","T":"𝓣","U":"𝓤",
  "V":"𝓥","W":"𝓦","X":"𝓧","Y":"𝓨","Z":"𝓩"
};

//  Fraktur
const mathfrakMap = {
  "A":"𝔄","B":"𝔅","C":"ℭ","D":"𝔇","E":"𝔈","F":"𝔉","G":"𝔊",
  "H":"ℌ","I":"ℑ","J":"𝔍","K":"𝔎","L":"𝔏","M":"𝔐","N":"𝔑",
  "O":"𝔒","P":"𝔓","Q":"𝔔","R":"ℜ","S":"𝔖","T":"𝔗","U":"𝔘",
  "V":"𝔙","W":"𝔚","X":"𝔛","Y":"𝔜","Z":"ℨ"
};


// Unicode fractions
const fractionMap = {
    "1/2":"½","1/3":"⅓","2/3":"⅔","1/4":"¼","3/4":"¾",
    "1/5":"⅕","2/5":"⅖","3/5":"⅗","4/5":"⅘",
    "1/6":"⅙","5/6":"⅚",
    "1/8":"⅛","3/8":"⅜","5/8":"⅝","7/8":"⅞"
};

const relations = {
  "\\lt":"<","\\gt":">",
  "\\le":"≤","\\leq":"≤",
  "\\ge":"≥","\\geq":"≥",
  "\\neq":"≠","\\ne":"≠",
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

const largemath = {
  // Sum
  "\\sumtop": "⎲","\\sumbot": "⎳",

  // Curly braces
  "\\lbraceTop": "⎧","\\lbraceMid": "⎨","\\lbraceBot": "⎩",
  "\\rbraceTop": "⎫","\\rbraceMid": "⎬","\\rbraceBot": "⎭",

  // Square brackets
  "\\lbracketTop": "⎡","\\lbracketMid": "⎢","\\lbracketBot": "⎣",
  "\\rbracketTop": "⎤","\\rbracketMid": "⎥","\\rbracketBot": "⎦",

  // Parentheses
  "\\lparenTop": "⎛","\\lparenMid": "⎜","\\lparenBot": "⎝",
  "\\rparenTop": "⎞","\\rparenMid": "⎟","\\rparenBot": "⎠",

  // Integrals
  "\\inttop": "⌠","\\intbot": "⌡"
};


const latexToUnicode = {
  ...spacingCommands,
  ...greekLower,
  ...greekUpper,
  ...arithmeticOps,
  ...relations,
  ...fractionMap,
  ...setTheory,
  ...logicProof,
  ...calculus,
  ...accents,
  ...largemath,
  ...footnoteMarks
};


// Superscripts and subscripts
const superscripts = {"0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹","+":"⁺","-":"⁻","=":"⁼","(":"⁽",")":"⁾","n":"ⁿ","i":"ⁱ"};
const subscripts = {"0":"₀","1":"₁","2":"₂","3":"₃","4":"₄","5":"₅","6":"₆","7":"₇","8":"₈","9":"₉","+":"₊","-":"₋","=":"₌","(":"₍",")":"₎","a":"ₐ","e":"ₑ","h":"ₕ","i":"ᵢ","j":"ⱼ","k":"ₖ","l":"ₗ","m":"ₘ","n":"ₙ","o":"ₒ","p":"ₚ","r":"ᵣ","s":"ₛ","t":"ₜ","u":"ᵤ","v":"ᵥ","x":"ₓ"};



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

    // Replace LaTeX symbols (longest first)
    const latexKeys = Object.keys(latexToUnicode)
        .sort((a, b) => b.length - a.length);

    for (const key of latexKeys) {
        input = input.split(key).join(latexToUnicode[key]);
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

    ///  Math Styles
    // Blackboard bold
    input = input.replace(/\\mathbb\{([A-Z])\}/g, (_, letter) => mathbbMap[letter] || letter);
    // Calligraphic
    input = input.replace(/\\mathcal\{([A-Z])\}/g, (_, letter) => mathcalMap[letter] || letter);
    // handwritten-style
    input = input.replace(/\\mathscript\{([A-Z])\}/g, (_, letter) => mathscriptMap[letter] || letter);
    //  Fraktur
    input = input.replace(/\\mathfrak\{([A-Z])\}/g, (_, letter) => mathfrakMap[letter] || letter);
    ////////////////////////////////

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
// ================= Modal  =================
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
         // Add a Unicode number input at the top
        const unicodeDiv = document.createElement("div");
        unicodeDiv.className = "unicode-input";
        unicodeDiv.innerHTML = `
            <center><label>Insert Unicode (hex): </label></center>
            <input id="unicodeCode" type="text" placeholder="e.g. 03B1">
            <button id="unicodeInsert">Insert</button>
        `;
        Symbols.appendChild(unicodeDiv);
         document.getElementById("unicodeInsert").onclick = () => {
            const code = document.getElementById("unicodeCode").value.trim();
            if (code) {
                try {
                    const char = String.fromCodePoint(parseInt(code, 16));
                    insertAtCursor(char);
                    document.getElementById("unicodeCode").value = "";
                } catch (e) {
                    alert("Invalid Unicode code point!");
                }
            }
        };
        addGroup("Greek (lowercase)", greekLower);
        addGroup("Greek (uppercase)", greekUpper);
        addGroup("Arithmetic", arithmeticOps);
        addGroup("Relations", relations);
        addGroup("Set Theory", setTheory);
        addGroup("Logic & Proof", logicProof);
        addGroup("Calculus", calculus);
        addGroup("Accents", accents);
        addGroup("LargeMath", largemath);
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
