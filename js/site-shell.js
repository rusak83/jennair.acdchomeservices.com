(function () {
  var REVIEW_CLASS = "elfsight-app-27ba2164-9624-4923-84ac-869de3348ad8";
  var PHONE = "(469) 730-0309";
  var PHONE_HREF = "tel:+14697300309";
  var BOOK_URL = "https://book.housecallpro.com/book/ACDC-HVAC--Appliance-Repair/53312602f0a846a9b9e0059cfb118440?v2=true";

  function ensureElfsightScript() {
    if (document.querySelector('script[src="https://apps.elfsight.com/p/platform.js"]')) {
      return;
    }
    var script = document.createElement("script");
    script.src = "https://apps.elfsight.com/p/platform.js";
    script.defer = true;
    document.body.appendChild(script);
  }

  function injectReviewsIfMissing() {
    if (document.querySelector("." + REVIEW_CLASS)) {
      return;
    }

    var footer = document.querySelector("footer");
    var host = footer || document.querySelector("main") || document.body;
    if (!host) {
      return;
    }

    var section = document.createElement("section");
    section.className = "shared-reviews-section";
    section.innerHTML =
      '<div class="fixed-width-container">' +
      '<hr>' +
      '<h2 class="section-headline">What our customers say</h2>' +
      '<div class="shared-reviews-card">' +
      '<div class="' + REVIEW_CLASS + '"></div>' +
      "</div>" +
      "</div>";

    if (footer && footer.parentNode) {
      footer.parentNode.insertBefore(section, footer);
    } else {
      host.appendChild(section);
    }

    ensureElfsightScript();
  }

  function enhanceLegacyHeader() {
    var navContainer = document.querySelector(".top-bar .nav--container");
    if (!navContainer || navContainer.querySelector(".nav-phone-pill")) {
      return;
    }

    var phoneLink = document.createElement("a");
    phoneLink.className = "nav-phone-pill";
    phoneLink.href = PHONE_HREF;
    phoneLink.textContent = PHONE;
    navContainer.appendChild(phoneLink);
  }

  function injectSharedHeaderForFallbackPages() {
    if (document.querySelector(".top-bar") || document.querySelector(".shared-topbar")) {
      return;
    }

    var fallbackHeader = document.querySelector("header.site-header[role='banner']");
    if (!fallbackHeader) {
      return;
    }

    var sharedHeader = document.createElement("header");
    sharedHeader.className = "shared-topbar";
    sharedHeader.innerHTML =
      '<div class="shared-topbar__inner">' +
      '<a class="shared-topbar__logo" href="/">AC/DC Home<br>Services</a>' +
      '<nav class="shared-topbar__nav" aria-label="Main navigation">' +
      '<a href="/85-reasons-book-acdc-appliance-repair">Why Us</a>' +
      '<a href="/about">About</a>' +
      '<a href="/contacts">Contacts</a>' +
      "</nav>" +
      '<a class="shared-topbar__phone" href="' + PHONE_HREF + '">' + PHONE + "</a>" +
      "</div>";

    document.body.insertBefore(sharedHeader, document.body.firstChild);
    document.body.classList.add("has-injected-shared-header", "shared-header-offset");
  }

  function enhanceCtaButton() {
    var catButton = document.querySelector(".cat-button");
    if (!catButton) {
      return;
    }
    if (!catButton.textContent || catButton.textContent.indexOf(PHONE) === -1) {
      catButton.textContent = "CLICK TO CALL " + PHONE;
    }
  }

  function addBookButtonToFallbackPages() {
    if (document.querySelector(".top-bar") || !document.body.classList.contains("has-injected-shared-header")) {
      return;
    }

    if (document.querySelector(".shared-fallback-book")) {
      return;
    }

    var container = document.querySelector("main .container, main .wrapper, main");
    if (!container) {
      return;
    }

    var book = document.createElement("p");
    book.className = "shared-fallback-book";
    book.style.margin = "16px 0 0";
    book.innerHTML = '<a href="' + BOOK_URL + '" rel="noopener">Book same-day diagnostic</a>';

    var firstBlock = container.querySelector(".container, .wrapper, div");
    if (firstBlock) {
      firstBlock.appendChild(book);
    }
  }

  function init() {
    injectSharedHeaderForFallbackPages();
    enhanceLegacyHeader();
    enhanceCtaButton();
    injectReviewsIfMissing();
    addBookButtonToFallbackPages();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
