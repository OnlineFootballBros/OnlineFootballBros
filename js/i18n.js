/**
 * i18next 多语言支持配置文件
 *
 * 本文件配置了网站的多语言支持功能
 * 支持中文(zh-CN)、英文(en-US)、日文(ja-JP)和韩文(ko-KR)等语言
 */

// 全局状态变量
window.i18nextReady = false; // 表示i18next是否已初始化完成
window.jqueryI18nextReady = false; // 表示jqueryI18next是否已初始化完成
window.jqueryReady = false; // 表示jQuery是否已成功加载

// 支持的语言列表
const supportedLanguages = [
  { code: "zh", name: "简体中文", flag: "🇨🇳" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
];

// 确保所有页面上的语言按钮都显示正确的语言
function ensureLanguageButtonUpdated() {
  const languageButton = document.getElementById("language-button");

  if (languageButton) {
    // 获取当前语言
    const currentLang = i18next.language || "en";

    // 更精确的语言匹配，优先完全匹配，再尝试前缀匹配
    const selectedLanguage =
      supportedLanguages.find((lang) => lang.code === currentLang) ||
      supportedLanguages.find((lang) => currentLang.startsWith(lang.code)) ||
      supportedLanguages[0];

    // 更新按钮显示
    languageButton.innerHTML = `
      <span class="mr-1">${selectedLanguage.flag}</span>
      <span>${selectedLanguage.name}</span>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    `;
  } else {
    console.warn("未找到语言按钮元素，无法更新显示");
  }
}

// 重新初始化jQuery-i18next
function reinitJQueryI18next() {
  console.log("尝试重新初始化jQuery-i18next");

  if (typeof $ === "undefined" && typeof jQuery !== "undefined") {
    console.log("使用全局jQuery代替$");
    window.$ = jQuery;
  }

  if (
    typeof $ !== "undefined" &&
    typeof i18next !== "undefined" &&
    i18next.isInitialized &&
    typeof jqueryI18next !== "undefined"
  ) {
    try {
      console.log("重新初始化jqueryI18next");
      jqueryI18next.init(i18next, $, { useOptionsAttr: true });
      window.jqueryI18nextReady = true;
      console.log("jqueryI18next重新初始化成功");

      // 立即应用一次翻译
      updateContent();
      return true;
    } catch (error) {
      console.error("jqueryI18next重新初始化失败:", error);
      return false;
    }
  }
  return false;
}

// 检查jQuery加载状态，最多尝试10次
function checkJQuery(retryCount = 0, maxRetries = 10) {
  console.log(`检查jQuery加载状态 (${retryCount}/${maxRetries})`);

  if (typeof $ !== "undefined") {
    console.log("jQuery ($) 已可用");
    window.jqueryReady = true;
    return true;
  } else if (typeof jQuery !== "undefined") {
    console.log("全局jQuery已可用，但$未定义，将jQuery赋值给$");
    window.$ = jQuery;
    window.jqueryReady = true;
    return true;
  } else if (retryCount < maxRetries) {
    console.log(`jQuery尚未加载，${retryCount + 1}秒后重试`);
    setTimeout(() => checkJQuery(retryCount + 1, maxRetries), 1000);
    return false;
  } else {
    console.error("jQuery加载失败，国际化功能将受限");
    return false;
  }
}

// 初始化语言选择器下拉菜单
function initLanguageDropdown() {
  console.log("初始化语言选择器下拉菜单");
  const languageDropdown = document.getElementById("language-dropdown");
  const languageButton = document.getElementById("language-button");
  const languageOptions = document.getElementById("language-options");

  if (!languageDropdown || !languageButton || !languageOptions) {
    console.error("语言选择器元素未找到:", {
      languageDropdown,
      languageButton,
      languageOptions,
    });
    return;
  }

  console.log("语言选择器元素已找到");

  // 更新当前选中的语言显示
  function updateCurrentLanguage() {
    const currentLang = i18next.language || "en";
    console.log("当前语言代码(i18next.language):", currentLang);
    console.log("当前语言参数类型:", typeof currentLang);

    // 安全获取localStorage
    let storedLang = "";
    try {
      storedLang = localStorage.getItem("i18nextLng") || "";
      console.log("localStorage中保存的语言:", storedLang);
    } catch (e) {
      console.error("无法访问localStorage:", e);
    }

    // 更精确的语言匹配，优先完全匹配，再尝试前缀匹配
    const selectedLanguage =
      supportedLanguages.find((lang) => lang.code === currentLang) ||
      supportedLanguages.find((lang) => currentLang.startsWith(lang.code)) ||
      supportedLanguages[0];

    console.log("选中的语言对象:", selectedLanguage);

    languageButton.innerHTML = `
      <span class="mr-1">${selectedLanguage.flag}</span>
      <span>${selectedLanguage.name}</span>
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd" />
      </svg>
    `;

    // 确保页面上所有的语言按钮都更新
    ensureLanguageButtonUpdated();
  }

  // 切换下拉菜单显示状态 - 简化处理
  languageButton.onclick = function (e) {
    e.preventDefault();
    e.stopPropagation();
    console.log("语言按钮被点击");

    // 直接切换显示状态
    if (languageOptions.style.display === "block") {
      languageOptions.style.display = "none";
      console.log("语言选项隐藏");
    } else {
      // 确保下拉菜单显示在最上层
      languageOptions.style.zIndex = "9999";
      languageOptions.style.display = "block";

      // 解决可能的显示问题
      setTimeout(() => {
        if (languageOptions.style.display === "block") {
          // 重新确认样式设置正确
          languageOptions.style.position = "absolute";
          languageOptions.style.right = "0";
          languageOptions.style.zIndex = "9999";
        }
      }, 10);

      console.log("语言选项显示");
    }
  };

  // 初始状态设置为隐藏
  languageOptions.style.display = "none";

  // 点击外部区域关闭下拉菜单
  document.addEventListener("click", function (event) {
    // 确保点击的不是语言下拉菜单内的元素
    if (!languageDropdown.contains(event.target)) {
      languageOptions.style.display = "none";
      console.log("因点击外部区域，关闭语言选项");
    }
  });

  // 处理触摸事件，在移动设备上也能正常工作
  document.addEventListener("touchend", function (event) {
    if (!languageDropdown.contains(event.target)) {
      languageOptions.style.display = "none";
      console.log("因触摸外部区域，关闭语言选项");
    }
  });

  // 渲染语言选项
  languageOptions.innerHTML = "";
  console.log("正在渲染语言选项:", supportedLanguages);

  supportedLanguages.forEach((lang) => {
    const option = document.createElement("a");
    option.href = "#";
    option.className =
      "block px-4 py-3 text-sm text-gray-300 hover:bg-white hover:bg-opacity-10 hover:text-white transition-colors";
    option.innerHTML = `<span class="mr-2">${lang.flag}</span>${lang.name}`;
    option.dataset.langCode = lang.code;

    // 让语言选项区域更大，更易点击
    option.style.display = "block";
    option.style.width = "100%";
    option.style.textAlign = "left";

    // 当前选中的语言添加标记
    if (lang.code === (i18next.language || "en").substring(0, 2)) {
      option.classList.add("bg-primary", "bg-opacity-20", "text-white");
    }

    option.onclick = function (e) {
      e.preventDefault();
      e.stopPropagation();
      console.log("选择语言:", lang.code);

      if (i18next.language !== lang.code) {
        // 安全地保存语言设置到本地存储
        try {
          localStorage.setItem("i18nextLng", lang.code);
          console.log("已保存语言设置到localStorage:", lang.code);
        } catch (err) {
          console.error("无法保存语言设置到localStorage:", err);
          // 备用：保存到cookie
          document.cookie = `i18next=${lang.code};path=/;max-age=31536000`;
          console.log("已保存语言设置到cookie:", lang.code);
        }

        // 切换语言
        i18next.changeLanguage(lang.code, function (err) {
          if (err) {
            console.error("切换语言失败:", err);
            return;
          }
          console.log("语言已切换为:", lang.code);
          console.log("i18next.language值:", i18next.language);
          updateContent();
          updateCurrentLanguage();

          // 重新渲染语言选择器选项，确保选中状态正确
          initLanguageDropdown();
        });
      }

      // 隐藏下拉菜单
      languageOptions.style.display = "none";
    };

    languageOptions.appendChild(option);
  });

  // 初始更新当前语言显示
  updateCurrentLanguage();
}

// 初始化i18next
function initI18next() {
  console.log("开始初始化i18next");

  // 首先检查jQuery是否已加载
  checkJQuery();

  // 实现一个内存版的localStorage备份，防止沙箱环境中无法访问localStorage
  const memoryStorage = {
    data: {},
    getItem: function (key) {
      try {
        // 先尝试真实的localStorage
        if (window.localStorage) {
          return window.localStorage.getItem(key);
        }
      } catch (e) {
        console.log("无法访问真实localStorage，使用内存存储");
      }
      return this.data[key];
    },
    setItem: function (key, value) {
      try {
        // 先尝试真实的localStorage
        if (window.localStorage) {
          window.localStorage.setItem(key, value);
        }
      } catch (e) {
        console.log("无法写入真实localStorage，使用内存存储");
      }
      this.data[key] = value;
    },
  };

  // 尝试从URL或者document.cookie获取语言设置
  let detectedLng = null;

  // 检查是否是首次访问，如果是则默认使用英文
  try {
    const isFirstVisit = !localStorage.getItem("visited");
    if (isFirstVisit) {
      console.log("检测到首次访问网站，默认使用英文");
      localStorage.setItem("visited", "true");
      detectedLng = "en";
    }
  } catch (e) {
    console.log("无法访问localStorage判断是否首次访问:", e);
  }

  // 如果不是首次访问，则按照优先级检测语言
  if (!detectedLng) {
    // 从URL获取
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has("lng")) {
      detectedLng = urlParams.get("lng");
      console.log("从URL检测到语言:", detectedLng);
    }

    // 从Cookie获取
    if (!detectedLng) {
      const match = document.cookie.match(new RegExp("(^| )i18next=([^;]+)"));
      if (match) {
        detectedLng = match[2];
        console.log("从Cookie检测到语言:", detectedLng);
      }
    }

    // 尝试从localStorage获取
    try {
      if (!detectedLng && window.localStorage) {
        detectedLng = localStorage.getItem("i18nextLng");
        console.log("从localStorage检测到语言:", detectedLng);
      }
    } catch (e) {
      console.log("无法从localStorage读取语言设置:", e);
    }

    // 如果什么都没检测到，使用默认语言(英文)
    if (!detectedLng) {
      detectedLng = "en";
      console.log("未检测到语言，使用默认英文:", detectedLng);
    }
  }

  // 保存到内存存储
  memoryStorage.setItem("i18nextLng", detectedLng);

  console.log("检测到的语言:", detectedLng);
  console.log(
    "当前localStorage中的语言设置:",
    memoryStorage.getItem("i18nextLng")
  );

  // 初始化i18next
  i18next
    .use(i18nextHttpBackend)
    .use(i18nextBrowserLanguageDetector)
    .init(
      {
        fallbackLng: "en", // 默认语言为英文
        lng: detectedLng, // 使用检测到的语言
        debug: true, // 启用调试
        ns: ["common"], // 命名空间
        defaultNS: "common",
        backend: {
          loadPath: "locales/{{lng}}/{{ns}}.json", // 语言文件路径
        },
        detection: {
          order: ["querystring", "cookie", "localStorage"], // 移除navigator来避免自动使用浏览器语言
          lookupQuerystring: "lng",
          lookupCookie: "i18next",
          lookupLocalStorage: "i18nextLng",
          caches: ["localStorage", "cookie"],
        },
      },
      function (err, t) {
        if (err) {
          console.error("i18next初始化失败:", err);
          return;
        }

        console.log("i18next初始化成功, 当前语言:", i18next.language);
        console.log("当前语言代码类型:", typeof i18next.language);
        console.log(
          "语言探测结果:",
          i18next.services.languageDetector.detect()
        );

        // 设置全局状态变量，表示i18next已初始化完成
        window.i18nextReady = true;

        // 初始化jqueryI18next
        if (
          window.jqueryReady ||
          typeof $ !== "undefined" ||
          typeof jQuery !== "undefined"
        ) {
          // 确保$变量可用
          if (typeof $ === "undefined" && typeof jQuery !== "undefined") {
            window.$ = jQuery;
            console.log("将全局jQuery赋值给$");
          }

          if (
            typeof $ !== "undefined" &&
            typeof jqueryI18next !== "undefined"
          ) {
            try {
              jqueryI18next.init(i18next, $, { useOptionsAttr: true });
              window.jqueryI18nextReady = true;
              console.log("jqueryI18next初始化成功");
            } catch (error) {
              console.error("jqueryI18next初始化失败:", error);

              // 延迟重试初始化jqueryI18next
              setTimeout(() => reinitJQueryI18next(), 1000);
            }
          } else {
            console.error(
              "无法初始化jqueryI18next，jQuery或jqueryI18next未定义"
            );

            // 延迟重试初始化jqueryI18next
            setTimeout(() => reinitJQueryI18next(), 2000);
          }
        } else {
          console.warn("jQuery尚未加载，将在jQuery可用时初始化jqueryI18next");

          // jQuery尚未加载，设置一个延迟检查
          setTimeout(() => {
            if (!window.jqueryI18nextReady) {
              console.log("延迟检查jQuery状态并尝试初始化jqueryI18next");
              if (checkJQuery(0, 2)) {
                reinitJQueryI18next();
              }
            }
          }, 3000);
        }

        // 初始化完成后进行本地化，即使jQuery尚未就绪
        updateContent();

        // 初始化语言选择器
        initLanguageDropdown();

        console.log("i18next初始化和语言选择器初始化完成");

        // 触发一个自定义事件，通知其他脚本i18next已初始化完成
        const i18nextReadyEvent = new CustomEvent("i18nextInitialized");
        document.dispatchEvent(i18nextReadyEvent);
      }
    );
}

