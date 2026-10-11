
  // ===== THINGS YOU (or Hira) EDIT =====
  const WHATSAPP = "923001234567";   // TODO: Hira's number, country code first, no + or spaces
  const FULLY_BOOKED = [];           // Hira adds dates here, e.g. ["2026-12-12", "2026-12-13"]

  // TODO: all prices and sizes below are placeholders. Confirm with Hira.
  // notice = minimum days in advance
  const MENU = [
    { name:"Biscoff Cheesecake",   cat:"Cheesecake",          best:true,  notice:3, sizes:["Jar","1 lb","2 lb"],         price:"PKR 1800" },
    { name:"Chocolate Fudge Cake", cat:"Cakes",               best:true,  notice:3, sizes:["1 lb","2 lb"],               price:"PKR 2200" },
    { name:"Red Velvet Cupcakes",  cat:"Cupcakes",            best:true,  notice:2, sizes:["Box of 6","Box of 12"],      price:"PKR 1500" },
    { name:"Plain Cake",           cat:"Cakes",               best:false, notice:3, sizes:["1 lb","2 lb"],               price:"PKR 1200" },
    { name:"Brownies",             cat:"Brownies & Cookies",  best:false, notice:2, sizes:["Box of 6","Box of 12"],      price:"PKR 800" },
    { name:"Cookies",              cat:"Brownies & Cookies",  best:false, notice:2, sizes:["Box of 6","Box of 12"],      price:"PKR 600" },
    { name:"Cheesecake Jars",      cat:"Cheesecake",          best:false, notice:2, sizes:["1 jar","Box of 4"],          price:"PKR 1000" },
    { name:"Custom Birthday / Anniversary Cake", cat:"Custom", best:false, notice:5, sizes:["1 lb","2 lb","Bigger (tell Hira)"], price:"Depends on design" }
  ];

  // ===== SHORTCUT =====
  const $ = id => document.getElementById(id);

  // ===== SHOW BESTSELLERS =====
  $("best-grid").innerHTML = MENU.filter(i => i.best).map(i =>
    `<div class="card"><h3>${i.name}</h3><p>${i.sizes.join(" / ")}</p><strong>${i.price}</strong></div>`
  ).join("");

  // ===== SHOW MENU grouped by category =====
  const cats = [...new Set(MENU.map(i => i.cat))];
  $("menu-list").innerHTML = cats.map(c =>
    `<h3>${c}</h3><ul>` +
    MENU.filter(i => i.cat === c).map(i =>
      `<li><span>${i.name} <small>(${i.sizes.join(" / ")})</small></span><strong>${i.price}</strong></li>`
    ).join("") + `</ul>`
  ).join("");

  // ===== FILL THE ITEM DROPDOWN =====
  $("f-item").innerHTML = MENU.map(i => `<option>${i.name}</option>`).join("");

  // Helper: date -> "YYYY-MM-DD" using local time
  const iso = d => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

  // When the item changes: update sizes, notice text, and earliest allowed date
  function updateItem() {
    const item = MENU.find(i => i.name === $("f-item").value);
    $("f-size").innerHTML = item.sizes.map(s => `<option>${s}</option>`).join("");
    const earliest = new Date();
    earliest.setDate(earliest.getDate() + item.notice);
    $("f-date").min = iso(earliest);                       // blocks dates that are too soon
    $("notice").textContent = `${item.name} needs at least ${item.notice} days' notice.`;
  }
  $("f-item").addEventListener("change", updateItem);
  updateItem();

  // Show address fields only for delivery
  $("f-mode").addEventListener("change", () => {
    const delivery = $("f-mode").value === "Delivery";
    $("delivery-fields").hidden = !delivery;
    $("f-area").required = delivery;
    $("f-address").required = delivery;
  });

  // ===== SUBMIT: build a WhatsApp message =====
  $("order-form").addEventListener("submit", e => {
    e.preventDefault();
    const dateVal = $("f-date").value;

    // Closed on Sundays
    if (new Date(dateVal + "T00:00:00").getDay() === 0) {
      return alert("Sorry, we are closed on Sundays. Please choose another date.");
    }
    // Hira's "fully booked" list
    if (FULLY_BOOKED.includes(dateVal)) {
      return alert("Sorry, that date is fully booked. Please choose another date.");
    }

    const delivery = $("f-mode").value === "Delivery";
    const lines = [
      "*New order - Sweet Crumbs*",
      `Name: ${$("f-name").value}`,
      `Phone: ${$("f-phone").value}`,
      `Item: ${$("f-item").value}`,
      `Size: ${$("f-size").value} x ${$("f-qty").value}`,
      `Date needed: ${dateVal}`,
      `Type: ${$("f-mode").value}`,
      delivery ? `Area: ${$("f-area").value}` : "",
      delivery ? `Address: ${$("f-address").value}` : "",
      $("f-msg").value ? `Message on cake: ${$("f-msg").value}` : "",
      "(I will send my reference photo in this chat)"
    ].filter(Boolean);                                     // removes empty lines

    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
  });

  // Contact button
  $("wa-link").href = `https://wa.me/${WHATSAPP}`;
