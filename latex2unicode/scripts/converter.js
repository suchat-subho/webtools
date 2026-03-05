///// <!---------UI -------->
function setStatusAlign(align) {
  const status = document.getElementById("status");
  status.style.textAlign = align;
}

let liveMode = true;
//////////////////
function toggleLiveMode() {
    liveMode = !liveMode;
    document.getElementById("liveToggle").innerText =
        liveMode ? "Live Mode: ON" : "Live Mode: OFF";
}

document.getElementById("urlInput").addEventListener("input", () => {
    if (liveMode) convertToUnicode();
});
//////<!---------UI -------->

////  All Simple Symbols
const spacingSubgroups = {
   icon: "⇤ ⇥",
   symbols: {
        "\\quad":  "    ",      // 4 spaces
        "\\qquad": "        ",   // 8 spaces
        "\\vdots": "⋮",
        "\\ldots": "…",
        "\\cdot": "·",
        "\\cdots":"\u22EF",
        "\\\\" : "\u000A",
        "\\&":"\u0009",
    }
};
const arrowSubgroups = {
  icon: "↘",
  symbols: {
    "\\searrow": "↘","\\swarrow": "↙","\\nearrow": "↗","\\nwarrow": "↖",
    "\\rightarrow": "→","\\leftarrow":  "←","\\uparrow":    "↑","\\downarrow":  "↓",
    "\\Rightarrow": "⇒","\\Leftarrow":  "⇐","\\Uparrow":    "⇑","\\Downarrow":  "⇓",
    "\\hookrightarrow": "↪","\\hookleftarrow":  "↩","\\curvearrowright": "↷","\\curvearrowleft":  "↶",
    "\\triangleright":      "▷","\\triangleleft":       "◁","\\blacktriangleright": "▶","\\blacktriangleleft":  "◀","\\blacktriangleup":    "▲","\\blacktriangledown":  "▼",
    "\\mapsto":     "↦","\\leadsto":    "↝","\\rightsquigarrow": "⇝",
  }
};
// ================= LaTeX → Unicode Maps =================
const greekLowerSubgroups = {
   icon: "δ",
   symbols: {
      "\\alpha":"α","\\beta":"β","\\gamma":"γ","\\delta":"δ","\\epsilon":"ε",
      "\\zeta":"ζ","\\eta":"η","\\theta":"θ","\\iota":"ι","\\kappa":"κ",
      "\\lambda":"λ","\\mu":"μ","\\nu":"ν","\\xi":"ξ","\\pi":"π","\\rho":"ρ",
      "\\sigma":"σ","\\tau":"τ","\\upsilon":"υ","\\phi":"φ","\\chi":"χ",
      "\\psi":"ψ","\\omega":"ω","\\varphi":"φ",
    }
};

const greekUpperSubgroups = {
   icon: "Δ",
   symbols: {
      "\\Gamma":"Γ","\\Delta":"Δ","\\Theta":"Θ","\\Lambda":"Λ",
      "\\Xi":"Ξ","\\Pi":"Π","\\Sigma":"Σ","\\Phi":"Φ",
      "\\Psi":"Ψ","\\Omega":"Ω",
   }
};

const arithmeticSubgroups = {
  icon: "±",
  symbols: {
    "\\times":"×","\\div":"÷","\\pm":"±","\\mp":"∓",
    "\\sqrt":"√","\\infty":"∞",
  }
};

const accentsSubgroups = {
  icon: "̂",
  symbols: {
    "\\hat": "\u0302",        // ̂
    "\\bar": "\u0304",        // ̄
    "\\vec": "\u20D7",        // ⃗
    "\\dot": "\u0307",        // ̇
    "\\ddot": "\u0308",       // ̈
    "\\tilde": "\u0303",      // ̃
    "\\underline": "\u0332",   // ̲
  }
};

const footnoteSubgroups = {
  icon: "※",
  symbols: {
    "\\ast":"*","\\dagger":"†","\\ddagger":"‡",
    "\\S":"§","\\P":"¶","\\parallel":"‖",
    "\\asterism":"⁂","\\bullet":"•","\\reference":"※",
    "\\lowast":"⁎","\\star":"⋆",
  }
};

const relationsSubgroups = {
  icon: "≠",
  symbols: {
    "\\lt":"<","\\gt":">","\\le":"≤","\\leq":"≤","\\ge":"≥","\\geq":"≥",
    "\\neq":"≠","\\ne":"≠","\\approx":"≈","\\sim":"∼","\\simeq":"≃",
    "\\equiv":"≡","\\cong":"≅","\\ll":"≪","\\gg":"≫",
  }
};

const setSubgroups = {
  icon: "∈",
  symbols: {
    "\\in":"∈","\\notin":"∉","\\ni":"∋",
    "\\subset":"⊂","\\subseteq":"⊆","\\nsubseteq":"⊄",
    "\\supset":"⊃","\\supseteq":"⊇","\\nsupseteq":"⊅",
    "\\cup":"∪","\\cap":"∩","\\setminus":"∖",
    "\\emptyset":"∅","\\varnothing":"∅",
  }
};