// 更新页面内容
function updateContent() {
  console.log("更新页面内容 - 本地化元素");

  // 检查jQuery和i18next是否都已正确加载
  if (typeof $ === "undefined") {
    console.error("jQuery未定义，无法应用翻译");

    // 尝试使用全局jQuery
    if (typeof jQuery !== "undefined") {
      console.log("使用全局jQuery代替$");
      window.$ = jQuery;
    } else {
      return;
    }
  }

  if (typeof i18next === "undefined" || !i18next.isInitialized) {
    console.error("i18next未初始化，无法应用翻译");
    return;
  }

  if (typeof $.fn.localize === "undefined") {
    console.error("jQuery.fn.localize未定义，可能jqueryI18next未正确初始化");

    // 尝试重新初始化jqueryI18next
    if (typeof jqueryI18next !== "undefined") {
      try {
        jqueryI18next.init(i18next, $, { useOptionsAttr: true });
        window.jqueryI18nextReady = true;
        console.log("updateContent中重新初始化jqueryI18next成功");
      } catch (error) {
        console.error("updateContent中重新初始化jqueryI18next失败:", error);
        return;
      }
    } else {
      return;
    }
  }

  try {
    // 本地化所有带有data-i18n属性的元素
    $("[data-i18n]").localize();
    console.log("成功应用翻译到所有data-i18n元素");

    // 确保语言按钮显示正确的语言
    ensureLanguageButtonUpdated();

    // 更新语言选择器中的选中状态
    updateLanguageOptionsSelected();
  } catch (error) {
    console.error("应用翻译时出错:", error);
  }
}

