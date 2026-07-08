const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}

const storageKeys = {
  services: "beauty_services",
  specialists: "beauty_specialists",
  bookings: "beauty_bookings",
};

const defaultServices = [
  { id: "haircut", name: "Մազերի կտրում", duration: 45, price: 8000 },
  { id: "color", name: "Մազերի ներկում", duration: 120, price: 25000 },
  { id: "makeup", name: "Դիմահարդարում", duration: 60, price: 18000 },
  { id: "nails", name: "Մատնահարդարում", duration: 75, price: 10000 },
  { id: "brows", name: "Հոնքերի ձևավորում", duration: 30, price: 5000 },
  { id: "skincare", name: "Դեմքի խնամք", duration: 60, price: 16000 },
];

const defaultSpecialists = [
  { id: "mariam", name: "Մարիամ", role: "Hair stylist", services: ["haircut", "color"], rating: "4.9" },
  { id: "ani", name: "Անի", role: "Makeup artist", services: ["makeup", "brows"], rating: "5.0" },
  { id: "sona", name: "Սոնա", role: "Nail master", services: ["nails"], rating: "4.8" },
  { id: "lilit", name: "Լիլիթ", role: "Cosmetologist", services: ["skincare", "brows"], rating: "4.9" },
];

const slots = ["10:00", "11:00", "12:00", "13:30", "15:00", "16:30", "18:00", "19:00"];

const state = {
  services: load(storageKeys.services, defaultServices),
  specialists: load(storageKeys.specialists, defaultSpecialists),
  bookings: load(storageKeys.bookings, []),
  selection: {
    serviceId: null,
    specialistId: null,
    date: null,
    time: null,
    reminder: true,
  },
  view: "services",
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const apiEnabled = location.protocol === "http:" || location.protocol === "https:";

const views = {
  services: $("#servicesView"),
  specialists: $("#specialistsView"),
  time: $("#timeView"),
  summary: $("#summaryView"),
};

function load(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key)) || fallback;
  } catch {
    return fallback;
  }
}

function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function money(value) {
  return `${Number(value).toLocaleString("hy-AM")} ֏`;
}

function todayIso() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

