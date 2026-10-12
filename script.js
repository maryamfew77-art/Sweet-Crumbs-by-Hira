  // ===== THINGS YOU (or Hira) EDIT =====
  const WHATSAPP = "923001234567";   // TODO: Hira's number, country code first, no + or spaces
  const INSTAGRAM = "";              // TODO: Hira's Instagram username only (no @, no link). Empty = Instagram button stays hidden
  const FULLY_BOOKED = [];           // Hira adds dates here, e.g. ["2026-12-12", "2026-12-13"]

  // TODO: all prices and sizes below are placeholders. Confirm with Hira.
  // notice = minimum days in advance, img = photo in assets/images (bestsellers only)
  const MENU = [
    { name:"Biscoff Cheesecake",   cat:"Cheesecake",          best:true,  notice:3, sizes:["Jar","1 lb","2 lb"],         price:"PKR 1800", img:"cake2 - Copy.jpg" },
    { name:"Chocolate Fudge Cake", cat:"Cakes",               best:true,  notice:3, sizes:["1 lb","2 lb"],               price:"PKR 2200", img:"cake1.jpg" },
    { name:"Red Velvet Cupcakes",  cat:"Cupcakes",            best:true,  notice:2, sizes:["Box of 6","Box of 12"],      price:"PKR 1500", img:"cake3 - Copy.jpg" },
    { name:"Plain Cake",           cat:"Cakes",               best:false, notice:3, sizes:["1 lb","2 lb"],               price:"PKR 1200" },
    { name:"Brownies",             cat:"Brownies & Cookies",  best:false, notice:2, sizes:["Box of 6","Box of 12"],      price:"PKR 800" },
    { name:"Cookies",              cat:"Brownies & Cookies",  best:false, notice:2, sizes:["Box of 6","Box of 12"],      price:"PKR 600" },
    { name:"Cheesecake Jars",      cat:"Cheesecake",          best:false, notice:2, sizes:["1 jar","Box of 4"],          price:"PKR 1000" },
    { name:"Custom Birthday / Anniversary Cake", cat:"Custom", best:false, notice:5, sizes:["1 lb","2 lb","Bigger (tell Hira)"], price:"Price on request" }
  ];

  // ===== SHORTCUT =====
  const $ = id => document.getElementById(id);

  // ===== SHOW BESTSELLERS (same photo size on every card) =====
  $("best-grid").innerHTML = MENU.filter(i => i.best).map(i => `
    <article class="card">
      <div class="card-img">
        ${i.img ? `<img src="${encodeURI("./assets/images/" + i.img)}" alt="${i.name}" loading="lazy" onerror="this.remove()">` : ""}
        <span class="badge">Bestseller</span>
      </div>
      <div class="card-body">
        <h3>${i.name}</h3>
        <p class="sizes">${i.sizes.join(" / ")}</p>
        <p class="price">${i.price}</p>
      </div>
    </article>`
  ).join("");

  // ===== SHOW MENU grouped by category (custom cakes get a "price on request" label) =====
  const cats = [...new Set(MENU.map(i => i.cat))];
  $("menu-list").innerHTML = cats.map(c =>
    `<h3>${c}</h3><ul>` +
    MENU.filter(i => i.cat === c).map(i =>
      `<li><span class="item-name">${i.name}<small>${i.sizes.join(" / ")}</small></span>` +
      `<span class="item-price${i.cat === "Custom" ? " on-request" : ""}">${i.price}</span></li>`
    ).join("") + `</ul>`
  ).join("");

  // ===== FILL THE ITEM DROPDOWN =====
  $("f-item").innerHTML = MENU.map(i => `<option>${i.name}</option>`).join("");

  // Helper: date -> "YYYY-MM-DD" using local time
  const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

  // Helpers for showing / clearing an error message under a field
  function setError(fieldId, errorId, message) {
    $(errorId).textContent = message;
    if (message) $(fieldId).setAttribute("aria-invalid", "true");
    else $(fieldId).removeAttribute("aria-invalid");
    return message;
  }

  // When the item changes: update sizes, notice text, and earliest allowed date
  function updateItem() {
    const item = MENU.find(i => i.name === $("f-item").value);
    $("f-size").innerHTML = item.sizes.map(s => `<option>${s}</option>`).join("");
    const earliest = new Date();
    earliest.setDate(earliest.getDate() + item.notice);
    $("f-date").min = iso(earliest);                       // blocks dates that are too soon
    $("notice").textContent = `${item.name} needs at least ${item.notice} days' notice.`;
    setError("f-date", "date-error", "");
  }
  $("f-item").addEventListener("change", updateItem);
  updateItem();

  // Show address fields only for delivery (and the pickup note only for pickup)
  function updateMode() {
    const delivery = $("f-mode").value === "Delivery";
    $("delivery-fields").hidden = !delivery;
    $("pickup-note").hidden = delivery;
    $("f-area").required = delivery;
    $("f-address").required = delivery;
  }
  $("f-mode").addEventListener("change", updateMode);
  updateMode();

  // Extra note when Satiana Road or another area is chosen
  $("f-area").addEventListener("change", () => {
    const needsConfirm = /Satiana|Other/.test($("f-area").value);
    $("area-hint").textContent = needsConfirm
      ? "Hira will confirm this area and the delivery charge before accepting your order." : "";
  });

  // Clear an error as soon as the customer edits the field
  $("f-phone").addEventListener("input", () => setError("f-phone", "phone-error", ""));
  $("f-date").addEventListener("input", () => setError("f-date", "date-error", ""));

  // Checks the date and returns an error message (empty text = OK)
  function dateProblem() {
    const dateVal = $("f-date").value;
    if (!dateVal) return "Please choose the date you need your order.";
    if (dateVal < $("f-date").min) {
      const earliest = new Date($("f-date").min + "T00:00:00")
        .toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
      return `This item needs more notice. The earliest date is ${earliest}.`;
    }
    // Closed on Sundays
    if (new Date(dateVal + "T00:00:00").getDay() === 0) {
      return "Sorry, we are closed on Sundays. Please choose another date.";
    }
    // Hira's "fully booked" list
    if (FULLY_BOOKED.includes(dateVal)) {
      return "Sorry, that date is fully booked. Please choose another date.";
    }
    return "";
  }

  // ===== SUBMIT: check the form, then build a WhatsApp message =====
  $("order-form").addEventListener("submit", e => {
    e.preventDefault();

    const phoneDigits = $("f-phone").value.replace(/\D/g, "");
    const phoneMsg = setError("f-phone", "phone-error",
      phoneDigits.length < 10 ? "Please enter a valid phone number, for example 03XX XXXXXXX." : "");
    const dateMsg = setError("f-date", "date-error", dateProblem());

    // Stop here and jump to the first problem
    if (phoneMsg || dateMsg) {
      (phoneMsg ? $("f-phone") : $("f-date")).focus();
      return;
    }

    const delivery = $("f-mode").value === "Delivery";
    const lines = [
      "*New order - Sweet Crumbs*",
      `Name: ${$("f-name").value.trim()}`,
      `Phone: ${$("f-phone").value.trim()}`,
      `Item: ${$("f-item").value}`,
      `Size: ${$("f-size").value} x ${$("f-qty").value}`,
      `Date needed: ${$("f-date").value}`,
      `Type: ${$("f-mode").value}`,
      delivery ? `Area: ${$("f-area").value}` : "",
      delivery ? `Address: ${$("f-address").value.trim()}` : "",
      $("f-msg").value.trim() ? `Message on cake: ${$("f-msg").value.trim()}` : "",
      $("f-notes").value.trim() ? `Special instructions: ${$("f-notes").value.trim()}` : "",
      "(I will send my reference photo in this chat)"
    ].filter(Boolean);                                     // removes empty lines

    const url = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`;
    // If the phone blocks the new tab, open WhatsApp in the same tab instead
    if (!window.open(url, "_blank")) window.location.href = url;
  });

  // Contact buttons
  $("wa-link").href = `https://wa.me/${WHATSAPP}`;
  if (INSTAGRAM) {
    $("ig-link").href = `https://instagram.com/${INSTAGRAM}`;
    $("ig-link").hidden = false;
  }

  // ===== MOBILE MENU (hamburger button) =====
  const menuToggle = $("menu-toggle");
  const navbar = $("navbar");

  function setMenu(open) {
    navbar.classList.toggle("open", open);                 // shows or hides the links
    menuToggle.setAttribute("aria-expanded", open);        // tells screen readers the state
    menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  // Open or close when the button is tapped
  menuToggle.addEventListener("click", () => setMenu(!navbar.classList.contains("open")));

  // Close the menu after tapping a link
  navbar.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setMenu(false)));

  // Close with the Escape key
  document.addEventListener("keydown", e => { if (e.key === "Escape") setMenu(false); });

  // Reset the menu if the screen grows to desktop size
  window.matchMedia("(min-width: 769px)").addEventListener("change", e => { if (e.matches) setMenu(false); });