(function () {
  'use strict';

  var root = document.documentElement;
  var state = { data: null, lang: 'zh', rank: null, ccf: null, pubBody: null, pubSection: null };

  var UI = {
    zh: {
      lang: { label: '语言' },
      theme: { label: '主题', light: '浅色', dark: '深色', eye: '护眼' },
      nav: {
        label: '章节',
        research: '研究兴趣',
        experience: '教育与工作经历',
        projects: '科研项目',
        publications: '代表性成果',
        service: '学术服务与荣誉'
      },
      profile: { label: '个人资料', metrics: '主要指标', cv: '简历 PDF', contact: '联系我', copy: '复制邮箱', copied: '已复制', copyFailed: '无法自动复制，请选中邮箱复制' },
      navigation: { top: '回到顶部' },
      error: { load: '无法加载 data/site.js。请确认它和本页在同一目录。' },
      ccf: { label: '是否使用 CCF', on: '使用 CCF', off: '不使用 CCF' },
      rank: { label: '分区体系', print: '分区体系：{name}' },
      pub: { count: '{label} {n} 篇', countPlural: '{label} {n} 篇', sep: '；', results: '共 {n} 篇', scholar: 'Google Scholar', dblp: 'DBLP', lookup: '搜索论文：{title}（{provider}，新窗口）' },
      print: { cv: 'CV', noCcf: ' · 不使用CCF' },
      footer: { updated: '最近更新：{date}' }
    },
    en: {
      lang: { label: 'Language' },
      theme: { label: 'Theme', light: 'Light', dark: 'Dark', eye: 'Reading' },
      nav: {
        label: 'Sections',
        research: 'Research',
        experience: 'Experience',
        projects: 'Projects',
        publications: 'Publications',
        service: 'Service'
      },
      profile: { label: 'Profile', metrics: 'Metrics', cv: 'CV · PDF', contact: 'Contact me', copy: 'Copy email', copied: 'Copied', copyFailed: 'Select the email address to copy it manually' },
      navigation: { top: 'Back to top' },
      error: { load: 'Cannot load data/site.js. Make sure it sits next to this page.' },
      ccf: { label: 'Use CCF', on: 'Use CCF', off: 'Do not use CCF' },
      rank: { label: 'Ranking system', print: 'Ranking: {name}' },
      pub: { count: '{label} · {n} paper', countPlural: '{label} · {n} papers', sep: '; ', results: '{n} publications', scholar: 'Google Scholar', dblp: 'DBLP', lookup: 'Search for {title} ({provider}, new window)' },
      print: { cv: 'CV', noCcf: ' · no CCF' },
      footer: { updated: 'Last updated: {date}' }
    }
  };

  var ICONS = {
    scholar: '<path d="M12 3.5 1.8 8.6 12 13.7l10.2-5.1L12 3.5Z"/><path d="M5.6 11v4.4c0 1.8 2.9 3.2 6.4 3.2s6.4-1.4 6.4-3.2V11"/>',
    github: '<path d="M9 19.5c-3.5 1-3.5-1.8-5-2.2m10 4.2v-3.4c0-1 .1-1.4-.5-2 2.3-.3 4.5-1.2 4.5-5a3.9 3.9 0 0 0-1.1-2.7 3.6 3.6 0 0 0-.1-2.7s-1.1-.3-3.5 1.4a8.6 8.6 0 0 0-4.6 0C6.3 5.4 5.2 5.7 5.2 5.7a3.6 3.6 0 0 0-.1 2.7A3.9 3.9 0 0 0 4 11.1c0 3.8 2.2 4.7 4.5 5-.4.4-.5.9-.5 1.6V21"/>',
    orcid: '<circle cx="12" cy="12" r="9"/><path d="M9.2 8.6v7"/><circle cx="9.2" cy="6.9" r=".7" fill="currentColor" stroke="none"/><path d="M12.4 8.6h2.3a3.5 3.5 0 0 1 0 7h-2.3v-7Z"/>',
    cv: '<path d="M13.5 3H6.8A1.8 1.8 0 0 0 5 4.8v14.4A1.8 1.8 0 0 0 6.8 21h10.4a1.8 1.8 0 0 0 1.8-1.8V8.5L13.5 3Z"/><path d="M13.5 3v5.5H19"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>',
    copy: '<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h3"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="1.5"/><path d="m4.5 7 7.5 5.5L19.5 7"/>'
  };

  function icon(name) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  }

  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (!attrs) return node;
    Object.keys(attrs).forEach(function (key) {
      var value = attrs[key];
      if (key === 'text') node.textContent = value;
      else if (key === 'html') node.innerHTML = value;
      else if (key === 'class') node.className = value;
      else node.setAttribute(key, value);
    });
    return node;
  }

  layui.use(['i18n', 'layer'], function () {
    var $ = layui.$;
    var i18n = layui.i18n;
    var layer = layui.layer;

    var messages = i18n.config.messages || (i18n.config.messages = {});
    (messages['zh-CN'] = messages['zh-CN'] || {}).ui = UI.zh;
    (messages.en = messages.en || {}).ui = UI.en;

    function $t(key, data) {
      return i18n.$t('ui.' + key, data);
    }

    function T(value) {
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') return value;
      return value[state.lang] || value.en || value.zh || '';
    }

    function read(key) {
      try { return localStorage.getItem(key); } catch (e) { return null; }
    }

    function store(key, value) {
      try { localStorage.setItem(key, value); } catch (e) {}
    }

    var navEl = document.getElementById('nav');
    var sidebarEl = document.getElementById('sidebar');
    var contentEl = document.getElementById('content-body');
    var copyrightEl = document.getElementById('copyright');
    var updatedEl = document.getElementById('updated');
    var errorEl = document.getElementById('load-error');
    var langSelect = document.getElementById('lang-toggle');
    var themeMeta = document.querySelector('meta[name="theme-color"]');
    var themeButtons = document.querySelectorAll('.theme-option');
    var topbar = document.querySelector('.topbar');
    var backToTop = document.getElementById('back-to-top');

    function syncHeaderHeight() {
      root.style.setProperty('--header-height', topbar.getBoundingClientRect().height + 'px');
    }

    function readingPosition() {
      if (!state.data || window.scrollY < 90) return { top: window.scrollY };
      var limit = topbar.getBoundingClientRect().height + 20;
      var candidates = contentEl.querySelectorAll('.section, [data-reading-key]');
      var anchor = candidates[0];
      Array.prototype.forEach.call(candidates, function (node) {
        if (node.getBoundingClientRect().top <= limit) anchor = node;
      });
      return anchor ? { id: anchor.id, key: anchor.getAttribute('data-reading-key'), offset: anchor.getBoundingClientRect().top - limit } : { top: window.scrollY };
    }

    function restoreReading(position) {
      syncHeaderHeight();
      var anchor = position.id ? document.getElementById(position.id) : null;
      if (position.key) {
        Array.prototype.some.call(contentEl.querySelectorAll('[data-reading-key]'), function (node) {
          if (node.getAttribute('data-reading-key') !== position.key) return false;
          anchor = node;
          return true;
        });
      }
      var target = anchor ? window.scrollY + anchor.getBoundingClientRect().top - topbar.getBoundingClientRect().height - 20 - position.offset : position.top;
      window.scrollTo({ top: Math.max(0, target || 0), behavior: 'instant' });
      updateActive();
    }

    if (window.ResizeObserver) new ResizeObserver(function () { syncHeaderHeight(); updateActive(); }).observe(topbar);
    window.addEventListener('resize', syncHeaderHeight);
    syncHeaderHeight();
    if (backToTop) backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    });

    function setTheme(theme) {
      var next = ['light', 'dark', 'eye'].indexOf(theme) !== -1 ? theme : 'light';
      root.dataset.theme = next;
      store('theme', next);

      Array.prototype.forEach.call(themeButtons, function (button) {
        button.setAttribute('aria-pressed', String(button.dataset.themeValue === next));
      });
      if (themeMeta) themeMeta.setAttribute('content', getComputedStyle(root).getPropertyValue('--paper').trim());
    }

    Array.prototype.forEach.call(themeButtons, function (button) {
      button.addEventListener('click', function () {
        setTheme(button.dataset.themeValue);
      });
    });

    setTheme(root.dataset.theme);

    function fillStaticText() {
      $('[data-i18n]').each(function () {
        $(this).text($t(this.getAttribute('data-i18n')));
      });
      $('[data-i18n-label]').each(function () {
        this.setAttribute('aria-label', $t(this.getAttribute('data-i18n-label')));
      });
    }

    function setLang(lang, persist) {
      var position = readingPosition();
      state.lang = lang === 'en' ? 'en' : 'zh';
      root.dataset.lang = state.lang;
      root.lang = state.lang === 'zh' ? 'zh-CN' : 'en';
      i18n.set({ locale: state.lang === 'zh' ? 'zh-CN' : 'en' });
      if (persist !== false) store('lang', state.lang);
      if (langSelect) langSelect.value = state.lang;

      fillStaticText();
      paintQuip();
      render();
      restoreReading(position);
    }

    if (langSelect) {
      langSelect.addEventListener('change', function () {
        setLang(langSelect.value);
      });
    }

    function roleLine(profile) {
      var parts = [T(profile.org), T(profile.title)].filter(Boolean);
      var node = el('p', { class: 'role' });
      parts.forEach(function (part) {
        node.appendChild(el('span', { class: 'role-line', text: part }));
      });
      return node;
    }

    function renderSidebar() {
      var p = state.data.profile;
      sidebarEl.innerHTML = '';

      sidebarEl.appendChild(el('img', {
        class: 'portrait',
        src: p.photo,
        alt: T(p.name),
        width: '600',
        height: '750'
      }));

      var main = el('div', { class: 'side-main' });
      var identity = el('div', { class: 'identity' });
      identity.appendChild(el('h1', { text: T(p.name) }));
      identity.appendChild(roleLine(p));
      main.appendChild(identity);

      var metrics = el('dl', { class: 'metrics', 'aria-label': $t('profile.metrics') });
      (p.metrics || []).forEach(function (metric) {
        var row = el('div');
        row.appendChild(el('dt', { text: T(metric.label) }));
        row.appendChild(el('dd', { text: metric.value }));
        metrics.appendChild(row);
      });
      main.appendChild(metrics);

      var contacts = el('ul', { class: 'side-contact' });
      (p.contacts || []).forEach(function (contact) {
        var node = el('a', { href: contact.href });
        if (contact.external) {
          node.setAttribute('target', '_blank');
          node.setAttribute('rel', 'noopener');
        }
        node.innerHTML = icon(contact.icon) + '<span></span>';
        node.querySelector('span').textContent = T(contact.label);

        var item = el('li');
        item.appendChild(node);
        contacts.appendChild(item);
      });

      var actions = el('div', { class: 'profile-actions' });
      var printBtn = el('button', { class: 'profile-action action-primary cv-print', type: 'button' });
      printBtn.addEventListener('click', function () { window.print(); });
      printBtn.innerHTML = icon('cv');
      printBtn.appendChild(el('span', { text: $t('profile.cv') }));
      actions.appendChild(printBtn);
      if (p.collaboration && p.collaboration.email) {
        var contactBtn = el('a', { class: 'profile-action action-secondary', href: 'mailto:' + p.collaboration.email });
        contactBtn.innerHTML = icon('mail');
        contactBtn.appendChild(el('span', { text: $t('profile.contact') }));
        actions.appendChild(contactBtn);
      }
      main.appendChild(actions);
      main.appendChild(contacts);

      if (p.collaboration) {
        var card = el('section', { class: 'side-block side-card' });
        card.appendChild(el('p', { class: 'card-title', text: T(p.collaboration.title) }));
        card.appendChild(el('p', { class: 'card-text', text: T(p.collaboration.text) }));
        var mail = el('a', { class: 'card-link', href: 'mailto:' + p.collaboration.email });
        mail.innerHTML = icon('mail') + '<span></span>';
        mail.querySelector('span').textContent = p.collaboration.email;
        var emailRow = el('div', { class: 'email-row' });
        emailRow.appendChild(mail);
        if (p.collaboration.email) {
          var copyButton = el('button', { class: 'email-copy', type: 'button', 'aria-label': $t('profile.copy'), title: $t('profile.copy'), html: icon('copy') });
          var feedback = el('span', { class: 'copy-feedback', role: 'status', 'aria-live': 'polite' });
          var feedbackTimer;
          copyButton.addEventListener('click', function () {
            clearTimeout(feedbackTimer);
            feedback.textContent = '';
            copyButton.disabled = true;
            var copying = navigator.clipboard && navigator.clipboard.writeText
              ? navigator.clipboard.writeText(p.collaboration.email)
              : Promise.reject(new Error('Clipboard unavailable'));
            copying.then(function () {
              layer.msg($t('profile.copied'), { time: 500 });
            }).catch(function () {
              var selection = window.getSelection();
              var range = document.createRange();
              range.selectNodeContents(mail.querySelector('span'));
              selection.removeAllRanges();
              selection.addRange(range);
              feedback.textContent = $t('profile.copyFailed');
            }).then(function () {
              copyButton.disabled = false;
              feedbackTimer = setTimeout(function () { feedback.textContent = ''; }, 4000);
            });
          });
          emailRow.appendChild(copyButton);
          card.appendChild(emailRow);
          card.appendChild(feedback);
        } else card.appendChild(emailRow);
        main.appendChild(card);
      }

      sidebarEl.appendChild(main);

      if (p.meta) {
        var meta = el('div', { class: 'side-meta' });
        var item = el('p', { class: 'meta-item' });
        item.innerHTML = icon('clock') + '<span class="local-time"></span>';
        meta.appendChild(item);
        sidebarEl.appendChild(meta);
        tickClock();
      }
    }

    function bodyWrap() {
      return el('div', { class: 'section-body' });
    }

    function renderInterests(section) {
      var body = bodyWrap();
      var list = el('dl', { class: 'interests' });

      (section.items || []).forEach(function (item) {
        var row = el('div', { class: 'interest' });
        row.appendChild(el('dt', { text: T(item.term) }));
        row.appendChild(el('dd', { text: T(item.desc) }));
        list.appendChild(row);
      });

      body.appendChild(list);
      return body;
    }

    function timeValue(text, part) {
      var raw = String(text || '').trim();
      if (!raw) return null;
      var piece = raw.split(/\s*[–—-]\s*/)[part || 0] || '';
      var match = piece.match(/(\d{4})\D*(\d{1,2})?/);
      if (!match) return null;
      return Number(match[1]) * 100 + (match[2] ? Number(match[2]) : 0);
    }

    function byTime(a, b) {
      for (var part = 0; part < 2; part++) {
        var valueA = timeValue(a.date, part);
        var valueB = timeValue(b.date, part);
        if (valueA == null && valueB == null) return 0;
        if (valueA == null) return 1;
        if (valueB == null) return -1;
        if (valueA !== valueB) return valueB - valueA;
      }
      return 0;
    }

    function renderTimeline(section) {
      var body = bodyWrap();
      var list = el('ul', { class: 'rows' });

      (section.items || []).slice().sort(byTime).forEach(function (item) {
        var row = el('li', { class: 'row' });
        row.appendChild(el('div', { class: 'when', text: item.date }));

        var what = el('div', { class: 'what' });
        var primary = el('p', { class: 'primary' });
        primary.appendChild(document.createTextNode(T(item.org)));
        primary.appendChild(el('span', { class: 'duty', text: T(item.duty) }));
        what.appendChild(primary);

        var advisorName = item.advisor ? T(item.advisor.name).trim() : '';
        if (advisorName) {
          var advisor = el('p', { class: 'advisor' });
          var advisorLabel = T(item.advisor.label).trim();
          if (advisorLabel) advisor.appendChild(document.createTextNode(advisorLabel + ' '));
          var advisorUrl = String(item.advisor.url || '').trim();
          if (advisorUrl) {
            advisor.appendChild(el('a', {
              href: advisorUrl,
              target: '_blank',
              rel: 'noopener',
              text: advisorName
            }));
          } else {
            advisor.appendChild(document.createTextNode(advisorName));
          }
          what.appendChild(advisor);
        }

        row.appendChild(what);
        list.appendChild(row);
      });

      body.appendChild(list);
      return body;
    }

    function projectRoleLabel(role) {
      if (role === 'join') return state.lang === 'zh' ? '参与' : 'Participant';
      if (role === 'lead') return state.lang === 'zh' ? '主持' : 'PI';
      return '';
    }

    function renderProjects(section) {
      var body = bodyWrap();
      var list = el('ul', { class: 'rows' });

      (section.items || []).slice().sort(byTime).forEach(function (item) {
        var row = el('li', { class: 'row' });
        row.appendChild(el('div', { class: 'when', text: item.date }));

        var what = el('div', { class: 'what' });
        what.appendChild(el('p', { class: 'primary', text: T(item.title) }));

        var meta = el('p', { class: 'project-meta' });
        meta.appendChild(el('span', { class: 'funder', text: T(item.funder) }));
        var amount = T(item.amount).trim();
        var role = projectRoleLabel(item.role);
        var tail = [amount, role].filter(Boolean).join(' · ');
        if (tail) meta.appendChild(el('span', { class: 'amount', text: tail }));
        what.appendChild(meta);

        row.appendChild(what);
        list.appendChild(row);
      });

      body.appendChild(list);
      return body;
    }

    var titleBeforePrint = '';

    function printTitle() {
      var profile = state.data && state.data.profile;
      var name = profile ? T(profile.name) : '';
      var rankName = state.pubSection ? rankSystemLabel(state.pubSection) : '';
      var title = name ? name + ' - ' + $t('print.cv') : $t('print.cv');
      if (rankName) title += ' - ' + rankName;
      if (state.ccf === false) title += $t('print.noCcf');
      return title;
    }

    window.addEventListener('beforeprint', function () {
      titleBeforePrint = document.title;
      document.title = printTitle();
    });
    window.addEventListener('afterprint', function () {
      if (titleBeforePrint) document.title = titleBeforePrint;
    });

    function rankSystemLabel(section) {
      var found = null;
      ((section.rank || {}).systems || []).forEach(function (system) {
        if (system.key === state.rank) found = system;
      });
      return found ? T(found.label) : '';
    }

    var BUCKETS = {
      1: { zh: 'CCF-A / 一区', en: 'CCF-A / Q1' },
      2: { zh: 'CCF-B / 二区', en: 'CCF-B / Q2' }
    };

    var ZONE_LABELS = {
      1: { zh: '一区', en: 'Q1' },
      2: { zh: '二区', en: 'Q2' }
    };

    function zoneRank(zone) {
      var value = Number(zone);
      return value === 1 || value === 2 ? value : 9;
    }

    function currentZone(item) {
      var rank = item ? item.rank : null;
      if (rank === null || rank === undefined) return { state: 'none' };
      if (typeof rank === 'number') {
        var numeric = zoneRank(rank);
        return numeric < 9 ? { state: 'zone', value: numeric } : { state: 'drop' };
      }
      if (!Object.prototype.hasOwnProperty.call(rank, state.rank) || rank[state.rank] === '' || rank[state.rank] == null) {
        return { state: 'missing' };
      }
      var value = zoneRank(rank[state.rank]);
      return value < 9 ? { state: 'zone', value: value } : { state: 'drop' };
    }

    function itemBucket(item) {
      var zone = currentZone(item);
      if (zone.state === 'drop' || zone.state === 'missing') return 0;
      var ccf = item && (item.ccf === 1 || item.ccf === 2) ? item.ccf : 0;
      if (!state.ccf) return zone.state === 'zone' ? zone.value : 0;
      if (zone.state === 'zone') {
        if (!ccf) return zone.value;
        return Math.min(ccf, zone.value) === 1 ? 1 : 2;
      }
      return ccf;
    }

    function bucketLabel(section, bucket) {
      var rank = section && section.rank;
      var configured = state.ccf ? rank && rank.buckets : rank && rank.zones;
      var fallback = state.ccf ? BUCKETS : ZONE_LABELS;

      if (configured) {
        for (var i = 0; i < configured.length; i++) {
          if (configured[i].id === bucket && configured[i].label) return T(configured[i].label);
        }
      }
      return T(fallback[bucket] || '');
    }

    function bucketKeys(buckets) {
      return Object.keys(buckets).map(Number).sort(function (a, b) { return a - b; });
    }

    function noteCounts(section, buckets) {
      var parts = [];
      bucketKeys(buckets).forEach(function (bucket) {
        var count = buckets[bucket].length;
        if (!count) return;
        parts.push($t(count === 1 ? 'pub.count' : 'pub.countPlural', {
          label: bucketLabel(section, bucket),
          n: count
        }));
      });
      return parts.join($t('pub.sep'));
    }

    function selfNames(section) {
      var names = (section && section.self) || [];
      return Array.isArray(names) ? names : [names];
    }

    function escapeHtml(value) {
      return String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function authorTokens(item) {
      return String(item.authors || '').split(',').map(function (name) {
        return name.trim();
      }).filter(Boolean);
    }

    function authorName(token) {
      return token.replace(/\*/g, '').replace(/\.$/, '').trim();
    }

    function selfIndex(section, item) {
      var names = selfNames(section);
      var tokens = authorTokens(item);
      for (var i = 0; i < tokens.length; i++) {
        if (names.indexOf(authorName(tokens[i])) !== -1) return i;
      }
      return -1;
    }

    function renderAuthors(section, item) {
      var index = selfIndex(section, item);

      return authorTokens(item).map(function (token, i) {
        var corresponding = token.indexOf('*') !== -1;
        var name = authorName(token);
        var period = /\.$/.test(token.trim());
        var html = escapeHtml(name);

        if (i === index) {
          html = '<span class="' + (i === 0 ? 'me' : 'me-plain') + '">' + html + '</span>';
        }
        if (corresponding) html += '<sup>*</sup>';
        if (period) html += '.';
        return html;
      }).join(', ');
    }

    function itemOrder(section, item) {
      if (/major\s+revision/i.test(item.venue || '')) return 3;
      var index = selfIndex(section, item);
      if (index === 0) return 0;
      if (index > 0) return 1;
      return 2;
    }

    function pubYear(item) {
      var match = String(item.venue || '').match(/\b(?:19|20)\d{2}\b/);
      return match ? Number(match[0]) : null;
    }

    function sortItems(section, items) {
      return (items || []).slice().sort(function (a, b) {
        var order = itemOrder(section, a) - itemOrder(section, b);
        if (order) return order;
        var yearA = pubYear(a);
        var yearB = pubYear(b);
        if (yearA == null && yearB == null) return 0;
        if (yearA == null) return -1;
        if (yearB == null) return 1;
        return yearB - yearA;
      });
    }

    function buildSeg(className, label, options) {
      var wrap = el('div', { class: 'seg ' + className, role: 'group', 'aria-label': label });
      wrap.style.setProperty('--seg-count', String(options.length));
      wrap.appendChild(el('span', { class: 'seg-thumb', 'aria-hidden': 'true' }));

      var index = 0;
      options.forEach(function (option, i) {
        if (option.active) index = i;
        var button = el('button', {
          class: 'seg-option',
          type: 'button',
          'aria-pressed': String(option.active),
          text: option.text
        });
        Object.keys(option.attrs || {}).forEach(function (key) {
          button.setAttribute(key, option.attrs[key]);
        });
        button.addEventListener('click', option.onClick);
        wrap.appendChild(button);
      });

      wrap.style.setProperty('--seg-index', String(index));
      return wrap;
    }

    function ccfOptions(section) {
      var configured = section.rank && section.rank.ccf && section.rank.ccf.options;
      if (configured && configured.length) return configured;
      return [
        { use: true, label: { zh: '使用 CCF', en: 'Use CCF' } },
        { use: false, label: { zh: '不使用 CCF', en: 'Do not use CCF' } }
      ];
    }

    function buildCcfSelect(section) {
      var cfg = (section.rank || {}).ccf || {};
      var wrap = el('span', { class: 'ccf-select' });
      var select = el('select', { 'aria-label': cfg.label ? T(cfg.label) : $t('ccf.label') });

      ccfOptions(section).forEach(function (option) {
        var use = option.use !== false;
        var node = el('option', { value: use ? '1' : '0', text: T(option.label) });
        if (state.ccf === use) node.selected = true;
        select.appendChild(node);
      });

      select.addEventListener('change', function () { setCcf(select.value === '1'); });
      wrap.appendChild(select);
      wrap.insertAdjacentHTML('beforeend',
        '<svg class="lang-caret" viewBox="0 0 10 6" aria-hidden="true">' +
        '<path d="M1 1l4 4 4-4" fill="none" stroke="currentColor" stroke-width="1.3" ' +
        'stroke-linecap="round" stroke-linejoin="round"/></svg>');
      return wrap;
    }

    function buildRankSwitch(section) {
      var cfg = section.rank || {};
      var systems = cfg.systems || [];
      if (!systems.length) return null;

      return buildSeg('seg-rank', T(cfg.label) || $t('rank.label'), systems.map(function (system) {
        return {
          active: system.key === state.rank,
          text: T(system.label),
          attrs: { 'data-rank': system.key },
          onClick: function () { setRank(system.key); }
        };
      }));
    }

    function refillPublications(selector) {
      if (!(state.pubBody && state.pubSection)) return;
      fillPublications(state.pubBody, state.pubSection);
      if (!selector) return;
      var again = state.pubBody.querySelector(selector);
      if (again) again.focus({ preventScroll: true });
    }

    function setCcf(use) {
      use = !!use;
      if (state.ccf === use) return;
      state.ccf = use;
      store('ccf', use ? '1' : '0');

      var focused = document.activeElement && document.activeElement.matches
        && document.activeElement.matches('.ccf-select select');
      refillPublications(focused ? '.ccf-select select' : null);
    }

    function setRank(key) {
      if (state.rank === key) return;
      state.rank = key;
      store('rank', key);

      var focused = document.activeElement && document.activeElement.dataset
        ? document.activeElement.dataset.rank
        : null;
      refillPublications(focused ? '.seg-option[data-rank="' + focused + '"]' : null);
    }

    function pubList(section, items) {
      var list = el('ol', { class: 'pubs' });

      sortItems(section, items).forEach(function (item) {
        var entry = el('li', { 'data-reading-key': 'pub:' + item.title });
        entry.appendChild(el('p', { class: 'pub-title', text: item.title }));
        entry.appendChild(el('p', { class: 'pub-authors', html: renderAuthors(section, item) }));
        var venue = el('p', { class: 'pub-venue' });
        venue.appendChild(el('span', { class: 'pub-venue-text', text: item.venue }));
        var lookups = el('span', { class: 'pub-lookups' });
        [
          { key: 'scholar', url: 'https://scholar.google.com/scholar?q=' },
          { key: 'dblp', url: 'https://dblp.org/search?q=' }
        ].forEach(function (provider) {
          var lookup = el('a', {
            href: provider.url + encodeURIComponent(item.title || ''),
            target: '_blank', rel: 'noopener noreferrer',
            'aria-label': $t('pub.lookup', { title: item.title, provider: $t('pub.' + provider.key) })
          });
          lookup.appendChild(el('span', { class: provider.key === 'scholar' ? 'lookup-full' : '', text: $t('pub.' + provider.key) + ' ↗' }));
          if (provider.key === 'scholar') lookup.appendChild(el('span', { class: 'lookup-short', 'aria-hidden': 'true', text: 'Scholar ↗' }));
          lookups.appendChild(lookup);
        });
        venue.appendChild(lookups);
        entry.appendChild(venue);
        list.appendChild(entry);
      });

      return list;
    }

    function renderPublications(section) {
      var body = bodyWrap();
      state.pubBody = body;
      state.pubSection = section;
      fillPublications(body, section);
      return body;
    }

    function resolveCcf(section) {
      if (state.ccf === true || state.ccf === false) return;
      var cfg = section.rank && section.rank.ccf;
      state.ccf = !(cfg && cfg.default === false);
    }

    function resolveRank(section) {
      var cfg = section.rank || {};
      var systems = cfg.systems || [];
      if (!systems.length) return;

      var keys = systems.map(function (system) { return system.key; });
      if (keys.indexOf(state.rank) !== -1) return;

      state.rank = keys.indexOf(cfg.default) === -1 ? keys[0] : cfg.default;
    }

    function fillPublications(body, section) {
      body.innerHTML = '';

      resolveRank(section);
      resolveCcf(section);

      var buckets = publicationBuckets(section);

      var bar = el('div', { class: 'pub-bar' });
      var note = el('p', { class: 'note', html: T(section.note) });

      var counts = noteCounts(section, buckets);
      if (counts) note.appendChild(el('span', { class: 'note-count', text: counts }));

      var rankName = rankSystemLabel(section);
      if (rankName) {
        var ccfMark = state.ccf ? ' · CCF' : '';
        note.appendChild(el('span', {
          class: 'note-rank print-only',
          text: $t('rank.print', { name: rankName + ccfMark })
        }));
      }

      bar.appendChild(note);

      var switches = el('div', { class: 'pub-switches' });
      switches.appendChild(buildCcfSelect(section));
      var switcher = buildRankSwitch(section);
      if (switcher) switches.appendChild(switcher);
      bar.appendChild(switches);

      body.appendChild(bar);
      body.appendChild(el('p', {
        class: 'pub-result-count', role: 'status', 'aria-live': 'polite', 'aria-atomic': 'true',
        text: $t('pub.results', { n: buckets[1].length + buckets[2].length })
      }));
      var results = el('div', { class: 'pub-results' });
      body.appendChild(results);
      bucketKeys(buckets).forEach(function (bucket) {
        if (!buckets[bucket].length) return;
        var heading = el('h3', { class: 'group' });
        heading.appendChild(document.createTextNode(bucketLabel(section, bucket)));
        heading.appendChild(el('span', { class: 'group-count', text: ' · ' + buckets[bucket].length }));
        results.appendChild(heading);
        results.appendChild(pubList(section, buckets[bucket]));
      });
      return body;
    }

    function publicationBuckets(section) {
      var buckets = { 1: [], 2: [] };
      (section.items || []).forEach(function (item) {
        var bucket = itemBucket(item);
        if (bucket) buckets[bucket].push(item);
      });
      return buckets;
    }

    function renderService(section) {
      var body = bodyWrap();
      var cols = el('div', { class: 'service-cols' });

      (section.columns || []).forEach(function (column) {
        var wrap = el('div');
        wrap.appendChild(el('h3', { text: T(column.title) }));

        var list = el('ul');
        (column.items || []).forEach(function (item) {
          list.appendChild(el('li', { text: T(item) }));
        });

        wrap.appendChild(list);
        cols.appendChild(wrap);
      });

      body.appendChild(cols);
      return body;
    }

    var RENDERERS = {
      interests: renderInterests,
      timeline: renderTimeline,
      projects: renderProjects,
      publications: renderPublications,
      service: renderService
    };

    function renderContent() {
      contentEl.innerHTML = '';
      contentEl.appendChild(el('p', { class: 'lede', text: T(state.data.intro) }));

      (state.data.sections || []).forEach(function (section) {
        var node = el('section', { class: 'section', id: section.id });
        node.appendChild(el('h2', { text: T(section.title) }));

        var renderer = RENDERERS[section.type];
        if (renderer) node.appendChild(renderer(section));

        contentEl.appendChild(node);
      });
    }

    function updatedLine() {
      var raw = state.data.site && state.data.site.updatedAt;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(raw || '')) return '';
      var parts = raw.split('-').map(Number);
      var year = parts[0];
      var month = parts[1] - 1;
      var day = parts[2];
      var check = new Date(Date.UTC(year, month, day));
      if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month || check.getUTCDate() !== day) return '';
      var date = state.lang === 'zh'
        ? year + ' 年 ' + (month + 1) + ' 月 ' + day + ' 日'
        : ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][month] + ' ' + day + ', ' + year;
      return $t('footer.updated', { date: date });
    }

    function renderFooter() {
      var year = String(new Date().getFullYear());
      if (copyrightEl) copyrightEl.textContent = '© ' + year + ' HomePage · CV';
      if (updatedEl) {
        updatedEl.textContent = updatedLine();
        updatedEl.hidden = !updatedEl.textContent;
      }
    }

    function applyHead() {
      var profile = state.data.profile || {};
      var name = profile.name || {};
      var en = typeof name === 'string' ? name : (name.en || '');
      var zh = typeof name === 'string' ? '' : (name.zh || '');
      var configured = state.data.site && state.data.site.title;
      var title = typeof configured === 'string' ? configured.trim() : '';
      if (title) document.title = title;

      var description = document.querySelector('meta[name="description"]');
      if (description && state.data.intro) {
        description.setAttribute('content', T(state.data.intro));
      }

      var author = document.querySelector('meta[name="author"]');
      if (author && (en || zh)) author.setAttribute('content', en || zh);
      ['og:title', 'twitter:title'].forEach(function (key) {
        var meta = document.querySelector('meta[property="' + key + '"], meta[name="' + key + '"]');
        if (meta) meta.setAttribute('content', document.title);
      });
      ['og:description', 'twitter:description'].forEach(function (key) {
        var meta = document.querySelector('meta[property="' + key + '"], meta[name="' + key + '"]');
        if (meta) meta.setAttribute('content', T(state.data.intro));
      });
    }

    function render() {
      if (!state.data) return;
      applyHead();
      renderSidebar();
      renderContent();
      renderFooter();
      updateActive();
    }

    function tickClock() {
      var nodes = document.querySelectorAll('.local-time');
      if (!nodes.length) return;

      var meta = state.data && state.data.profile.meta;
      if (!meta) return;

      var hhmm;
      try {
        hhmm = new Intl.DateTimeFormat('en-GB', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
          timeZone: meta.timezone
        }).format(new Date());
      } catch (e) {
        hhmm = new Date().toTimeString().slice(0, 5);
      }

      Array.prototype.forEach.call(nodes, function (node) {
        node.textContent = meta.location + ' ' + hhmm;
      });
    }

    window.setInterval(tickClock, 30000);

    function updateActive() {
      if (backToTop) backToTop.hidden = window.scrollY < 500;
      var links = Array.prototype.slice.call(navEl.querySelectorAll('a'));
      var sections = links
        .map(function (link) { return document.getElementById(link.getAttribute('href').slice(1)); })
        .filter(Boolean);

      if (!sections.length) return;

      if (window.scrollY < 90) {
        links.forEach(function (link) { link.classList.remove('active'); link.removeAttribute('aria-current'); });
        return;
      }

      var current = sections[0];
      var threshold = topbar.getBoundingClientRect().height + 32;
      sections.forEach(function (section) {
        if (section.getBoundingClientRect().top <= threshold) current = section;
      });

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 8) {
        current = sections[sections.length - 1];
      }

      links.forEach(function (link) {
        var active = link.getAttribute('href') === '#' + current.id;
        var changed = active && !link.classList.contains('active');
        link.classList.toggle('active', active);
        if (changed && navEl.scrollWidth > navEl.clientWidth) {
          var navRect = navEl.getBoundingClientRect();
          var linkRect = link.getBoundingClientRect();
          if (linkRect.left < navRect.left || linkRect.right > navRect.right) {
            navEl.scrollTo({ left: navEl.scrollLeft + linkRect.left - navRect.left - (navRect.width - linkRect.width) / 2, behavior: 'instant' });
          }
        }
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        updateActive();
        ticking = false;
      });
    }, { passive: true });

    var quipEl = document.getElementById('quip');
    var quipText = '';
    var DEFAULT_QUIP = 'https://v1.hitokoto.cn/?c=d&c=i&c=k&min_length=12&max_length=16&encode=json';

    function paintQuip() {
      if (!quipEl) return;
      var show = !!quipText && state.lang === 'zh';
      quipEl.hidden = !show;
      quipEl.textContent = show ? quipText : '';
    }

    function loadQuip() {
      var quip = state.data && state.data.site && state.data.site.quip;
      if (quip === false || quip === '' || !quipEl || !window.fetch) return;

      var url = typeof quip === 'string' ? quip : DEFAULT_QUIP;

      fetch(url, { cache: 'no-store' })
        .then(function (response) {
          return response.ok ? response.json() : null;
        })
        .then(function (data) {
          if (!data || !data.hitokoto) return;
          quipText = '「' + data.hitokoto + '」';
          paintQuip();
        })
        .catch(function () {});
    }

    function loadJSON(path) {
      var files = window.HOMEPAGE && window.HOMEPAGE.files;
      if (!files || !Object.prototype.hasOwnProperty.call(files, path)) {
        return Promise.reject(new Error(path + ' 未加载'));
      }
      return Promise.resolve(files[path]);
    }

    function loadSite() {
      return loadJSON('data/site.js').then(function (site) {
        var sectionLoads = (site.sections || []).map(function (section) {
          return loadJSON(section.file).then(function (content) {
            return Object.assign({}, section, content);
          });
        });

        return Promise.all([loadJSON(site.profile), Promise.all(sectionLoads)])
          .then(function (results) {
            site.profile = results[0];
            site.sections = results[1];
            return site;
          });
      });
    }

    var savedRank = read('rank');
    if (savedRank) state.rank = savedRank;

    var savedCcf = read('ccf');
    if (savedCcf === '0') state.ccf = false;
    else if (savedCcf === '1') state.ccf = true;

    var savedLang = read('lang');
    var initialLang = savedLang === 'en' || savedLang === 'zh' ? savedLang : 'zh';
    setLang(initialLang, false);

    loadSite()
      .then(function (data) {
        state.data = data;
        var fallback = data.site && data.site.defaultLang;
        if (!savedLang && (fallback === 'zh' || fallback === 'en') && fallback !== state.lang) {
          setLang(fallback);
        } else {
          render();
        }
        loadQuip();
      })
      .catch(function (error) {
        if (errorEl) errorEl.hidden = false;
        if (window.console) window.console.error('Failed to load site data', error);
      });
  });
})();