const logicProofSubgroups = {
  icon: "∀",
  symbols: {
    "\\forall":"∀","\\exists":"∃",
    "\\therefore":"∴","\\because":"∵",
    "\\implies":"⟹","\\Rightarrow":"⇒","\\Leftrightarrow":"⇔",
    "\\qed":"□",
  }
};

const calculusSubgroups = {
  icon: "∫",
  symbols: {
    "\\sum":"∑","\\prod":"∏","\\int":"∫","\\oint":"∮",
    "\\propto":"∝","\\npropto":"∝̸",
  }
};


const largemathSubgroups = {
  icon: "⎲",
  symbols: {
    // Sum
    "\\sumTop": "⎲","\\sumBot": "⎳",
    // Integrals
    "\\intTop": "⌠","\\intBot": "⌡",

    // Parentheses
    "\\lparenTop": "⎛","\\lparenMid": "⎜","\\lparenBot": "⎝",
    "\\rparenTop": "⎞","\\rparenMid": "⎟","\\rparenBot": "⎠",
    // Curly braces
    "\\lbraceTop": "⎧","\\lbraceMid": "⎨","\\lbraceBot": "⎩",
    "\\rbraceTop": "⎫","\\rbraceMid": "⎬","\\rbraceBot": "⎭",
    // Square brackets
    "\\lbracketTop": "⎡","\\lbracketMid": "⎢","\\lbracketBot": "⎣",
    "\\rbracketTop": "⎤","\\rbracketMid": "⎥","\\rbracketBot": "⎦",
  }
};
//// All Simple symbols

//// Composite symbols
//// Math Scripts
// Blackboard bold letters (uppercase only)
const mathbbMapSubgroups = {
    icon: "𝔸",
    symbols: {
            "A":"𝔸","B":"𝔹","C":"ℂ","D":"𝔻","E":"𝔼","F":"𝔽","G":"𝔾",
            "H":"ℍ","I":"𝕀","J":"𝕁","K":"𝕂","L":"𝕃","M":"𝕄","N":"ℕ",
            "O":"𝕆","P":"ℙ","Q":"ℚ","R":"ℝ","S":"𝕊","T":"𝕋","U":"𝕌",
            "V":"𝕍","W":"𝕎","X":"𝕏","Y":"𝕐","Z":"ℤ",
    }
};
// Calligraphic
const mathcalMapSubgroups = {
    icon: "𝒜",
    symbols: {
          "A":"𝒜","B":"ℬ","C":"𝒞","D":"𝒟","E":"ℰ","F":"ℱ","G":"𝒢",
          "H":"ℋ","I":"ℐ","J":"𝒥","K":"𝒦","L":"ℒ","M":"ℳ","N":"𝒩",
          "O":"𝒪","P":"𝒫","Q":"𝒬","R":"ℛ","S":"𝒮","T":"𝒯","U":"𝒰",
          "V":"𝒱","W":"𝒲","X":"𝒳","Y":"𝒴","Z":"𝒵",
    }
};

// handwritten-style
const mathscriptMapSubgroups = {
    icon: "𝓐",
    symbols: {
          "A":"𝓐","B":"𝓑","C":"𝓒","D":"𝓓","E":"𝓔","F":"𝓕","G":"𝓖",
          "H":"𝓗","I":"𝓘","J":"𝓙","K":"𝓚","L":"𝓛","M":"𝓜","N":"𝓝",
          "O":"𝓞","P":"𝓟","Q":"𝓠","R":"𝓡","S":"𝓢","T":"𝓣","U":"𝓤",
          "V":"𝓥","W":"𝓦","X":"𝓧","Y":"𝓨","Z":"𝓩",
    }
};

//  Fraktur
const mathfrakMapSubgroups = {
    icon: "𝔄",
    symbols: {
        "A":"𝔄","B":"𝔅","C":"ℭ","D":"𝔇","E":"𝔈","F":"𝔉","G":"𝔊",
        "H":"ℌ","I":"ℑ","J":"𝔍","K":"𝔎","L":"𝔏","M":"𝔐","N":"𝔑",
        "O":"𝔒","P":"𝔓","Q":"𝔔","R":"ℜ","S":"𝔖","T":"𝔗","U":"𝔘",
        "V":"𝔙","W":"𝔚","X":"𝔛","Y":"𝔜","Z":"ℨ",
    }
};
//// Math Scripts
// Unicode fractions
const fractionMapSubgroups = {
    icon: "½",
    symbols: {
        "1/2":"½","1/3":"⅓","2/3":"⅔","1/4":"¼","3/4":"¾",
        "1/5":"⅕","2/5":"⅖","3/5":"⅗","4/5":"⅘",
        "1/6":"⅙","5/6":"⅚",
        "1/8":"⅛","3/8":"⅜","5/8":"⅝","7/8":"⅞",
    }
};