// 更新语言选择器中的选中状态
function updateLanguageOptionsSelected() {
  console.log("更新语言选择器中的选中状态");
  const languageOptions = document.getElementById("language-options");

  if (!languageOptions) {
    console.warn("未找到语言选项元素，无法更新选中状态");
    return;
  }

  const currentLang = i18next.language || "en";
  const currentLangCode = currentLang.substring(0, 2);

  // 移除所有选项的选中样式
  const allOptions = languageOptions.querySelectorAll("a");
  allOptions.forEach((option) => {
    option.classList.remove("bg-primary", "bg-opacity-20", "text-white");
  });

  // 为当前语言选项添加选中样式
  const selectedOption = languageOptions.querySelector(
    `a[data-lang-code="${currentLangCode}"]`
  );
  if (selectedOption) {
    selectedOption.classList.add("bg-primary", "bg-opacity-20", "text-white");
    console.log("已更新选中状态到语言:", currentLangCode);
  } else {
    console.warn("未找到匹配当前语言的选项:", currentLangCode);
  }
}

// 导出i18n模块函数供全局使用
document.addEventListener("DOMContentLoaded", function () {
  console.log("DOMContentLoaded事件触发");

  // 手动测试语言选择器的显示/隐藏
  setTimeout(function () {
    const button = document.getElementById("language-button");
    const options = document.getElementById("language-options");

    if (button && options) {
      console.log("测试语言选择器点击");

      button.addEventListener("click", function () {
        console.log("语言按钮点击测试");
        options.classList.toggle("hidden");
      });
    }

    // 确保语言按钮显示正确
    if (i18next.isInitialized) {
      ensureLanguageButtonUpdated();
      // 同时更新选择器中的选中状态
      updateLanguageOptionsSelected();
    }
  }, 1000);

  // 初始化i18next
  initI18next();

  // 导出模块函数供全局使用
  window.I18nModule = {
    init: initLanguageDropdown,
    translate: updateContent,
    getCurrentLanguage: () => i18next.language,
    reinitJQueryI18next: reinitJQueryI18next,
    updateLanguageButton: ensureLanguageButtonUpdated,
    updateLanguageOptionsSelected: updateLanguageOptionsSelected,
  };

  // 页面变化时重新更新语言按钮
  window.addEventListener("load", function () {
    if (i18next.isInitialized) {
      ensureLanguageButtonUpdated();
    }
  });

  // 在文件末尾添加立即执行的代码，确保在文档加载后更新语言按钮
  console.log("DOMContentLoaded: 尝试立即更新语言按钮");

  // 检查i18next是否已经初始化
  if (typeof i18next !== "undefined" && i18next.isInitialized) {
    console.log("i18next已初始化，立即更新语言按钮");
    ensureLanguageButtonUpdated();
  } else {
    console.log("i18next尚未初始化，等待事件");
    // 监听i18next初始化完成事件
    document.addEventListener("i18nextInitialized", function () {
      console.log("收到i18next初始化事件，更新语言按钮");
      setTimeout(ensureLanguageButtonUpdated, 100);
    });

    // 设置一个定时器作为备份，防止事件未触发
    setTimeout(function () {
      if (typeof i18next !== "undefined" && i18next.isInitialized) {
        console.log("i18next初始化检查(备份)，更新语言按钮");
        ensureLanguageButtonUpdated();
      }
    }, 2000);
  }
});

