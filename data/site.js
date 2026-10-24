window.HOMEPAGE = window.HOMEPAGE || { files: {} };
window.HOMEPAGE.files["data/site.js"] = {
  "site": {
    "title": "Guang Yang · 杨光",
    "defaultLang": "zh",
    "quip": true
  },
  "profile": "data/profile.js",
  "intro": {
    "zh": "研究聚焦人工智能与软件工程的交叉，围绕程序理解、生成与安全，探索面向软/硬件的大模型代码智能。",
    "en": "The research focuses on the intersection of AI4SE, focusing on program understanding, generation and security, and exploring CodeLLMs for software/hardware."
  },
  "sections": [
    {
      "id": "research",
      "type": "interests",
      "file": "data/research.js"
    },
    {
      "id": "experience",
      "type": "timeline",
      "file": "data/experience.js"
    },
    {
      "id": "projects",
      "type": "projects",
      "file": "data/projects.js"
    },
    {
      "id": "publications",
      "type": "publications",
      "file": "data/publications.js"
    },
    {
      "id": "service",
      "type": "service",
      "file": "data/service.js"
    }
  ]
};
