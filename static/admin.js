const nonWorkingForm = document.querySelector("#nonWorkingForm");
const durationForm = document.querySelector("#durationForm");
const priceForm = document.querySelector("#priceForm");
const priceStatus = document.querySelector("#priceStatus");
const adminSlotCountEl = document.querySelector("#adminSlotCount");
const nonWorkingDaysEl = document.querySelector("#nonWorkingDays");
const bookingsEl = document.querySelector("#bookings");
const refreshBookings = document.querySelector("#refreshBookings");

let nonWorkingDays = [];
let servicePrices = {};

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "Request failed");
  }
  return data;
}

async function loadSchedule() {
  const [schedule, publicData] = await Promise.all([
    requestJson("/api/admin/schedule"),
    requestJson("/api/availability"),
  ]);

  nonWorkingDays = schedule.nonWorkingDays || [];
  servicePrices = publicData.servicePrices || {};
  fillDurationForm(schedule.workSettings);
  fillPriceForm();
  adminSlotCountEl.textContent = `${schedule.availability.length} ազատ ժամ`;
  renderNonWorkingDays();
}

function fillDurationForm(settings) {
  durationForm.elements.studioBlockMinutes.value = String(settings.studioBlockMinutes || 60);
  durationForm.elements.otherBlockMinutes.value = String(settings.otherBlockMinutes || 120);
  durationForm.dataset.dateFrom = settings.dateFrom;
  durationForm.dataset.dateTo = settings.dateTo;
  durationForm.dataset.startTime = settings.startTime;
  durationForm.dataset.endTime = settings.endTime;
  durationForm.dataset.slotMinutes = settings.slotMinutes;
}

function fillPriceForm() {
  ["studio", "yerevan"].forEach((group) => {
    ["Photo", "Reel", "Photo + Reel"].forEach((key) => {
      priceForm.elements[`${group}.${key}`].value = servicePrices[group]?.[key] || 0;
    });
  });
}

function renderNonWorkingDays() {
  nonWorkingDaysEl.innerHTML = nonWorkingDays.length ? "" : '<p class="empty">Ոչ աշխատանքային օրեր նշված չեն։</p>';

  nonWorkingDays.forEach((day) => {
    const row = document.createElement("article");
    row.className = "admin-row";
    row.innerHTML = `
      <div>
        <strong>${day.date}</strong>
        <small>${day.reason || "Ոչ աշխատանքային օր"}</small>
      </div>
      <div class="row-actions">
        <button type="button" data-action="deleteNonWorking" data-id="${day.id}">Հեռացնել</button>
      </div>
    `;
    nonWorkingDaysEl.append(row);
  });
}

async function loadBookings() {
  const data = await requestJson("/api/admin/bookings");
  bookingsEl.innerHTML = data.bookings.length ? "" : '<p class="empty">Հարցումներ չկան։</p>';

  data.bookings.slice().reverse().forEach((booking) => {
    const row = document.createElement("article");
    row.className = "admin-row booking-row";
    row.innerHTML = `
      <div>
        <strong>${booking.firstName} ${booking.lastName}</strong>
        <span>${booking.date} ${booking.time} · ${booking.serviceType || "Photo"} · ${booking.photoType}</span>
        ${booking.isPreferredTimeRequest ? "<span>Ցանկալի ժամի հարցում</span>" : ""}
        <span>Գին՝ ${formatPrice(booking.price)}</span>
        <small>${booking.statusLabel}</small>
      </div>
      <div class="row-actions">
        <button type="button" data-action="approve" data-id="${booking.id}">Հաստատել</button>
        <button type="button" data-action="reject" data-id="${booking.id}">Մերժել</button>
      </div>
      <p>${formatLocation(booking)}</p>
      <p>Անձեր՝ ${booking.peopleCount}. Նշումներ՝ ${booking.notes || "-"}</p>
    `;
    bookingsEl.append(row);
  });
}

function formatLocation(booking) {
  if (booking.locationType === "studio") {
    return `${booking.studioName || "-"}, ${booking.studioAddress || "-"}`;
  }
  if (booking.locationType === "other") {
    const area = booking.otherArea === "outside" ? "Երևանից դուրս" : "Երևան";
    return `${area}. ${booking.otherAddress || "-"}`;
  }
  return "Վայրը դեռ որոշված չէ";
}

function formatPrice(value) {
  if (value === null) return "Հարցումով";
  const amount = Number(value || 0);
  if (!amount) return "Նշված չէ";
  return `${new Intl.NumberFormat("hy-AM").format(amount)} AMD`;
}

priceForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(priceForm);
  const payload = {
    studio: {
      Photo: formData.get("studio.Photo"),
      Reel: formData.get("studio.Reel"),
      "Photo + Reel": formData.get("studio.Photo + Reel"),
    },
    yerevan: {
      Photo: formData.get("yerevan.Photo"),
      Reel: formData.get("yerevan.Reel"),
      "Photo + Reel": formData.get("yerevan.Photo + Reel"),
    },
  };
  const data = await requestJson("/api/admin/prices", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  servicePrices = data.servicePrices;
  fillPriceForm();
  priceStatus.textContent = "Գները պահպանված են։";
  priceStatus.dataset.type = "success";
});

nonWorkingForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(nonWorkingForm);
  await requestJson("/api/admin/non-working/range", {
    method: "POST",
    body: JSON.stringify({
      dateFrom: formData.get("dateFrom"),
      dateTo: formData.get("dateTo"),
      reason: formData.get("reason"),
    }),
  });
  nonWorkingForm.reset();
  await loadSchedule();
});

durationForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(durationForm);
  await requestJson("/api/admin/work-settings", {
    method: "POST",
    body: JSON.stringify({
      dateFrom: durationForm.dataset.dateFrom,
      dateTo: durationForm.dataset.dateTo,
      startTime: durationForm.dataset.startTime,
      endTime: durationForm.dataset.endTime,
      slotMinutes: durationForm.dataset.slotMinutes,
      studioBlockMinutes: formData.get("studioBlockMinutes"),
      otherBlockMinutes: formData.get("otherBlockMinutes"),
    }),
  });
  await loadSchedule();
});

nonWorkingDaysEl.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button || button.dataset.action !== "deleteNonWorking") return;
  await requestJson("/api/admin/non-working/delete", {
    method: "POST",
    body: JSON.stringify({ id: button.dataset.id }),
  });
  await loadSchedule();
});

bookingsEl.addEventListener("click", async (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  const status = button.dataset.action === "approve" ? "approved" : "rejected";
  await requestJson("/api/admin/bookings/status", {
    method: "POST",
    body: JSON.stringify({ bookingId: button.dataset.id, status }),
  });
  await Promise.all([loadBookings(), loadSchedule()]);
});

refreshBookings.addEventListener("click", loadBookings);

Promise.all([loadSchedule(), loadBookings()]);
