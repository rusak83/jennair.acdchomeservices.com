/* ============================================================
   ACDC HOME SERVICES — main.js
   Phone tracking + dynamic number insertion + event tracking
   + FAQ accordion + mobile nav + sticky call
   ============================================================ */
(function () {
  'use strict';

  /* ── Phone Mapping by Traffic Source ── */
  var phoneMapping = {
    'google-cpc': '+14695011201',
    'bing-cpc': '+14692050052',
    'facebook-cpc': '+14697514146',
    'facebook-paid': '+14697514146',
    'google-organic': '+14692240577',
    'google': '+14692240577',
    'organic': '+14692240577',
    'yelp': '+14697300301',
    'yelp-cpc': '+14697300301',
    'homedepot': '+14694982044',
    'directories': '+14694982044',
    'default': '+14692240577'
  };

  var cachedYandexCounterId;

  /* ── Brand Detection (path-based for acdcdfw.com) ── */
  function getBrandName() {
    var path = window.location.pathname.toLowerCase();
    if (path.indexOf('/sub-zero/') === 0) return 'Sub-Zero';
    if (path.indexOf('/viking/') === 0) return 'Viking';
    if (path.indexOf('/thermador/') === 0) return 'Thermador';
    if (path.indexOf('/wolf/') === 0) return 'Wolf';
    if (path.indexOf('/kitchenaid/') === 0) return 'KitchenAid';
    if (path.indexOf('/jennair/') === 0) return 'JennAir';
    if (path.indexOf('/ge-monogram/') === 0) return 'GE Monogram';
    if (path.indexOf('/dacor/') === 0) return 'Dacor';
    if (path.indexOf('/miele/') === 0) return 'Miele';
    if (path.indexOf('/bosch/') === 0) return 'Bosch';
    if (path.indexOf('/ice-machines/') === 0) return 'Ice Machines';
    if (path.indexOf('/wine-coolers/') === 0) return 'Wine Coolers';
    return 'ACDC';
  }

  /* ── UTM Params ── */
  function getUTMParams() {
    var urlParams = new URLSearchParams(window.location.search);
    return {
      source: urlParams.get('utm_source') || '',
      medium: urlParams.get('utm_medium') || '',
      campaign: urlParams.get('utm_campaign') || ''
    };
  }

  /* ── Phone Number Selection ── */
  function getPhoneNumber() {
    var utm = getUTMParams();
    var referrer = document.referrer.toLowerCase();
    var key = (utm.source + '-' + utm.medium).toLowerCase();
    if (phoneMapping[key]) return phoneMapping[key];
    if (utm.source && phoneMapping[utm.source]) return phoneMapping[utm.source];
    if (referrer.indexOf('google.com') !== -1 && !utm.medium) return phoneMapping['google-organic'];
    if (referrer.indexOf('yelp.com') !== -1) return phoneMapping['yelp'];
    return phoneMapping['default'];
  }

  function savePhoneToSession(phone) {
    try {
      sessionStorage.setItem('tracking_phone', phone);
      sessionStorage.setItem('tracking_phone_timestamp', Date.now());
    } catch (e) {}
  }

  function getPhoneFromSession() {
    try {
      var phone = sessionStorage.getItem('tracking_phone');
      var timestamp = sessionStorage.getItem('tracking_phone_timestamp');
      if (phone && timestamp) {
        if (Date.now() - parseInt(timestamp, 10) < 30 * 60 * 1000) return phone;
      }
    } catch (e) {}
    return null;
  }

  function formatPhone(phone) {
    var cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 11 && cleaned[0] === '1') {
      return '(' + cleaned.substr(1, 3) + ') ' + cleaned.substr(4, 3) + '-' + cleaned.substr(7, 4);
    }
    return phone;
  }

  /* ── Channel Detection ── */
  function getChannelName() {
    var utm = getUTMParams();
    var key = (utm.source + '-' + utm.medium).toLowerCase();
    if (key === 'google-cpc') return 'Google Ads';
    if (key === 'bing-cpc') return 'Bing Ads';
    if (key === 'facebook-cpc' || key === 'facebook-paid') return 'Facebook Ads';
    if (utm.source === 'google' && !utm.medium) return 'Google Organic';
    if (utm.source === 'yelp') return 'Yelp';
    if (utm.source === 'homedepot') return 'Home Depot';
    return 'Direct/Other';
  }

  /* ── Page Context (sent with every event) ── */
  function getPageContext() {
    var utm = getUTMParams();
    return {
      brandName: getBrandName(),
      channelName: getChannelName(),
      pagePath: window.location.pathname,
      pageTitle: document.title,
      phoneNumber: getPhoneFromSession() || getPhoneNumber(),
      utm_source: utm.source || 'direct',
      utm_medium: utm.medium || 'direct',
      utm_campaign: utm.campaign || 'direct'
    };
  }

  /* ── Event Push: GTM dataLayer ── */
  function pushDataLayerEvent(eventName, payload) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: eventName }, getPageContext(), payload || {}));
  }

  /* ── Event Push: gtag ── */
  function pushGtagEvent(eventName, payload) {
    if (typeof window.gtag === 'function') {
      window.gtag('event', eventName, Object.assign({}, getPageContext(), payload || {}));
    }
  }

  /* ── Event Push: Yandex Metrika ── */
  function getYandexCounterId() {
    if (cachedYandexCounterId !== undefined) return cachedYandexCounterId;
    cachedYandexCounterId = null;
    document.querySelectorAll('script').forEach(function (script) {
      if (cachedYandexCounterId) return;
      var text = script.textContent || '';
      var match = text.match(/ym\((\d+)\s*,\s*['"]init['"]/);
      if (match) cachedYandexCounterId = parseInt(match[1], 10);
    });
    return cachedYandexCounterId;
  }

  function pushYandexGoal(goalName, payload) {
    var counterId = getYandexCounterId();
    if (counterId && typeof window.ym === 'function') {
      window.ym(counterId, 'reachGoal', goalName, Object.assign({}, getPageContext(), payload || {}));
    }
  }

  /* ── Event Push: Microsoft UET ── */
  function pushUETEvent(eventName, payload) {
    window.uetq = window.uetq || [];
    window.uetq.push('event', eventName, Object.assign({}, getPageContext(), payload || {}));
  }

  /* ── Unified Event Tracking ── */
  function trackEvent(eventName, payload) {
    pushDataLayerEvent(eventName, payload);
    pushGtagEvent(eventName, payload);
    pushYandexGoal(eventName, payload);
    pushUETEvent(eventName, payload);
  }

  /* ── Dynamic Phone Replacement ── */
  function replacePhoneNumbers() {
    var phone = getPhoneFromSession() || getPhoneNumber();
    savePhoneToSession(phone);

    var formattedPhone = formatPhone(phone);
    var utm = getUTMParams();
    var gclid = new URLSearchParams(window.location.search).get('gclid');

    pushDataLayerEvent('phone_number_set', {
      phoneNumber: phone,
      phoneFormatted: formattedPhone,
      gclid: gclid || 'none',
      referrer: document.referrer,
      brandName: getBrandName(),
      channelName: getChannelName(),
      utm_source: utm.source || 'direct',
      utm_medium: utm.medium || 'direct',
      utm_campaign: utm.campaign || 'direct'
    });

    document.querySelectorAll('a[href^="tel:"]').forEach(function (link) {
      link.href = 'tel:' + phone;
      if (link.textContent.match(/[\d\(\)\-\s]+/)) {
        link.textContent = formattedPhone;
      }
    });

    document.querySelectorAll('.phone-number, [data-phone], .cat-button').forEach(function (el) {
      if (el.tagName === 'A') {
        el.href = 'tel:' + phone;
      }
      if (el.textContent.match(/[\d\(\)\-\s]+/)) {
        el.textContent = formattedPhone;
      }
    });
  }

  /* ── Phone Click Tracking ── */
  function initPhoneClickTracking() {
    document.querySelectorAll('a[href^="tel:"]').forEach(function (link) {
      if (link.dataset.trackingBound === 'true') return;
      link.dataset.trackingBound = 'true';
      link.addEventListener('click', function () {
        trackEvent('phone_click', {
          clickText: (link.textContent || '').trim(),
          clickLocation: link.dataset.location || link.id || link.className || 'tel_link',
          phoneTarget: link.getAttribute('href')
        });
      });
    });
  }

  /* ── Booking Click Tracking ── */
  function initBookingTracking() {
    document.querySelectorAll('a[href*="book.housecallpro.com"], a.hcp-button').forEach(function (link) {
      if (link.dataset.bookingTrackingBound === 'true') return;
      link.dataset.bookingTrackingBound = 'true';
      link.addEventListener('click', function () {
        trackEvent('booking_click', {
          bookingUrl: link.href,
          triggerText: (link.textContent || '').trim(),
          clickLocation: link.dataset.location || link.id || link.className || 'booking_link'
        });
      });
    });
  }

  /* ── Form Submit Tracking ── */
  function initFormTracking() {
    document.querySelectorAll('form').forEach(function (form) {
      if (form.dataset.formTrackingBound === 'true') return;
      form.dataset.formTrackingBound = 'true';

      form.addEventListener('submit', function (event) {
        var formData = new FormData(form);
        var submitMode = form.dataset.submitMode || 'native';

        trackEvent('form_submit', {
          formId: form.id || '',
          formClass: form.className || '',
          formAction: form.getAttribute('action') || '',
          formMethod: form.getAttribute('method') || 'GET',
          submitMode: submitMode,
          leadName: formData.get('name') || '',
          leadPhone: formData.get('phone') || '',
          leadZip: formData.get('zip') || '',
          leadIssue: formData.get('issue') || formData.get('message') || ''
        });

        if (submitMode === 'call' || submitMode === 'booking') {
          event.preventDefault();
          var target = submitMode === 'booking'
            ? 'https://book.housecallpro.com/book/ACDC-HVAC--Appliance-Repair/53312602f0a846a9b9e0059cfb118440?v2=true'
            : (document.querySelector('a[href^="tel:"]') || {}).href || 'tel:+14692240577';
          setTimeout(function () { window.location.href = target; }, 120);
        }
      });
    });
  }

  /* ── MOBILE NAV ── */
  function initMobileNav() {
    var toggle = document.querySelector('.nav-mobile-toggle');
    var links = document.querySelector('.nav-links');
    if (!toggle || !links) return;

    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open);
    });

    document.addEventListener('click', function (e) {
      if (!e.target.closest('.site-header')) {
        links.classList.remove('open');
      }
    });
  }

  /* ── FAQ ACCORDION ── */
  function initFAQ() {
    document.querySelectorAll('.faq-question').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var item = btn.closest('.faq-item');
        var isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(function (el) {
          el.classList.remove('open');
        });
        if (!isOpen) item.classList.add('open');
      });
    });
  }

  /* ── STICKY CALL BUTTON ── */
  function initStickyCall() {
    var btn = document.querySelector('.sticky-call');
    if (!btn) return;

    window.addEventListener('scroll', function () {
      if (window.scrollY < 300) {
        btn.style.opacity = '0';
        btn.style.pointerEvents = 'none';
      } else {
        btn.style.opacity = '1';
        btn.style.pointerEvents = 'auto';
      }
    }, { passive: true });
  }

  /* ── INIT ── */
  document.addEventListener('DOMContentLoaded', function () {
    replacePhoneNumbers();
    initPhoneClickTracking();
    initBookingTracking();
    initFormTracking();
    initMobileNav();
    initFAQ();
    initStickyCall();
  });

})();
