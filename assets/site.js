/* M2R-Academy shared chrome: header/footer injection + AR/EN i18n.
   No globals leak except window.M2R. Depends on nothing. */
(function () {
  'use strict';

  var LANG_KEY = 'm2r.lang';

  var I18N = {
    ar: {
      'skip': 'تخطَّ إلى المحتوى',
      'brand': 'M2R-Academy',
      'nav.home': 'الرئيسية', 'nav.about': 'من نحن', 'nav.courses': 'الكورسات',
      'nav.projects': 'المشاريع', 'nav.leaderboard': 'الترتيب', 'nav.contact': 'اتصل بنا',
      'nav.login': 'دخول', 'nav.signup': 'حساب جديد', 'nav.profile': 'حسابي',
      'nav.admin': 'الإدارة', 'nav.logout': 'خروج', 'nav.menu': 'القائمة',
      'lang.name': 'EN',
      'footer.about_t': 'عن M2R-Academy',
      'footer.about_x': 'أكاديمية عربية: برمجة وشطرنج باللهجة المصرية — التفاصيل والأسعار على واتساب.',
      'footer.links_t': 'روابط سريعة', 'footer.tracks_t': 'التراكات', 'footer.sources_t': 'المصادر',
      'footer.rights': '© 2025 M2R-Academy — جميع الحقوق محفوظة.',
      'footer.disclaimer': 'محتوى تعليمي فقط — المحتوى المرئي ملك أصحابه.',
      'hero.badge': 'أكاديمية عربية • باللهجة المصرية • التفاصيل واتساب',
      'hero.title': 'تعلّم. <span>تدرّب.</span> احترف.',
      'hero.sub': 'M2R-Academy: برمجة وشطرنج — كورسات مرتبة من الصفر للاحتراف، من غير حسابات ولا تعقيد.',
      'hero.cta_courses': 'ابدأ التعلم', 'hero.cta_how': 'إزاي بيشتغل؟',
      'what.t': 'إيه هي M2R-Academy؟',
      'what.x': 'منصة تعليمية أسسها مصطفى وملك ورحمة عشان أي حد عربي يتعلّم البرمجة والشطرنج — بترتيب واضح ومحتوى مختار بعناية من أفضل القنوات المصرية. الكورسات مدفوعة والتفاصيل والأسعار على واتساب.',
      'target.t': 'هدفنا',
      'target.1': 'تعليم عربي يوصل لأي حد في مصر والوطن العربي — الأسعار والتفاصيل على واتساب.',
      'target.2': 'ترتيب واضح: تمشي خطوة بخطوة من غير ما تتوه بين الفيديوهات.',
      'target.3': 'منافسة شريفة: نقط وترتيب يشجعك تكمّل.',
      'tracks.t': 'التراكات', 'tracks.sub': 'اختار طريقك وابدأ النهارده.',
      'projects.t': 'مشاريع الطلبة', 'projects.sub': 'شغل حقيقي من ناس زيك.',
      'projects.more': 'كل المشاريع', 'projects.all': 'الكل',
      'lb.t': 'الأوائل', 'lb.sub': 'أعلى نقط على المنصة.',
      'lb.more': 'الترتيب الكامل', 'lb.rank': 'الترتيب', 'lb.user': 'الطالب',
      'lb.points': 'النقط', 'lb.courses': 'الكورسات', 'lb.empty': 'لسه مفيش نقط — كن أول واحد!',
      'lb.login_hint': 'سجّل دخول عشان تظهر في الترتيب.',
      'how.t': 'إزاي بيشتغل؟',
      'how.1t': 'اختار الكورس', 'how.1x': 'تصفح التراكات واختار الجزء المناسب لمستواك.',
      'how.2t': 'هات كود Appline', 'how.2x': 'ابعت الكود لينا على واتساب واستلم كود الفتح.',
      'how.3t': 'اتفتح واتعلّم', 'how.3x': 'اتفرج بتقدّم محفوظ واجمع نقط.',
      'common.view': 'استكشف ←', 'common.coming': 'قريباً', 'common.videos': 'فيديو',
      'common.parts': 'أجزاء', 'common.loading': 'بيحمّل…', 'common.retry': 'حاول تاني',
      'common.load_fail': 'المحتوى متحملش. اتأكد من النت وحاول تاني.',
      'about.hero_t': 'من نحن', 'about.hero_s': 'قصتنا وهدفنا وطريقتنا.',
      'story.t': 'قصتنا',
      'story.x': 'بدأت M2R-Academy بفكرة بسيطة من مصطفى وملك ورحمة: المحتوى العربي الكويس موجود بس متبعتر — فجمعنا أحسن الكورسات المصرية ورتبناها في تراكات واضحة. الكورسات مدفوعة — للتفاصيل والأسعار كلمنا واتساب.',
      'mission.t': 'مهمتنا', 'mission.x': 'نخلي أي شاب عربي يقدر يتعلّم مهارة حقيقية توصله لسوق الشغل.',
      'vision.t': 'رؤيتنا', 'vision.x': 'أكبر مجتمع تعلّم عربي: ناس بتتعلم، بتنافس، وبتشتغل.',
      'method.t': 'طريقة المذاكرة',
      'method.x': 'ذاكر على سرعتك: كل تراك متقسم أجزاء وكل جزء فيديوهات بالترتيب. بتاخد كود، تبعته Appline على واتساب، يجيلك كود الفتح — من غير حسابات ولا اشتراكات.',
      'founders.t': 'المؤسسون', 'role.founder': 'مؤسس الأكاديمية', 'role.tba': 'الدور قريباً',
      'quote.t': 'كلام يشجعك',
      'quote.x': '«محدش اتولد محترف — كل خبير كان مبتدئ قرر ميبطلش.»',
      'faq.t': 'أسئلة شائعة',
      'faq.q1': 'هل الكورسات مجانية؟', 'faq.a1': 'لأ — الكورسات مدفوعة والتفاصيل والأسعار على واتساب.',
      'faq.q2': 'محتاج حساب عشان أتفرج؟', 'faq.a2': 'لأ. التصفح والمشاهدة بعد الفتح من غير حساب. الحساب بس عشان النقط والترتيب.',
      'faq.q3': 'إزاي بفتح كورس؟', 'faq.a3': 'اختار الجزء، خد الكود، ابعته على واتساب Appline، هيوصلك كود الفتح.',
      'faq.q4': 'الشهادات معتمدة؟',       'faq.a4': 'لأ — دي منصة تعليم عملي. المهارة اللي هتكتسبها هي الشهادة الحقيقية.',
      'faq.q5': 'أقدر أشارك بمشروعي؟', 'faq.a5': 'أكيد! ابعته على واتساب الأكاديمية وهنضيفه لمعرض المشاريع.',
      'faq.q6': 'الفيديوهات بتتحمل؟', 'faq.a6': 'المشاهدة جوه المنصة بس للحفاظ على حقوق أصحاب المحتوى.',
      'courses.t': 'الكورسات', 'courses.sub': 'اختار التراك المناسب وابدأ.',
      'detail.back': '← كل التراكات', 'detail.back_track': '← رجوع للتراك',
      'detail.videos_t': 'فيديوهات الكورس', 'detail.choose': 'اختار الجزء',
      'detail.enroll': 'احصل على الكود', 'detail.continue': '▶ كمّل الكورس',
      'detail.locked': '🔒 مقفول', 'detail.unlocked': '✓ مفتوح',
      'enroll.t': 'فتح الكورس', 'enroll.course': 'الكورس:',
      'enroll.step1': 'خد الكود ده وابعته على Appline واتساب:',
      'enroll.copy': 'نسخ', 'enroll.copied': '✓ اتنسخ',
      'enroll.regen': '↻ كود جديد', 'enroll.wa': 'ابعت على واتساب',
      'enroll.step2': 'دخل كود الفتح اللي وصلك من Appline:',
      'enroll.otp': 'كود الفتح (8 حروف/أرقام)',
      'enroll.verify': 'تحقق وافتح الكورس',
      'enroll.note': 'تواصل مع Appline الخاص بك وادخل كود الـ OTP اللي يوصلك.',
      'enroll.err_short': 'دخل الكود كامل (8 حروف/أرقام).',
      'enroll.err_wrong': 'الكود غلط. حاول تاني.',
      'enroll.ok': 'اتفتح! بالتوفيق 🎉',
      'watch.back': '← رجوع للكورس', 'watch.playlist_t': 'محتوى الكورس',
      'watch.unavailable': 'الفيديو مش متاح حالياً. جرّب اللي بعده.',
      'watch.next': 'الفيديو التالي ←',
      'auth.login_t': 'تسجيل الدخول', 'auth.login_sub': 'أهلاً برجوعك!',
      'auth.email': 'البريد الإلكتروني', 'auth.password': 'كلمة السر',
      'auth.signin': 'دخول', 'auth.no_account': 'معندكش حساب؟',
      'auth.has_account': 'عندك حساب؟', 'auth.create_link': 'اعمل حساب',
      'auth.login_link': 'سجّل دخول',
      'auth.signup_t': 'حساب جديد', 'auth.signup_sub': 'حساب — نقطك وترتيبك معاك في أي جهاز.',
      'auth.name': 'الاسم', 'auth.confirm': 'تأكيد كلمة السر',
      'auth.terms': 'موافق على شروط الاستخدام',
      'auth.create': 'اعمل حساب', 'auth.back': '← رجوع للدخول',
      'auth.err_fill': 'املأ كل الحقول.', 'auth.err_short': 'كلمة السر 6 حروف على الأقل.',
      'auth.err_match': 'كلمتا السر مش زي بعض.', 'auth.err_terms': 'لازم توافق على الشروط.',
      'auth.err_noconfig': 'التسجيل أونلاين لسه متفعلش.',
      'auth.err_bad': 'البريد أو كلمة السر غلط.',
      'auth.err_used': 'البريد ده مسجل قبل كده. سجّل دخول.',
      'auth.err_net': 'مشكلة في النت. حاول تاني.',
      'auth.err_banned': 'الحساب ده محظور. تواصل مع الإدارة.',
      'auth.err_domain': 'الدومين غير مسموح في Firebase — ضيفه في Authorized domains.',
      'auth.created': 'اتعمل الحساب. أهلاً بيك! 🎉',
      'profile.t': 'حسابي', 'profile.name': 'الاسم', 'profile.bio': 'نبذة عنك',
      'profile.save': 'احفظ', 'profile.saved': 'اتحفظ ✓',
      'profile.avatar': 'الصورة (حد أقصى 2MB)', 'profile.points': 'نقطي',
      'profile.rank': 'ترتيبي', 'profile.courses_t': 'كورساتي',
      'profile.logout': 'تسجيل الخروج', 'profile.need_login': 'سجّل دخول عشان تشوف حسابك.',
      'admin.t': 'لوحة الإدارة', 'admin.denied': 'الصفحة دي للإدارة بس.',
      'admin.users_t': 'المستخدمون', 'admin.pts': 'النقط',
      'admin.ann_t': 'الإعلانات', 'admin.ann_ph': 'اكتب إعلان…',
      'admin.save': 'احفظ', 'admin.saved': 'اتحفظ ✓',
      'admin.projects_t': 'المشاريع', 'admin.comp_t': 'المسابقات',
      'admin.add': 'ضيف', 'admin.del': 'امسح', 'admin.ban': 'حظر', 'admin.unban': 'فك الحظر',
      'admin.banned': 'محظور', 'admin.title_ph': 'العنوان', 'admin.del_confirm': 'متأكد؟',
      'contact.t': 'اتصل بنا', 'contact.sub': 'كلمنا في أي وقت — بنرد بسرعة.',
      'contact.founder': 'مصطفى — مؤسس الأكاديمية',
      'contact.wa': 'كلمنا واتساب', 'contact.channels_t': 'قنوات المحتوى',
      'contact.projects_note': 'عندك مشروع؟ ابعته وهنعرضه باسمك.',
      'e404.t': 'الصفحة مش موجودة', 'e404.x': 'اللينك ده مودّيش لحتة.',
      'e404.home': '← رجوع للرئيسية'
    },
    en: {
      'skip': 'Skip to content',
      'brand': 'M2R-Academy',
      'nav.home': 'Home', 'nav.about': 'About', 'nav.courses': 'Courses',
      'nav.projects': 'Projects', 'nav.leaderboard': 'Ranks', 'nav.contact': 'Contact',
      'nav.login': 'Log in', 'nav.signup': 'Sign up', 'nav.profile': 'Profile',
      'nav.admin': 'Admin', 'nav.logout': 'Log out', 'nav.menu': 'Menu',
      'lang.name': 'عربي',
      'footer.about_t': 'About M2R-Academy',
      'footer.about_x': 'An Arabic academy: programming and chess in Egyptian Arabic — details and pricing on WhatsApp.',
      'footer.links_t': 'Quick links', 'footer.tracks_t': 'Tracks', 'footer.sources_t': 'Sources',
      'footer.rights': '© 2025 M2R-Academy — All rights reserved.',
      'footer.disclaimer': 'Educational content only — videos belong to their owners.',
      'hero.badge': 'Arabic • Egyptian dialect • Details on WhatsApp',
      'hero.title': 'Learn. <span>Practice.</span> Master.',
      'hero.sub': 'M2R-Academy: programming and chess — ordered courses from zero to pro, no accounts, no hassle.',
      'hero.cta_courses': 'Start learning', 'hero.cta_how': 'How it works',
      'what.t': 'What is M2R-Academy?',
      'what.x': 'A learning platform founded by Mustafa, Malak and Rahma so any Arabic speaker can learn programming and chess — curated Egyptian content in clear tracks. Courses are paid — details and pricing on WhatsApp.',
      'target.t': 'Our target',
      'target.1': 'Arabic education for everyone in Egypt and the Middle East — details and pricing on WhatsApp.',
      'target.2': 'Clear order: step-by-step tracks so you never get lost.',
      'target.3': 'Fair competition: points and ranks that keep you going.',
      'tracks.t': 'Tracks', 'tracks.sub': 'Pick your path and start today.',
      'projects.t': 'Student projects', 'projects.sub': 'Real work from people like you.',
      'projects.more': 'All projects', 'projects.all': 'All',
      'lb.t': 'Top learners', 'lb.sub': 'Highest points on the platform.',
      'lb.more': 'Full ranking', 'lb.rank': 'Rank', 'lb.user': 'Learner',
      'lb.points': 'Points', 'lb.courses': 'Courses', 'lb.empty': 'No points yet — be the first!',
      'lb.login_hint': 'Log in to appear in the ranking.',
      'how.t': 'How it works',
      'how.1t': 'Pick a course', 'how.1x': 'Browse tracks and choose the part for your level.',
      'how.2t': 'Get Appline code', 'how.2x': 'Send us the code on WhatsApp and receive the unlock code.',
      'how.3t': 'Unlock & learn', 'how.3x': 'Watch with saved progress and collect points.',
      'common.view': 'Explore →', 'common.coming': 'Soon', 'common.videos': 'videos',
      'common.parts': 'parts', 'common.loading': 'Loading…', 'common.retry': 'Retry',
      'common.load_fail': 'Content failed to load. Check connection and retry.',
      'about.hero_t': 'About us', 'about.hero_s': 'Our story, goal and method.',
      'story.t': 'Our story',
      'story.x': 'M2R-Academy started with a simple idea from Mustafa, Malak and Rahma: good Arabic content exists but scattered — so we gathered the best Egyptian courses into clear tracks. Courses are paid — contact us on WhatsApp for details and pricing.',
      'mission.t': 'Mission', 'mission.x': 'Help any Arab youth gain a real skill for the job market.',
      'vision.t': 'Vision', 'vision.x': 'The biggest Arab learning community: learning, competing, working.',
      'method.t': 'Learning method',
      'method.x': 'Learn at your pace: every track is split into parts, videos in order. Take a code, send it to Appline on WhatsApp, get the unlock code — no accounts, no subscriptions.',
      'founders.t': 'Founders', 'role.founder': 'Academy founder', 'role.tba': 'Role soon',
      'quote.t': 'Fuel', 'quote.x': '"Nobody is born a pro — every expert was a beginner who refused to quit."',
      'faq.t': 'FAQ',
      'faq.q1': 'Are courses free?', 'faq.a1': 'No — courses are paid. Details and pricing on WhatsApp.',
      'faq.q2': 'Do I need an account to watch?', 'faq.a2': 'No. Browsing and unlocked watching need no account. Accounts are only for points and ranks.',
      'faq.q3': 'How do I unlock a course?', 'faq.a3': 'Pick a part, take the code, send it to Appline on WhatsApp, receive the unlock code.',
      'faq.q4': 'Are certificates accredited?',       'faq.a4': 'No — this is hands-on learning. The skill you gain is the real certificate.',
      'faq.q5': 'Can I submit my project?', 'faq.a5': 'Sure! Send it on the academy WhatsApp and we will feature it.',
      'faq.q6': 'Can videos be downloaded?', 'faq.a6': 'Watching happens inside the platform only, to respect content owners.',
      'courses.t': 'Courses', 'courses.sub': 'Pick the right track and start.',
      'detail.back': '← All tracks', 'detail.back_track': '← Back to track',
      'detail.videos_t': 'Course videos', 'detail.choose': 'Choose your part',
      'detail.enroll': 'Get the code', 'detail.continue': '▶ Continue course',
      'detail.locked': '🔒 Locked', 'detail.unlocked': '✓ Unlocked',
      'enroll.t': 'Unlock course', 'enroll.course': 'Course:',
      'enroll.step1': 'Take this code and send it to Appline on WhatsApp:',
      'enroll.copy': 'Copy', 'enroll.copied': '✓ Copied',
      'enroll.regen': '↻ New code', 'enroll.wa': 'Send on WhatsApp',
      'enroll.step2': 'Enter the unlock code Appline sent you:',
      'enroll.otp': 'Unlock code (8 chars)',
      'enroll.verify': 'Verify & unlock',
      'enroll.note': 'Contact your Appline and enter the OTP code it gives you.',
      'enroll.err_short': 'Enter the full code (8 chars).',
      'enroll.err_wrong': 'Wrong code. Try again.',
      'enroll.ok': 'Unlocked! Good luck 🎉',
      'watch.back': '← Back to course', 'watch.playlist_t': 'Course content',
      'watch.unavailable': 'Video unavailable now. Try the next one.',
      'watch.next': 'Next video →',
      'auth.login_t': 'Log in', 'auth.login_sub': 'Welcome back!',
      'auth.email': 'Email', 'auth.password': 'Password',
      'auth.signin': 'Log in', 'auth.no_account': "New here?",
      'auth.has_account': 'Have an account?', 'auth.create_link': 'Sign up',
      'auth.login_link': 'Log in',
      'auth.signup_t': 'Sign up', 'auth.signup_sub': 'Account — your points and rank on any device.',
      'auth.name': 'Name', 'auth.confirm': 'Confirm password',
      'auth.terms': 'I agree to the terms',
      'auth.create': 'Create account', 'auth.back': '← Back to login',
      'auth.err_fill': 'Fill in all fields.', 'auth.err_short': 'Password needs 6+ characters.',
      'auth.err_match': 'Passwords do not match.', 'auth.err_terms': 'You must accept the terms.',
      'auth.err_noconfig': 'Online signup is not enabled yet.',
      'auth.err_bad': 'Wrong email or password.',
      'auth.err_used': 'Email already registered. Log in.',
      'auth.err_net': 'Network issue. Retry.',
      'auth.err_banned': 'This account is banned. Contact admin.',
      'auth.err_domain': 'Domain not authorized in Firebase — add it in Authorized domains.',
      'auth.created': 'Account created. Welcome! 🎉',
      'profile.t': 'My profile', 'profile.name': 'Name', 'profile.bio': 'About you',
      'profile.save': 'Save', 'profile.saved': 'Saved ✓',
      'profile.avatar': 'Photo (max 2MB)', 'profile.points': 'My points',
      'profile.rank': 'My rank', 'profile.courses_t': 'My courses',
      'profile.logout': 'Log out', 'profile.need_login': 'Log in to see your profile.',
      'admin.t': 'Admin panel', 'admin.denied': 'Admins only.',
      'admin.users_t': 'Users', 'admin.pts': 'Points',
      'admin.ann_t': 'Announcements', 'admin.ann_ph': 'Write announcement…',
      'admin.save': 'Save', 'admin.saved': 'Saved ✓',
      'admin.projects_t': 'Projects', 'admin.comp_t': 'Competitions',
      'admin.add': 'Add', 'admin.del': 'Delete', 'admin.ban': 'Ban', 'admin.unban': 'Unban',
      'admin.banned': 'Banned', 'admin.title_ph': 'Title', 'admin.del_confirm': 'Sure?',
      'contact.t': 'Contact us', 'contact.sub': 'Message anytime — we reply fast.',
      'contact.founder': 'Mustafa — Academy founder',
      'contact.wa': 'Chat on WhatsApp', 'contact.channels_t': 'Content channels',
      'contact.projects_note': 'Have a project? Send it and we will feature you.',
      'e404.t': 'Page not found', 'e404.x': 'This link leads nowhere.',
      'e404.home': '← Back home'
    }
  };

  var listeners = [];

  function getLang() {
    try {
      var l = window.localStorage.getItem(LANG_KEY);
      return l === 'en' ? 'en' : 'ar';
    } catch (e) { return 'ar'; }
  }

  function t(key) {
    var lang = getLang();
    if (I18N[lang] && I18N[lang][key] != null) return I18N[lang][key];
    if (I18N.ar[key] != null) return I18N.ar[key];
    return key;
  }

  function applyI18n(root) {
    var lang = getLang();
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    var scope = root || document;
    Array.prototype.forEach.call(scope.querySelectorAll('[data-i18n]'), function (el) {
      el.textContent = t(el.getAttribute('data-i18n'));
    });
    Array.prototype.forEach.call(scope.querySelectorAll('[data-i18n-html]'), function (el) {
      el.innerHTML = t(el.getAttribute('data-i18n-html'));
    });
    Array.prototype.forEach.call(scope.querySelectorAll('[data-i18n-ph]'), function (el) {
      el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph')));
    });
    Array.prototype.forEach.call(scope.querySelectorAll('[data-i18n-aria]'), function (el) {
      el.setAttribute('aria-label', t(el.getAttribute('data-i18n-aria')));
    });
  }

  function setLang(lang) {
    try { window.localStorage.setItem(LANG_KEY, lang === 'en' ? 'en' : 'ar'); } catch (e) {}
    renderChrome();
    applyI18n();
    listeners.forEach(function (fn) { try { fn(getLang()); } catch (e) {} });
  }

  function onLang(fn) { listeners.push(fn); }

  function esc(s) {
    return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function toast(msg, type) {
    var el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast toast--visible' + (type ? ' toast--' + type : '');
    el.hidden = false;
    if (toast._t) clearTimeout(toast._t);
    toast._t = setTimeout(function () { el.classList.remove('toast--visible'); el.hidden = true; }, 3000);
  }

  function getParam(name) {
    try { return new URLSearchParams(window.location.search).get(name); }
    catch (e) { return null; }
  }

  function loadJSON(path) {
    return fetch(path, { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error('http ' + r.status);
      return r.json();
    });
  }

  var TRACKS_META = [
    { id: 'programming', icon: '💻' }, { id: 'web', icon: '🌐' },
    { id: 'chess', icon: '♞' }, { id: 'cybersecurity', icon: '🛡️' }
  ];

  function renderChrome() {
    var page = document.body.getAttribute('data-page') || '';
    var lang = getLang();
    var L = function (id, key) {
      return '<a class="site-nav__link' + (page === id ? ' site-nav__link--active' : '') +
        '" href="' + id + '.html">' + esc(t(key)) + '</a>';
    };
    var h = document.getElementById('site-header');
    if (h) {
      h.className = 'site-header';
      h.innerHTML =
        '<div class="site-header__inner">' +
        '<a class="site-header__brand" href="index.html">' +
        '<img class="site-header__logo" src="assets/logo.svg" alt="M2R" />' +
        '<span>' + esc(t('brand')) + '</span></a>' +
        '<button class="hamburger" id="nav-toggle" aria-label="' + esc(t('nav.menu')) + '">☰</button>' +
        '<nav class="site-nav" id="site-nav" aria-label="main">' +
        L('index', 'nav.home') + L('about', 'nav.about') + L('courses', 'nav.courses') +
        L('projects', 'nav.projects') + L('leaderboard', 'nav.leaderboard') + L('contact', 'nav.contact') +
        '<span id="nav-auth"></span></nav>' +
        '<div class="header-actions"><button class="lang-toggle" id="lang-toggle">' +
        esc(t('lang.name')) + '</button></div></div>';
      var tg = document.getElementById('nav-toggle');
      if (tg) tg.addEventListener('click', function () {
        document.getElementById('site-nav').classList.toggle('site-nav--open');
      });
      var lt = document.getElementById('lang-toggle');
      if (lt) lt.addEventListener('click', function () { setLang(lang === 'ar' ? 'en' : 'ar'); });
    }
    var f = document.getElementById('site-footer');
    if (f) {
      var li = function (id, key) {
        return '<li><a href="' + id + '.html">' + esc(t(key)) + '</a></li>';
      };
      var links = '<ul>' + li('index', 'nav.home') + li('about', 'nav.about') +
        li('courses', 'nav.courses') + li('projects', 'nav.projects') +
        li('leaderboard', 'nav.leaderboard') + li('contact', 'nav.contact') + '</ul>';
      var tracks = '<ul>' + TRACKS_META.map(function (m) {
        return '<li><a href="track.html?track=' + m.id + '">' + m.icon +
          ' <span data-track-name="' + m.id + '">' + m.id + '</span></a></li>';
      }).join('') + '</ul>';
      f.className = 'site-footer';
      f.innerHTML =
        '<div class="site-footer__inner"><div><h3>' + esc(t('brand')) + '</h3>' +
        '<p><strong>' + esc(t('footer.about_t')) + '</strong><br>' + esc(t('footer.about_x')) + '</p></div>' +
        '<div><h3>' + esc(t('footer.links_t')) + '</h3>' + links + '</div>' +
        '<div><h3>' + esc(t('footer.tracks_t')) + '</h3>' + tracks + '</div>' +
        '<div><h3>' + esc(t('footer.sources_t')) + '</h3><ul>' +
        '<li>Elzero Web School</li><li>codeZone</li><li>Codezilla</li>' +
        '<li>Takkat Chess</li><li>Udemy</li></ul></div></div>' +
        '<div class="site-footer__bottom">' + esc(t('footer.rights')) + '<br>' +
        esc(t('footer.disclaimer')) + '</div>';
    }
    if (window.M2RAuth && window.M2RAuth.refreshHeader) {
      try { window.M2RAuth.refreshHeader(); } catch (e) {}
    }
    // Localize footer track names from data (quietly keeps working if offline).
    try {
      loadJSON('data/courses.json').then(function (d) {
        var lang = getLang();
        (d.tracks || []).forEach(function (tr) {
          var el = document.querySelector('[data-track-name="' + tr.id + '"]');
          if (el) el.textContent = lang === 'en' ? (tr.titleEn || tr.title) : tr.title;
        });
      }).catch(function () {});
    } catch (e) {}
  }

  document.addEventListener('DOMContentLoaded', function () {
    renderChrome();
    applyI18n();
  });

  window.M2R = {
    t: t, lang: getLang, setLang: setLang, onLang: onLang,
    esc: esc, toast: toast, getParam: getParam, loadJSON: loadJSON,
    applyI18n: applyI18n, renderChrome: renderChrome, TRACKS_META: TRACKS_META
  };
})();
