// ================= Modal =================
document.addEventListener("DOMContentLoaded", () => {
    /// Symbol bar Start
    const symbolGroupList = [
      ["Greek (lowercase)", symbolGroups.greekLower],
      ["Greek (uppercase)", symbolGroups.greekUpper],
      ["Arithmetic", symbolGroups.arithmeticOps],
      ["Relations", symbolGroups.relations],
      ["Set Theory", symbolGroups.setTheory],
      ["Logic & Proof", symbolGroups.logicProof],
      ["Calculus", symbolGroups.calculus],
      ["Accents", symbolGroups.accents],
      ["LargeMath", symbolGroups.largemath],
      ["FootnoteMarks", symbolGroups.footnoteMarks]
    ];
    const groupButtonsDiv = document.getElementById("groupButtons");

    symbolGroupList.forEach(([title, groupObj], index) => {
        const btn = document.createElement("button");
        btn.textContent = title;
        btn.style.margin = "4px";
        btn.onclick = () => openGroupModal(title, groupObj, index);
        groupButtonsDiv.appendChild(btn);
    });

    function openGroupModal(title, groupObj, idx) {
        let modal = document.getElementById(`groupModal-${idx}`);

        if (!modal) {
            modal = document.createElement("div");
            modal.className = "modal";
            modal.id = `groupModal-${idx}`;

            modal.innerHTML = `
              <div class="modal-content">
                <span class="close">&times;</span>
                <h3 style="text-align:center;">${title}</h3>
                <div class="symbol-grid" id="groupSymbols-${idx}"></div>
              </div>
            `;

            document.body.appendChild(modal);

            const closeBtn = modal.querySelector(".close");
            closeBtn.onclick = () => modal.style.display = "none";

            window.addEventListener("click", (e) => {
                if (e.target === modal) modal.style.display = "none";
            });

            // Populate symbols ONCE
            const container = modal.querySelector(`#groupSymbols-${idx}`);
            addGroupSymbols(container, groupObj);
        }

        modal.style.display = "block";
    }
    /// Symbol bar End

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
        unicodeDiv.style.display = "flex";
        unicodeDiv.style.flexDirection = "column";
        unicodeDiv.style.alignItems = "center";
        unicodeDiv.style.margin = "10px auto";
        unicodeDiv.style.border = "2px solid #FCBA03";
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
