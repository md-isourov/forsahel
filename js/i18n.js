/**
 * i18n.js — minimal translation system.
 * Add or edit phrases in the TRANSLATIONS object below.
 * Any element with data-i18n="key" gets its text replaced.
 * Any element with data-i18n-placeholder="key" gets its placeholder replaced.
 * Language choice is remembered in localStorage under "lang".
 */

const TRANSLATIONS = {
  en: {
    nav_home: "Home",
    nav_contributions: "Contributions",
    nav_gallery: "Gallery",
    lang_toggle: "বাংলা",

    hero_kicker: "In loving memory",
    hero_purpose_heading: "Why this page exists",

    stat_given_this_month: "Given this month",
    stat_last_given: "Last given",
    stat_total_given: "Total given",
    stat_no_payment_yet: "No payment recorded yet",

    home_about_heading: "How this works",
    home_about_body: "A small circle of friends contributes every month. What's collected is passed on to the family. This site exists so everyone involved — donors and family alike — can see that it's happening, without publishing anyone's private financial details.",
    home_cta: "See the contributions",

    contrib_heading: "Contributions",
    contrib_subheading: "An open record of who's up to date, and a private view for each donor's own history.",
    contrib_table_donor: "Donor",
    contrib_table_status: "Status",
    status_up_to_date: "Up to date",
    status_due_one: "1 month due",
    status_due_many: "{n} months due",

    lookup_heading: "View your contributions",
    lookup_body: "Enter your Donor ID to see your personal contribution history. Only you can see this — it isn't shown anywhere else on the site.",
    lookup_placeholder: "Enter your Donor ID",
    lookup_button: "View contributions",
    lookup_clear: "Close",
    lookup_error_empty: "Enter your Donor ID to continue.",
    lookup_error_invalid: "We couldn't find that Donor ID. Please check it and try again.",

    dash_total: "Total contributed",
    dash_current_month: "This month",
    dash_due: "Months due",
    dash_last_contribution: "Last contribution",
    dash_history_heading: "Monthly history",
    dash_table_month: "Month",
    dash_table_amount: "Amount",
    dash_table_status: "Status",
    paid: "Paid",
    due: "Due",
    upcoming: "Upcoming",
    not_yet_started: "—",

    gallery_heading: "Photo gallery",
    gallery_subheading: "Moments we're glad we have.",
    lightbox_close: "Close",
    lightbox_prev: "Previous photo",
    lightbox_next: "Next photo",

    error_generic: "We couldn't load the information right now. Please try again later.",
    error_gallery: "We couldn't load the gallery right now. Please try again later.",

    footer_statement: "Maintained quietly by friends, for the family.",
    footer_made_with_care: "Made with care by friends.",
  },
  bn: {
    nav_home: "হোম",
    nav_contributions: "অনুদান",
    nav_gallery: "গ্যালারি",
    lang_toggle: "EN",

    hero_kicker: "স্মৃতিতে",
    hero_purpose_heading: "এই পাতাটি কেন",

    stat_given_this_month: "এই মাসে দেওয়া হয়েছে",
    stat_last_given: "সর্বশেষ দেওয়া হয়েছে",
    stat_total_given: "মোট দেওয়া হয়েছে",
    stat_no_payment_yet: "এখনও কোনো অর্থ প্রদান রেকর্ড করা হয়নি",

    home_about_heading: "যেভাবে এটি কাজ করে",
    home_about_body: "বন্ধুদের একটি ছোট দল প্রতি মাসে অর্থ দেন। যা সংগ্রহ করা হয় তা পরিবারের কাছে পৌঁছে দেওয়া হয়। এই সাইটটি রয়েছে যাতে সবাই — দাতা ও পরিবার — দেখতে পারেন এটি নিয়মিত ঘটছে, কারো ব্যক্তিগত আর্থিক তথ্য প্রকাশ না করেই।",
    home_cta: "অনুদান দেখুন",

    contrib_heading: "অনুদান",
    contrib_subheading: "কে হালনাগাদ আছেন তার একটি খোলা তালিকা, এবং প্রতিটি দাতার নিজস্ব ইতিহাস দেখার একটি ব্যক্তিগত সুবিধা।",
    contrib_table_donor: "দাতা",
    contrib_table_status: "অবস্থা",
    status_up_to_date: "হালনাগাদ",
    status_due_one: "১ মাস বাকি",
    status_due_many: "{n} মাস বাকি",

    lookup_heading: "আপনার অনুদান দেখুন",
    lookup_body: "আপনার নিজস্ব অনুদানের ইতিহাস দেখতে আপনার Donor ID লিখুন। শুধু আপনিই এটি দেখতে পাবেন — এটি সাইটের অন্য কোথাও প্রদর্শিত হয় না।",
    lookup_placeholder: "আপনার Donor ID লিখুন",
    lookup_button: "অনুদান দেখুন",
    lookup_clear: "বন্ধ করুন",
    lookup_error_empty: "চালিয়ে যেতে আপনার Donor ID লিখুন।",
    lookup_error_invalid: "এই Donor ID খুঁজে পাওয়া যায়নি। অনুগ্রহ করে যাচাই করে আবার চেষ্টা করুন।",

    dash_total: "মোট প্রদান",
    dash_current_month: "এই মাস",
    dash_due: "বাকি মাস",
    dash_last_contribution: "সর্বশেষ প্রদান",
    dash_history_heading: "মাসিক ইতিহাস",
    dash_table_month: "মাস",
    dash_table_amount: "পরিমাণ",
    dash_table_status: "অবস্থা",
    paid: "প্রদান করা হয়েছে",
    due: "বাকি",
    upcoming: "আসন্ন",
    not_yet_started: "—",

    gallery_heading: "ছবির গ্যালারি",
    gallery_subheading: "যে মুহূর্তগুলো আমরা রেখে দিতে পেরে খুশি।",
    lightbox_close: "বন্ধ করুন",
    lightbox_prev: "পূর্ববর্তী ছবি",
    lightbox_next: "পরবর্তী ছবি",

    error_generic: "এই মুহূর্তে তথ্য লোড করা যায়নি। অনুগ্রহ করে পরে আবার চেষ্টা করুন।",
    error_gallery: "এই মুহূর্তে গ্যালারি লোড করা যায়নি। অনুগ্রহ করে পরে আবার চেষ্টা করুন।",

    footer_statement: "বন্ধুদের পক্ষ থেকে নীরবে পরিবারের জন্য পরিচালিত।",
    footer_made_with_care: "বন্ধুদের যত্নে তৈরি।",
  },
};