function makeId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2, 7)}`;
}

function selectedService() {
  return state.services.find((service) => service.id === state.selection.serviceId);
}

function selectedSpecialist() {
  return state.specialists.find((specialist) => specialist.id === state.selection.specialistId);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-visible"), 2600);
  tg?.HapticFeedback?.notificationOccurred("success");
}

async function saveBookingToServer(booking) {
  if (!apiEnabled) return null;
  const response = await fetch("/api/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ booking }),
  });
  if (!response.ok) throw new Error("Booking API failed");
  return response.json();
}

function setView(view) {
  state.view = view;
  Object.entries(views).forEach(([name, element]) => element.classList.toggle("is-visible", name === view));
  $$(".step").forEach((button) => button.classList.toggle("is-active", button.dataset.view === view));
  if (view === "summary") renderSummary();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderServices() {
  $("#servicesCount").textContent = `${state.services.length} տարբերակ`;
  $("#servicesList").innerHTML = state.services
    .map((service) => `
      <button class="service-card ${state.selection.serviceId === service.id ? "is-selected" : ""}" data-service="${service.id}">
        <strong>${service.name}</strong>
        <span class="meta">${service.duration} րոպե</span>
        <span class="price">${money(service.price)}</span>
      </button>
    `)
    .join("");
}

function renderSpecialists() {
  const service = selectedService();
  const specialists = state.specialists.filter((specialist) => !service || specialist.services.includes(service.id));
  $("#specialistsList").innerHTML = specialists.length
    ? specialists
        .map((specialist) => `
          <button class="specialist-card ${state.selection.specialistId === specialist.id ? "is-selected" : ""}" data-specialist="${specialist.id}">
            <span class="avatar">${specialist.name.slice(0, 1)}</span>
            <span>
              <strong>${specialist.name}</strong>
              <span class="meta">${specialist.role}</span>
            </span>
            <span class="rating">★ ${specialist.rating || "4.8"}</span>
          </button>
        `)
        .join("")
    : `<div class="summary-card">Այս ծառայության համար մասնագետ դեռ չկա։</div>`;
}

function renderSlots() {
  const taken = state.bookings
    .filter((booking) => booking.date === state.selection.date && booking.specialistId === state.selection.specialistId && booking.status !== "Չեղարկված")
    .map((booking) => booking.time);

  $("#slotList").innerHTML = slots
    .map((slot) => {
      const disabled = taken.includes(slot);
      const selected = state.selection.time === slot;
      return `<button class="slot ${selected ? "is-selected" : ""}" ${disabled ? "disabled" : ""} data-slot="${slot}">${disabled ? "Զբաղված" : slot}</button>`;
    })
    .join("");
}

function renderSummary() {
  const service = selectedService();
  const specialist = selectedSpecialist();
  $("#summaryCard").innerHTML = `
    <div class="summary-row"><span>Ծառայություն</span><strong>${service?.name || "-"}</strong></div>
    <div class="summary-row"><span>Մասնագետ</span><strong>${specialist?.name || "-"}</strong></div>
    <div class="summary-row"><span>Ամսաթիվ</span><strong>${state.selection.date || "-"}</strong></div>
    <div class="summary-row"><span>Ժամ</span><strong>${state.selection.time || "-"}</strong></div>
    <div class="summary-row"><span>Գին</span><strong>${service ? money(service.price) : "-"}</strong></div>
    <div class="summary-row"><span>Հիշեցում</span><strong>${state.selection.reminder ? "Այո" : "Ոչ"}</strong></div>
  `;
}

function renderBookings() {
  const sorted = [...state.bookings].sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  $("#bookingsList").innerHTML = sorted.length
    ? sorted
        .map((booking) => `
          <article class="booking-item">
            <div class="booking-row"><span>${booking.serviceName}</span><strong>${booking.status}</strong></div>
            <div class="booking-row"><span>${booking.specialistName}</span><strong>${booking.date} ${booking.time}</strong></div>
            <div class="booking-row"><span>${money(booking.price)}</span><button class="danger" data-cancel="${booking.id}">Չեղարկել</button></div>
          </article>
        `)
        .join("")
    : `<div class="summary-card">Դեռ ամրագրումներ չկան։</div>`;
}

function renderAdmin() {
  $("#adminStats").innerHTML = `
    <div class="stat"><strong>${state.services.length}</strong><span>Ծառայություն</span></div>
    <div class="stat"><strong>${state.specialists.length}</strong><span>Մասնագետ</span></div>
    <div class="stat"><strong>${state.bookings.length}</strong><span>Ամրագրում</span></div>
  `;

  $("#adminServices").innerHTML = state.services
    .map((service) => `
      <div class="admin-row">
        <span><strong>${service.name}</strong><br><span class="meta">${service.duration} րոպե · ${money(service.price)}</span></span>
        <button type="button" class="danger" data-delete-service="${service.id}">Ջնջել</button>
      </div>
    `)
    .join("");

  $("#adminSpecialists").innerHTML = state.specialists
    .map((specialist) => `
      <div class="admin-row">
        <span><strong>${specialist.name}</strong><br><span class="meta">${specialist.role}</span></span>
        <button type="button" class="danger" data-delete-specialist="${specialist.id}">Ջնջել</button>
      </div>
    `)
    .join("");

  $("#adminBookings").innerHTML = state.bookings.length
    ? state.bookings
        .map((booking) => `
          <div class="admin-row">
            <span><strong>${booking.serviceName}</strong><br><span class="meta">${booking.specialistName} · ${booking.date} ${booking.time} · ${booking.status}</span></span>
            <button type="button" class="danger" data-delete-booking="${booking.id}">Ջնջել</button>
          </div>
        `)
        .join("")
    : `<div class="summary-card">Ամրագրումներ չկան։</div>`;
}

function rerenderAll() {
  renderServices();
  renderSpecialists();
  renderSlots();
  renderSummary();
  renderBookings();
  renderAdmin();
}

async function confirmBooking() {
  const service = selectedService();
  const specialist = selectedSpecialist();
  if (!service || !specialist || !state.selection.date || !state.selection.time) {
    showToast("Խնդրում ենք լրացնել բոլոր դաշտերը");
    return;
  }

  const booking = {
    id: makeId("booking"),
    serviceId: service.id,
    serviceName: service.name,
    specialistId: specialist.id,
    specialistName: specialist.name,
    date: state.selection.date,
    time: state.selection.time,
    price: service.price,
    reminder: state.selection.reminder,
    reminded: false,
    status: "Հաստատված",
    createdAt: new Date().toISOString(),
    telegramUserId: tg?.initDataUnsafe?.user?.id ? String(tg.initDataUnsafe.user.id) : "",
    telegramUserName: tg?.initDataUnsafe?.user?.username || "",
  };

  try {
    await saveBookingToServer(booking);
  } catch {
    showToast("Backend-ը հասանելի չէ, պահվեց local-ում");
  }

  state.bookings.push(booking);
  save(storageKeys.bookings, state.bookings);
  state.selection.time = null;
  rerenderAll();
  setView("services");
  showToast("Ամրագրումը հաստատված է");

  const message = `Գրանցում՝ ${booking.serviceName}, ${booking.specialistName}, ${booking.date} ${booking.time}`;
  tg?.sendData?.(JSON.stringify({ type: "booking_created", booking }));
  tg?.MainButton?.setText(message);
}

function checkReminders() {
  const now = Date.now();
  let changed = false;

  state.bookings.forEach((booking) => {
    if (!booking.reminder || booking.reminded || booking.status === "Չեղարկված") return;
    const startsAt = new Date(`${booking.date}T${booking.time}:00`).getTime();
    const diff = startsAt - now;
    if (diff > 0 && diff <= 2 * 60 * 60 * 1000) {
      booking.reminded = true;
      changed = true;
      showToast(`Հիշեցում՝ այսօր ${booking.time}-ին ${booking.serviceName}`);
    }
  });

  if (changed) {
    save(storageKeys.bookings, state.bookings);
    rerenderAll();
  }
}

document.addEventListener("click", (event) => {
  const serviceButton = event.target.closest("[data-service]");
  const specialistButton = event.target.closest("[data-specialist]");
  const slotButton = event.target.closest("[data-slot]");
  const stepButton = event.target.closest("[data-view]");
  const backButton = event.target.closest("[data-back]");
  const cancelButton = event.target.closest("[data-cancel]");
  const deleteService = event.target.closest("[data-delete-service]");
  const deleteSpecialist = event.target.closest("[data-delete-specialist]");
  const deleteBooking = event.target.closest("[data-delete-booking]");

  if (serviceButton) {
    state.selection.serviceId = serviceButton.dataset.service;
    state.selection.specialistId = null;
    state.selection.time = null;
    rerenderAll();
    setView("specialists");
  }

  if (specialistButton) {
    state.selection.specialistId = specialistButton.dataset.specialist;
    state.selection.time = null;
    rerenderAll();
    setView("time");
  }

  if (slotButton && !slotButton.disabled) {
    state.selection.time = slotButton.dataset.slot;
    rerenderAll();
    setView("summary");
  }

  if (stepButton) {
    setView(stepButton.dataset.view);
  }

  if (backButton) {
    setView(backButton.dataset.back);
  }

  if (cancelButton) {
    const booking = state.bookings.find((item) => item.id === cancelButton.dataset.cancel);
    if (booking) booking.status = "Չեղարկված";
    save(storageKeys.bookings, state.bookings);
    rerenderAll();
    showToast("Ամրագրումը չեղարկվեց");
  }

  if (deleteService) {
    state.services = state.services.filter((service) => service.id !== deleteService.dataset.deleteService);
    state.specialists = state.specialists.map((specialist) => ({
      ...specialist,
      services: specialist.services.filter((id) => id !== deleteService.dataset.deleteService),
    }));
    save(storageKeys.services, state.services);
    save(storageKeys.specialists, state.specialists);
    rerenderAll();
  }

  if (deleteSpecialist) {
    state.specialists = state.specialists.filter((specialist) => specialist.id !== deleteSpecialist.dataset.deleteSpecialist);
    save(storageKeys.specialists, state.specialists);
    rerenderAll();
  }

  if (deleteBooking) {
    state.bookings = state.bookings.filter((booking) => booking.id !== deleteBooking.dataset.deleteBooking);
    save(storageKeys.bookings, state.bookings);
    rerenderAll();
  }
});

$("#startBooking").addEventListener("click", () => setView("services"));
$("#confirmBooking").addEventListener("click", confirmBooking);
$("#bookingDate").addEventListener("change", (event) => {
  state.selection.date = event.target.value;
  state.selection.time = null;
  renderSlots();
});
$("#reminderToggle").addEventListener("change", (event) => {
  state.selection.reminder = event.target.checked;
  renderSummary();
});
$("#clearPast").addEventListener("click", () => {
  const nowIso = todayIso();
  state.bookings = state.bookings.filter((booking) => booking.date >= nowIso);
  save(storageKeys.bookings, state.bookings);
  rerenderAll();
});

$("#adminOpen").addEventListener("click", () => {
  $("#adminDialog").showModal();
  renderAdmin();
});

$("#unlockAdmin").addEventListener("click", () => {
  if ($("#adminPin").value !== "2026") {
    showToast("Սխալ PIN");
    return;
  }
  $("#pinGate").style.display = "none";
  $("#adminPanel").classList.add("is-visible");
});

$("#addService").addEventListener("click", () => {
  const name = $("#newServiceName").value.trim();
  const price = Number($("#newServicePrice").value);
  const duration = Number($("#newServiceDuration").value);
  if (!name || !price || !duration) {
    showToast("Լրացրեք ծառայության բոլոր դաշտերը");
    return;
  }
  state.services.push({ id: makeId("service"), name, price, duration });
  save(storageKeys.services, state.services);
  $("#newServiceName").value = "";
  $("#newServicePrice").value = "";
  $("#newServiceDuration").value = "";
  rerenderAll();
});

$("#addSpecialist").addEventListener("click", () => {
  const name = $("#newSpecialistName").value.trim();
  const role = $("#newSpecialistRole").value.trim();
  if (!name || !role) {
    showToast("Լրացրեք մասնագետի անունն ու ոլորտը");
    return;
  }
  state.specialists.push({
    id: makeId("specialist"),
    name,
    role,
    services: state.services.map((service) => service.id),
    rating: "4.8",
  });
  save(storageKeys.specialists, state.specialists);
  $("#newSpecialistName").value = "";
  $("#newSpecialistRole").value = "";
  rerenderAll();
});

$("#bookingDate").min = todayIso();
$("#bookingDate").value = todayIso();
state.selection.date = todayIso();

rerenderAll();
setInterval(checkReminders, 60000);
checkReminders();
