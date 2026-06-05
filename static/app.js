const tg = window.Telegram?.WebApp;

const state = {
  selectedDate: "",
  selectedSlotId: "",
  slots: [],
  photoTypes: [],
  workSettings: {},
};

const slotsEl = document.querySelector("#slots");
const slotsTitle = document.querySelector("#slotsTitle");
const slotCountEl = document.querySelector("#slotCount");
const bookingDateInput = document.querySelector("#bookingDate");
const usePreferredTime = document.querySelector("#usePreferredTime");
const preferredTimeWrap = document.querySelector("#preferredTimeWrap");
const preferredTimeInput = document.querySelector("#preferredTime");
const preferredTimeOptions = document.querySelector("#preferredTimeOptions");
const form = document.querySelector("#bookingForm");
const statusEl = document.querySelector("#status");
const selectedSlotText = document.querySelector("#selectedSlotText");
const photoTypeSelect = form.elements.photoType;
const servicePriceEl = document.querySelector("#servicePrice");
const studioFields = document.querySelector("#studioFields");
const otherAddressWrap = document.querySelector("#otherAddressWrap");
const otherAreaWrap = document.querySelector("#otherAreaWrap");
const referenceFilesInput = document.querySelector("#referenceFiles");
const referenceFileText = document.querySelector("#referenceFileText");
const referenceFilePicker = document.querySelector(".file-picker");
const serviceDescriptionEl = document.querySelector("#serviceDescription");
const bookingStatusPanel = document.querySelector("#bookingStatusPanel");
const bookingStatusText = document.querySelector("#bookingStatusText");
const refreshStatus = document.querySelector("#refreshStatus");
const languageMenuButton = document.querySelector("#languageMenuButton");
const languageMenu = document.querySelector("#languageMenu");
const submitButton = document.querySelector("#submitButton");
let servicePrices = {};
let currentLang = localStorage.getItem("lang") || "hy";
const priceUnitLabels = {
  hy: "1 \u056A\u0561\u0574",
  ru: "1 \u0447\u0430\u0441",
  en: "1 hour",
};
const telegramPlatform = tg?.platform || "";
const isTelegramDesktop = ["tdesktop", "weba", "webk", "macos"].includes(telegramPlatform);
document.body.dataset.telegramDesktop = String(isTelegramDesktop);

function lockHorizontalScroll() {
  document.documentElement.scrollLeft = 0;
  document.body.scrollLeft = 0;
  if (window.scrollX) {
    window.scrollTo(0, window.scrollY);
  }
}

const serviceDescriptions = {
  hy: {
    Photo: "Ներառում է լուսանկարահանում, ընտրված նկարների մշակում և պատրաստ ֆայլերի փոխանցում։",
    Reel: "Ներառում է կարճ reel-ի նկարահանում, մոնտաժ և պատրաստ հոլովակի փոխանցում։",
    "Photo + Reel": "Ներառում է լուսանկարահանում և reel՝ մեկ ամբողջական փաթեթով։",
  },
  ru: {
    Photo: "Фотосъемка, обработка выбранных кадров и передача готовых файлов.",
    Reel: "Съемка короткого reel, монтаж и передача готового ролика.",
    "Photo + Reel": "Фотосъемка и reel в одном пакете.",
  },
  en: {
    Photo: "Photo session, selected photo editing, and final file delivery.",
    Reel: "Short reel shooting, editing, and final video delivery.",
    "Photo + Reel": "Photo session and reel production in one package.",
  },
};

const photoTypeTranslations = {
  "Անհատական ֆոտոսեսիա": {
    hy: "Անհատական ֆոտոսեսիա",
    ru: "Индивидуальная фотосессия",
    en: "Individual photo session",
  },
  "Ընտանեկան ֆոտոսեսիա": {
    hy: "Ընտանեկան ֆոտոսեսիա",
    ru: "Семейная фотосессия",
    en: "Family photo session",
  },
  "Զույգերի ֆոտոսեսիա": {
    hy: "Զույգերի ֆոտոսեսիա",
    ru: "Фотосессия пары",
    en: "Couple photo session",
  },
  "Հարսանեկան ֆոտոսեսիա": {
    hy: "Հարսանեկան ֆոտոսեսիա",
    ru: "Свадебная фотосессия",
    en: "Wedding photo session",
  },
  "Ծննդյան ֆոտոսեսիա": {
    hy: "Ծննդյան ֆոտոսեսիա",
    ru: "Фотосессия дня рождения",
    en: "Birthday photo session",
  },
  "Մանկական ֆոտոսեսիա": {
    hy: "Մանկական ֆոտոսեսիա",
    ru: "Детская фотосессия",
    en: "Kids photo session",
  },
};

