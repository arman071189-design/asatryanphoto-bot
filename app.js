const tg = window.Telegram?.WebApp;

if (tg) {
  tg.ready();
  tg.expand();
}

const storageKeys = {
  services: "beauty_services_v2",
  specialists: "beauty_specialists_v2",
  bookings: "beauty_bookings_v2",
  lang: "beauty_lang",
};

const i18n = {
  hy: {
    title: "Ամրագրել այց",
    heroText: "Ընտրեք ծառայությունը, մասնագետին և հարմար ժամը։",
    start: "Սկսել ամրագրումը",
    stepServices: "1. Ծառայություն",
    stepSpecialists: "2. Մասնագետ",
    stepTime: "3. Ժամ",
    stepConfirm: "4. Հաստատում",
    services: "Ծառայություններ",
    specialists: "Մասնագետներ",
    changeService: "Փոխել ծառայությունը",
    changeSpecialist: "Փոխել մասնագետին",
    timeSelect: "Ժամի ընտրություն",
    date: "Ամսաթիվ",
    availableTimes: "Հասանելի ժամեր",
    clientName: "Անուն",
    clientPhone: "Հեռախոս",
    vipClient: "VIP / loyalty հաճախորդ",
    reminder: "Հիշեցնել այցից 24 ժամ և 2 ժամ առաջ",
    summary: "Ամրագրում",
    changeTime: "Փոխել ժամը",
    confirm: "Ուղարկել հաստատման",
    portfolio: "Portfolio",
    giftCards: "Gift cards",
    giftTitle: "Beauty certificate",
    giftText: "Նվիրեք premium խնամքի փորձ՝ 25,000 ֏-ից սկսած։",
    giftButton: "Հետաքրքրված եմ",
    reviews: "Կարծիքներ",
    myBookings: "Իմ ամրագրումները",
    refresh: "Թարմացնել",
    adminPanel: "Կառավարման վահանակ",
    pin: "Մուտքագրեք PIN",
    login: "Մուտք",
    add: "Ավելացնել",
    bookings: "Ամրագրումներ",
    minutes: "րոպե",
    serviceCount: "տարբերակ",
    occupied: "Զբաղված",
    noSpecialists: "Այս ծառայության համար մասնագետ դեռ չկա։",
    noBookings: "Դեռ ամրագրումներ չկան։",
    status: "Կարգավիճակ",
    pending: "Սպասում է",
    confirmed: "Հաստատված",
    cancelled: "Չեղարկված",
    completed: "Ավարտված",
    edit: "Խմբագրել",
    save: "Պահել",
    delete: "Ջնջել",
    cancel: "Չեղարկել",
    complete: "Ավարտել",
    pendingAction: "Սպասման մեջ",
    sent: "Ամրագրումն ուղարկվեց հաստատման",
    fillAll: "Լրացրեք բոլոր պարտադիր դաշտերը",
    backendOffline: "Backend-ը հասանելի չէ, պահվեց local-ում",
    giftToast: "Մենք կկապվենք gift card-ի մանրամասների համար",
  },
  ru: {
    title: "Записаться",
    heroText: "Выберите услугу, специалиста и удобное время.",
    start: "Начать запись",
    stepServices: "1. Услуга",
    stepSpecialists: "2. Специалист",
    stepTime: "3. Время",
    stepConfirm: "4. Подтверждение",
    services: "Услуги",
    specialists: "Специалисты",
    changeService: "Изменить услугу",
    changeSpecialist: "Изменить специалиста",
    timeSelect: "Выбор времени",
    date: "Дата",
    availableTimes: "Доступное время",
    clientName: "Имя",
    clientPhone: "Телефон",
    vipClient: "VIP / loyalty клиент",
    reminder: "Напомнить за 24 часа и за 2 часа",
    summary: "Запись",
    changeTime: "Изменить время",
    confirm: "Отправить на подтверждение",
    portfolio: "Портфолио",
    giftCards: "Подарочные карты",
    giftTitle: "Beauty certificate",
    giftText: "Подарите premium уход от 25,000 ֏.",
    giftButton: "Интересно",
    reviews: "Отзывы",
    myBookings: "Мои записи",
    refresh: "Обновить",
    adminPanel: "Панель управления",
    pin: "Введите PIN",
    login: "Войти",
    add: "Добавить",
    bookings: "Записи",
    minutes: "мин",
    serviceCount: "вариантов",
    occupied: "Занято",
    noSpecialists: "Для этой услуги пока нет специалиста.",
    noBookings: "Записей пока нет.",
    status: "Статус",
    pending: "Ожидает",
    confirmed: "Подтверждено",
    cancelled: "Отменено",
    completed: "Завершено",
    edit: "Редактировать",
    save: "Сохранить",
    delete: "Удалить",
    cancel: "Отменить",
    complete: "Завершить",
    pendingAction: "В ожидание",
    sent: "Запись отправлена на подтверждение",
    fillAll: "Заполните обязательные поля",
    backendOffline: "Backend недоступен, сохранено локально",
    giftToast: "Мы свяжемся по деталям gift card",
  },
  en: {
    title: "Book an appointment",
    heroText: "Choose a service, specialist, and time that fits your day.",
    start: "Start booking",
    stepServices: "1. Service",
    stepSpecialists: "2. Specialist",
    stepTime: "3. Time",
    stepConfirm: "4. Confirm",
    services: "Services",
    specialists: "Specialists",
    changeService: "Change service",
    changeSpecialist: "Change specialist",
    timeSelect: "Select time",
    date: "Date",
    availableTimes: "Available times",
    clientName: "Name",
    clientPhone: "Phone",
    vipClient: "VIP / loyalty client",
    reminder: "Remind 24 hours and 2 hours before",
    summary: "Booking",
    changeTime: "Change time",
    confirm: "Send for confirmation",
    portfolio: "Portfolio",
    giftCards: "Gift cards",
    giftTitle: "Beauty certificate",
    giftText: "Gift a premium care experience from 25,000 ֏.",
    giftButton: "Interested",
    reviews: "Reviews",
    myBookings: "My bookings",
    refresh: "Refresh",
    adminPanel: "Admin panel",
    pin: "Enter PIN",
    login: "Login",
    add: "Add",
    bookings: "Bookings",
    minutes: "min",
    serviceCount: "options",
    occupied: "Booked",
    noSpecialists: "No specialist yet for this service.",
    noBookings: "No bookings yet.",
    status: "Status",
    pending: "Pending",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    completed: "Completed",
    edit: "Edit",
    save: "Save",
    delete: "Delete",
    cancel: "Cancel",
    complete: "Complete",
    pendingAction: "Set pending",
    sent: "Booking sent for confirmation",
    fillAll: "Please fill all required fields",
    backendOffline: "Backend unavailable, saved locally",
    giftToast: "We will contact you about gift card details",
  },
};