// Superscripts and subscripts
const subscripts = {
  // digits
  "0":"₀","1":"₁","2":"₂","3":"₃","4":"₄","5":"₅","6":"₆","7":"₇","8":"₈","9":"₉",

  // signs & operators
  "+":"₊","-":"₋","=":"₌","(":"₍",")":"₎",

  // latin letters (Unicode-defined only)
  "a":"ₐ","e":"ₑ","h":"ₕ","i":"ᵢ","j":"ⱼ","k":"ₖ","l":"ₗ",
  "m":"ₘ","n":"ₙ","o":"ₒ","p":"ₚ","r":"ᵣ","s":"ₛ","t":"ₜ",
  "u":"ᵤ","v":"ᵥ","x":"ₓ",

  // greek (partial)
  "β":"ᵦ","γ":"ᵧ","ρ":"ᵨ","φ":"ᵩ","χ":"ᵪ",
};

const superscripts = {
  // digits
  "0":"⁰","1":"¹","2":"²","3":"³","4":"⁴","5":"⁵","6":"⁶","7":"⁷","8":"⁸","9":"⁹",

  // signs & operators
  "+":"⁺","-":"⁻","=":"⁼","(":"⁽",")":"⁾",

  // latin letters (only ones Unicode supports)
  "a":"ᵃ","b":"ᵇ","c":"ᶜ","d":"ᵈ","e":"ᵉ","f":"ᶠ","g":"ᵍ","h":"ʰ",
  "i":"ⁱ","j":"ʲ","k":"ᵏ","l":"ˡ","m":"ᵐ","n":"ⁿ","o":"ᵒ","p":"ᵖ",
  "r":"ʳ","s":"ˢ","t":"ᵗ","u":"ᵘ","v":"ᵛ","w":"ʷ","x":"ˣ","y":"ʸ","z":"ᶻ",

  // greek (partial support)
  "β":"ᵝ","γ":"ᵞ","δ":"ᵟ","θ":"ᶿ",
};

//// Composite symbols


//// Full Dictionary
const latexToUnicode = {
  ...spacingSubgroups.symbols,
  // Greek
  ...greekLowerSubgroups.symbols,
  ...greekUpperSubgroups.symbols,

  // Arithmetic & relations
  ...arithmeticSubgroups.symbols,
  ...relationsSubgroups.symbols,

  // Fractions
  ...fractionMapSubgroups.symbols,

  // Sets & logic
  ...setSubgroups.symbols,
  ...logicProofSubgroups.symbols,

  // Calculus & large math
  ...calculusSubgroups.symbols,
  ...largemathSubgroups.symbols,

  // Accents & footnotes
  ...accentsSubgroups.symbols,
  ...footnoteSubgroups.symbols,

  // Arrows
  ...arrowSubgroups.symbols
};

const icons = {
  spacing: spacingSubgroups.icon,
  greekLower: greekLowerSubgroups.icon,
  greekUpper: greekUpperSubgroups.icon,
  arithmetic: arithmeticSubgroups.icon,
  relations: relationsSubgroups.icon,
  set: setSubgroups.icon,
  logic: logicProofSubgroups.icon,
  calculus: calculusSubgroups.icon,
  largemath: largemathSubgroups.icon,
  accents: accentsSubgroups.icon,
  footnote: footnoteSubgroups.icon,
  arrow: arrowSubgroups.icon
};

const symbols = {
  spacing: spacingSubgroups.symbols,
  greekLower: greekLowerSubgroups.symbols,
  greekUpper: greekUpperSubgroups.symbols,
  arithmetic: arithmeticSubgroups.symbols,
  relations: relationsSubgroups.symbols,
  set: setSubgroups.symbols,
  logic: logicProofSubgroups.symbols,
  calculus: calculusSubgroups.symbols,
  largemath: largemathSubgroups.symbols,
  accents: accentsSubgroups.symbols,
  footnote: footnoteSubgroups.symbols,
  arrow: arrowSubgroups.symbols
};


window.symbolGroups = symbols;
window.icons = icons;
/*******************************************************************/
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
        if (fractionMapSubgroups.symbols[key]) {
            // Common fraction with single Unicode character
            return fractionMapSubgroups.symbols[key];
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
    /*******************************************************************/
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
    input = input.replace(/\\mathbb\{([A-Z])\}/g, (_, letter) => mathbbMapSubgroups.symbols[letter] || letter);
    // Calligraphic
    input = input.replace(/\\mathcal\{([A-Z])\}/g, (_, letter) => mathcalMapSubgroups.symbols[letter] || letter);
    // handwritten-style
    input = input.replace(/\\mathscript\{([A-Z])\}/g, (_, letter) => mathscriptMapSubgroups.symbols[letter] || letter);
    //  Fraktur
    input = input.replace(/\\mathfrak\{([A-Z])\}/g, (_, letter) => mathfrakMapSubgroups.symbols[letter] || letter);
    ////////////////////////////////

    input = input.replace(/\\\\/g, '\n');

    document.getElementById("status").innerText = input;
}
/*******************************************************************/
// Helper functions
function toSup(str){ return [...str].map(c => superscripts[c]||c).join(''); }
function toSub(str){ return [...str].map(c => subscripts[c]||c).join(''); }
/*******************************************************************/
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
/*******************************************************************/
// ================= Expose symbols for modal =================
window.insertAtCursor = insertAtCursor;
window.convertToUnicode = convertToUnicode;
window.liveModeRef = () => liveMode;