const t = {
  hy: {
    navBooking: "Գրանցում",
    navStatus: "Կարգավիճակ",
    statusTitle: "Իմ վերջին հարցումը",
    refresh: "Թարմացնել",
    chooseDateTitle: "Ընտրեք օրը",
    availableDate: "Ազատ օր",
    availableTimesTitle: "Այս օրվա ազատ ժամերը",
    preferredMissing: "Իմ նախընտրելի ժամը չկա",
    preferredTime: "Ցանկալի ժամ",
    bookingDetails: "Ամրագրման տվյալներ",
    firstName: "Անուն",
    lastName: "Ազգանուն",
    phone: "Հեռախոսահամար",
    serviceType: "Ծառայության տեսակ",
    price: "Գին",
    photoType: "Ֆոտոսեսիայի տեսակ",
    locationType: "Վայրի տեսակ",
    studio: "Ստուդիա",
    otherPlace: "Այլ վայր",
    undecided: "Դեռ չեմ որոշել",
    studioName: "Ստուդիայի անուն",
    studioAddress: "Ստուդիայի հասցե",
    shootAddress: "Ֆոտոսեսիայի հասցե",
    otherArea: "Այլ վայրի տարածք",
    yerevan: "Երևան",
    outsideYerevan: "Երևանից դուրս",
    peopleCount: "Անձերի քանակ",
    selectedTime: "Ընտրված ժամ",
    notes: "Լրացուցիչ նշումներ",
    references: "Ցանկալի նկարների / ռիլի օրինակներ",
    attachExamples: "Կցել օրինակներ",
    sendRequest: "Ուղարկել հարցումը",
    noFiles: "Ֆայլ ընտրված չէ",
    filesSelected: (count) => `${count} ֆայլ ընտրված է`,
    desktopFilesUnsupported: "Կոմպով նկարները ուղարկեք հենց այս բոտի chat-ում՝ ամրագրումից հետո։",
    noSlots: "Այս պահին ազատ ժամեր չկան։",
    noSlotsForDay: "Ընտրած օրվա համար ազատ ժամեր չկան։",
    freeDays: (count) => `${count} ազատ օր`,
    notSet: "Նշված չէ",
    byRequest: "Հարցումով",
    sending: "Հարցումը ուղարկվում է...",
    priceLabel: "Գին",
    locationLabel: "Վայր",
    peopleLabel: "Անձեր",
    summaryTitle: "Ստուգեք ամրագրումը",
    confirmSend: "Ուղարկե՞լ հարցումը",
    noTime: "Խնդրում ենք ընտրել ազատ ժամը կամ նշել ցանկալի ժամը։",
    invalidPreferredTime: "Նշեք ժամը 24-ժամյա ձևաչափով, օրինակ՝ 16:00։",
    missingRequiredFields: "Լրացրեք պարտադիր դաշտերը և փորձեք կրկին։",
    sent: "Հարցումը ուղարկված է։ Սպասեք ֆոտոգրաֆի հաստատմանը։",
    failed: "Չհաջողվեց ուղարկել հարցումը։ Ստուգեք տվյալները և փորձեք կրկին։",
    selectedTimeUnavailable: "Ընտրված ժամը այլևս հասանելի չէ։ Թարմացրեք էջը և ընտրեք ազատ ժամ։",
    telegramValidationFailed: "Խնդրում ենք բացել գրանցումը Telegram բոտից և փորձել կրկին։",
  },
  ru: {
    navBooking: "Запись",
    navStatus: "Статус",
    statusTitle: "Моя последняя заявка",
    refresh: "Обновить",
    chooseDateTitle: "Выберите день",
    availableDate: "Свободный день",
    availableTimesTitle: "Свободное время в этот день",
    preferredMissing: "Моего времени нет",
    preferredTime: "Желаемое время",
    bookingDetails: "Данные бронирования",
    firstName: "Имя",
    lastName: "Фамилия",
    phone: "Телефон",
    serviceType: "Тип услуги",
    price: "Цена",
    photoType: "Тип фотосессии",
    locationType: "Место",
    studio: "Студия",
    otherPlace: "Другое место",
    undecided: "Еще не решил(а)",
    studioName: "Название студии",
    studioAddress: "Адрес студии",
    shootAddress: "Адрес съемки",
    otherArea: "Зона другого места",
    yerevan: "Ереван",
    outsideYerevan: "За пределами Еревана",
    peopleCount: "Количество людей",
    selectedTime: "Выбранное время",
    notes: "Дополнительные заметки",
    references: "Примеры желаемых фото / reel",
    attachExamples: "Прикрепить примеры",
    sendRequest: "Отправить заявку",
    noFiles: "Файл не выбран",
    filesSelected: (count) => `Выбрано файлов: ${count}`,
    desktopFilesUnsupported: "На компьютере отправьте фото прямо в чат этого бота после заявки.",
    noSlots: "Сейчас нет свободного времени.",
    noSlotsForDay: "В выбранный день нет свободного времени.",
    freeDays: (count) => `Свободных дней: ${count}`,
    notSet: "Не указано",
    byRequest: "По запросу",
    sending: "Заявка отправляется...",
    priceLabel: "Цена",
    locationLabel: "Место",
    peopleLabel: "Людей",
    summaryTitle: "Проверьте бронирование",
    confirmSend: "Отправить заявку?",
    noTime: "Выберите свободное время или укажите желаемое время.",
    invalidPreferredTime: "Укажите время в 24-часовом формате, например 16:00.",
    missingRequiredFields: "Заполните обязательные поля и попробуйте снова.",
    sent: "Заявка отправлена. Ожидайте подтверждения фотографа.",
    failed: "Не удалось отправить заявку. Проверьте данные и попробуйте снова.",
    selectedTimeUnavailable: "Выбранное время больше недоступно. Обновите страницу и выберите свободное время.",
    telegramValidationFailed: "Пожалуйста, откройте запись из Telegram-бота и попробуйте снова.",
  },
  en: {
    navBooking: "Booking",
    navStatus: "Status",
    statusTitle: "My Latest Request",
    refresh: "Refresh",
    chooseDateTitle: "Choose Date",
    availableDate: "Available date",
    availableTimesTitle: "Available times for this day",
    preferredMissing: "My preferred time is missing",
    preferredTime: "Preferred time",
    bookingDetails: "Booking Details",
    firstName: "First name",
    lastName: "Last name",
    phone: "Phone number",
    serviceType: "Service type",
    price: "Price",
    photoType: "Session type",
    locationType: "Location type",
    studio: "Studio",
    otherPlace: "Other place",
    undecided: "Not decided yet",
    studioName: "Studio name",
    studioAddress: "Studio address",
    shootAddress: "Session address",
    otherArea: "Other place area",
    yerevan: "Yerevan",
    outsideYerevan: "Outside Yerevan",
    peopleCount: "People count",
    selectedTime: "Selected time",
    notes: "Additional notes",
    references: "Reference photos / reel examples",
    attachExamples: "Attach examples",
    sendRequest: "Send request",
    noFiles: "No file selected",
    filesSelected: (count) => `${count} file(s) selected`,
    desktopFilesUnsupported: "On desktop, send photos directly in this bot chat after booking.",
    noSlots: "There are no available times right now.",
    noSlotsForDay: "There are no available times for this day.",
    freeDays: (count) => `${count} available day(s)`,
    notSet: "Not set",
    byRequest: "By request",
    sending: "Sending request...",
    priceLabel: "Price",
    locationLabel: "Location",
    peopleLabel: "People",
    summaryTitle: "Review Booking",
    confirmSend: "Send request?",
    noTime: "Please select an available time or enter a preferred time.",
    invalidPreferredTime: "Enter time in 24-hour format, for example 16:00.",
    missingRequiredFields: "Fill in the required fields and try again.",
    sent: "Request sent. Please wait for photographer confirmation.",
    failed: "Could not send the request. Check the details and try again.",
    selectedTimeUnavailable: "The selected time is no longer available. Refresh and choose an available time.",
    telegramValidationFailed: "Please open booking from the Telegram bot and try again.",
  },
};

