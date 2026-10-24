(function () {
  "use strict";

  var form;
  var element;
  var layer;

  var PATHS = {
    site: "data/site.js",
    profile: "data/profile.js",
    research: "data/research.js",
    experience: "data/experience.js",
    projects: "data/projects.js",
    publications: "data/publications.js",
    service: "data/service.js"
  };

  var ORDER = ["site", "profile", "research", "experience", "projects", "publications", "service"];

  var STEPS = [
    { files: ["site"] },
    { files: ["profile"] },
    { files: ["research"] },
    { files: ["experience"] },
    { files: ["projects"] },
    { files: ["publications"] },
    { files: ["service"] }
  ];

  var stepIndex = 0;
  var state = {};
  var meta = { missing: {}, bad: {}, dataDir: null };

  var TEMPLATES = {
    site: {
      site: {
        title: "",
        defaultLang: "zh",
        quip: true
      },
      profile: "data/profile.js",
      intro: { zh: "", en: "" },
      sections: [
        { id: "research", type: "interests", file: "data/research.js" },
        { id: "experience", type: "timeline", file: "data/experience.js" },
        { id: "projects", type: "projects", file: "data/projects.js" },
        { id: "publications", type: "publications", file: "data/publications.js" },
        { id: "service", type: "service", file: "data/service.js" }
      ]
    },
    profile: {
      name: { zh: "", en: "" },
      org: { zh: "", en: "" },
      title: { zh: "", en: "" },
      photo: "assets/photo.jpg",
      metrics: [],
      contacts: [],
      collaboration: {
        title: { zh: "", en: "" },
        text: { zh: "", en: "" },
        email: ""
      },
      meta: { location: "", timezone: "Asia/Shanghai" }
    },
    research: { title: { zh: "研究兴趣", en: "Research Interests" }, items: [] },
    experience: { title: { zh: "教育与工作经历", en: "Education & Experience" }, items: [] },
    projects: { title: { zh: "科研项目", en: "Research Projects" }, items: [] },
    publications: {
      title: { zh: "代表性成果", en: "Selected Publications" },
      note: { zh: "", en: "" },
      rank: {
        label: { zh: "分区体系", en: "Ranking system" },
        default: "jcr",
        systems: [
          { key: "cas", label: { zh: "中科院", en: "CAS" } },
          { key: "jcr", label: { zh: "JCR", en: "JCR" } },
          { key: "xr", label: { zh: "新锐", en: "XR" } }
        ],
        ccf: {
          label: { zh: "是否使用 CCF", en: "Use CCF" },
          default: true,
          options: [
            { use: true, label: { zh: "使用 CCF", en: "Use CCF" } },
            { use: false, label: { zh: "不使用 CCF", en: "Don't use CCF" } }
          ]
        },
        buckets: [
          { id: 1, label: { zh: "CCF-A / 一区", en: "CCF-A / Q1" } },
          { id: 2, label: { zh: "CCF-B / 二区", en: "CCF-B / Q2" } }
        ],
        zones: [
          { id: 1, label: { zh: "一区", en: "Q1" } },
          { id: 2, label: { zh: "二区", en: "Q2" } }
        ]
      },
      self: [],
      items: []
    },
    service: { title: { zh: "学术服务与荣誉", en: "Service & Awards" }, columns: [] }
  };

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function el(tag, attrs) {
    var node = document.createElement(tag);
    if (!attrs) return node;
    Object.keys(attrs).forEach(function (key) {
      var value = attrs[key];
      if (key === "text") node.textContent = value;
      else if (key === "html") node.innerHTML = value;
      else node.setAttribute(key, value);
    });
    return node;
  }

  function partKey(part) {
    return /^\d+$/.test(part) ? Number(part) : part;
  }

  function getPath(root, path) {
    var cur = root;
    var parts = path.split(".");
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return "";
      cur = cur[partKey(parts[i])];
    }
    return cur == null ? "" : cur;
  }

  function setPath(root, path, value) {
    var parts = path.split(".");
    var cur = root;
    for (var i = 0; i < parts.length - 1; i++) {
      var key = partKey(parts[i]);
      var next = partKey(parts[i + 1]);
      if (cur[key] == null) cur[key] = typeof next === "number" ? [] : {};
      cur = cur[key];
    }
    cur[partKey(parts[parts.length - 1])] = value;
  }

  function textOf(value) {
    if (value == null) return "";
    if (typeof value === "string" || typeof value === "number") return String(value);
    return "";
  }

  function field(label) {
    var item = el("div", { class: "layui-form-item field" });
    item.appendChild(el("label", { class: "layui-form-label", text: label || "" }));
    return item;
  }

  function control(area, bind, placeholder, value) {
    var node = el(area ? "textarea" : "input", {
      class: area ? "layui-textarea" : "layui-input",
      "data-bind": bind,
      placeholder: placeholder || "",
      autocomplete: "off"
    });
    if (!area) node.type = "text";
    if (area) node.rows = 3;
    node.value = textOf(value);
    return node;
  }

  function bi(label, path, area) {
    var block = field(label);
    block.classList.add("bi");
    var pair = el("div", { class: "bi-pair" });

    function column(cap, lang) {
      var col = el("div", { class: "bi-col" });
      col.appendChild(el("span", { class: "bi-cap", text: cap }));
      col.appendChild(control(area, path + "." + lang, "", getPath(state, path + "." + lang)));
      return col;
    }

    pair.appendChild(column("中文", "zh"));
    pair.appendChild(column("English", "en"));
    pair.appendChild(el("button", {
      type: "button",
      class: "layui-btn layui-btn-primary bi-translate",
      html: '<i class="layui-icon layui-icon-transfer"></i> 生成英文',
      "data-action": "translate",
      "data-zh": path + ".zh",
      "data-en": path + ".en"
    }));
    block.appendChild(pair);
    return block;
  }

  function plain(label, path, placeholder) {
    var block = field(label);
    block.appendChild(control(false, path, placeholder || "", getPath(state, path)));
    return block;
  }

  function tools(list, index) {
    var bar = el("div", { class: "card-tools" });
    function btn(cls, icon, text, action) {
      bar.appendChild(el("button", {
        type: "button",
        class: "layui-btn " + cls + " layui-btn-xs",
        html: '<i class="layui-icon ' + icon + '"></i> ' + text,
        "data-action": action,
        "data-list": list,
        "data-index": String(index)
      }));
    }
    var timed = list === "experience.items" || list === "projects.items";
    if (!timed) {
      btn("layui-btn-primary", "layui-icon-up", "上移", "up");
      btn("layui-btn-primary", "layui-icon-down", "下移", "down");
    }
    btn("layui-btn-danger", "layui-icon-delete", "删除", "remove");
    return bar;
  }

  function addButton(text, list) {
    var bar = el("div", { class: "list-bar" });
    bar.appendChild(el("button", {
      type: "button",
      class: "layui-btn layui-btn-primary layui-btn-sm layui-btn-fluid",
      html: '<i class="layui-icon layui-icon-addition"></i> ' + text,
      "data-action": "add",
      "data-list": list
    }));
    return bar;
  }

  function listRoot(list) {
    return el("div", { "data-list-root": list });
  }

  function hint(text) {
    return el("p", { class: "layui-word-aux hint", text: text });
  }

  function advisorBlank(advisor) {
    if (!advisor) return true;
    function empty(value) {
      if (value == null) return true;
      if (typeof value === "string") return !String(value).trim();
      return !String(value.zh || "").trim() && !String(value.en || "").trim();
    }
    return empty(advisor.label) && empty(advisor.name) && empty(advisor.url);
  }

  function groupTitle(text) {
    var box = el("fieldset", { class: "layui-elem-field layui-field-title" });
    box.appendChild(el("legend", { text: text }));
    return box;
  }

  function cardBody(attrs, className) {
    var wrap = el("div", { class: "layui-card" + (className ? " " + className : "") });
    Object.keys(attrs || {}).forEach(function (key) {
      wrap.setAttribute(key, attrs[key]);
    });
    return wrap;
  }

  function toast(text) {
    layer.msg(text);
  }

  function saved(detail) {
    layer.msg(detail ? "保存成功。" + detail : "保存成功", { icon: 1, time: 2200 });
  }

  function openSaveMask() {
    return layer.load(1, { shade: [0.15, "#000"] });
  }

  function closeSaveMask(id) {
    if (id) layer.close(id);
  }

  function ensurePair(obj, key) {
    if (!obj[key] || typeof obj[key] !== "object") obj[key] = { zh: "", en: "" };
  }

  function blankFor(list) {
    if (list === "publications.items") {
      return { title: "", authors: "", venue: "" };
    }
    if (list.indexOf("service.columns.") === 0 && list.slice(-6) === ".items") {
      return { zh: "", en: "" };
    }
    var blanks = {
      "profile.metrics": { value: "", label: { zh: "", en: "" } },
      "profile.contacts": { icon: "github", label: "", href: "https://", external: true },
      "research.items": { term: { zh: "", en: "" }, desc: { zh: "", en: "" } },
      "experience.items": {
        date: "",
        org: { zh: "", en: "" },
        duty: { zh: "", en: "" },
        advisor: { label: { zh: "", en: "" }, name: { zh: "", en: "" }, url: "" }
      },
      "projects.items": {
        date: "",
        title: { zh: "", en: "" },
        funder: { zh: "", en: "" },
        amount: { zh: "", en: "" },
        role: "lead"
      },
      "service.columns": { title: { zh: "", en: "" }, items: [] }
    };
    return clone(blanks[list]);
  }

  function renderInto(file) {
    var body = document.querySelector('[data-body="' + file + '"]');
    if (!body) return;
    body.innerHTML = "";
    if (meta.bad[file]) {
      body.appendChild(hint(meta.bad[file] + "。这一块不会被保存，以免覆盖原文件。"));
      return;
    }
    if (meta.missing[file]) body.appendChild(hint("还没有这个文件。保存后会新建 " + PATHS[file] + "。"));
    var renderer = RENDERERS[file];
    if (renderer) body.appendChild(renderer());
    form.render();
  }

  function renderAll() {
    ORDER.forEach(renderInto);
  }

  function renderSite() {
    var root = document.createDocumentFragment();
    var site = state.site;
    site.site = site.site || {};
    ensurePair(site, "intro");
    if (typeof site.site.title !== "string") site.site.title = "";

    root.appendChild(plain("页面标题", "site.site.title", "Guang Yang · 杨光"));

    var lang = field("默认语言");
    var langSelect = el("select", { "data-bind": "site.site.defaultLang", "lay-filter": "field" });
    [["zh", "中文"], ["en", "English"]].forEach(function (pair) {
      var option = el("option", { value: pair[0], text: pair[1] });
      if ((site.site.defaultLang || "zh") === pair[0]) option.selected = true;
      langSelect.appendChild(option);
    });
    lang.appendChild(langSelect);
    root.appendChild(lang);

    if (typeof site.site.quip === "string") site.site.quip = true;
    var quip = field("顶栏短句");
    var quipSelect = el("select", { "data-kind": "quip-mode", "lay-filter": "field" });
    [["on", "开启"], ["off", "关闭"]].forEach(function (pair) {
      var option = el("option", { value: pair[0], text: pair[1] });
      if ((site.site.quip === false ? "off" : "on") === pair[0]) option.selected = true;
      quipSelect.appendChild(option);
    });
    quip.appendChild(quipSelect);
    root.appendChild(quip);

    root.appendChild(bi("开头简介", "site.intro", true));
    return root;
  }

  function renderProfile() {
    var root = document.createDocumentFragment();
    var profile = state.profile;
    ensurePair(profile, "name");
    ensurePair(profile, "org");
    ensurePair(profile, "title");
    profile.metrics = profile.metrics || [];
    profile.contacts = profile.contacts || [];
    profile.collaboration = profile.collaboration || {};
    ensurePair(profile.collaboration, "title");
    ensurePair(profile.collaboration, "text");
    if (!profile.collaboration.email) profile.collaboration.email = "";
    profile.meta = profile.meta || { location: "", timezone: "Asia/Shanghai" };

    root.appendChild(bi("姓名", "profile.name"));
    root.appendChild(bi("单位", "profile.org"));
    root.appendChild(bi("职位", "profile.title"));
    root.appendChild(emailField());
    root.appendChild(plain("头像路径", "profile.photo", "assets/photo.jpg"));
    root.appendChild(hint("图片放在 assets/ 下，这里写相对站点根目录的路径。"));

    root.appendChild(groupTitle("指标"));
    var metrics = listRoot("profile.metrics");
    metrics.className = "pair-list";
    profile.metrics.forEach(function (item, index) {
      ensurePair(item, "label");
      metrics.appendChild(pairRow(
        lockedPair(item.label),
        control(false, "profile.metrics." + index + ".value", "50+", item.value)
      ));
    });
    root.appendChild(metrics);

    root.appendChild(groupTitle("链接"));
    var contacts = listRoot("profile.contacts");
    contacts.className = "pair-list";
    profile.contacts.forEach(function (item, index) {
      contacts.appendChild(pairRow(
        lockedPair(item.label),
        control(false, "profile.contacts." + index + ".href", "https://", item.href)
      ));
    });
    root.appendChild(contacts);

    root.appendChild(groupTitle("合作卡片"));
    root.appendChild(bi("标题", "profile.collaboration.title"));
    root.appendChild(bi("说明", "profile.collaboration.text", true));

    root.appendChild(plain("所在城市", "profile.meta.location", "Hangzhou"));
    root.appendChild(timezoneField());
    return root;
  }

  function emailField() {
    var block = field("邮箱");
    var input = control(
      false,
      "profile.collaboration.email",
      "name@example.com",
      getPath(state, "profile.collaboration.email")
    );
    input.setAttribute("lay-verify", "email");
    input.setAttribute("lay-vertype", "tips");
    input.addEventListener("blur", function () {
      if (form && form.validate) form.validate(input);
    });
    block.appendChild(input);
    return block;
  }

  function timezoneField() {
    var block = field("时区");
    var current = getPath(state, "profile.meta.timezone") || "Asia/Shanghai";
    var zones = [
      "Asia/Shanghai", "Asia/Urumqi", "Asia/Hong_Kong", "Asia/Taipei", "Asia/Macau",
      "Asia/Singapore", "Asia/Tokyo", "Asia/Seoul", "Asia/Bangkok", "Asia/Dubai",
      "Asia/Kolkata", "Europe/London", "Europe/Paris", "Europe/Berlin",
      "America/New_York", "America/Chicago", "America/Los_Angeles", "America/Toronto",
      "Australia/Sydney", "Pacific/Auckland", "UTC"
    ];
    if (zones.indexOf(current) < 0) zones.unshift(current);
    var select = el("select", {
      "data-bind": "profile.meta.timezone",
      "lay-filter": "field",
      "lay-search": ""
    });
    zones.forEach(function (zone) {
      var option = el("option", { value: zone, text: zone });
      if (zone === current) option.selected = true;
      select.appendChild(option);
    });
    block.appendChild(select);
    return block;
  }

  function pairRow(label, input) {
    var row = el("div", { class: "pair-row" });
    row.appendChild(label);
    row.appendChild(input);
    return row;
  }

  function lockedPair(value) {
    var line = el("p", { class: "locked" });
    var zh = value && typeof value === "object" ? textOf(value.zh) : textOf(value);
    var en = value && typeof value === "object" ? textOf(value.en) : "";
    line.appendChild(el("span", { text: zh }));
    if (en && en !== zh) line.appendChild(el("span", { class: "locked-en", text: en }));
    return line;
  }

  function renderResearch() {
    var root = document.createDocumentFragment();
    ensurePair(state.research, "title");
    state.research.items = state.research.items || [];
    var list = listRoot("research.items");
    state.research.items.forEach(function (item, index) {
      ensurePair(item, "term");
      ensurePair(item, "desc");
      var card = cardBody();
      card.appendChild(bi("条目", "research.items." + index + ".term"));
      card.appendChild(bi("说明", "research.items." + index + ".desc", true));
      card.appendChild(tools("research.items", index));
      list.appendChild(card);
    });
    list.appendChild(addButton("新增条目", "research.items"));
    root.appendChild(list);
    return root;
  }

  function timeValue(text, part) {
    var raw = String(text || "").trim();
    if (!raw) return null;
    var piece = raw.split(/\s*[–—-]\s*/)[part || 0] || "";
    var match = piece.match(/(\d{4})\D*(\d{1,2})?/);
    if (!match) return null;
    return Number(match[1]) * 100 + (match[2] ? Number(match[2]) : 0);
  }

  function sortByTime(items) {
    if (!items || !items.sort) return items;
    items.sort(function (a, b) {
      var startA = timeValue(a.date, 0);
      var startB = timeValue(b.date, 0);
      if (startA == null && startB == null) return 0;
      if (startA == null) return 1;
      if (startB == null) return -1;
      if (startA !== startB) return startB - startA;
      var endA = timeValue(a.date, 1);
      var endB = timeValue(b.date, 1);
      if (endA == null && endB == null) return 0;
      if (endA == null) return 1;
      if (endB == null) return -1;
      return endB - endA;
    });
    return items;
  }

  function renderExperience() {
    var root = document.createDocumentFragment();
    ensurePair(state.experience, "title");
    state.experience.items = sortByTime(state.experience.items || []);
    var list = listRoot("experience.items");
    state.experience.items.forEach(function (item, index) {
      ensurePair(item, "org");
      ensurePair(item, "duty");
      item.advisor = item.advisor || {};
      ensurePair(item.advisor, "label");
      ensurePair(item.advisor, "name");
      if (typeof item.advisor.url !== "string") item.advisor.url = "";
      var base = "experience.items." + index;
      var card = cardBody();
      card.appendChild(plain("时间", base + ".date", "2022.09 – 2025.10"));
      card.appendChild(bi("单位", base + ".org"));
      card.appendChild(bi("职位", base + ".duty"));
      card.appendChild(bi("导师称谓", base + ".advisor.label"));
      card.appendChild(bi("导师姓名", base + ".advisor.name"));
      card.appendChild(plain("导师主页", base + ".advisor.url", "https://"));
      var note = hint("称谓、姓名和主页都留空时，主页不显示导师。");
      note.classList.add("advisor-hint");
      note.hidden = !advisorBlank(item.advisor);
      card.appendChild(note);
      card.appendChild(tools("experience.items", index));
      list.appendChild(card);
    });
    list.appendChild(addButton("新增经历", "experience.items"));
    root.appendChild(list);
    return root;
  }

  function renderProjects() {
    var root = document.createDocumentFragment();
    ensurePair(state.projects, "title");
    state.projects.items = sortByTime(state.projects.items || []);
    var list = listRoot("projects.items");
    state.projects.items.forEach(function (item, index) {
      ensurePair(item, "title");
      ensurePair(item, "funder");
      ensurePair(item, "amount");
      if (item.role !== "lead" && item.role !== "join") item.role = "lead";
      var base = "projects.items." + index;
      var card = cardBody();
      card.appendChild(plain("时间", base + ".date", "2025.12 – 2027.11"));
      card.appendChild(bi("题目", base + ".title", true));
      card.appendChild(bi("资助", base + ".funder"));
      card.appendChild(bi("金额", base + ".amount"));
      card.appendChild(roleField(base + ".role", item.role));
      card.appendChild(tools("projects.items", index));
      list.appendChild(card);
    });
    list.appendChild(addButton("新增项目", "projects.items"));
    root.appendChild(list);
    return root;
  }

  function roleField(bind, current) {
    var block = field("主持 / 参与");
    var group = el("div", { class: "role-radios" });
    [["lead", "主持"], ["join", "参与"]].forEach(function (pair) {
      var input = el("input", {
        type: "radio",
        name: bind,
        value: pair[0],
        title: pair[1],
        "lay-filter": "field",
        "data-bind": bind
      });
      if ((current || "lead") === pair[0]) input.checked = true;
      group.appendChild(input);
    });
    block.appendChild(group);
    return block;
  }

  function rankObject(item) {
    var rank = item.rank;
    var obj = { cas: null, jcr: null, xr: null };
    if (typeof rank === "number") obj.cas = obj.jcr = obj.xr = rank;
    else if (rank && typeof rank === "object") {
      ["cas", "jcr", "xr"].forEach(function (key) {
        if (rank[key] == null || rank[key] === "") return;
        var zone = Number(rank[key]);
        if (zone === 1 || zone === 2) obj[key] = zone;
      });
    }
    return obj;
  }

  function setItemRank(item, key, raw) {
    var obj = rankObject(item);
    obj[key] = raw === "" ? null : Number(raw);
    var keys = ["cas", "jcr", "xr"].filter(function (name) { return obj[name] != null && !isNaN(obj[name]); });
    if (!keys.length) {
      delete item.rank;
      return;
    }
    if (keys.length === 3 && obj.cas === obj.jcr && obj.jcr === obj.xr) {
      item.rank = obj.cas;
      return;
    }
    var out = {};
    keys.forEach(function (name) { out[name] = obj[name]; });
    item.rank = out;
  }

  function rankChoice(item, key) {
    if (key === "ccf") return item.ccf === 1 || item.ccf === 2 ? String(item.ccf) : "0";
    var value = rankObject(item)[key];
    return value === 1 || value === 2 ? String(value) : "0";
  }

  function rankPick(item, base, key, label, choices) {
    var row = el("div", { class: "rank-pick" });
    row.appendChild(el("span", { class: "rank-pick-label", text: label }));
    var radios = el("div", { class: "role-radios" });
    var current = rankChoice(item, key);
    choices.forEach(function (pair) {
      var input = el("input", {
        type: "radio",
        name: base + "." + key,
        value: pair[0],
        title: pair[1],
        "lay-filter": "field",
        "data-kind": "rank",
        "data-rank": key,
        "data-bind": base
      });
      if (current === pair[0]) input.checked = true;
      radios.appendChild(input);
    });
    row.appendChild(radios);
    return row;
  }

  function ensurePublications(pub) {
    ensurePair(pub, "title");
    ensurePair(pub, "note");
    pub.rank = pub.rank || clone(TEMPLATES.publications.rank);
    if (!Array.isArray(pub.self)) pub.self = pub.self ? [String(pub.self)] : [];
    pub.items = Array.isArray(pub.items) ? pub.items : [];
  }

  function renderPublications() {
    var root = document.createDocumentFragment();
    var pub = state.publications;
    ensurePublications(pub);

    var self = field("本人姓名");
    var selfInput = el("input", {
      type: "text",
      class: "layui-input",
      "data-kind": "self",
      placeholder: "Yang G, 杨光",
      autocomplete: "off"
    });
    selfInput.value = pub.self.join(", ");
    self.appendChild(selfInput);
    root.appendChild(self);
    root.appendChild(hint("作者栏里会出现的写法，用逗号分隔。姓名后加 * 会显示成通讯作者。"));

    var papers = listRoot("publications.items");
    pub.items.forEach(function (item, index) {
      papers.appendChild(paperCard(item, "publications.items", index));
    });
    papers.appendChild(addButton("新增论文", "publications.items"));
    root.appendChild(papers);
    return root;
  }

  function paperCard(item, list, index) {
    var base = list + "." + index;
    var card = cardBody(null, "paper");
    card.appendChild(plain("标题", base + ".title"));
    card.appendChild(plain("作者", base + ".authors", "Yang G, Zhou Y, et al."));
    card.appendChild(plain("出处", base + ".venue"));
    var zones = [["1", "一区"], ["2", "二区"], ["0", "其他"]];
    var ranks = el("div", { class: "rank-picks" });
    ranks.appendChild(rankPick(item, base, "cas", "中科院", zones));
    ranks.appendChild(rankPick(item, base, "jcr", "JCR", zones));
    ranks.appendChild(rankPick(item, base, "xr", "新锐", zones));
    ranks.appendChild(rankPick(item, base, "ccf", "CCF", [["1", "CCF-A"], ["2", "CCF-B"], ["0", "其他"]]));
    card.appendChild(ranks);
    card.appendChild(tools(list, index));
    return card;
  }

  function renderService() {
    var root = document.createDocumentFragment();
    ensurePair(state.service, "title");
    state.service.columns = state.service.columns || [];
    state.service.columns.forEach(function (column, index) {
      ensurePair(column, "title");
      column.items = column.items || [];
      var card = cardBody();
      card.appendChild(bi("列标题", "service.columns." + index + ".title"));
      var itemList = "service.columns." + index + ".items";
      var list = listRoot(itemList);
      column.items.forEach(function (item, itemIndex) {
        var row = cardBody();
        row.appendChild(bi("内容", itemList + "." + itemIndex));
        row.appendChild(tools(itemList, itemIndex));
        list.appendChild(row);
      });
      list.appendChild(addButton("新增内容", itemList));
      card.appendChild(list);
      card.appendChild(tools("service.columns", index));
      root.appendChild(card);
    });
    root.appendChild(addButton("新增一列", "service.columns"));
    return root;
  }

  var RENDERERS = {
    site: renderSite,
    profile: renderProfile,
    research: renderResearch,
    experience: renderExperience,
    projects: renderProjects,
    publications: renderPublications,
    service: renderService
  };

  function fileOf(list) {
    if (list.indexOf("publications.") === 0) return "publications";
    if (list.indexOf("service.") === 0) return "service";
    return list.split(".")[0];
  }

  function onEdit(event) {
    var input = event.target;
    if (!input || !input.getAttribute) return;
    var kind = input.getAttribute("data-kind");
    var bind = input.getAttribute("data-bind");

    if (kind === "quip-mode") {
      state.site.site.quip = input.value === "on";
      return;
    }
    if (kind === "self") {
      state.publications.self = input.value.split(/[,，]/).map(function (name) {
        return name.trim();
      }).filter(Boolean);
      return;
    }
    if (kind === "rank") {
      var raw = input.value.trim();
      var key = input.getAttribute("data-rank");
      var paper = getPath(state, bind);
      if (!paper) return;
      if (key === "ccf") {
        if (raw === "1" || raw === "2") paper.ccf = Number(raw);
        else delete paper.ccf;
        return;
      }
      setItemRank(paper, key, raw === "1" || raw === "2" ? raw : "");
      return;
    }
    if (bind) {
      setPath(state, bind, input.value);
      if (bind.indexOf(".advisor.") !== -1) refreshAdvisorHint(input);
      if (event.type === "change" && /\.date$/.test(bind)) {
        if (bind.indexOf("experience.items.") === 0) renderInto("experience");
        if (bind.indexOf("projects.items.") === 0) renderInto("projects");
      }
    }
  }

  function refreshAdvisorHint(input) {
    var card = input.closest ? input.closest(".layui-card") : null;
    var note = card && card.querySelector(".advisor-hint");
    if (!note) return;
    var bind = input.getAttribute("data-bind") || "";
    var base = bind.replace(/\.advisor\.(label\.(zh|en)|name\.(zh|en)|url)$/, "");
    note.hidden = !advisorBlank(getPath(state, base + ".advisor"));
  }

  function moveItem(list, index, dir) {
    var arr = getPath(state, list);
    var next = index + dir;
    if (!arr || next < 0 || next >= arr.length) return;
    var item = arr[index];
    arr[index] = arr[next];
    arr[next] = item;
    renderInto(fileOf(list));
  }

  function onClick(event) {
    var node = event.target;
    while (node && node !== document && !(node.getAttribute && node.getAttribute("data-action"))) {
      node = node.parentNode;
    }
    if (!node || !node.getAttribute) return;
    var action = node.getAttribute("data-action");
    if (action === "open-folder") {
      openFolder();
      return;
    }
    if (action === "save-all") {
      saveFiles(ORDER);
      return;
    }
    if (action === "save-step") {
      saveFiles(STEPS[stepIndex].files);
      return;
    }
    if (action === "prev-step") {
      gotoStep(stepIndex - 1);
      return;
    }
    if (action === "next-step") {
      gotoStep(stepIndex + 1);
      return;
    }
    if (action === "translate") {
      translate(node);
      return;
    }

    var list = node.getAttribute("data-list");
    var index = Number(node.getAttribute("data-index"));
    if (action === "add") {
      var arr = getPath(state, list);
      if (!arr || typeof arr.push !== "function") return;
      arr.push(blankFor(list));
      renderInto(fileOf(list));
      var root = document.querySelector('[data-list-root="' + list + '"]');
      var cards = root ? root.querySelectorAll(":scope > .layui-card") : [];
      var last = cards[cards.length - 1];
      var focus = last && last.querySelector("input, textarea");
      if (focus) focus.focus();
      return;
    }
    if (action === "remove") {
      getPath(state, list).splice(index, 1);
      renderInto(fileOf(list));
      return;
    }
    if (action === "up") moveItem(list, index, -1);
    if (action === "down") moveItem(list, index, 1);
  }

  function profileEmailOk() {
    var input = document.querySelector('[data-bind="profile.collaboration.email"]');
    if (!input || !form || !form.validate) return true;
    return form.validate(input) !== false;
  }

  function gotoStep(index) {
    index = Math.max(0, Math.min(STEPS.length - 1, index));
    if (index !== stepIndex && onProfileStep() && !profileEmailOk()) return;
    stepIndex = index;
    element.tabChange("steps", String(index));
    updateStep();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function onProfileStep() {
    var step = STEPS[stepIndex];
    return step && step.files.indexOf("profile") !== -1;
  }

  function updateStep() {
    var now = document.getElementById("step-now");
    if (now) now.textContent = String(stepIndex + 1);
    var total = document.getElementById("step-total");
    if (total) total.textContent = String(STEPS.length);

    var prev = document.querySelector('[data-action="prev-step"]');
    var next = document.querySelector('[data-action="next-step"]');
    if (prev) {
      prev.disabled = stepIndex === 0;
      prev.classList.toggle("layui-btn-disabled", stepIndex === 0);
    }
    if (next) {
      next.disabled = stepIndex === STEPS.length - 1;
      next.classList.toggle("layui-btn-disabled", stepIndex === STEPS.length - 1);
    }
  }

  var TRANSLATE_API = "https://api.translate.zvo.cn/translate.json";

  function requestTranslate(text) {
    var payload = encodeURIComponent(JSON.stringify([text]));
    return fetch(TRANSLATE_API, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: "from=chinese_simplified&to=english&text=" + payload
    }).then(function (response) {
      if (!response.ok) throw new Error("翻译接口返回 " + response.status);
      return response.json();
    }).then(function (body) {
      if (body.result !== 1) throw new Error(body.info || "翻译失败");
      var out = (body.text || [])[0] || "";
      if (!out) throw new Error("没有得到英文");
      return out.trim();
    });
  }

  function translate(button) {
    var zh = textOf(getPath(state, button.getAttribute("data-zh"))).trim();
    if (!zh) {
      toast("先填写中文");
      return;
    }
    var enPath = button.getAttribute("data-en");
    var current = textOf(getPath(state, enPath)).trim();

    if (current) {
      layer.confirm("英文已有内容，用生成结果替换？", { icon: 3, title: "提示" }, function (close) {
        layer.close(close);
        runTranslate(button, zh, enPath);
      });
      return;
    }
    runTranslate(button, zh, enPath);
  }

  function runTranslate(button, zh, enPath) {
    var old = button.innerHTML;
    button.disabled = true;
    button.innerHTML = '<i class="layui-icon layui-icon-loading layui-anim layui-anim-rotate layui-anim-loop"></i> 生成中';

    requestTranslate(zh).then(function (text) {
      setPath(state, enPath, text);
      var input = findBind(enPath);
      if (input) input.value = text;
      toast("已填入英文，可以再改");
    }).catch(function (error) {
      toast(error.message || "生成失败");
    }).then(function () {
      button.disabled = false;
      button.innerHTML = old;
    });
  }

  function findBind(path) {
    var nodes = document.querySelectorAll("[data-bind]");
    for (var i = 0; i < nodes.length; i++) {
      if (nodes[i].getAttribute("data-bind") === path) return nodes[i];
    }
    return null;
  }

  function readText(file) {
    if (file.text) return file.text();
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(String(reader.result || "")); };
      reader.onerror = function () { reject(reader.error); };
      reader.readAsText(file, "utf-8");
    });
  }

  function collectFiles(keys) {
    var files = {};
    keys.forEach(function (key) {
      if (meta.bad[key] || !state[key]) return;
      files[PATHS[key]] = state[key];
    });
    return files;
  }

  function parseDataFile(text) {
    var trimmed = String(text || "").replace(/^\uFEFF/, "").trim();
    if (!trimmed) throw new Error("empty");
    if (trimmed.charAt(0) === "{" || trimmed.charAt(0) === "[") return JSON.parse(trimmed);
    var at = trimmed.indexOf("HOMEPAGE.files[");
    var eq = at >= 0 ? trimmed.indexOf("=", at) : trimmed.lastIndexOf("=");
    if (eq < 0) throw new Error("parse");
    var body = trimmed.slice(eq + 1).trim();
    if (body.charAt(body.length - 1) === ";") body = body.slice(0, -1);
    return JSON.parse(body);
  }

  function fileSource(rel, data) {
    return "window.HOMEPAGE = window.HOMEPAGE || { files: {} };\n"
      + "window.HOMEPAGE.files[" + JSON.stringify(rel) + "] = "
      + JSON.stringify(data, null, 2) + ";\n";
  }

  function findSiteFile(dir) {
    return dir.getFileHandle("site.js").catch(function () {
      return dir.getFileHandle("site.json");
    });
  }

  function openNamed(dir, name) {
    return dir.getFileHandle(name).catch(function () {
      if (name.slice(-3) === ".js") return dir.getFileHandle(name.slice(0, -3) + ".json");
      throw new Error("missing");
    });
  }

  function locateDataDir(root) {
    return findSiteFile(root).then(function () {
      meta.dataDir = root;
    }).catch(function () {
      return root.getDirectoryHandle("data").then(function (dir) {
        return findSiteFile(dir).then(function () {
          meta.dataDir = dir;
        });
      });
    });
  }

  function readDataDir(dir) {
    return Promise.all(ORDER.map(function (key) {
      var name = PATHS[key].split("/").pop();
      return openNamed(dir, name).then(function (handle) {
        return handle.getFile().then(readText);
      }).then(function (text) {
        state[key] = parseDataFile(text);
        delete meta.missing[key];
        delete meta.bad[key];
      }).catch(function () {
        state[key] = clone(TEMPLATES[key]);
        meta.missing[key] = true;
        delete meta.bad[key];
      });
    })).then(function () {
      meta.fetchFailed = false;
      document.getElementById("banner").hidden = true;
      renderAll();
      toast("已从文件夹载入");
    });
  }

  function openFolder() {
    if (window.showDirectoryPicker && window.isSecureContext) {
      showDirectoryPicker({ mode: "readwrite", id: "homepage-cv" }).then(function (root) {
        return locateDataDir(root).then(function () {
          return readDataDir(meta.dataDir);
        });
      }).catch(function (error) {
        if (error && error.name === "AbortError") return;
        toast("这个目录里没有 data/site.js");
      });
      return;
    }
    document.getElementById("folder-input").click();
  }

  function readChosenFiles(fileList) {
    var byName = {};
    ORDER.forEach(function (key) {
      var base = PATHS[key].split("/").pop();
      byName[base] = key;
      byName[base.replace(/\.js$/, ".json")] = key;
    });
    var jobs = [];
    Array.prototype.forEach.call(fileList, function (file) {
      var key = byName[file.name];
      if (!key) return;
      jobs.push(readText(file).then(function (text) {
        state[key] = parseDataFile(text);
        delete meta.missing[key];
        delete meta.bad[key];
      }));
    });
    if (!jobs.length) {
      toast("没有找到 data 里的数据文件");
      return;
    }
    Promise.all(jobs).then(function () {
      meta.fetchFailed = false;
      document.getElementById("banner").hidden = true;
      renderAll();
      toast("已从文件夹载入");
    }).catch(function () {
      toast("有数据文件无法解析");
    });
  }

  function writeDataDir(files) {
    var names = Object.keys(files);
    return Promise.all(names.map(function (rel) {
      var name = rel.split("/").pop();
      return meta.dataDir.getFileHandle(name, { create: true }).then(function (handle) {
        return handle.createWritable().then(function (writable) {
          return writable.write(fileSource(rel, files[rel])).then(function () {
            return writable.close();
          });
        });
      });
    })).then(function () {
      names.forEach(function (rel) {
        ORDER.forEach(function (key) {
          if (PATHS[key] === rel) delete meta.missing[key];
        });
      });
    });
  }

  function saveFiles(keys) {
    if (keys.indexOf("profile") !== -1 && !profileEmailOk()) return;
    var files = collectFiles(keys);
    var names = Object.keys(files);
    if (!names.length) {
      toast("没有可保存的内容");
      return;
    }
    var mask = openSaveMask();
    setTimeout(function () { runSave(files, mask); }, 16);
  }

  function finishSave(mask, detail) {
    closeSaveMask(mask);
    saved(detail);
  }

  function runSave(files, mask) {
    if (meta.dataDir) {
      writeDataDir(files).then(function () {
        finishSave(mask);
      }).catch(function () {
        closeSaveMask(mask);
        toast("写入失败");
      });
      return;
    }
    if (window.showDirectoryPicker && window.isSecureContext) {
      showDirectoryPicker({ mode: "readwrite", id: "homepage-cv" }).then(function (root) {
        return locateDataDir(root).catch(function () {
          return root.getDirectoryHandle("data", { create: true }).then(function (dir) {
            meta.dataDir = dir;
          });
        });
      }).then(function () {
        return writeDataDir(files);
      }).then(function () {
        finishSave(mask);
      }).catch(function (error) {
        if (error && error.name === "AbortError") {
          closeSaveMask(mask);
          return;
        }
        downloadZip(files, mask);
      });
      return;
    }
    downloadZip(files, mask);
  }

  function storedFile(path) {
    var files = window.HOMEPAGE && window.HOMEPAGE.files;
    return files && Object.prototype.hasOwnProperty.call(files, path) ? files[path] : null;
  }

  function loadFile(key) {
    var ready = storedFile(PATHS[key]);
    if (ready) {
      state[key] = clone(ready);
      return Promise.resolve();
    }
    return fetch(PATHS[key], { cache: "no-store" }).then(function (response) {
      if (response.status === 404) {
        state[key] = clone(TEMPLATES[key]);
        meta.missing[key] = true;
        return;
      }
      if (!response.ok) throw new Error("http");
      return response.text().then(function (text) {
        state[key] = parseDataFile(text);
      });
    }).catch(function (error) {
      if (meta.missing[key]) return;
      if (error && error.message === "http") {
        meta.bad[key] = PATHS[key] + " 读取失败";
        return;
      }
      meta.fetchFailed = true;
      state[key] = clone(TEMPLATES[key]);
      meta.missing[key] = true;
    });
  }

  function bind() {
    var main = document.getElementById("main");
    main.addEventListener("input", onEdit);
    main.addEventListener("change", onEdit);
    document.body.addEventListener("click", onClick);

    form.on("select(field)", function (data) {
      onEdit({ target: data.elem, type: "change" });
    });
    form.on("radio(field)", function (data) {
      onEdit({ target: data.elem, type: "change" });
    });

    element.render("tab");
    element.on("tab(steps)", function (data) {
      if (data.index !== stepIndex && onProfileStep() && !profileEmailOk()) {
        element.tabChange("steps", String(stepIndex));
        return;
      }
      stepIndex = data.index;
      updateStep();
    });
    updateStep();
  }

  function u16(view, offset, value) {
    view[offset] = value & 255;
    view[offset + 1] = (value >> 8) & 255;
  }

  function u32(view, offset, value) {
    u16(view, offset, value & 65535);
    u16(view, offset + 2, (value >>> 16) & 65535);
  }

  function crc32(bytes) {
    if (!crc32.table) {
      var table = [];
      for (var n = 0; n < 256; n++) {
        var c = n;
        for (var k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
        table[n] = c >>> 0;
      }
      crc32.table = table;
    }
    var crc = 0xffffffff;
    for (var i = 0; i < bytes.length; i++) crc = crc32.table[(crc ^ bytes[i]) & 255] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  }

  function concat(parts) {
    var size = 0;
    parts.forEach(function (part) { size += part.length; });
    var out = new Uint8Array(size);
    var offset = 0;
    parts.forEach(function (part) {
      out.set(part, offset);
      offset += part.length;
    });
    return out;
  }

  function zipStored(entries) {
    var encoder = new TextEncoder();
    var now = new Date();
    var time = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
    var date = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
    var locals = [];
    var centrals = [];
    var offset = 0;
    entries.forEach(function (entry) {
      var name = encoder.encode(entry.name);
      var data = encoder.encode(entry.text);
      var crc = crc32(data);
      var local = new Uint8Array(30 + name.length);
      u32(local, 0, 0x04034b50);
      u16(local, 4, 20);
      u16(local, 6, 0x0800);
      u16(local, 8, 0);
      u16(local, 10, time);
      u16(local, 12, date);
      u32(local, 14, crc);
      u32(local, 18, data.length);
      u32(local, 22, data.length);
      u16(local, 26, name.length);
      u16(local, 28, 0);
      local.set(name, 30);
      locals.push(local, data);
      var central = new Uint8Array(46 + name.length);
      u32(central, 0, 0x02014b50);
      u16(central, 4, 20);
      u16(central, 6, 20);
      u16(central, 8, 0x0800);
      u16(central, 10, 0);
      u16(central, 12, time);
      u16(central, 14, date);
      u32(central, 16, crc);
      u32(central, 20, data.length);
      u32(central, 24, data.length);
      u16(central, 28, name.length);
      u32(central, 42, offset);
      central.set(name, 46);
      centrals.push(central);
      offset += local.length + data.length;
    });
    var central = concat(centrals);
    var end = new Uint8Array(22);
    u32(end, 0, 0x06054b50);
    u16(end, 8, entries.length);
    u16(end, 10, entries.length);
    u32(end, 12, central.length);
    u32(end, 16, offset);
    return concat(locals.concat([central, end]));
  }

  function downloadZip(files, mask) {
    var entries = Object.keys(files).map(function (rel) {
      return { name: rel, text: fileSource(rel, files[rel]) };
    });
    var bytes = zipStored(entries);
    var url = URL.createObjectURL(new Blob([bytes], { type: "application/zip" }));
    var link = el("a", { href: url, download: "data.zip" });
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
    finishSave(mask, "已下载 data.zip，解压后覆盖原来的 data 目录");
  }

  layui.use(["form", "element", "layer"], function () {
    form = layui.form;
    element = layui.element;
    layer = layui.layer;
    boot();
  });

  function boot() {
    bind();
    document.getElementById("folder-input").addEventListener("change", function (event) {
      readChosenFiles(event.target.files);
      event.target.value = "";
    });
    Promise.all(ORDER.map(loadFile)).then(function () {
      if (meta.fetchFailed) document.getElementById("banner").hidden = false;
      renderAll();
    });
  }
})();
