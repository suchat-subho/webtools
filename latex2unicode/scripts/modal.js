// ================= Symbol Toolbar + Modals =================
document.addEventListener("DOMContentLoaded", () => {

  /* -------------------------------------------------
   * Sanity checks
   * ------------------------------------------------- */
  const toolbar = document.getElementById("symbolToolbar");

  if (!window.symbolGroups || Object.keys(window.symbolGroups).length === 0) {
    alert("ERROR: window.symbolGroups is empty or undefined. Please report to developper ");
    return;
  }

  console.log("Symbol subgroups detected:",
    Object.keys(window.symbolGroups)
  );

  const icons = window.icons || {};
  const groups = window.symbolGroups;

  /* -------------------------------------------------
   * Build toolbar buttons (MAIN WINDOW)
   * ------------------------------------------------- */
  Object.keys(groups).forEach(groupName => {
    const btn = document.createElement("button");
    btn.className = "symbol-toolbar-btn";

    btn.innerHTML = `
      <span class="group-icon">${icons[groupName] || "□"}</span>
      <span class="group-title">${groupName}</span>
    `;

    btn.addEventListener("click", () => {
      console.log("Toolbar clicked:", groupName);
      openSubgroupModal(groupName, groups[groupName]);
    });

    toolbar.appendChild(btn);
  });

  /* -------------------------------------------------
   * Subgroup Modal (one per subgroup)
   * ------------------------------------------------- */
  function openSubgroupModal(groupName, symbols) {
    let modal = document.getElementById(`symbol-modal-${groupName}`);

    if (!modal) {
      modal = document.createElement("div");
      modal.className = "symbol-modal";
      modal.id = `symbol-modal-${groupName}`;

      modal.innerHTML = `
        <div class="symbol-modal-content">
          <span class="symbol-modal-close">&times;</span>
          <h3 style="text-align:center;">${groupName}</h3>
          <div class="symbol-grid"></div>
        </div>
      `;

      document.body.appendChild(modal);

      const grid = modal.querySelector(".symbol-grid");

      Object.entries(symbols).forEach(([latex, char]) => {
        const item = document.createElement("div");
        item.className = "symbol-item";

        item.innerHTML = `
          <span class="symbol-latex">${latex}</span>
          <span class="symbol-char">${char}</span>
        `;

        item.addEventListener("click", () => {
          if (typeof insertAtCursor === "function") {
            insertAtCursor(latex);
          } else {
            console.warn("insertAtCursor() is not defined");
          }
        });

        grid.appendChild(item);
      });

      // Close button
      modal.querySelector(".symbol-modal-close").onclick = () => {
        modal.style.display = "none";
      };

      // Click outside modal closes it
      modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.style.display = "none";
      });
    }

    modal.style.display = "flex";
  }

});