const apiErrorMessages = {
  "Selected time is not available": "selectedTimeUnavailable",
  "Telegram initData validation failed": "telegramValidationFailed",
  "Missing required fields": "missingRequiredFields",
};

function setStatus(message, type = "") {
  statusEl.textContent = message;
  statusEl.dataset.type = type;
}

function applyLanguage() {
  if (!t[currentLang]) currentLang = "hy";
  document.documentElement.lang = currentLang;
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    node.textContent = t[currentLang][node.dataset.i18n] || node.textContent;
  });
  document.querySelectorAll("[data-lang]").forEach((button) => {
    button.dataset.active = String(button.dataset.lang === currentLang);
  });
  referenceFileText.textContent = referenceFilesInput.files.length
    ? t[currentLang].filesSelected(referenceFilesInput.files.length)
    : isTelegramDesktop
      ? t[currentLang].desktopFilesUnsupported
      : t[currentLang].noFiles;
  if (state.photoTypes.length) renderPhotoTypes(state.photoTypes);
  renderSlots();
  updateServicePrice();
  updateServiceDescription();
  loadLastBookingStatus();
}

function formatDate(dateText) {
  const locales = { hy: "hy-AM", ru: "ru-RU", en: "en-US" };
  return new Intl.DateTimeFormat(locales[currentLang] || "hy-AM", {
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(new Date(`${dateText}T00:00:00`));
}

function getAvailableDates() {
  return [...new Set(state.slots.map((slot) => slot.date))].sort();
}

function getSlotsForSelectedDate() {
  if (!state.selectedDate) return [];
  return state.slots.filter((slot) => slot.date === state.selectedDate);
}

function renderCalendar() {
  const dates = getAvailableDates();

  if (!dates.length) {
    bookingDateInput.value = "";
    bookingDateInput.disabled = true;
    return;
  }

  bookingDateInput.disabled = false;
  bookingDateInput.min = dates[0];
  bookingDateInput.max = dates[dates.length - 1];

  if (!state.selectedDate || !dates.includes(state.selectedDate)) {
    state.selectedDate = dates[0];
    state.selectedSlotId = "";
    selectedSlotText.value = "";
  }

  bookingDateInput.value = state.selectedDate;
}

function renderSlots() {
  slotsEl.innerHTML = "";
  const visibleSlots = getSlotsForSelectedDate();
  slotCountEl.textContent = t[currentLang].freeDays(getAvailableDates().length);

  if (!state.slots.length) {
    slotsEl.innerHTML = `<p class="empty">${t[currentLang].noSlots}</p>`;
    return;
  }

  if (!visibleSlots.length) {
    slotsEl.innerHTML = `<p class="empty">${t[currentLang].noSlotsForDay}</p>`;
    return;
  }

  visibleSlots.forEach((slot) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "slot";
    button.dataset.active = String(slot.id === state.selectedSlotId);
    button.innerHTML = `<strong>${slot.time}</strong>`;
    button.addEventListener("click", () => {
      if (usePreferredTime.checked) return;
      state.selectedSlotId = slot.id;
      selectedSlotText.value = `${slot.date} ${slot.time}`;
      renderSlots();
      tg?.HapticFeedback?.selectionChanged();
    });
    slotsEl.append(button);
  });
}

function timeToMinutes(value) {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

function minutesToTime(minutes) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function isPastPreferredTime(timeValue) {
  if (!bookingDateInput.value) return false;
  const now = new Date();
  const today = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  if (bookingDateInput.value !== today) return false;
  return timeToMinutes(timeValue) <= now.getHours() * 60 + now.getMinutes();
}

function preferredTimeValues() {
  const settings = state.workSettings || {};
  const start = settings.startTime || "10:00";
  const end = settings.endTime || "20:00";
  const step = Number(settings.slotMinutes || 60);
  const startMinutes = timeToMinutes(start);
  const endMinutes = timeToMinutes(end);
  if (!step || startMinutes >= endMinutes) return [];

  const values = [];
  for (let minutes = startMinutes; minutes < endMinutes; minutes += step) {
    const timeValue = minutesToTime(minutes);
    if (!isPastPreferredTime(timeValue)) {
      values.push(timeValue);
    }
  }
  return values;
}

function renderPreferredTimeOptions() {
  preferredTimeOptions.innerHTML = "";
  preferredTimeValues().forEach((timeValue) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "preferred-time-chip";
    button.dataset.active = String(preferredTimeInput.value === timeValue);
    button.textContent = timeValue;
    button.addEventListener("click", () => {
      preferredTimeInput.value = timeValue;
      syncPreferredTime(false);
      renderPreferredTimeOptions();
      tg?.HapticFeedback?.selectionChanged();
    });
    preferredTimeOptions.append(button);
  });
}

function updatePreferredTimeMode() {
  const enabled = usePreferredTime.checked;
  preferredTimeWrap.classList.toggle("hidden", !enabled);
  slotsTitle.classList.toggle("hidden", enabled);
  slotsEl.classList.toggle("hidden", enabled);
  preferredTimeInput.required = enabled;
  selectedSlotText.required = !enabled;
  selectedSlotText.setCustomValidity("");
  if (enabled) {
    state.selectedSlotId = "";
    selectedSlotText.value = bookingDateInput.value ? `${bookingDateInput.value} ${preferredTimeInput.value || ""}` : "";
    renderSlots();
    renderPreferredTimeOptions();
  } else {
    preferredTimeInput.value = "";
    selectedSlotText.value = "";
    renderSlots();
    renderPreferredTimeOptions();
  }
}

function normalizePreferredTime(value) {
  const compact = value.trim().replace(/[^\d]/g, "");
  if (/^\d{1,2}$/.test(compact)) {
    return `${compact.padStart(2, "0")}:00`;
  }
  if (/^\d{3,4}$/.test(compact)) {
    return `${compact.slice(0, -2).padStart(2, "0")}:${compact.slice(-2)}`;
  }
  return value.trim();
}

function isValidPreferredTime(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

function syncPreferredTime(showValidation = true) {
  if (!usePreferredTime.checked) return true;
  const normalized = normalizePreferredTime(preferredTimeInput.value);
  preferredTimeInput.value = normalized;
  if (!isValidPreferredTime(normalized)) {
    preferredTimeInput.setCustomValidity(t[currentLang].invalidPreferredTime);
    if (showValidation) preferredTimeInput.reportValidity();
    return false;
  }
  preferredTimeInput.setCustomValidity("");
  if (bookingDateInput.value) {
    selectedSlotText.value = `${bookingDateInput.value} ${normalized}`;
  }
  return true;
}

function renderPhotoTypes(photoTypes) {
  const selectedValue = photoTypeSelect.value;
  photoTypeSelect.innerHTML = "";
  photoTypes.forEach((type) => {
    const option = document.createElement("option");
    option.value = type;
    option.textContent = photoTypeTranslations[type]?.[currentLang] || type;
    photoTypeSelect.append(option);
  });
  if (selectedValue && photoTypes.includes(selectedValue)) {
    photoTypeSelect.value = selectedValue;
  }
}

function formatPrice(value) {
  if (value === null) return t[currentLang].byRequest;
  const amount = Number(value || 0);
  if (!amount) return t[currentLang].notSet;
  const locales = { hy: "hy-AM", ru: "ru-RU", en: "en-US" };
  return `${new Intl.NumberFormat(locales[currentLang] || "hy-AM").format(amount)} AMD / ${priceUnitLabels[currentLang] || priceUnitLabels.hy}`;
}

function updateServicePrice() {
  const serviceType = form.elements.serviceType.value;
  const locationType = form.elements.locationType.value;
  const otherArea = form.elements.otherArea.value;

  if (locationType === "studio") {
    servicePriceEl.textContent = formatPrice(servicePrices.studio?.[serviceType]);
    return;
  }

  if (locationType === "other" && otherArea === "yerevan") {
    servicePriceEl.textContent = formatPrice(servicePrices.yerevan?.[serviceType]);
    return;
  }

  servicePriceEl.textContent = t[currentLang].byRequest;
}

function updateServiceDescription() {
  const serviceType = form.elements.serviceType.value;
  serviceDescriptionEl.textContent = serviceDescriptions[currentLang][serviceType] || "";
}

async function loadAvailability() {
  const response = await fetch("/api/availability");
  if (!response.ok) {
    throw new Error("Could not load availability");
  }
  const data = await response.json();
  state.slots = data.availability;
  state.photoTypes = data.photoTypes || [];
  state.workSettings = data.workSettings || {};
  servicePrices = data.servicePrices || {};
  renderPhotoTypes(state.photoTypes);
  updateServicePrice();
  updateServiceDescription();
  renderCalendar();
  renderSlots();
  renderPreferredTimeOptions();
}

function updateLocationFields() {
  const locationType = form.elements.locationType.value;
  const isStudio = locationType === "studio";
  const isOther = locationType === "other";
  studioFields.classList.toggle("hidden", !isStudio);
  otherAddressWrap.classList.toggle("hidden", !isOther);
  otherAreaWrap.classList.toggle("hidden", !isOther);
  form.elements.studioName.required = isStudio;
  form.elements.studioAddress.required = isStudio;
  form.elements.otherAddress.required = isOther;
  updateServicePrice();
}

function collectPayload() {
  const formData = new FormData(form);
  const user = tg?.initDataUnsafe?.user || {};
  return {
    slotId: state.selectedSlotId,
    requestedDate: bookingDateInput.value,
    preferredTime: preferredTimeInput.value,
    isPreferredTime: usePreferredTime.checked ? "1" : "",
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    phone: formData.get("phone"),
    serviceType: formData.get("serviceType"),
    photoType: formData.get("photoType"),
    locationType: formData.get("locationType"),
    otherArea: formData.get("otherArea"),
    studioName: formData.get("studioName"),
    studioAddress: formData.get("studioAddress"),
    otherAddress: formData.get("otherAddress"),
    peopleCount: formData.get("peopleCount"),
    notes: formData.get("notes"),
    initData: tg?.initData || "",
    telegramUserId: user.id || "",
    telegramUsername: user.username || "",
  };
}

function collectBookingFormData() {
  const payload = collectPayload();
  const data = new FormData();
  Object.entries(payload).forEach(([key, value]) => {
    data.append(key, value ?? "");
  });

  Array.from(form.elements.references.files || []).slice(0, 10).forEach((file) => {
    data.append("references", file);
  });
  return data;
}

async function submitBooking(event) {
  event.preventDefault();
  if (!state.selectedSlotId) {
    if (!usePreferredTime.checked || !bookingDateInput.value || !preferredTimeInput.value) {
      setStatus(t[currentLang].noTime, "error");
      return;
    }
    if (!syncPreferredTime()) {
      setStatus(t[currentLang].invalidPreferredTime, "error");
      return;
    }
  }

  if (usePreferredTime.checked) {
    selectedSlotText.value = `${bookingDateInput.value} ${preferredTimeInput.value}`;
  }

  if (!confirm(buildSummary())) {
    return;
  }

  submitButton.disabled = true;
  setStatus(t[currentLang].sending);

  try {
    const response = await fetch("/api/bookings", {
      method: "POST",
      body: collectBookingFormData(),
    });
    const data = await response.json();
    if (!response.ok) {
      const messageKey = apiErrorMessages[data.error] || "";
      throw new Error(messageKey ? t[currentLang][messageKey] : data.error || t[currentLang].failed);
    }

    localStorage.setItem("lastBookingId", data.booking.id);
    renderLastBookingStatus(data.booking);
    setStatus(t[currentLang].sent, "success");
    tg?.HapticFeedback?.notificationOccurred("success");
    tg?.MainButton?.hide();
    await loadAvailability();
  } catch (error) {
    setStatus(error.message || t[currentLang].failed, "error");
    tg?.HapticFeedback?.notificationOccurred("error");
  } finally {
    submitButton.disabled = false;
  }
}

function buildSummary() {
  const payload = collectPayload();
  return [
    t[currentLang].summaryTitle,
    "",
    `${payload.firstName} ${payload.lastName}`,
    `${payload.requestedDate || state.selectedDate} ${payload.preferredTime || selectedSlotText.value.split(" ")[1] || ""}`,
    `${payload.serviceType} · ${translatedPhotoType(payload.photoType)}`,
    `${t[currentLang].priceLabel}՝ ${servicePriceEl.textContent}`,
    `${t[currentLang].locationLabel}՝ ${locationLabel(payload)}`,
    `${t[currentLang].peopleLabel}՝ ${payload.peopleCount}`,
    "",
    t[currentLang].confirmSend,
  ].join("\n");
}

function locationLabel(payload) {
  if (payload.locationType === "studio") return t[currentLang].studio;
  if (payload.locationType === "other") {
    return payload.otherArea === "outside" ? t[currentLang].outsideYerevan : t[currentLang].yerevan;
  }
  return t[currentLang].undecided;
}

function translatedPhotoType(type) {
  return photoTypeTranslations[type]?.[currentLang] || type;
}

function renderLastBookingStatus(booking) {
  bookingStatusPanel.classList.remove("hidden");
  const statusLabels = {
    hy: { pending: "Սպասում է հաստատման", approved: "Հաստատված է", rejected: "Մերժված է" },
    ru: { pending: "Ожидает подтверждения", approved: "Подтверждено", rejected: "Отклонено" },
    en: { pending: "Pending confirmation", approved: "Approved", rejected: "Rejected" },
  };
  bookingStatusText.textContent = `${booking.date} ${booking.time} · ${booking.serviceType} · ${statusLabels[currentLang][booking.status] || booking.statusLabel}`;
  bookingStatusText.dataset.type = booking.status === "approved" ? "success" : booking.status === "rejected" ? "error" : "";
}

async function loadLastBookingStatus() {
  const id = localStorage.getItem("lastBookingId");
  if (!id) return;
  try {
    const response = await fetch(`/api/bookings/status?id=${encodeURIComponent(id)}`);
    if (!response.ok) return;
    renderLastBookingStatus(await response.json());
  } catch {
  }
}

document.querySelectorAll('input[name="locationType"]').forEach((input) => {
  input.addEventListener("change", updateLocationFields);
});

document.querySelectorAll('input[name="serviceType"]').forEach((input) => {
  input.addEventListener("change", () => {
    updateServicePrice();
    updateServiceDescription();
  });
});

document.querySelectorAll('input[name="otherArea"]').forEach((input) => {
  input.addEventListener("change", updateServicePrice);
});

referenceFilesInput.addEventListener("change", () => {
  const count = referenceFilesInput.files.length;
  referenceFileText.textContent = count ? t[currentLang].filesSelected(count) : t[currentLang].noFiles;
});

referenceFilePicker.addEventListener("click", () => {
  if (isTelegramDesktop) {
    referenceFileText.textContent = t[currentLang].desktopFilesUnsupported;
    setStatus(t[currentLang].desktopFilesUnsupported, "");
    return;
  }
  referenceFilesInput.click();
});

referenceFilePicker.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  if (isTelegramDesktop) {
    referenceFileText.textContent = t[currentLang].desktopFilesUnsupported;
    setStatus(t[currentLang].desktopFilesUnsupported, "");
    return;
  }
  referenceFilesInput.click();
});