const I18N_MONTHS = {
  en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  bn: ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"],
};

const I18N_DIGITS_BN = ["০","১","২","৩","৪","৫","৬","৭","৮","৯"];

function getLang() {
  return localStorage.getItem("lang") === "bn" ? "bn" : "en";
}

function setLang(lang) {
  localStorage.setItem("lang", lang);
  applyLang(lang);
}

function t(key, vars) {
  const lang = getLang();
  let str = (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS.en[key] || key;
  if (vars) {
    Object.keys(vars).forEach((k) => {
      str = str.replace(`{${k}}`, vars[k]);
    });
  }
  return str;
}

/** Format a "YYYY-MM" string as a localized month + year label. */
function formatMonthLabel(yyyyMm, lang) {
  lang = lang || getLang();
  const [y, m] = yyyyMm.split("-").map(Number);
  const monthName = I18N_MONTHS[lang][m - 1];
  const year = lang === "bn" ? toBnDigits(String(y)) : String(y);
  return `${monthName} ${year}`;
}

/** Format a "YYYY-MM-DD" string as a localized "D Month YYYY" date. */
function formatFullDate(yyyyMmDd, lang) {
  lang = lang || getLang();
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  const monthName = I18N_MONTHS[lang][m - 1];
  const day = lang === "bn" ? toBnDigits(String(d)) : String(d);
  const year = lang === "bn" ? toBnDigits(String(y)) : String(y);
  return `${day} ${monthName} ${year}`;
}

function toBnDigits(str) {
  return String(str).replace(/[0-9]/g, (d) => I18N_DIGITS_BN[d]);
}

/** Format an integer amount with the site currency symbol, respecting language digit style. */
function formatCurrency(amount, symbol) {
  const lang = getLang();
  const rounded = Math.round(amount);
  let numStr = rounded.toLocaleString("en-US");
  if (lang === "bn") numStr = toBnDigits(numStr);
  return `${symbol}${numStr}`;
}

function applyLang(lang) {
  lang = lang || getLang();
  document.documentElement.setAttribute("lang", lang === "bn" ? "bn" : "en");
  document.documentElement.setAttribute("dir", "ltr");

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
  });
  document.querySelectorAll("[data-lang-toggle-label]").forEach((el) => {
    el.textContent = t("lang_toggle");
  });

  document.dispatchEvent(new CustomEvent("langchange", { detail: { lang } }));
}

function initLangToggle() {
  applyLang(getLang());
  document.querySelectorAll("[data-lang-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => {
      setLang(getLang() === "bn" ? "en" : "bn");
    });
  });
}

document.addEventListener("DOMContentLoaded", initLangToggle);