const defaultServices = [
  { id: "haircut", name: "Մազերի կտրում", duration: 45, price: 8000, description: "Կերպարի թարմացում և styling", image: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=700&q=80" },
  { id: "color", name: "Մազերի ներկում", duration: 120, price: 25000, description: "Գունային խորհրդատվություն և premium ներկում", image: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=700&q=80" },
  { id: "makeup", name: "Դիմահարդարում", duration: 60, price: 18000, description: "Երեկոյան և bridal makeup", image: "https://images.unsplash.com/photo-1487412947147-5cebf100ffc2?auto=format&fit=crop&w=700&q=80" },
  { id: "nails", name: "Մատնահարդարում", duration: 75, price: 10000, description: "Gel polish, clean manicure, nail art", image: "https://images.unsplash.com/photo-1610992015732-2449b76344bc?auto=format&fit=crop&w=700&q=80" },
  { id: "brows", name: "Հոնքերի ձևավորում", duration: 30, price: 5000, description: "Ձևավորում, ներկում և lamination", image: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?auto=format&fit=crop&w=700&q=80" },
  { id: "skincare", name: "Դեմքի խնամք", duration: 60, price: 16000, description: "Մաքրում, խոնավացում, glow treatment", image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=700&q=80" },
];

const defaultSpecialists = [
  { id: "mariam", name: "Մարիամ", role: "Hair stylist", bio: "8 տարվա փորձ, color correction", services: ["haircut", "color"], rating: "4.9" },
  { id: "ani", name: "Անի", role: "Makeup artist", bio: "Bridal և evening makeup", services: ["makeup", "brows"], rating: "5.0" },
  { id: "sona", name: "Սոնա", role: "Nail master", bio: "Minimal և luxury nail art", services: ["nails"], rating: "4.8" },
  { id: "lilit", name: "Լիլիթ", role: "Cosmetologist", bio: "Դեմքի խնամք և brows", services: ["skincare", "brows"], rating: "4.9" },
];

const portfolio = [
  { title: "Gloss hair", image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=700&q=80" },
  { title: "Evening makeup", image: "https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=700&q=80" },
  { title: "Clean nails", image: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=700&q=80" },
];

const reviews = [
  { name: "Լուսինե", text: "Շատ նուրբ սպասարկում, մաքուր և premium միջավայր։", rating: "5.0" },
  { name: "Anna", text: "The booking was easy and the result felt truly polished.", rating: "5.0" },
  { name: "Мария", text: "Отличный сервис и аккуратная работа мастера.", rating: "4.9" },
];

const slots = ["10:00", "11:00", "12:00", "13:30", "15:00", "16:30", "18:00", "19:00"];
const statusOrder = ["pending", "confirmed", "cancelled", "completed"];

const state = {
  lang: load(storageKeys.lang, "hy"),
  services: load(storageKeys.services, defaultServices),
  specialists: load(storageKeys.specialists, defaultSpecialists),
  bookings: load(storageKeys.bookings, []),
  selection: { serviceId: null, specialistId: null, date: null, time: null, reminder: true, vip: false },
  view: "services",
};

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
const apiEnabled = location.protocol === "http:" || location.protocol === "https:";
const views = { services: $("#servicesView"), specialists: $("#specialistsView"), time: $("#timeView"), summary: $("#summaryView") };

function t(key) {
  return i18n[state.lang][key] || i18n.hy[key] || key;
}

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

async function api(path, options = {}) {
  if (!apiEnabled) throw new Error("API unavailable");
  const response = await fetch(path, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  if (!response.ok) throw new Error("API failed");
  return response.json();
}

async function syncBookings() {
  try {
    const remote = await api("/api/bookings");
    state.bookings = remote;
    save(storageKeys.bookings, state.bookings);
    rerenderAll();
  } catch {
    renderBookings();
  }
}

function applyLanguage() {
  document.documentElement.lang = state.lang;
  $("#languageSelect").value = state.lang;
  $$("[data-i18n]").forEach((node) => {
    node.textContent = t(node.dataset.i18n);
  });
}

function setView(view) {
  state.view = view;
  Object.entries(views).forEach(([name, element]) => element.classList.toggle("is-visible", name === view));
  $$(".step").forEach((button) => button.classList.toggle("is-active", button.dataset.view === view));
  if (view === "summary") renderSummary();
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function statusBadge(status) {
  return `<span class="status-badge status-${status}">${t(status || "pending")}</span>`;
}

function renderServices() {
  $("#servicesCount").textContent = `${state.services.length} ${t("serviceCount")}`;
  $("#servicesList").innerHTML = state.services.map((service) => `
    <button class="service-card ${state.selection.serviceId === service.id ? "is-selected" : ""}" data-service="${service.id}">
      <span class="service-photo" style="background-image:url('${service.image || defaultServices[0].image}')"></span>
      <strong>${service.name}</strong>
      <span class="meta">${service.description || ""}</span>
      <span class="price">${money(service.price)} · ${service.duration} ${t("minutes")}</span>
    </button>
  `).join("");
}

function renderSpecialists() {
  const service = selectedService();
  const specialists = state.specialists.filter((specialist) => !service || specialist.services.includes(service.id));
  $("#specialistsList").innerHTML = specialists.length
    ? specialists.map((specialist) => `
      <button class="specialist-card ${state.selection.specialistId === specialist.id ? "is-selected" : ""}" data-specialist="${specialist.id}">
        <span class="avatar">${specialist.name.slice(0, 1)}</span>
        <span>
          <strong>${specialist.name}</strong>
          <span class="meta">${specialist.role} · ${specialist.bio || ""}</span>
        </span>
        <span class="rating">★ ${specialist.rating || "4.8"}</span>
      </button>
    `).join("")
    : `<div class="summary-card">${t("noSpecialists")}</div>`;
}

function renderSlots() {
  const taken = state.bookings
    .filter((booking) => booking.date === state.selection.date && booking.specialistId === state.selection.specialistId && !["cancelled"].includes(booking.status))
    .map((booking) => booking.time);

  $("#slotList").innerHTML = slots.map((slot) => {
    const disabled = taken.includes(slot);
    const selected = state.selection.time === slot;
    return `<button class="slot ${selected ? "is-selected" : ""}" ${disabled ? "disabled" : ""} data-slot="${slot}">${disabled ? t("occupied") : slot}</button>`;
  }).join("");
}

function renderSummary() {
  const service = selectedService();
  const specialist = selectedSpecialist();
  $("#summaryCard").innerHTML = `
    <div class="summary-row"><span>${t("services")}</span><strong>${service?.name || "-"}</strong></div>
    <div class="summary-row"><span>${t("specialists")}</span><strong>${specialist?.name || "-"}</strong></div>
    <div class="summary-row"><span>${t("date")}</span><strong>${state.selection.date || "-"}</strong></div>
    <div class="summary-row"><span>${t("stepTime").replace("3. ", "")}</span><strong>${state.selection.time || "-"}</strong></div>
    <div class="summary-row"><span>${t("clientName")}</span><strong>${$("#clientName").value || "-"}</strong></div>
    <div class="summary-row"><span>${t("clientPhone")}</span><strong>${$("#clientPhone").value || "-"}</strong></div>
    <div class="summary-row"><span>VIP</span><strong>${state.selection.vip ? "VIP" : "Standard"}</strong></div>
    <div class="summary-row"><span>Գին</span><strong>${service ? money(service.price) : "-"}</strong></div>
  `;
}

function renderBookings() {
  const sorted = [...state.bookings].sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  $("#bookingsList").innerHTML = sorted.length
    ? sorted.map((booking) => `
      <article class="booking-item">
        <div class="booking-row"><span>${booking.serviceName}</span>${statusBadge(booking.status || "pending")}</div>
        <div class="booking-row"><span>${booking.specialistName}</span><strong>${booking.date} ${booking.time}</strong></div>
        <div class="booking-row"><span>${money(booking.price)}</span>${booking.vip ? '<span class="vip-pill">VIP</span>' : ""}</div>
        ${booking.status !== "cancelled" ? `<button class="danger" data-cancel="${booking.id}">${t("cancel")}</button>` : ""}
      </article>
    `).join("")
    : `<div class="summary-card">${t("noBookings")}</div>`;
}

function renderAdmin() {
  $("#adminStats").innerHTML = `
    <div class="stat"><strong>${state.services.length}</strong><span>${t("services")}</span></div>
    <div class="stat"><strong>${state.specialists.length}</strong><span>${t("specialists")}</span></div>
    <div class="stat"><strong>${state.bookings.length}</strong><span>${t("bookings")}</span></div>
  `;

  $("#adminServices").innerHTML = state.services.map((service) => `
    <div class="admin-row editable-row">
      <input value="${service.name}" data-edit-service="${service.id}" data-field="name" />
      <input type="number" value="${service.price}" data-edit-service="${service.id}" data-field="price" />
      <input type="number" value="${service.duration}" data-edit-service="${service.id}" data-field="duration" />
      <input value="${service.description || ""}" data-edit-service="${service.id}" data-field="description" />
      <button type="button" class="ghost" data-save-service="${service.id}">${t("save")}</button>
      <button type="button" class="danger" data-delete-service="${service.id}">${t("delete")}</button>
    </div>
  `).join("");

  $("#adminSpecialists").innerHTML = state.specialists.map((specialist) => `
    <div class="admin-row editable-row">
      <input value="${specialist.name}" data-edit-specialist="${specialist.id}" data-field="name" />
      <input value="${specialist.role}" data-edit-specialist="${specialist.id}" data-field="role" />
      <input value="${specialist.bio || ""}" data-edit-specialist="${specialist.id}" data-field="bio" />
      <button type="button" class="ghost" data-save-specialist="${specialist.id}">${t("save")}</button>
      <button type="button" class="danger" data-delete-specialist="${specialist.id}">${t("delete")}</button>
    </div>
  `).join("");

  $("#adminBookings").innerHTML = state.bookings.length
    ? state.bookings.map((booking) => `
      <div class="admin-row booking-admin-row">
        <span><strong>${booking.serviceName}</strong><br><span class="meta">${booking.clientName || "-"} · ${booking.clientPhone || "-"} · ${booking.specialistName} · ${booking.date} ${booking.time}</span></span>
        ${statusBadge(booking.status || "pending")}
        <div class="status-actions">
          ${statusOrder.map((status) => `<button type="button" class="ghost" data-status="${status}" data-booking="${booking.id}">${t(status)}</button>`).join("")}
        </div>
      </div>
    `).join("")
    : `<div class="summary-card">${t("noBookings")}</div>`;
}

function renderPortfolio() {
  $("#portfolioList").innerHTML = portfolio.map((item) => `
    <article class="media-card">
      <img src="${item.image}" alt="${item.title}" />
      <strong>${item.title}</strong>
    </article>
  `).join("");
}

function renderReviews() {
  $("#reviewsList").innerHTML = reviews.map((review) => `
    <article class="review-card">
      <strong>★ ${review.rating}</strong>
      <p>${review.text}</p>
      <span>${review.name}</span>
    </article>
  `).join("");
}

function rerenderAll() {
  applyLanguage();
  renderServices();
  renderSpecialists();
  renderSlots();
  renderSummary();
  renderBookings();
  renderAdmin();
  renderPortfolio();
  renderReviews();
}

async function confirmBooking() {
  const service = selectedService();
  const specialist = selectedSpecialist();
  const clientName = $("#clientName").value.trim();
  const clientPhone = $("#clientPhone").value.trim();
  if (!service || !specialist || !state.selection.date || !state.selection.time || !clientName || !clientPhone) {
    showToast(t("fillAll"));
    return;
  }

  const booking = {
    id: makeId("booking"),
    serviceId: service.id,
    serviceName: service.name,
    specialistId: specialist.id,
    specialistName: specialist.name,
    clientName,
    clientPhone,
    date: state.selection.date,
    time: state.selection.time,
    price: service.price,
    reminder: state.selection.reminder,
    vip: state.selection.vip,
    loyaltyLevel: state.selection.vip ? "VIP" : "Standard",
    status: "pending",
    createdAt: new Date().toISOString(),
    telegramUserId: tg?.initDataUnsafe?.user?.id ? String(tg.initDataUnsafe.user.id) : "",
    telegramUserName: tg?.initDataUnsafe?.user?.username || "",
  };

  try {
    const result = await api("/api/bookings", { method: "POST", body: JSON.stringify({ booking }) });
    state.bookings.push(result.booking);
  } catch {
    showToast(t("backendOffline"));
    state.bookings.push(booking);
  }

  save(storageKeys.bookings, state.bookings);
  state.selection.time = null;
  rerenderAll();
  setView("services");
  showToast(t("sent"));
  tg?.sendData?.(JSON.stringify({ type: "booking_created", booking }));
}

async function setBookingStatus(id, status, source = "admin") {
  const booking = state.bookings.find((item) => item.id === id);
  if (booking) booking.status = status;
  save(storageKeys.bookings, state.bookings);
  rerenderAll();
  try {
    await api(`/api/bookings/${id}`, { method: "PATCH", body: JSON.stringify({ status, source }) });
    await syncBookings();
  } catch {
    showToast(t("backendOffline"));
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
  const saveService = event.target.closest("[data-save-service]");
  const saveSpecialist = event.target.closest("[data-save-specialist]");
  const statusButton = event.target.closest("[data-status][data-booking]");

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
  if (stepButton) setView(stepButton.dataset.view);
  if (backButton) setView(backButton.dataset.back);
  if (cancelButton) setBookingStatus(cancelButton.dataset.cancel, "cancelled", "client");
  if (statusButton) setBookingStatus(statusButton.dataset.booking, statusButton.dataset.status, "admin");

  if (deleteService) {
    state.services = state.services.filter((service) => service.id !== deleteService.dataset.deleteService);
    state.specialists = state.specialists.map((specialist) => ({ ...specialist, services: specialist.services.filter((id) => id !== deleteService.dataset.deleteService) }));
    save(storageKeys.services, state.services);
    save(storageKeys.specialists, state.specialists);
    rerenderAll();
  }
  if (deleteSpecialist) {
    state.specialists = state.specialists.filter((specialist) => specialist.id !== deleteSpecialist.dataset.deleteSpecialist);
    save(storageKeys.specialists, state.specialists);
    rerenderAll();
  }
  if (saveService) {
    const id = saveService.dataset.saveService;
    const service = state.services.find((item) => item.id === id);
    $$(`[data-edit-service="${id}"]`).forEach((input) => {
      service[input.dataset.field] = input.type === "number" ? Number(input.value) : input.value.trim();
    });
    save(storageKeys.services, state.services);
    rerenderAll();
  }
  if (saveSpecialist) {
    const id = saveSpecialist.dataset.saveSpecialist;
    const specialist = state.specialists.find((item) => item.id === id);
    $$(`[data-edit-specialist="${id}"]`).forEach((input) => {
      specialist[input.dataset.field] = input.value.trim();
    });
    save(storageKeys.specialists, state.specialists);
    rerenderAll();
  }
});

$("#languageSelect").addEventListener("change", (event) => {
  state.lang = event.target.value;
  save(storageKeys.lang, state.lang);
  rerenderAll();
});
$("#startBooking").addEventListener("click", () => setView("services"));
$("#confirmBooking").addEventListener("click", confirmBooking);
$("#refreshBookings").addEventListener("click", syncBookings);
$("#giftInterest").addEventListener("click", () => showToast(t("giftToast")));
$("#bookingDate").addEventListener("change", (event) => {
  state.selection.date = event.target.value;
  state.selection.time = null;
  renderSlots();
});
$("#reminderToggle").addEventListener("change", (event) => {
  state.selection.reminder = event.target.checked;
  renderSummary();
});
$("#vipToggle").addEventListener("change", (event) => {
  state.selection.vip = event.target.checked;
  renderSummary();
});
$("#clientName").addEventListener("input", renderSummary);
$("#clientPhone").addEventListener("input", renderSummary);
$("#adminOpen").addEventListener("click", () => {
  $("#adminDialog").showModal();
  renderAdmin();
});
$("#unlockAdmin").addEventListener("click", () => {
  if ($("#adminPin").value !== "2026") {
    showToast("Wrong PIN");
    return;
  }
  $("#pinGate").style.display = "none";
  $("#adminPanel").classList.add("is-visible");
  syncBookings();
});
$("#addService").addEventListener("click", () => {
  const name = $("#newServiceName").value.trim();
  const price = Number($("#newServicePrice").value);
  const duration = Number($("#newServiceDuration").value);
  const description = $("#newServiceDescription").value.trim();
  if (!name || !price || !duration) return showToast(t("fillAll"));
  state.services.push({ id: makeId("service"), name, price, duration, description, image: defaultServices[0].image });
  save(storageKeys.services, state.services);
  ["#newServiceName", "#newServicePrice", "#newServiceDuration", "#newServiceDescription"].forEach((id) => ($(id).value = ""));
  rerenderAll();
});
$("#addSpecialist").addEventListener("click", () => {
  const name = $("#newSpecialistName").value.trim();
  const role = $("#newSpecialistRole").value.trim();
  const bio = $("#newSpecialistBio").value.trim();
  if (!name || !role) return showToast(t("fillAll"));
  state.specialists.push({ id: makeId("specialist"), name, role, bio, services: state.services.map((service) => service.id), rating: "4.8" });
  save(storageKeys.specialists, state.specialists);
  ["#newSpecialistName", "#newSpecialistRole", "#newSpecialistBio"].forEach((id) => ($(id).value = ""));
  rerenderAll();
});

$("#bookingDate").min = todayIso();
$("#bookingDate").value = todayIso();
state.selection.date = todayIso();

rerenderAll();
syncBookings();