if (isTelegramDesktop) {
  referenceFileText.textContent = t[currentLang].desktopFilesUnsupported;
}

document.querySelectorAll("[data-lang]").forEach((button) => {
  button.addEventListener("click", () => {
    currentLang = button.dataset.lang;
    localStorage.setItem("lang", currentLang);
    applyLanguage();
    languageMenu.classList.add("hidden");
  });
});

languageMenuButton.addEventListener("click", () => {
  languageMenu.classList.toggle("hidden");
});

document.addEventListener("click", (event) => {
  if (!event.target.closest(".language-menu")) {
    languageMenu.classList.add("hidden");
  }
});

window.addEventListener("scroll", lockHorizontalScroll, { passive: true });
window.addEventListener("resize", lockHorizontalScroll);
visualViewport?.addEventListener("resize", lockHorizontalScroll);

refreshStatus.addEventListener("click", loadLastBookingStatus);

bookingDateInput.addEventListener("change", () => {
  state.selectedDate = bookingDateInput.value;
  state.selectedSlotId = "";
  selectedSlotText.value = "";
  if (usePreferredTime.checked && preferredTimeInput.value) {
    selectedSlotText.value = `${bookingDateInput.value} ${preferredTimeInput.value}`;
  }
  renderSlots();
  renderPreferredTimeOptions();
  tg?.HapticFeedback?.selectionChanged();
});

usePreferredTime.addEventListener("change", updatePreferredTimeMode);

preferredTimeInput.addEventListener("change", () => {
  syncPreferredTime();
  renderPreferredTimeOptions();
});

preferredTimeInput.addEventListener("blur", () => {
  syncPreferredTime();
  renderPreferredTimeOptions();
});

form.addEventListener("submit", submitBooking);

tg?.ready();
tg?.expand();
lockHorizontalScroll();
updateLocationFields();
applyLanguage();
loadLastBookingStatus();
loadAvailability().catch(() => setStatus("Ազատ ժամերը բեռնել չհաջողվեց։", "error"));
