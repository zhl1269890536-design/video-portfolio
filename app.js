(function () {
  "use strict";

  var data = window.PORTFOLIO || { profile: {}, categories: [], works: [] };
  var categories = data.categories || [];
  var groups = data.groups || [];
  if (!groups.length) {
    groups = categories.map(function (category) {
      return { id: category.id, name: category.name, background: category.background, categories: [category.id] };
    });
  }
  var visibleGroups = groups.filter(function (group) {
    return (group.categories || []).some(function (categoryId) {
      return data.works.some(function (work) {
        return work.category === categoryId;
      });
    });
  });
  var categoryNames = {};
  var categoryMap = {};

  categories.forEach(function (category) {
    categoryNames[category.id] = category.name;
    categoryMap[category.id] = category;
  });

  var sectionsWrap = document.getElementById("sections");
  var overlayEl = document.getElementById("detail-overlay");
  var mediaEl = document.getElementById("detail-media");
  var categoryEl = document.getElementById("detail-category");
  var titleEl = document.getElementById("detail-title");
  var roleEl = document.getElementById("detail-role");
  var noteEl = document.getElementById("detail-note");
  var noteBlockEl = document.getElementById("detail-note-block");
  var actionsEl = document.getElementById("detail-actions");
  var closeBtn = document.getElementById("detail-close");
  var prevBtn = document.getElementById("detail-prev");
  var nextBtn = document.getElementById("detail-next");
  var counterEl = document.getElementById("detail-counter");
  var roleSubtitleEl = document.getElementById("site-role");
  var topNavEl = document.getElementById("top-nav");
  var navToggleEl = document.getElementById("nav-toggle");
  var navLinks = Array.prototype.slice.call(document.querySelectorAll(".top-menu a"));

  var lastFocused = null;
  var currentWorkIndex = -1;

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
      }[char];
    });
  }

  function categoryLabel(id) {
    return categoryNames[id] || id;
  }

  function renderProfile() {
    var name = (data.profile && data.profile.name) || "你的名字";
    var tagline = (data.profile && data.profile.tagline) || "作品集";
    document.getElementById("site-name").textContent = name;
    document.getElementById("site-eyebrow").textContent = tagline;
    roleSubtitleEl.textContent = (data.profile && data.profile.subtitle) || "";
    document.title = name + " · " + tagline;
  }

  function buildCard(work, index) {
    var card = document.createElement("article");
    card.className = "work-card reveal";
    card.tabIndex = 0;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", "打开作品：" + work.title);
    card.style.transitionDelay = Math.min(index * 0.08, 0.4) + "s";

    var coverClass = "work-cover" + (work.cover ? " has-cover" : "");
    var coverStyle = work.cover ? " style=\"background-image:url('" + escapeHtml(work.cover) + "')\"" : "";

    card.innerHTML = [
      '<div class="' + coverClass + '"' + coverStyle + ">",
      "</div>",
      '<div class="work-body">',
      '<h3 class="work-title">' + escapeHtml(work.title) + "</h3>",
      "</div>"
    ].join("");

    card.addEventListener("click", function () {
      openWork(work);
    });
    card.addEventListener("keydown", function (event) {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openWork(work);
      }
    });

    return card;
  }

  function shouldUsePlayerPage() {
    return /MicroMessenger/i.test(navigator.userAgent) ||
      /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  }

  function openWork(work) {
    if (shouldUsePlayerPage()) {
      window.location.href = "player.html?id=" + encodeURIComponent(work.id);
      return;
    }
    openDetail(work);
  }

  function worksFor(categoryId) {
    return data.works.filter(function (work) {
      return work.category === categoryId;
    });
  }

  function buildGroupBlock(group, category) {
    var block = document.createElement("div");
    block.className = "group-block reveal";
    block.id = "group-" + group.id + "-" + category.id;

    var head = document.createElement("header");
    head.className = "group-head";

    var title = document.createElement("h3");
    title.className = "group-title";
    title.textContent = category.name;

    head.appendChild(title);
    block.appendChild(head);

    var works = worksFor(category.id);
    if (!works.length) {
      var empty = document.createElement("p");
      empty.className = "group-empty";
      empty.textContent = "作品待补充";
      block.appendChild(empty);
      return block;
    }

    var row = document.createElement("div");
    row.className = "works-row works-" + Math.min(works.length, 4);
    works.forEach(function (work, workIndex) {
      row.appendChild(buildCard(work, workIndex + 1));
    });
    block.appendChild(row);
    return block;
  }

  function buildSection(group, index) {
    var section = document.createElement("section");
    section.className = "category-section";
    section.id = "section-" + group.id;

    if (group.background) {
      section.style.setProperty("--section-bg", "url('" + escapeHtml(group.background) + "')");
    }

    var inner = document.createElement("div");
    inner.className = "section-inner";

    var head = document.createElement("header");
    head.className = "section-head reveal";

    var title = document.createElement("h2");
    title.className = "section-title";
    title.textContent = group.name;

    head.appendChild(title);
    inner.appendChild(head);

    if ((group.categories || []).length > 1) {
      var subnav = document.createElement("nav");
      subnav.className = "group-subnav reveal";
      (group.categories || []).forEach(function (categoryId, subnavIndex) {
        var category = categoryMap[categoryId] || { id: categoryId, name: categoryId };
        var button = document.createElement("button");
        button.type = "button";
        button.className = "subnav-item";
        if (subnavIndex === 0) {
          button.classList.add("is-active");
        }
        button.dataset.target = "group-" + group.id + "-" + categoryId;
        button.textContent = category.name;
        button.addEventListener("click", function () {
          var target = document.getElementById(button.dataset.target);
          if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        });
        subnav.appendChild(button);
      });
      inner.appendChild(subnav);
    }

    (group.categories || []).forEach(function (categoryId) {
      var category = categoryMap[categoryId] || { id: categoryId, name: categoryId };
      inner.appendChild(buildGroupBlock(group, category));
    });

    section.appendChild(inner);
    return section;
  }

  function renderSections() {
    sectionsWrap.innerHTML = "";
    visibleGroups.forEach(function (group, index) {
      sectionsWrap.appendChild(buildSection(group, index));
    });
  }

  function setActiveNav(id) {
    navLinks.forEach(function (link) {
      var target = link.getAttribute("href").replace("#", "");
      link.classList.toggle("is-active", target === id);
    });
  }

  function initReveal() {
    var items = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      items.forEach(function (item) {
        item.classList.add("is-visible");
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });

    items.forEach(function (item) {
      observer.observe(item);
    });
  }

  function initScrollSpy() {
    var sections = document.querySelectorAll(".category-section, .page-section");
    if (!("IntersectionObserver" in window) || !sections.length) {
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          setActiveNav(entry.target.id);
        }
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  function initSubnavSpy() {
    var navs = document.querySelectorAll(".group-subnav");
    if (!("IntersectionObserver" in window) || !navs.length) {
      return;
    }

    navs.forEach(function (nav) {
      var buttons = nav.querySelectorAll(".subnav-item");
      var targets = [];
      buttons.forEach(function (button) {
        var target = document.getElementById(button.dataset.target);
        if (target) {
          targets.push(target);
        }
      });

      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            buttons.forEach(function (button) {
              button.classList.toggle("is-active", button.dataset.target === entry.target.id);
            });
          }
        });
      }, { rootMargin: "-35% 0px -55% 0px", threshold: 0 });

      targets.forEach(function (target) {
        observer.observe(target);
      });
    });
  }

  function renderMedia(work) {
    var oldVideo = mediaEl.querySelector("video");
    if (oldVideo) {
      oldVideo.pause();
      oldVideo.removeAttribute("src");
      oldVideo.load();
    }
    mediaEl.innerHTML = "";

    if (work.video) {
      var video = document.createElement("video");
      video.className = "detail-video";
      video.src = work.video;
      video.controls = true;
      video.playsInline = true;
      video.preload = "metadata";
      video.setAttribute("controlslist", "nodownload");
      mediaEl.appendChild(video);
      return;
    }

    if (work.bilibiliEmbed) {
      var frame = document.createElement("iframe");
      frame.src = work.bilibiliEmbed;
      frame.setAttribute("allow", "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen");
      frame.setAttribute("allowfullscreen", "true");
      frame.title = work.title;
      frame.setAttribute("loading", "lazy");
      mediaEl.appendChild(frame);
      return;
    }

    var placeholder = document.createElement("div");
    placeholder.className = "media-placeholder";

    var mediaTitle = document.createElement("p");
    mediaTitle.className = "media-title";
    mediaTitle.textContent = work.title;

    var status = document.createElement("p");
    status.className = "media-status";

    placeholder.appendChild(mediaTitle);

    if (work.feishu) {
      status.textContent = "视频放在飞书，点击下方按钮观看";
      placeholder.appendChild(status);
      var openFeishu = document.createElement("a");
      openFeishu.className = "btn";
      openFeishu.href = work.feishu;
      openFeishu.target = "_blank";
      openFeishu.rel = "noopener";
      openFeishu.textContent = "在飞书观看";
      placeholder.appendChild(openFeishu);
    } else {
      status.textContent = "作品待上传";
      placeholder.appendChild(status);
    }

    mediaEl.appendChild(placeholder);
  }

  function renderActions(work) {
    actionsEl.innerHTML = "";

    if (work.bilibiliPage) {
      var bilibiliButton = document.createElement("a");
      bilibiliButton.className = "btn";
      bilibiliButton.href = work.bilibiliPage;
      bilibiliButton.target = "_blank";
      bilibiliButton.rel = "noopener";
      bilibiliButton.textContent = "在 B 站打开";
      actionsEl.appendChild(bilibiliButton);
    }

    if (work.feishu) {
      var feishuButton = document.createElement("a");
      feishuButton.className = "btn btn-accent";
      feishuButton.href = work.feishu;
      feishuButton.target = "_blank";
      feishuButton.rel = "noopener";
      feishuButton.textContent = "在飞书观看";
      actionsEl.appendChild(feishuButton);
    }
  }

  function openDetail(work) {
    currentWorkIndex = data.works.indexOf(work);
    categoryEl.textContent = categoryLabel(work.category);
    titleEl.textContent = work.title;
    roleEl.innerHTML = roleChips(work.role) || '<span class="muted-text">待补充</span>';

    var hasNote = work.note && work.note !== "待补充";
    noteBlockEl.hidden = !hasNote;
    noteEl.textContent = hasNote ? work.note : "";
    renderMedia(work);
    renderActions(work);
    updateDetailNav();

    lastFocused = document.activeElement;
    overlayEl.hidden = false;
    document.body.style.overflow = "hidden";
    closeBtn.focus();
  }

  function roleChips(roles) {
    return (roles || []).map(function (role) {
      return '<span class="role-chip">' + escapeHtml(role) + "</span>";
    }).join("");
  }

  function updateDetailNav() {
    var total = data.works.length;
    counterEl.textContent = (currentWorkIndex + 1) + " / " + total;
    prevBtn.disabled = currentWorkIndex <= 0;
    nextBtn.disabled = currentWorkIndex >= total - 1;
  }

  function showWork(offset) {
    var nextIndex = currentWorkIndex + offset;
    if (nextIndex >= 0 && nextIndex < data.works.length) {
      openDetail(data.works[nextIndex]);
    }
  }

  function closeDetail() {
    var video = mediaEl.querySelector("video");
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
    overlayEl.hidden = true;
    document.body.style.overflow = "";
    if (lastFocused && lastFocused.focus) {
      lastFocused.focus();
    }
  }

  closeBtn.addEventListener("click", closeDetail);
  prevBtn.addEventListener("click", function () {
    showWork(-1);
  });
  nextBtn.addEventListener("click", function () {
    showWork(1);
  });

  navToggleEl.addEventListener("click", function () {
    var open = topNavEl.classList.toggle("is-open");
    navToggleEl.setAttribute("aria-expanded", String(open));
  });

  navLinks.forEach(function (link) {
    link.addEventListener("click", function () {
      topNavEl.classList.remove("is-open");
      navToggleEl.setAttribute("aria-expanded", "false");
    });
  });

  overlayEl.addEventListener("click", function (event) {
    if (event.target === overlayEl) {
      closeDetail();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && !overlayEl.hidden) {
      closeDetail();
    }
  });

  document.addEventListener("contextmenu", function (event) {
    event.preventDefault();
  });

  document.addEventListener("keydown", function (event) {
    var key = (event.key || "").toUpperCase();
    var blocked =
      event.key === "F12" ||
      (event.ctrlKey && event.shiftKey && ["I", "J", "C"].indexOf(key) !== -1) ||
      (event.metaKey && event.altKey && ["I", "J", "C"].indexOf(key) !== -1) ||
      (event.ctrlKey && key === "U");
    if (blocked) {
      event.preventDefault();
    }
  });

  if (navLinks.length) {
    navLinks[0].classList.add("is-active");
  }

  renderProfile();
  renderSections();
  initReveal();
  initScrollSpy();
  initSubnavSpy();
})();
