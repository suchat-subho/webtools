// ================= Modal =================
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
        // Unicode hex input
        const unicodeDiv = document.createElement("div");
        unicodeDiv.className = "unicode-input";
        unicodeDiv.innerHTML = `
            <center><label>Insert Unicode (hex): </label></center>
            <center><input id="unicodeCode" type="text" placeholder="e.g. 03B1">
            <button id="unicodeInsert">Insert</button></center>
        `;
        Symbols.appendChild(unicodeDiv);

        document.getElementById("unicodeInsert").onclick = () => {
            const code = document.getElementById("unicodeCode").value.trim();
            if (!code) return;

            try {
                const char = String.fromCodePoint(parseInt(code, 16));
                insertAtCursor(char);
                document.getElementById("unicodeCode").value = "";
            } catch {
                alert("Invalid Unicode code point!");
            }
        };

        addGroup("Greek (lowercase)", symbolGroups.greekLower);
        addGroup("Greek (uppercase)", symbolGroups.greekUpper);
        addGroup("Arithmetic", symbolGroups.arithmeticOps);
        addGroup("Relations", symbolGroups.relations);
        addGroup("Set Theory", symbolGroups.setTheory);
        addGroup("Logic & Proof", symbolGroups.logicProof);
        addGroup("Calculus", symbolGroups.calculus);
        addGroup("Accents", symbolGroups.accents);
        addGroup("LargeMath", symbolGroups.largemath);
        addGroup("FootnoteMarks", symbolGroups.footnoteMarks);
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