// 添加MutationObserver观察DOM变化，确保language-button不被覆盖
(function () {
  if (typeof MutationObserver !== "undefined") {
    console.log("设置MutationObserver监控language-button");
    // 创建observer实例
    const observer = new MutationObserver(function (mutations) {
      // 检查语言按钮是否存在且内容是否正确
      const languageButton = document.getElementById("language-button");
      if (
        languageButton &&
        typeof i18next !== "undefined" &&
        i18next.isInitialized
      ) {
        const currentLang = i18next.language || "en";
        const buttonText = languageButton.textContent.trim();

        // 检查按钮文本是否包含当前语言名称
        const shouldContain = supportedLanguages.find(
          (lang) =>
            lang.code === currentLang || currentLang.startsWith(lang.code)
        );

        if (shouldContain && !buttonText.includes(shouldContain.name)) {
          console.log("检测到language-button内容不符合当前语言，重新更新");
          ensureLanguageButtonUpdated();
        }
      }
    });

    // 开始观察document.body的子树变化
    setTimeout(function () {
      if (document.body) {
        observer.observe(document.body, {
          childList: true,
          subtree: true,
          characterData: true,
        });
        console.log("MutationObserver已启动");
      }
    }, 1000);
  }
})();

// 最强力的解决方案：使用window.onload和定时器确保language-button始终正确
window.addEventListener("load", function () {
  console.log("window.onload: 所有资源加载完成，强制更新语言按钮");

  // 立即更新一次
  if (typeof i18next !== "undefined" && i18next.isInitialized) {
    ensureLanguageButtonUpdated();
  }

  // 设置定时器，在页面完全加载后每隔一段时间检查一次
  // 这是最有力的保障，确保其他脚本不会覆盖语言按钮
  let checkCount = 0;
  const maxChecks = 5;
  const checkInterval = setInterval(function () {
    checkCount++;

    if (typeof i18next !== "undefined" && i18next.isInitialized) {
      ensureLanguageButtonUpdated();
    }

    if (checkCount >= maxChecks) {
      clearInterval(checkInterval);
      console.log("完成所有定时检查");
    }
  }, 1000); // 每秒检查一次，共检查5次
});

// 暴露全局函数，允许任何脚本直接调用更新
window.updateLanguageButton = function () {
  if (typeof ensureLanguageButtonUpdated === "function") {
    return ensureLanguageButtonUpdated();
  }
  return false;
};
