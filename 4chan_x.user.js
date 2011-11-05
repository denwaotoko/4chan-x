// ==UserScript==
// @name           4chan x
// @version        2.20.2
// @namespace      aeosynth
// @description    Adds various features.
// @copyright      2009-2011 James Campos <james.r.campos@gmail.com>
// @license        MIT; http://en.wikipedia.org/wiki/Mit_license
// @include        http://boards.4chan.org/*
// @include        http://sys.4chan.org/*
// @updateURL      https://raw.github.com/aeosynth/4chan-x/stable/4chan_x.user.js
// @icon           https://raw.github.com/aeosynth/4chan-x/gh-pages/favicon.png
// ==/UserScript==

/* LICENSE
 *
 * Copyright (c) 2009-2011 James Campos <james.r.campos@gmail.com>
 * http://aeosynth.github.com/4chan-x/
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */

/* HACKING
 *
 * 4chan x is written in CoffeeScript[1], and developed on github[2].
 *
 * [1]: http://jashkenas.github.com/coffee-script/
 * [2]: http://github.com/aeosynth/4chan-x
 */

/* CONTRIBUTORS
 *
 * Zixaphir - fix qr textarea - captcha-image gap
 * Mayhem - various features / fixes
 * Ongpot - sfw favicon
 * thisisanon - nsfw + 404 favicons
 * Anonymous - empty favicon
 * Seiba - chrome quick reply focusing
 * herpaderpderp - recaptcha fixes
 * wakimoko - recaptcha tab order http://userscripts.org/scripts/show/82657
 * xat- new favicons
 *
 * All the people who've taken the time to write bug reports.
 *
 * Thank you.
 */

(function() {
  var $, $$, DAY, Favicon, HOUR, MINUTE, Main, NAMESPACE, Recaptcha, SECOND, Time, VERSION, anonymize, conf, config, cooldown, d, expandComment, expandThread, firstRun, g, getTitle, imgExpand, imgGif, imgHover, imgPreloading, key, keybinds, log, nav, nodeInserted, options, qr, quoteBacklink, quoteInline, quoteOP, quotePreview, redirect, replyHiding, reportButton, revealSpoilers, sauce, threadHiding, threadStats, threading, titlePost, ui, unread, updater, val, watcher;
  var __slice = Array.prototype.slice;
  config = {
    main: {
      Enhancing: {
        '404 Redirect': [true, 'Redirect dead threads'],
        'Anonymize': [false, 'Make everybody anonymous'],
        'Keybinds': [true, 'Binds actions to keys'],
        'Time Formatting': [true, 'Arbitrarily formatted timestamps, using your local time'],
        'Report Button': [true, 'Add report buttons'],
        'Comment Expansion': [true, 'Expand too long comments'],
        'Thread Expansion': [true, 'View all replies'],
        'Index Navigation': [true, 'Navigate to previous / next thread'],
        'Reply Navigation': [false, 'Navigate to top / bottom of thread'],
        'Check for Updates': [true, 'Check for updated versions of 4chan X']
      },
      Hiding: {
        'Reply Hiding': [true, 'Hide single replies'],
        'Thread Hiding': [true, 'Hide entire threads'],
        'Show Stubs': [true, 'Of hidden threads / replies']
      },
      Imaging: {
        'Image Auto-Gif': [false, 'Animate gif thumbnails'],
        'Image Expansion': [true, 'Expand images'],
        'Image Hover': [false, 'Show full image on mouseover'],
        'Image Preloading': [false, 'Preload Images'],
        'Sauce': [true, 'Add sauce to images'],
        'Reveal Spoilers': [false, 'Replace spoiler thumbnails by the original thumbnail']
      },
      Monitoring: {
        'Thread Updater': [true, 'Update threads. Has more options in its own dialog.'],
        'Unread Count': [true, 'Show unread post count in tab title'],
        'Post in Title': [true, 'Show the op\'s post in the tab title'],
        'Thread Stats': [true, 'Display reply and image count'],
        'Thread Watcher': [true, 'Bookmark threads'],
        'Auto Watch': [true, 'Automatically watch threads that you start'],
        'Auto Watch Reply': [false, 'Automatically watch threads that you reply to']
      },
      Posting: {
        'Auto Noko': [true, 'Always redirect to your post'],
        'Cooldown': [true, 'Prevent \'flood detected\' errors'],
        'Quick Reply': [true, 'Reply without leaving the page'],
        'Persistent QR': [false, 'Quick reply won\'t disappear after posting. Only in replies.'],
        'Auto Hide QR': [true, 'Automatically auto-hide the quick reply when posting'],
        'Remember Spoiler': [false, 'Remember the spoiler state, instead of resetting after posting']
      },
      Quoting: {
        'Quote Backlinks': [true, 'Add quote backlinks'],
        'OP Backlinks': [false, 'Add backlinks to the OP'],
        'Quote Highlighting': [true, 'Highlight the previewed post'],
        'Quote Inline': [true, 'Show quoted post inline on quote click'],
        'Quote Preview': [true, 'Show quote content on hover'],
        'Indicate OP quote': [true, 'Add \'(OP)\' to OP quotes']
      }
    },
    flavors: ['http://iqdb.org/?url=', 'http://google.com/searchbyimage?image_url=', '#http://regex.info/exif.cgi?url=', '#http://tineye.com/search?url=', '#http://saucenao.com/search.php?db=999&url=', '#http://imgur.com/upload?url='].join('\n'),
    time: '%m/%d/%y(%a)%H:%M',
    backlink: '>>%id',
    hotkeys: {
      close: 'Esc',
      spoiler: 'ctrl+s',
      openQR: 'i',
      openEmptyQR: 'I',
      submit: 'alt+s',
      nextReply: 'J',
      previousReply: 'K',
      nextThread: 'n',
      previousThread: 'p',
      nextPage: 'L',
      previousPage: 'H',
      zero: '0',
      openThreadTab: 'o',
      openThread: 'O',
      expandThread: 'e',
      watch: 'w',
      hide: 'x',
      expandImages: 'm',
      expandAllImages: 'M',
      update: 'u',
      unreadCountTo0: 'z'
    },
    updater: {
      checkbox: {
        'Scrolling': [false, 'Scroll updated posts into view. Only enabled at bottom of page.'],
        'Scroll BG': [false, 'Scroll background tabs'],
        'Verbose': [true, 'Show countdown timer, new post count'],
        'Auto Update': [true, 'Automatically fetch new posts']
      },
      'Interval': 30
    }
  };
  if (typeof console !== "undefined" && console !== null) {
    log = function(arg) {
      return console.log(arg);
    };
  }
  if (!Object.keys) {
    Object.keys = function(o) {
      var key, _results;
      _results = [];
      for (key in o) {
        _results.push(key);
      }
      return _results;
    };
  }
  conf = {};
  (function(parent, obj) {
    var key, val, _results;
    if (obj.length) {
      if (typeof obj[0] === 'boolean') {
        return conf[parent] = obj[0];
      } else {
        return conf[parent] = obj;
      }
    } else if (typeof obj === 'object') {
      _results = [];
      for (key in obj) {
        val = obj[key];
        _results.push(arguments.callee(key, val));
      }
      return _results;
    } else {
      return conf[parent] = obj;
    }
  })(null, config);
  NAMESPACE = 'AEOS.4chan_x.';
  VERSION = '2.20.2';
  SECOND = 1000;
  MINUTE = 60 * SECOND;
  HOUR = 60 * MINUTE;
  DAY = 24 * HOUR;
  d = document;
  g = {
    callbacks: []
  };
  ui = {
    dialog: function(id, position, html) {
      var el, saved;
      el = d.createElement('div');
      el.className = 'reply dialog';
      el.innerHTML = html;
      el.id = id;
      el.style.cssText = (saved = localStorage["" + NAMESPACE + id + ".position"]) ? saved : position;
      el.querySelector('div.move').addEventListener('mousedown', ui.dragstart, false);
      return el;
    },
    dragstart: function(e) {
      var el, rect;
      e.preventDefault();
      ui.el = el = this.parentNode;
      d.addEventListener('mousemove', ui.drag, false);
      d.addEventListener('mouseup', ui.dragend, false);
      rect = el.getBoundingClientRect();
      ui.dx = e.clientX - rect.left;
      ui.dy = e.clientY - rect.top;
      ui.width = d.body.clientWidth - el.offsetWidth;
      return ui.height = d.body.clientHeight - el.offsetHeight;
    },
    drag: function(e) {
      var bottom, el, left, right, style, top;
      el = ui.el;
      left = e.clientX - ui.dx;
      if (left < 10) {
        left = '0';
      } else if (ui.width - left < 10) {
        left = null;
      }
      right = left ? null : 0;
      top = e.clientY - ui.dy;
      if (top < 10) {
        top = '0';
      } else if (ui.height - top < 10) {
        top = null;
      }
      bottom = top ? null : 0;
      style = el.style;
      style.top = top;
      style.right = right;
      style.bottom = bottom;
      return style.left = left;
    },
    dragend: function() {
      var el, id;
      el = ui.el;
      id = el.id;
      localStorage["" + NAMESPACE + id + ".position"] = el.style.cssText;
      d.removeEventListener('mousemove', ui.drag, false);
      return d.removeEventListener('mouseup', ui.dragend, false);
    },
    hover: function(e) {
      var clientHeight, clientWidth, clientX, clientY, el, height, style, top, _ref;
      clientX = e.clientX, clientY = e.clientY;
      el = ui.el;
      style = el.style;
      _ref = d.body, clientHeight = _ref.clientHeight, clientWidth = _ref.clientWidth;
      height = el.offsetHeight;
      top = clientY - 120;
      style.top = clientHeight < height || top < 0 ? 0 : top + height > clientHeight ? clientHeight - height : top;
      if (clientX < clientWidth - 400) {
        style.left = clientX + 45;
        return style.right = null;
      } else {
        style.left = null;
        return style.right = clientWidth - clientX + 45;
      }
    },
    hoverend: function(e) {
      return ui.el.parentNode.removeChild(ui.el);
    }
  };
  /*
  loosely follows the jquery api:
  http://api.jquery.com/
  not chainable
  */
  $ = function(selector, root) {
    if (root == null) {
      root = d.body;
    }
    return root.querySelector(selector);
  };
  $.extend = function(object, properties) {
    var key, val;
    for (key in properties) {
      val = properties[key];
      object[key] = val;
    }
    return object;
  };
  $.extend($, {
    id: function(id) {
      return d.getElementById(id);
    },
    globalEval: function(code) {
      var script;
      script = $.el('script', {
        textContent: "(" + code + ")()"
      });
      $.add(d.head, script);
      return $.rm(script);
    },
    ajax: function(url, cb, type) {
      var r;
      if (type == null) {
        type = 'get';
      }
      r = new XMLHttpRequest();
      r.onload = cb;
      r.open(type, url, true);
      r.send();
      return r;
    },
    cache: function(url, cb) {
      var req;
      if (req = $.cache.requests[url]) {
        if (req.readyState === 4) {
          return cb.call(req);
        } else {
          return req.callbacks.push(cb);
        }
      } else {
        req = $.ajax(url, (function() {
          var cb, _i, _len, _ref, _results;
          _ref = this.callbacks;
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            cb = _ref[_i];
            _results.push(cb.call(this));
          }
          return _results;
        }));
        req.callbacks = [cb];
        return $.cache.requests[url] = req;
      }
    },
    cb: {
      checked: function() {
        $.set(this.name, this.checked);
        return conf[this.name] = this.checked;
      },
      value: function() {
        $.set(this.name, this.value);
        return conf[this.name] = this.value;
      }
    },
    addStyle: function(css) {
      var style;
      style = $.el('style', {
        textContent: css
      });
      $.add(d.head, style);
      return style;
    },
    x: function(path, root) {
      if (root == null) {
        root = d.body;
      }
      return d.evaluate(path, root, null, XPathResult.ANY_UNORDERED_NODE_TYPE, null).singleNodeValue;
    },
    tn: function(s) {
      return d.createTextNode(s);
    },
    replace: function(root, el) {
      return root.parentNode.replaceChild(el, root);
    },
    addClass: function(el, className) {
      return el.classList.add(className);
    },
    removeClass: function(el, className) {
      return el.classList.remove(className);
    },
    rm: function(el) {
      return el.parentNode.removeChild(el);
    },
    add: function() {
      var child, children, parent, _i, _len, _results;
      parent = arguments[0], children = 2 <= arguments.length ? __slice.call(arguments, 1) : [];
      _results = [];
      for (_i = 0, _len = children.length; _i < _len; _i++) {
        child = children[_i];
        _results.push(parent.appendChild(child));
      }
      return _results;
    },
    prepend: function(parent, child) {
      return parent.insertBefore(child, parent.firstChild);
    },
    after: function(root, el) {
      return root.parentNode.insertBefore(el, root.nextSibling);
    },
    before: function(root, el) {
      return root.parentNode.insertBefore(el, root);
    },
    el: function(tag, properties) {
      var el;
      el = d.createElement(tag);
      if (properties) {
        $.extend(el, properties);
      }
      return el;
    },
    bind: function(el, eventType, handler) {
      return el.addEventListener(eventType, handler, false);
    },
    unbind: function(el, eventType, handler) {
      return el.removeEventListener(eventType, handler, false);
    },
    isDST: function() {
      /*
             http://en.wikipedia.org/wiki/Daylight_saving_time_in_the_United_States
             Since 2007, daylight saving time starts on the second Sunday of March
             and ends on the first Sunday of November, with all time changes taking
             place at 2:00 AM (0200) local time.
          */
      var date, month, sunday;
      date = new Date();
      month = date.getMonth();
      if (month < 2 || 10 < month) {
        return false;
      }
      if ((2 < month && month < 10)) {
        return true;
      }
      sunday = date.getDate() - date.getDay();
      if (month === 2) {
        if (sunday < 8) {
          return false;
        }
        if (sunday < 15 && date.getDay() === 0) {
          if (date.getHour() < 1) {
            return false;
          }
          return true;
        }
        return true;
      }
      if (sunday < 1) {
        return true;
      }
      if (sunday < 8 && date.getDay() === 0) {
        if (date.getHour() < 1) {
          return true;
        }
        return false;
      }
      return false;
    }
  });
  $.cache.requests = {};
  if (typeof GM_deleteValue !== "undefined" && GM_deleteValue !== null) {
    $.extend($, {
      "delete": function(name) {
        name = NAMESPACE + name;
        return GM_deleteValue(name);
      },
      get: function(name, defaultValue) {
        var value;
        name = NAMESPACE + name;
        if (value = GM_getValue(name)) {
          return JSON.parse(value);
        } else {
          return defaultValue;
        }
      },
      openInTab: function(url) {
        return GM_openInTab(url);
      },
      set: function(name, value) {
        name = NAMESPACE + name;
        localStorage[name] = JSON.stringify(value);
        return GM_setValue(name, JSON.stringify(value));
      }
    });
  } else {
    $.extend($, {
      "delete": function(name) {
        name = NAMESPACE + name;
        return delete localStorage[name];
      },
      get: function(name, defaultValue) {
        var value;
        name = NAMESPACE + name;
        if (value = localStorage[name]) {
          return JSON.parse(value);
        } else {
          return defaultValue;
        }
      },
      openInTab: function(url) {
        return window.open(url, "_blank");
      },
      set: function(name, value) {
        name = NAMESPACE + name;
        return localStorage[name] = JSON.stringify(value);
      }
    });
  }
  for (key in conf) {
    val = conf[key];
    conf[key] = $.get(key, val);
  }
  $$ = function(selector, root) {
    if (root == null) {
      root = d.body;
    }
    return Array.prototype.slice.call(root.querySelectorAll(selector));
  };
  expandComment = {
    init: function() {
      var a, _i, _len, _ref, _results;
      _ref = $$('span.abbr a');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        a = _ref[_i];
        _results.push($.bind(a, 'click', expandComment.expand));
      }
      return _results;
    },
    expand: function(e) {
      var a, replyID, threadID, _, _ref;
      e.preventDefault();
      _ref = this.href.match(/(\d+)#(\d+)/), _ = _ref[0], threadID = _ref[1], replyID = _ref[2];
      this.textContent = "Loading " + replyID + "...";
      threadID = this.pathname.split('/').pop() || $.x('ancestor::div[@class="thread"]/div', this).id;
      a = this;
      return $.cache(this.pathname, (function() {
        return expandComment.parse(this, a, threadID, replyID);
      }));
    },
    parse: function(req, a, threadID, replyID) {
      var body, bq, quote, reply, _i, _j, _len, _len2, _ref, _ref2;
      if (req.status !== 200) {
        a.textContent = "" + req.status + " " + req.statusText;
        return;
      }
      body = $.el('body', {
        innerHTML: req.responseText
      });
      if (threadID === replyID) {
        bq = $('blockquote', body);
      } else {
        _ref = $$('td[id]', body);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          reply = _ref[_i];
          if (reply.id === replyID) {
            bq = $('blockquote', reply);
            break;
          }
        }
      }
      _ref2 = $$('a.quotelink', bq);
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        quote = _ref2[_j];
        if (quote.getAttribute('href') === quote.hash) {
          quote.pathname = "/" + g.BOARD + "/res/" + threadID;
        }
        if (quote.hash.slice(1) === threadID) {
          quote.innerHTML += '&nbsp;(OP)';
        }
        if (conf['Quote Preview']) {
          $.bind(quote, 'mouseover', quotePreview.mouseover);
          $.bind(quote, 'mousemove', ui.hover);
          $.bind(quote, 'mouseout', quotePreview.mouseout);
        }
        if (conf['Quote Inline']) {
          $.bind(quote, 'click', quoteInline.toggle);
        }
      }
      return $.replace(a.parentNode.parentNode, bq);
    }
  };
  expandThread = {
    init: function() {
      var a, span, _i, _len, _ref, _results;
      _ref = $$('span.omittedposts');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        span = _ref[_i];
        a = $.el('a', {
          textContent: "+ " + span.textContent,
          className: 'omittedposts'
        });
        $.bind(a, 'click', expandThread.cb.toggle);
        _results.push($.replace(span, a));
      }
      return _results;
    },
    cb: {
      toggle: function(e) {
        var thread;
        thread = this.parentNode;
        return expandThread.toggle(thread);
      }
    },
    toggle: function(thread) {
      var a, backlink, num, pathname, prev, table, threadID, _i, _len, _ref, _ref2, _results;
      threadID = thread.firstChild.id;
      pathname = "/" + g.BOARD + "/res/" + threadID;
      a = $('a.omittedposts', thread);
      switch (a.textContent[0]) {
        case '+':
          if ((_ref = $('.op .container', thread)) != null) {
            _ref.innerHTML = '';
          }
          a.textContent = a.textContent.replace('+', 'X Loading...');
          return $.cache(pathname, (function() {
            return expandThread.parse(this, pathname, thread, a);
          }));
        case 'X':
          a.textContent = a.textContent.replace('X Loading...', '+');
          return $.cache[pathname].abort();
        case '-':
          a.textContent = a.textContent.replace('-', '+');
          num = (function() {
            switch (g.BOARD) {
              case 'b':
                return 3;
              case 't':
                return 1;
              default:
                return 5;
            }
          })();
          table = $.x("following::br[@clear][1]/preceding::table[" + num + "]", a);
          while ((prev = table.previousSibling) && (prev.nodeName === 'TABLE')) {
            $.rm(prev);
          }
          _ref2 = $$('.op a.backlink');
          _results = [];
          for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
            backlink = _ref2[_i];
            _results.push(!$.id(backlink.hash.slice(1)) ? $.rm(backlink) : void 0);
          }
          return _results;
      }
    },
    parse: function(req, pathname, thread, a) {
      var body, br, href, link, next, quote, reply, table, tables, _i, _j, _k, _len, _len2, _len3, _ref, _ref2, _results;
      if (req.status !== 200) {
        a.textContent = "" + req.status + " " + req.statusText;
        $.unbind(a, 'click', expandThread.cb.toggle);
        return;
      }
      a.textContent = a.textContent.replace('X Loading...', '-');
      while ((next = a.nextSibling) && !next.clear) {
        $.rm(next);
      }
      br = next;
      body = $.el('body', {
        innerHTML: req.responseText
      });
      _ref = $$('td[id]', body);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        reply = _ref[_i];
        _ref2 = $$('a.quotelink', reply);
        for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
          quote = _ref2[_j];
          if ((href = quote.getAttribute('href')) === quote.hash) {
            quote.pathname = pathname;
          } else if (href !== quote.href) {
            quote.href = "res/" + href;
          }
        }
        link = $('a.quotejs', reply);
        link.href = "res/" + thread.firstChild.id + "#" + reply.id;
        link.nextSibling.href = "res/" + thread.firstChild.id + "#q" + reply.id;
      }
      tables = $$('form[name=delform] table', body);
      tables.pop();
      _results = [];
      for (_k = 0, _len3 = tables.length; _k < _len3; _k++) {
        table = tables[_k];
        _results.push($.before(br, table));
      }
      return _results;
    }
  };
  replyHiding = {
    init: function() {
      return g.callbacks.push(function(root) {
        var a, dd, id, reply;
        if (!(dd = $('td.doubledash', root))) {
          return;
        }
        dd.className = 'replyhider';
        a = $.el('a', {
          textContent: '[ - ]'
        });
        $.bind(a, 'click', replyHiding.cb.hide);
        $.replace(dd.firstChild, a);
        reply = dd.nextSibling;
        id = reply.id;
        if (id in g.hiddenReplies) {
          return replyHiding.hide(reply);
        }
      });
    },
    cb: {
      hide: function(e) {
        var reply;
        reply = this.parentNode.nextSibling;
        return replyHiding.hide(reply);
      },
      show: function(e) {
        var div, table;
        div = this.parentNode;
        table = div.nextSibling;
        replyHiding.show(table);
        return $.rm(div);
      }
    },
    hide: function(reply) {
      var a, div, id, name, table, trip, _ref;
      table = reply.parentNode.parentNode.parentNode;
      table.hidden = true;
      if (conf['Show Stubs']) {
        name = $('span.commentpostername', reply).textContent;
        trip = ((_ref = $('span.postertrip', reply)) != null ? _ref.textContent : void 0) || '';
        a = $.el('a', {
          textContent: "[ + ] " + name + " " + trip
        });
        $.bind(a, 'click', replyHiding.cb.show);
        div = $.el('div', {
          className: 'stub'
        });
        $.add(div, a);
        $.before(table, div);
      }
      id = reply.id;
      g.hiddenReplies[id] = Date.now();
      return $.set("hiddenReplies/" + g.BOARD + "/", g.hiddenReplies);
    },
    show: function(table) {
      var id;
      table.hidden = false;
      id = $('td[id]', table).id;
      delete g.hiddenReplies[id];
      return $.set("hiddenReplies/" + g.BOARD + "/", g.hiddenReplies);
    }
  };
  keybinds = {
    init: function() {
      var node, _i, _len, _ref;
      _ref = $$('[accesskey]');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        node = _ref[_i];
        node.removeAttribute('accesskey');
      }
      return $.bind(d, 'keydown', keybinds.keydown);
    },
    keydown: function(e) {
      var o, range, selEnd, selStart, ta, thread, valEnd, valMid, valStart, value, _ref, _ref2, _ref3;
      updater.focus = true;
      if (((_ref = e.target.nodeName) === 'TEXTAREA' || _ref === 'INPUT') && !e.altKey && !e.ctrlKey && !(e.keyCode === 27)) {
        return;
      }
      if (!(key = keybinds.keyCode(e))) {
        return;
      }
      thread = nav.getThread();
      switch (key) {
        case conf.close:
          if (o = $('#overlay')) {
            $.rm(o);
          } else if (qr.el) {
            qr.close();
          }
          break;
        case conf.spoiler:
          ta = e.target;
          if (ta.nodeName !== 'TEXTAREA') {
            return;
          }
          value = ta.value;
          selStart = ta.selectionStart;
          selEnd = ta.selectionEnd;
          valStart = value.slice(0, selStart) + '[spoiler]';
          valMid = value.slice(selStart, selEnd);
          valEnd = '[/spoiler]' + value.slice(selEnd);
          ta.value = valStart + valMid + valEnd;
          range = valStart.length + valMid.length;
          ta.setSelectionRange(range, range);
          break;
        case conf.zero:
          window.location = "/" + g.BOARD + "/0#0";
          break;
        case conf.openEmptyQR:
          keybinds.qr(thread);
          break;
        case conf.nextReply:
          keybinds.hl.next(thread);
          break;
        case conf.previousReply:
          keybinds.hl.prev(thread);
          break;
        case conf.expandAllImages:
          keybinds.img(thread, true);
          break;
        case conf.openThread:
          keybinds.open(thread);
          break;
        case conf.expandThread:
          expandThread.toggle(thread);
          break;
        case conf.openQR:
          keybinds.qr(thread, true);
          break;
        case conf.expandImages:
          keybinds.img(thread);
          break;
        case conf.nextThread:
          nav.next();
          break;
        case conf.openThreadTab:
          keybinds.open(thread, true);
          break;
        case conf.previousThread:
          nav.prev();
          break;
        case conf.update:
          updater.update();
          break;
        case conf.watch:
          watcher.toggle(thread);
          break;
        case conf.hide:
          threadHiding.toggle(thread);
          break;
        case conf.nextPage:
          if ((_ref2 = $('input[value=Next]')) != null) {
            _ref2.click();
          }
          break;
        case conf.previousPage:
          if ((_ref3 = $('input[value=Previous]')) != null) {
            _ref3.click();
          }
          break;
        case conf.submit:
          if (qr.el) {
            qr.submit.call($('form', qr.el));
          } else {
            $('.postarea form').submit();
          }
          break;
        case conf.unreadCountTo0:
          unread.replies.length = 0;
          unread.updateTitle();
          Favicon.update();
          break;
        default:
          return;
      }
      return e.preventDefault();
    },
    keyCode: function(e) {
      var c, kc;
      key = (function() {
        switch (kc = e.keyCode) {
          case 8:
            return '';
          case 27:
            return 'Esc';
          case 37:
            return 'Left';
          case 38:
            return 'Up';
          case 39:
            return 'Right';
          case 40:
            return 'Down';
          case 48:
          case 49:
          case 50:
          case 51:
          case 52:
          case 53:
          case 54:
          case 55:
          case 56:
          case 57:
          case 65:
          case 66:
          case 67:
          case 68:
          case 69:
          case 70:
          case 71:
          case 72:
          case 73:
          case 74:
          case 75:
          case 76:
          case 77:
          case 78:
          case 79:
          case 80:
          case 81:
          case 82:
          case 83:
          case 84:
          case 85:
          case 86:
          case 87:
          case 88:
          case 89:
          case 90:
            c = String.fromCharCode(kc);
            if (e.shiftKey) {
              return c;
            } else {
              return c.toLowerCase();
            }
            break;
          default:
            return null;
        }
      })();
      if (key) {
        if (e.altKey) {
          key = 'alt+' + key;
        }
        if (e.ctrlKey) {
          key = 'ctrl+' + key;
        }
      }
      return key;
    },
    img: function(thread, all) {
      var root, thumb;
      if (all) {
        return $("#imageExpand").click();
      } else {
        root = $('td.replyhl', thread) || thread;
        thumb = $('img[md5]', root);
        return imgExpand.toggle(thumb.parentNode);
      }
    },
    qr: function(thread, quote) {
      var qrLink;
      if (!(qrLink = $('td.replyhl span[id] a:not(:first-child)', thread))) {
        qrLink = $("span[id^=nothread] a:not(:first-child)", thread);
      }
      if (quote) {
        return qr.quote.call(qrLink);
      } else {
        if (!qr.el) {
          qr.dialog(qrLink);
        }
        return $('textarea', qr.el).focus();
      }
    },
    open: function(thread, tab) {
      var id, url;
      id = thread.firstChild.id;
      url = "http://boards.4chan.org/" + g.BOARD + "/res/" + id;
      if (tab) {
        return $.openInTab(url);
      } else {
        return location.href = url;
      }
    },
    hl: {
      next: function(thread) {
        var next, rect, replies, reply, td, top, _i, _len;
        if (td = $('td.replyhl', thread)) {
          td.className = 'reply';
          rect = td.getBoundingClientRect();
          if (rect.top > 0 && rect.bottom < d.body.clientHeight) {
            next = $.x('following::td[@class="reply"]', td);
            if ($.x('ancestor::div[@class="thread"]', next) !== thread) {
              return;
            }
            rect = next.getBoundingClientRect();
            if (rect.top > 0 && rect.bottom < d.body.clientHeight) {
              next.className = 'replyhl';
            }
            return;
          }
        }
        replies = $$('td.reply', thread);
        for (_i = 0, _len = replies.length; _i < _len; _i++) {
          reply = replies[_i];
          top = reply.getBoundingClientRect().top;
          if (top > 0) {
            reply.className = 'replyhl';
            return;
          }
        }
      },
      prev: function(thread) {
        var bot, height, prev, rect, replies, reply, td, _i, _len;
        if (td = $('td.replyhl', thread)) {
          td.className = 'reply';
          rect = td.getBoundingClientRect();
          if (rect.top > 0 && rect.bottom < d.body.clientHeight) {
            prev = $.x('preceding::td[@class="reply"][1]', td);
            rect = prev.getBoundingClientRect();
            if (rect.top > 0 && rect.bottom < d.body.clientHeight) {
              prev.className = 'replyhl';
            }
            return;
          }
        }
        replies = $$('td.reply', thread);
        replies.reverse();
        height = d.body.clientHeight;
        for (_i = 0, _len = replies.length; _i < _len; _i++) {
          reply = replies[_i];
          bot = reply.getBoundingClientRect().bottom;
          if (bot < height) {
            reply.className = 'replyhl';
            return;
          }
        }
      }
    }
  };
  nav = {
    init: function() {
      var next, prev, span;
      span = $.el('span', {
        id: 'navlinks'
      });
      prev = $.el('a', {
        textContent: '▲'
      });
      next = $.el('a', {
        textContent: '▼'
      });
      $.bind(prev, 'click', nav.prev);
      $.bind(next, 'click', nav.next);
      $.add(span, prev, $.tn(' '), next);
      return $.add(d.body, span);
    },
    prev: function() {
      return nav.scroll(-1);
    },
    next: function() {
      return nav.scroll(+1);
    },
    threads: [],
    getThread: function(full) {
      var bottom, i, rect, thread, _len, _ref;
      nav.threads = $$('div.thread:not([hidden])');
      _ref = nav.threads;
      for (i = 0, _len = _ref.length; i < _len; i++) {
        thread = _ref[i];
        rect = thread.getBoundingClientRect();
        bottom = rect.bottom;
        if (bottom > 0) {
          if (full) {
            return [thread, i, rect];
          }
          return thread;
        }
      }
      return null;
    },
    scroll: function(delta) {
      var i, rect, thread, top, _ref;
      if (g.REPLY) {
        if (delta === -1) {
          window.scrollTo(0, 0);
        } else {
          window.scrollTo(0, d.body.scrollHeight);
        }
        return;
      }
      _ref = nav.getThread(true), thread = _ref[0], i = _ref[1], rect = _ref[2];
      top = rect.top;
      if (!((delta === -1 && Math.ceil(top) < 0) || (delta === +1 && top > 1))) {
        i += delta;
      }
      if (i === -1) {
        if (g.PAGENUM === 0) {
          window.scrollTo(0, 0);
        } else {
          window.location = "" + (g.PAGENUM - 1) + "#0";
        }
        return;
      }
      if (delta === +1) {
        if (i === nav.threads.length || (innerHeight + pageYOffset === d.body.scrollHeight)) {
          if ($('table.pages input[value="Next"]')) {
            window.location = "" + (g.PAGENUM + 1) + "#0";
            return;
          }
        }
      }
      top = nav.threads[i].getBoundingClientRect().top;
      return window.scrollBy(0, top);
    }
  };
  options = {
    init: function() {
      var a, home;
      home = $('#navtopr a');
      a = $.el('a', {
        textContent: '4chan X'
      });
      $.bind(a, 'click', options.dialog);
      $.replace(home, a);
      home = $('#navbotr a');
      a = $.el('a', {
        textContent: '4chan X'
      });
      $.bind(a, 'click', options.dialog);
      return $.replace(home, a);
    },
    dialog: function() {
      var arr, checked, description, dialog, hiddenNum, hiddenThreads, html, input, key, li, main, obj, overlay, ul, _i, _len, _ref, _ref2;
      hiddenThreads = $.get("hiddenThreads/" + g.BOARD + "/", {});
      hiddenNum = Object.keys(g.hiddenReplies).length + Object.keys(hiddenThreads).length;
      html = "      <div class='reply dialog'>        <div id=optionsbar>          <div id=floaty>            <label for=main_tab>main</label> | <label for=flavors_tab>sauce</label> | <label for=rice_tab>rice</label> | <label for=keybinds_tab>keybinds</label>          </div>          <div id=credits>            <a href=http://aeosynth.github.com/4chan-x/>4chan X</a> |            <a href=https://github.com/aeosynth/4chan-x/issues>github</a> |            <a href=https://www.paypal.com/cgi-bin/webscr?cmd=_donations&business=2DBVZBUAM4DHC&lc=US&item_name=Aeosynth&currency_code=USD&bn=PP%2dDonationsBF%3abtn_donate_LG%2egif%3aNonHosted>donate</a>          </div>        </div>        <hr>        <div id=content>          <input type=radio name=tab hidden id=main_tab checked>          <div id=main></div>          <input type=radio name=tab hidden id=flavors_tab>          <textarea name=flavors id=flavors>" + conf['flavors'] + "</textarea>          <input type=radio name=tab hidden id=rice_tab>          <div id=rice>            <ul>              Backlink formatting              <li><input type=text name=backlink value='" + conf['backlink'] + "'> : <span id=backlinkPreview></span></li>            </ul>            <ul>              Time formatting              <li><input type=text name=time value='" + conf['time'] + "'> : <span id=timePreview></span></li>              <li>Supported <a href=http://en.wikipedia.org/wiki/Date_%28Unix%29#Formatting>format specifiers</a>:</li>              <li>Day: %a, %A, %d, %e</li>              <li>Month: %m, %b, %B</li>              <li>Year: %y</li>              <li>Hour: %k, %H, %l (lowercase L), %I (uppercase i), %p, %P</li>              <li>Minutes: %M</li>            </ul>          </div>          <input type=radio name=tab hidden id=keybinds_tab>          <div id=keybinds>            <table>              <tbody>                <tr><th>Actions</th><th>Keybinds</th></tr>                <tr><td>Close Options or QR</td><td><input type=text name=close></td></tr>                <tr><td>Quick spoiler</td><td><input type=text name=spoiler></td></tr>                <tr><td>Open QR with post number inserted</td><td><input type=text name=openQR></td></tr>                <tr><td>Open QR without post number inserted</td><td><input type=text name=openEmptyQR></td></tr>                <tr><td>Submit post</td><td><input type=text name=submit></td></tr>                <tr><td>Select next reply</td><td><input type=text name=nextReply ></td></tr>                <tr><td>Select previous reply</td><td><input type=text name=previousReply></td></tr>                <tr><td>See next thread</td><td><input type=text name=nextThread></td></tr>                <tr><td>See previous thread</td><td><input type=text name=previousThread></td></tr>                <tr><td>Jump to the next page</td><td><input type=text name=nextPage></td></tr>                <tr><td>Jump to the previous page</td><td><input type=text name=previousPage></td></tr>                <tr><td>Jump to page 0</td><td><input type=text name=zero></td></tr>                <tr><td>Open thread in current tab</td><td><input type=text name=openThread></td></tr>                <tr><td>Open thread in new tab</td><td><input type=text name=openThreadTab></td></tr>                <tr><td>Expand thread</td><td><input type=text name=expandThread></td></tr>                <tr><td>Watch thread</td><td><input type=text name=watch></td></tr>                <tr><td>Hide thread</td><td><input type=text name=hide></td></tr>                <tr><td>Expand selected image</td><td><input type=text name=expandImages></td></tr>                <tr><td>Expand all images</td><td><input type=text name=expandAllImages></td></tr>                <tr><td>Update now</td><td><input type=text name=update></td></tr>                <tr><td>Reset the unread count to 0</td><td><input type=text name=unreadCountTo0></td></tr>              </tbody>            </table>          </div>        </div>      </div>    ";
      dialog = $.el('div', {
        id: 'options',
        innerHTML: html
      });
      main = $('#main', dialog);
      _ref = config.main;
      for (key in _ref) {
        obj = _ref[key];
        ul = $.el('ul', {
          textContent: key
        });
        for (key in obj) {
          arr = obj[key];
          checked = conf[key] ? "checked" : "";
          description = arr[1];
          li = $.el('li', {
            innerHTML: "<label><input type=checkbox name='" + key + "' " + checked + ">" + key + "</label><span class=description>: " + description + "</span>"
          });
          $.bind($('input', li), 'click', $.cb.checked);
          $.add(ul, li);
        }
        $.add(main, ul);
      }
      li = $.el('li', {
        innerHTML: "<button>hidden: " + hiddenNum + "</button> <span class=description>: Forget all hidden posts. Useful if you accidentally hide a post and have `show stubs` disabled."
      });
      $.bind($('button', li), 'click', options.clearHidden);
      $.add($('ul:nth-child(2)', dialog), li);
      $.bind($('#flavors', dialog), 'change', $.cb.value);
      $.bind($('input[name=time]', dialog), 'keyup', options.time);
      $.bind($('input[name=backlink]', dialog), 'keyup', options.backlink);
      _ref2 = $$('#keybinds input', dialog);
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        input = _ref2[_i];
        input.value = conf[input.name];
        $.bind(input, 'keydown', options.keybind);
      }
      /*
          Two parent divs are necessary to center on all browsers.
      
          Only one when Firefox and Opera will support flexboxes correctly.
          https://bugzilla.mozilla.org/show_bug.cgi?id=579776
          */
      overlay = $.el('div', {
        id: 'overlay'
      });
      $.add(overlay, dialog);
      $.add(d.body, overlay);
      options.time.call($('input[name=time]', dialog));
      options.backlink.call($('input[name=backlink]', dialog));
      $.bind(overlay, 'click', function() {
        return $.rm(overlay);
      });
      return $.bind(dialog.firstElementChild, 'click', function(e) {
        return e.stopPropagation();
      });
    },
    clearHidden: function(e) {
      $["delete"]("hiddenReplies/" + g.BOARD + "/");
      $["delete"]("hiddenThreads/" + g.BOARD + "/");
      this.textContent = "hidden: 0";
      return g.hiddenReplies = {};
    },
    keybind: function(e) {
      e.preventDefault();
      e.stopPropagation();
      if ((key = keybinds.keyCode(e)) == null) {
        return;
      }
      this.value = key;
      $.set(this.name, key);
      return conf[this.name] = key;
    },
    time: function(e) {
      $.set('time', this.value);
      conf['time'] = this.value;
      Time.foo();
      Time.date = new Date();
      return $('#timePreview').textContent = Time.funk(Time);
    },
    backlink: function(e) {
      $.set('backlink', this.value);
      conf['backlink'] = this.value;
      return $('#backlinkPreview').textContent = conf['backlink'].replace(/%id/, '123456789');
    }
  };
  cooldown = {
    init: function() {
      var match, time, _;
      if (match = location.search.match(/cooldown=(\d+)/)) {
        _ = match[0], time = match[1];
        if ($.get(g.BOARD + '/cooldown', 0) < time) {
          $.set(g.BOARD + '/cooldown', time);
        }
      }
      if (Date.now() < $.get(g.BOARD + '/cooldown', 0)) {
        cooldown.start();
      }
      $.bind(window, 'storage', function(e) {
        if (e.key === ("" + NAMESPACE + g.BOARD + "/cooldown")) {
          return cooldown.start();
        }
      });
      if (g.REPLY) {
        return $('.postarea form').action += '?cooldown';
      }
    },
    start: function() {
      var submit, _i, _len, _ref;
      cooldown.duration = Math.ceil(($.get(g.BOARD + '/cooldown', 0) - Date.now()) / 1000);
      if (!(cooldown.duration > 0)) {
        return;
      }
      _ref = $$('#com_submit');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        submit = _ref[_i];
        submit.value = cooldown.duration;
        submit.disabled = true;
      }
      return setTimeout(cooldown.cb, 1000);
    },
    cb: function() {
      var submit, submits, _i, _j, _len, _len2, _results;
      submits = $$('#com_submit');
      if (--cooldown.duration) {
        setTimeout(cooldown.cb, 1000);
        _results = [];
        for (_i = 0, _len = submits.length; _i < _len; _i++) {
          submit = submits[_i];
          _results.push(submit.value = cooldown.duration);
        }
        return _results;
      } else {
        for (_j = 0, _len2 = submits.length; _j < _len2; _j++) {
          submit = submits[_j];
          submit.disabled = false;
          submit.value = 'Submit';
        }
        return qr.autoPost();
      }
    }
  };
  qr = {
    init: function() {
      var iframe;
      g.callbacks.push(qr.node);
      $.bind($('#recaptcha_challenge_field_holder'), 'DOMNodeInserted', qr.captchaNode);
      qr.captchaTime = Date.now();
      qr.spoiler = $('.postarea label') ? '<label> [<input type=checkbox name=spoiler>Spoiler Image?]</label>' : '';
      qr.acceptFiles = $('.rules').textContent.match(/: (.+) /)[1].replace(/\w+/g, function(type) {
        switch (type) {
          case 'JPG':
            return 'image/JPEG';
          case 'PDF':
            return 'application/' + type;
          default:
            return 'image/' + type;
        }
      });
      iframe = $.el('iframe', {
        name: 'iframe',
        hidden: true
      });
      $.add(d.body, iframe);
      return $('#recaptcha_response_field').id = '';
    },
    attach: function() {
      var fileDiv;
      fileDiv = $.el('div', {
        innerHTML: "<input type=file name=upfile accept='" + qr.acceptFiles + "'><a>X</a>"
      });
      $.bind(fileDiv.firstChild, 'change', qr.validateFileSize);
      $.bind(fileDiv.lastChild, 'click', (function() {
        return $.rm(this.parentNode);
      }));
      return $.add($('#files', qr.el), fileDiv);
    },
    attachNext: function() {
      var file, fileDiv, oldFile;
      fileDiv = $.rm($('#files div', qr.el));
      file = fileDiv.firstChild;
      oldFile = $('#qr_form input[type=file]', qr.el);
      return $.replace(oldFile, file);
    },
    autoPost: function() {
      if (qr.el && $('#auto', qr.el).checked) {
        return qr.submit.call($('form', qr.el));
      }
    },
    captchaNode: function(e) {
      if (!qr.el) {
        return;
      }
      val = e.target.value;
      $('img', qr.el).src = "http://www.google.com/recaptcha/api/image?c=" + val;
      qr.challenge = val;
      return qr.captchaTime = Date.now();
    },
    captchaKeydown: function(e) {
      var captchas;
      if (!(e.keyCode === 13 && this.value)) {
        return;
      }
      captchas = $.get('captchas', []);
      captchas.push({
        challenge: qr.challenge,
        response: this.value,
        time: qr.captchaTime
      });
      $.set('captchas', captchas);
      $('#captchas', qr.el).textContent = captchas.length + ' captchas';
      Recaptcha.reload();
      this.value = '';
      if (!$('textarea', qr.el).value && !$('input[type=file]', qr.el).files.length) {
        return e.preventDefault();
      }
    },
    close: function() {
      $.rm(qr.el);
      return qr.el = null;
    },
    dialog: function(link) {
      var THREAD_ID, c, email, html, m, name, pwd, submitDisabled, submitValue;
      c = d.cookie;
      name = (m = c.match(/4chan_name=([^;]+)/)) ? decodeURIComponent(m[1]) : '';
      email = (m = c.match(/4chan_email=([^;]+)/)) ? decodeURIComponent(m[1]) : '';
      pwd = (m = c.match(/4chan_pass=([^;]+)/)) ? decodeURIComponent(m[1]) : $('input[name=pwd]').value;
      submitValue = $('#com_submit').value;
      submitDisabled = $('#com_submit').disabled ? 'disabled' : '';
      THREAD_ID = g.THREAD_ID || $.x('ancestor::div[@class="thread"]/div', link).id;
      qr.challenge = $('#recaptcha_challenge_field').value;
      html = "      <a id=close title=close>X</a>      <input type=checkbox id=autohide title=autohide>      <div class=move>        <input class=inputtext type=text name=name value='" + name + "' placeholder=Name form=qr_form>        Quick Reply      </div>      <div class=autohide>        <form name=post action=http://sys.4chan.org/" + g.BOARD + "/post method=POST enctype=multipart/form-data target=iframe id=qr_form>          <input type=hidden name=resto value=" + THREAD_ID + ">          <input type=hidden name=mode value=regist>          <input type=hidden name=recaptcha_challenge_field id=recaptcha_challenge_field>          <input type=hidden name=recaptcha_response_field id=recaptcha_response_field>          <div><input class=inputtext type=text name=email value='" + email + "' placeholder=E-mail>" + qr.spoiler + "</div>          <div><input class=inputtext type=text name=sub placeholder=Subject><input type=submit value=" + submitValue + " id=com_submit " + submitDisabled + "><label><input type=checkbox id=auto>auto</label></div>          <div><textarea class=inputtext name=com placeholder=Comment></textarea></div>          <div><img src=http://www.google.com/recaptcha/api/image?c=" + qr.challenge + "></div>          <div><input class=inputtext type=text autocomplete=off placeholder=Verification id=dummy><span id=captchas>" + ($.get('captchas', []).length) + " captchas</span></div>          <div><input type=file name=upfile accept='" + qr.acceptFiles + "'></div>        </form>        <div id=files></div>        <div><input class=inputtext type=password name=pwd value='" + pwd + "' placeholder=Password form=qr_form maxlength=8><a id=attach>attach another file</a></div>      </div>      <a id=error class=error></a>      ";
      qr.el = ui.dialog('qr', 'top: 0; left: 0;', html);
      $.bind($('input[name=name]', qr.el), 'mousedown', function(e) {
        return e.stopPropagation();
      });
      $.bind($('input[name=upfile]', qr.el), 'change', qr.validateFileSize);
      $.bind($('#close', qr.el), 'click', qr.close);
      $.bind($('form', qr.el), 'submit', qr.submit);
      $.bind($('#attach', qr.el), 'click', qr.attach);
      $.bind($('img', qr.el), 'click', Recaptcha.reload);
      $.bind($('#dummy', qr.el), 'keydown', Recaptcha.listener);
      $.bind($('#dummy', qr.el), 'keydown', qr.captchaKeydown);
      return $.add(d.body, qr.el);
    },
    message: function(data) {
      var duration, fileCount, tc;
      $('iframe[name=iframe]').src = 'about:blank';
      fileCount = $('#files', qr.el).childElementCount;
      tc = data.textContent;
      if (tc) {
        $.extend($('#error', qr.el), data);
        $('#recaptcha_response_field', qr.el).value = '';
        $('#autohide', qr.el).checked = false;
        if (tc === 'You seem to have mistyped the verification.') {
          setTimeout(qr.autoPost, 1000);
        } else if (tc === 'Error: Duplicate file entry detected.' && fileCount) {
          $('textarea', qr.el).value += '\n' + tc + ' ' + data.href;
          qr.attachNext();
          setTimeout(qr.autoPost, 1000);
        }
        return;
      }
      if (qr.el) {
        if (g.REPLY && (conf['Persistent QR'] || fileCount)) {
          qr.refresh();
          if (fileCount) {
            qr.attachNext();
          }
        } else {
          qr.close();
        }
      }
      if (conf['Cooldown']) {
        duration = qr.sage ? 60 : 30;
        $.set(g.BOARD + '/cooldown', Date.now() + duration * 1000);
        return cooldown.start();
      }
    },
    node: function(root) {
      var quote;
      quote = $('a.quotejs:not(:first-child)', root);
      return $.bind(quote, 'click', qr.quote);
    },
    postInvalid: function() {
      var captcha, captchas, content, cutoff, dummy, response;
      content = $('textarea', qr.el).value || $('input[type=file]', qr.el).files.length;
      if (!content) {
        return 'Error: No text entered.';
      }
      /*
          captchas expire after 5 hours (emperically verified). cutoff 5 minutes
          before then, b/c posting takes time.
          */
      cutoff = Date.now() - 5 * HOUR + 5 * MINUTE;
      captchas = $.get('captchas', []);
      while (captcha = captchas.shift()) {
        if (captcha.time > cutoff) {
          break;
        }
      }
      $.set('captchas', captchas);
      $('#captchas', qr.el).textContent = captchas.length + ' captchas';
      if (!captcha) {
        dummy = $('#dummy', qr.el);
        if (!(response = dummy.value)) {
          return 'You forgot to type in the verification';
        }
        captcha = {
          challenge: qr.challenge,
          response: response
        };
        dummy.value = '';
        Recaptcha.reload();
      }
      $('#recaptcha_challenge_field', qr.el).value = captcha.challenge;
      $('#recaptcha_response_field', qr.el).value = captcha.response;
      return false;
    },
    quote: function(e) {
      var id, s, selection, selectionID, ta, text, _ref;
      if (e) {
        e.preventDefault();
      }
      if (qr.el) {
        $('#autohide', qr.el).checked = false;
      } else {
        qr.dialog(this);
      }
      id = this.textContent;
      text = ">>" + id + "\n";
      selection = window.getSelection();
      if (s = selection.toString()) {
        selectionID = (_ref = $.x('preceding::input[@type="checkbox"][1]', selection.anchorNode)) != null ? _ref.name : void 0;
        if (selectionID === id) {
          s = s.replace(/\n/g, '\n>');
          text += ">" + s + "\n";
        }
      }
      ta = $('textarea', qr.el);
      ta.focus();
      return ta.value += text;
    },
    refresh: function() {
      var m, newFile, oldFile, _ref;
      $('[name=sub]', qr.el).value = '';
      $('[name=email]', qr.el).value = (m = d.cookie.match(/4chan_email=([^;]+)/)) ? decodeURIComponent(m[1]) : '';
      $('[name=com]', qr.el).value = '';
      $('[name=recaptcha_response_field]', qr.el).value = '';
      if (!conf['Remember Spoiler']) {
        if ((_ref = $('[name=spoiler]', qr.el)) != null) {
          _ref.checked = false;
        }
      }
      oldFile = $('[type=file]', qr.el);
      newFile = $.el('input', {
        type: 'file',
        name: 'upfile',
        accept: qr.acceptFiles
      });
      return $.replace(oldFile, newFile);
    },
    submit: function(e) {
      var id, msg, op;
      if (msg = qr.postInvalid()) {
        if (typeof e.preventDefault === "function") {
          e.preventDefault();
        }
        alert(msg);
        if (msg === 'You forgot to type in the verification.') {
          $('#dummy', qr.el).focus();
        }
        return;
      }
      if (conf['Auto Watch Reply'] && conf['Thread Watcher']) {
        if (g.REPLY && $('img.favicon').src === Favicon.empty) {
          watcher.watch(null, g.THREAD_ID);
        } else {
          id = $('input[name=resto]', qr.el).value;
          op = $.id(id);
          if ($('img.favicon', op).src === Favicon.empty) {
            watcher.watch(op, id);
          }
        }
      }
      if (!e) {
        this.submit();
      }
      $('#error', qr.el).textContent = '';
      if (conf['Auto Hide QR']) {
        $('#autohide', qr.el).checked = true;
      }
      return qr.sage = /sage/i.test($('input[name=email]', this).value);
    },
    sys: function() {
      var c, duration, id, noko, recaptcha, sage, search, thread, url, watch, _, _ref, _ref2;
      if (recaptcha = $('#recaptcha_response_field')) {
        $.bind(recaptcha, 'keydown', Recaptcha.listener);
        return;
      }
      /*
            http://code.google.com/p/chromium/issues/detail?id=20773
            Let content scripts see other frames (instead of them being undefined)
      
            To access the parent, we have to break out of the sandbox and evaluate
            in the global context.
          */
      $.globalEval(function() {
        var data, node, _ref;
        data = {
          to: 'qr.message'
        };
        if (node = (_ref = document.querySelector('table font b')) != null ? _ref.firstChild : void 0) {
          data.textContent = node.textContent;
          data.href = node.href;
        }
        return parent.postMessage(data, '*');
      });
      c = (_ref = $('b')) != null ? _ref.lastChild : void 0;
      if (!(c && c.nodeType === 8)) {
        return;
      }
      _ref2 = c.textContent.match(/thread:(\d+),no:(\d+)/), _ = _ref2[0], thread = _ref2[1], id = _ref2[2];
      search = location.search;
      cooldown = /cooldown/.test(search);
      noko = /noko/.test(search);
      sage = /sage/.test(search);
      watch = /watch/.test(search);
      url = "http://boards.4chan.org/" + g.BOARD;
      if (watch && thread === '0') {
        url += "/res/" + id + "?watch";
      } else if (noko) {
        url += '/res/';
        url += thread === '0' ? id : thread;
      }
      if (cooldown) {
        duration = Date.now() + (sage ? 60 : 30) * 1000;
        url += '?cooldown=' + duration;
      }
      if (noko) {
        url += '#' + id;
      }
      return window.location = url;
    },
    validateFileSize: function(e) {
      var file;
      if (!(this.files[0].size > $('input[name=MAX_FILE_SIZE]').value)) {
        return;
      }
      file = $.el('input', {
        type: 'file',
        name: 'upfile',
        accept: qr.acceptFiles
      });
      $.bind(file, 'change', qr.validateFileSize);
      $.replace(this, file);
      $('#error', qr.el).textContent = 'Error: File too large.';
      return alert('Error: File too large.');
    }
  };
  threading = {
    init: function() {
      var node;
      node = $('form[name=delform] > *:not([id])');
      return threading.thread(node);
    },
    op: function(node) {
      var op;
      op = $.el('div', {
        className: 'op'
      });
      $.before(node, op);
      while (node.nodeName !== 'BLOCKQUOTE') {
        $.add(op, node);
        node = op.nextSibling;
      }
      $.add(op, node);
      op.id = $('input[name]', op).name;
      return op;
    },
    thread: function(node) {
      var div;
      node = threading.op(node);
      if (g.REPLY) {
        return;
      }
      div = $.el('div', {
        className: 'thread'
      });
      $.before(node, div);
      while (node.nodeName !== 'HR') {
        $.add(div, node);
        node = div.nextSibling;
      }
      node = node.nextElementSibling;
      if (!(node.align || node.nodeName === 'CENTER')) {
        return threading.thread(node);
      }
    }
  };
  threadHiding = {
    init: function() {
      var a, hiddenThreads, op, thread, _i, _len, _ref, _results;
      hiddenThreads = $.get("hiddenThreads/" + g.BOARD + "/", {});
      _ref = $$('div.thread');
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        thread = _ref[_i];
        op = thread.firstChild;
        a = $.el('a', {
          textContent: '[ - ]'
        });
        $.bind(a, 'click', threadHiding.cb.hide);
        $.prepend(op, a);
        _results.push(op.id in hiddenThreads ? threadHiding.hideHide(thread) : void 0);
      }
      return _results;
    },
    cb: {
      hide: function(e) {
        var thread;
        thread = this.parentNode.parentNode;
        return threadHiding.hide(thread);
      },
      show: function(e) {
        var thread;
        thread = this.parentNode.parentNode;
        return threadHiding.show(thread);
      }
    },
    toggle: function(thread) {
      if (thread.classList.contains('stub') || thread.hidden) {
        return threadHiding.show(thread);
      } else {
        return threadHiding.hide(thread);
      }
    },
    hide: function(thread) {
      var hiddenThreads, id;
      threadHiding.hideHide(thread);
      id = thread.firstChild.id;
      hiddenThreads = $.get("hiddenThreads/" + g.BOARD + "/", {});
      hiddenThreads[id] = Date.now();
      return $.set("hiddenThreads/" + g.BOARD + "/", hiddenThreads);
    },
    hideHide: function(thread) {
      var a, div, name, num, span, text, trip, _ref;
      if (conf['Show Stubs']) {
        if (span = $('.omittedposts', thread)) {
          num = Number(span.textContent.match(/\d+/)[0]);
        } else {
          num = 0;
        }
        num += $$('table', thread).length;
        text = num === 1 ? "1 reply" : "" + num + " replies";
        name = $('span.postername', thread).textContent;
        trip = ((_ref = $('span.postername + span.postertrip', thread)) != null ? _ref.textContent : void 0) || '';
        a = $.el('a', {
          textContent: "[ + ] " + name + trip + " (" + text + ")"
        });
        $.bind(a, 'click', threadHiding.cb.show);
        div = $.el('div', {
          className: 'block'
        });
        $.add(div, a);
        $.add(thread, div);
        return $.addClass(thread, 'stub');
      } else {
        thread.hidden = true;
        return thread.nextSibling.hidden = true;
      }
    },
    show: function(thread) {
      var hiddenThreads, id;
      $.rm($('div.block', thread));
      $.removeClass(thread, 'stub');
      thread.hidden = false;
      thread.nextSibling.hidden = false;
      id = thread.firstChild.id;
      hiddenThreads = $.get("hiddenThreads/" + g.BOARD + "/", {});
      delete hiddenThreads[id];
      return $.set("hiddenThreads/" + g.BOARD + "/", hiddenThreads);
    }
  };
  updater = {
    init: function() {
      var checkbox, checked, dialog, html, input, name, title, _i, _len, _ref;
      if (conf['Scrolling']) {
        if (conf['Scroll BG']) {
          updater.focus = true;
        } else {
          $.bind(window, 'focus', (function() {
            return updater.focus = true;
          }));
          $.bind(window, 'blur', (function() {
            return updater.focus = false;
          }));
        }
      }
      html = "<div class=move><span id=count></span> <span id=timer>-" + conf['Interval'] + "</span></div>";
      checkbox = config.updater.checkbox;
      for (name in checkbox) {
        title = checkbox[name][1];
        checked = conf[name] ? 'checked' : '';
        html += "<div><label title='" + title + "'>" + name + "<input name='" + name + "' type=checkbox " + checked + "></label></div>";
      }
      checked = conf['Auto Update'] ? 'checked' : '';
      html += "      <div><label title='Controls whether *this* thread automatically updates or not'>Auto Update This<input name='Auto Update This' type=checkbox " + checked + "></label></div>      <div><label>Interval (s)<input name=Interval value=" + conf['Interval'] + " type=text></label></div>      <div><input value='Update Now' type=button></div>";
      dialog = ui.dialog('updater', 'bottom: 0; right: 0;', html);
      updater.count = $('#count', dialog);
      updater.timer = $('#timer', dialog);
      updater.br = $('br[clear]');
      _ref = $$('input', dialog);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        input = _ref[_i];
        if (input.type === 'checkbox') {
          $.bind(input, 'click', $.cb.checked);
          $.bind(input, 'click', function() {
            return conf[this.name] = this.checked;
          });
          if (input.name === 'Verbose') {
            $.bind(input, 'click', updater.cb.verbose);
            updater.cb.verbose.call(input);
          } else if (input.name === 'Auto Update This') {
            $.bind(input, 'click', updater.cb.autoUpdate);
            updater.cb.autoUpdate.call(input);
          }
        } else if (input.name === 'Interval') {
          $.bind(input, 'change', function() {
            return conf['Interval'] = this.value = parseInt(this.value) || conf['Interval'];
          });
          $.bind(input, 'change', $.cb.value);
        } else if (input.type === 'button') {
          $.bind(input, 'click', updater.updateNow);
        }
      }
      return $.add(d.body, dialog);
    },
    cb: {
      verbose: function() {
        if (conf['Verbose']) {
          updater.count.textContent = '+0';
          return updater.timer.hidden = false;
        } else {
          $.extend(updater.count, {
            className: '',
            textContent: 'Thread Updater'
          });
          return updater.timer.hidden = true;
        }
      },
      autoUpdate: function() {
        if (this.checked) {
          return updater.timeoutID = setTimeout(updater.timeout, 1000);
        } else {
          return clearTimeout(updater.timeoutID);
        }
      },
      update: function() {
        var arr, body, id, input, replies, reply, scroll, _i, _len, _ref, _ref2;
        if (this.status === 404) {
          updater.timer.textContent = '';
          updater.count.textContent = 404;
          updater.count.className = 'error';
          clearTimeout(updater.timeoutID);
          _ref = $$('#com_submit');
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            input = _ref[_i];
            input.disabled = true;
            input.value = 404;
          }
          d.title = d.title.match(/.+-/)[0] + ' 404';
          g.dead = true;
          Favicon.update();
          return;
        }
        id = Number(((_ref2 = $('td[id]', updater.br.previousElementSibling)) != null ? _ref2.id : void 0) || 0);
        arr = [];
        body = $.el('body', {
          innerHTML: this.responseText
        });
        replies = $$('.reply', body);
        while ((reply = replies.pop()) && (reply.id > id)) {
          arr.push(reply.parentNode.parentNode.parentNode);
        }
        scroll = conf['Scrolling'] && updater.focus && arr.length && (d.body.scrollHeight - d.body.clientHeight - window.scrollY < 20);
        updater.timer.textContent = '-' + conf['Interval'];
        if (conf['Verbose']) {
          updater.count.textContent = '+' + arr.length;
          if (arr.length === 0) {
            updater.count.className = '';
          } else {
            updater.count.className = 'new';
          }
        }
        while (reply = arr.pop()) {
          $.before(updater.br, reply);
        }
        if (scroll) {
          return scrollTo(0, d.body.scrollHeight);
        }
      }
    },
    timeout: function() {
      var n;
      n = Number(updater.timer.textContent);
      ++n;
      if (n === 10) {
        updater.count.textContent = 'retry';
        updater.count.className = '';
        n = 0;
      }
      updater.timer.textContent = n;
      if (n === 0) {
        updater.update();
      }
      return updater.timeoutID = setTimeout(updater.timeout, 1000);
    },
    updateNow: function() {
      updater.timer.textContent = 0;
      return updater.update();
    },
    update: function() {
      var cb, url, _ref;
      if ((_ref = updater.request) != null) {
        _ref.abort();
      }
      url = location.pathname + '?' + Date.now();
      cb = updater.cb.update;
      return updater.request = $.ajax(url, cb);
    }
  };
  watcher = {
    init: function() {
      var favicon, html, input, inputs, _i, _len;
      html = '<div class=move>Thread Watcher</div>';
      watcher.dialog = ui.dialog('watcher', 'top: 50px; left: 0px;', html);
      $.add(d.body, watcher.dialog);
      inputs = $$('.op input');
      for (_i = 0, _len = inputs.length; _i < _len; _i++) {
        input = inputs[_i];
        favicon = $.el('img', {
          className: 'favicon'
        });
        $.bind(favicon, 'click', watcher.cb.toggle);
        $.before(input, favicon);
      }
      watcher.refresh();
      if (conf['Auto Watch']) {
        if (!g.REPLY) {
          $('.postarea form').action += '?watch';
        } else if (/watch/.test(location.search) && $('img.favicon').src === Favicon.empty) {
          watcher.watch(null, g.THREAD_ID);
        }
      }
      return $.bind(window, 'storage', function(e) {
        if (e.key === ("" + NAMESPACE + "watched")) {
          return watcher.refresh();
        }
      });
    },
    refresh: function() {
      var board, div, favicon, id, link, props, watched, watchedBoard, x, _i, _j, _len, _len2, _ref, _ref2, _ref3, _results;
      watched = $.get('watched', {});
      _ref = $$('div:not(.move)', watcher.dialog);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        div = _ref[_i];
        $.rm(div);
      }
      for (board in watched) {
        _ref2 = watched[board];
        for (id in _ref2) {
          props = _ref2[id];
          div = $.el('div');
          x = $.el('a', {
            textContent: 'X'
          });
          $.bind(x, 'click', watcher.cb.x);
          link = $.el('a', props);
          $.add(div, x, $.tn(' '), link);
          $.add(watcher.dialog, div);
        }
      }
      watchedBoard = watched[g.BOARD] || {};
      _ref3 = $$('img.favicon');
      _results = [];
      for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
        favicon = _ref3[_j];
        id = favicon.nextSibling.name;
        _results.push(id in watchedBoard ? favicon.src = Favicon["default"] : favicon.src = Favicon.empty);
      }
      return _results;
    },
    cb: {
      toggle: function(e) {
        return watcher.toggle(this.parentNode);
      },
      x: function(e) {
        var board, id, _, _ref;
        _ref = this.nextElementSibling.getAttribute('href').substring(1).split('/'), board = _ref[0], _ = _ref[1], id = _ref[2];
        return watcher.unwatch(board, id);
      }
    },
    toggle: function(thread) {
      var favicon, id;
      favicon = $('img.favicon', thread);
      id = favicon.nextSibling.name;
      if (favicon.src === Favicon.empty) {
        return watcher.watch(thread, id);
      } else {
        return watcher.unwatch(g.BOARD, id);
      }
    },
    unwatch: function(board, id) {
      var watched;
      watched = $.get('watched', {});
      delete watched[board][id];
      $.set('watched', watched);
      return watcher.refresh();
    },
    watch: function(thread, id) {
      var props, watched, _name;
      props = {
        href: "/" + g.BOARD + "/res/" + id,
        textContent: getTitle(thread).slice(0, 30)
      };
      watched = $.get('watched', {});
      watched[_name = g.BOARD] || (watched[_name] = {});
      watched[g.BOARD][id] = props;
      $.set('watched', watched);
      return watcher.refresh();
    }
  };
  anonymize = {
    init: function() {
      return g.callbacks.push(function(root) {
        var name, trip;
        name = $('span.commentpostername, span.postername', root);
        name.textContent = 'Anonymous';
        if (trip = $('span.postertrip', root)) {
          if (trip.parentNode.nodeName === 'A') {
            return $.rm(trip.parentNode);
          } else {
            return $.rm(trip);
          }
        }
      });
    }
  };
  sauce = {
    init: function() {
      var prefix, s;
      sauce.prefixes = (function() {
        var _i, _len, _ref, _results;
        _ref = conf['flavors'].split('\n');
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          s = _ref[_i];
          if (s && s[0] !== '#') {
            _results.push(s);
          }
        }
        return _results;
      })();
      sauce.names = (function() {
        var _i, _len, _ref, _results;
        _ref = sauce.prefixes;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          prefix = _ref[_i];
          _results.push(prefix.match(/(\w+)\./)[1]);
        }
        return _results;
      })();
      return g.callbacks.push(function(root) {
        var i, link, prefix, span, suffix, _len, _ref, _results;
        if (root.className === 'inline') {
          return;
        }
        if (span = $('span.filesize', root)) {
          suffix = $('a', span).href;
          _ref = sauce.prefixes;
          _results = [];
          for (i = 0, _len = _ref.length; i < _len; i++) {
            prefix = _ref[i];
            link = $.el('a', {
              textContent: sauce.names[i],
              href: prefix + suffix,
              target: '_blank'
            });
            _results.push($.add(span, $.tn(' '), link));
          }
          return _results;
        }
      });
    }
  };
  revealSpoilers = {
    init: function() {
      return g.callbacks.push(function(root) {
        var board, img, imgID, _, _ref;
        if (!(img = $('img[alt^=Spoiler]', root)) || root.className === 'inline') {
          return;
        }
        img.removeAttribute('height');
        img.removeAttribute('width');
        _ref = img.parentNode.href.match(/(\w+)\/src\/(\d+)/), _ = _ref[0], board = _ref[1], imgID = _ref[2];
        return img.src = "http://0.thumbs.4chan.org/" + board + "/thumb/" + imgID + "s.jpg";
      });
    }
  };
  Time = {
    init: function() {
      Time.foo();
      return g.callbacks.push(Time.node);
    },
    node: function(root) {
      var day, hour, min, month, node, posttime, time, year, _, _ref;
      if (root.className === 'inline') {
        return;
      }
      node = (posttime = $('.posttime', root)) ? posttime : $('span[id]', root).previousSibling;
      _ref = node.textContent.match(/(\d+)\/(\d+)\/(\d+)\(\w+\)(\d+):(\d+)/), _ = _ref[0], month = _ref[1], day = _ref[2], year = _ref[3], hour = _ref[4], min = _ref[5];
      year = "20" + year;
      month -= 1;
      hour = g.chanOffset + Number(hour);
      Time.date = new Date(year, month, day, hour, min);
      time = $.el('time', {
        textContent: ' ' + Time.funk(Time) + ' '
      });
      return $.replace(node, time);
    },
    foo: function() {
      var code;
      code = conf['time'].replace(/%([A-Za-z])/g, function(s, c) {
        if (c in Time.formatters) {
          return "' + Time.formatters." + c + "() + '";
        } else {
          return s;
        }
      });
      return Time.funk = Function('Time', "return '" + code + "'");
    },
    day: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    month: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    zeroPad: function(n) {
      if (n < 10) {
        return '0' + n;
      } else {
        return n;
      }
    },
    formatters: {
      a: function() {
        return Time.day[Time.date.getDay()].slice(0, 3);
      },
      A: function() {
        return Time.day[Time.date.getDay()];
      },
      b: function() {
        return Time.month[Time.date.getMonth()].slice(0, 3);
      },
      B: function() {
        return Time.month[Time.date.getMonth()];
      },
      d: function() {
        return Time.zeroPad(Time.date.getDate());
      },
      e: function() {
        return Time.date.getDate();
      },
      H: function() {
        return Time.zeroPad(Time.date.getHours());
      },
      I: function() {
        return Time.zeroPad(Time.date.getHours() % 12 || 12);
      },
      k: function() {
        return Time.date.getHours();
      },
      l: function() {
        return Time.date.getHours() % 12 || 12;
      },
      m: function() {
        return Time.zeroPad(Time.date.getMonth() + 1);
      },
      M: function() {
        return Time.zeroPad(Time.date.getMinutes());
      },
      p: function() {
        if (Time.date.getHours() < 12) {
          return 'AM';
        } else {
          return 'PM';
        }
      },
      P: function() {
        if (Time.date.getHours() < 12) {
          return 'am';
        } else {
          return 'pm';
        }
      },
      y: function() {
        return Time.date.getFullYear() - 2000;
      }
    }
  };
  getTitle = function(thread) {
    var el, span;
    el = $('span.filetitle', thread);
    if (!el.textContent) {
      el = $('blockquote', thread);
      if (!el.textContent) {
        el = $('span.postername', thread);
      }
    }
    span = $.el('span', {
      innerHTML: el.innerHTML.replace(/<br>/g, ' ')
    });
    return "/" + g.BOARD + "/ - " + span.textContent;
  };
  titlePost = {
    init: function() {
      return d.title = getTitle();
    }
  };
  quoteBacklink = {
    init: function() {
      var format;
      format = conf['backlink'].replace(/%id/, "' + id + '");
      quoteBacklink.funk = Function('id', "return'" + format + "'");
      return g.callbacks.push(function(root) {
        var container, el, id, link, qid, quote, quotes, _i, _len, _ref, _results;
        if (/inline/.test(root.className)) {
          return;
        }
        id = root.id || $('td[id]', root).id;
        quotes = {};
        _ref = $$('a.quotelink', root);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          quote = _ref[_i];
          if (!(qid = quote.hash.slice(1))) {
            continue;
          }
          quotes[qid] = quote;
        }
        _results = [];
        for (qid in quotes) {
          if (!(el = $.id(qid))) {
            continue;
          }
          if (!conf['OP Backlinks'] && el.className === 'op') {
            continue;
          }
          link = $.el('a', {
            href: "#" + id,
            className: 'backlink',
            textContent: quoteBacklink.funk(id)
          });
          if (conf['Quote Preview']) {
            $.bind(link, 'mouseover', quotePreview.mouseover);
            $.bind(link, 'mousemove', ui.hover);
            $.bind(link, 'mouseout', quotePreview.mouseout);
          }
          if (conf['Quote Inline']) {
            $.bind(link, 'click', quoteInline.toggle);
          }
          if (!((container = $('.container', el)) && container.parentNode === el)) {
            container = $.el('span', {
              className: 'container'
            });
            root = $('.reportbutton', el) || $('span[id^=no]', el);
            $.after(root, container);
          }
          _results.push($.add(container, $.tn(' '), link));
        }
        return _results;
      });
    }
  };
  quoteInline = {
    init: function() {
      return g.callbacks.push(function(root) {
        var quote, _i, _len, _ref, _results;
        _ref = $$('a.quotelink, a.backlink', root);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          quote = _ref[_i];
          if (!quote.hash) {
            continue;
          }
          quote.removeAttribute('onclick');
          _results.push($.bind(quote, 'click', quoteInline.toggle));
        }
        return _results;
      });
    },
    toggle: function(e) {
      var el, hidden, id, inline, inlined, pathname, root, table, threadID, _i, _len, _ref;
      if (e.shiftKey || e.altKey || e.ctrlKey || e.button !== 0) {
        return;
      }
      e.preventDefault();
      id = this.hash.slice(1);
      if (table = $("#i" + id, $.x('ancestor::td[1]', this))) {
        $.rm(table);
        $.removeClass(this, 'inlined');
        _ref = $$('input', table);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          inlined = _ref[_i];
          if (hidden = $.id(inlined.name)) {
            $.x('ancestor::table[1]', hidden).hidden = false;
          }
        }
        return;
      }
      root = this.parentNode.nodeName === 'FONT' ? this.parentNode : this.nextSibling ? this.nextSibling : this;
      if (el = $.id(id)) {
        inline = quoteInline.table(id, el.innerHTML);
        if (this.className === 'backlink') {
          if ($("a.backlink[href='#" + id + "']", el)) {
            return;
          }
          $.after(this.parentNode, inline);
          $.x('ancestor::table[1]', el).hidden = true;
        } else {
          $.after(root, inline);
        }
      } else {
        inline = $.el('td', {
          className: 'reply inline',
          id: "i" + id,
          innerHTML: "Loading " + id + "..."
        });
        $.after(root, inline);
        pathname = this.pathname;
        threadID = pathname.split('/').pop();
        $.cache(pathname, (function() {
          return quoteInline.parse(this, pathname, id, threadID, inline);
        }));
      }
      return $.addClass(this, 'inlined');
    },
    parse: function(req, pathname, id, threadID, inline) {
      var body, href, html, link, newInline, op, quote, reply, _i, _j, _len, _len2, _ref, _ref2;
      if (!inline.parentNode) {
        return;
      }
      if (req.status !== 200) {
        inline.innerHTML = "" + req.status + " " + req.statusText;
        return;
      }
      body = $.el('body', {
        innerHTML: req.responseText
      });
      if (id === threadID) {
        op = threading.op($('form[name=delform] > *', body));
        html = op.innerHTML;
      } else {
        _ref = $$('td.reply', body);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          reply = _ref[_i];
          if (reply.id === id) {
            html = reply.innerHTML;
            break;
          }
        }
      }
      newInline = quoteInline.table(id, html);
      _ref2 = $$('a.quotelink', newInline);
      for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
        quote = _ref2[_j];
        if ((href = quote.getAttribute('href')) === quote.hash) {
          quote.pathname = pathname;
        } else if (!g.REPLY && href !== quote.href) {
          quote.href = "res/" + href;
        }
      }
      link = $('a.quotejs', newInline);
      link.href = "" + pathname + "#" + id;
      link.nextSibling.href = "" + pathname + "#q" + id;
      $.addClass(newInline, 'crossquote');
      return $.replace(inline, newInline);
    },
    table: function(id, html) {
      return $.el('table', {
        className: 'inline',
        id: "i" + id,
        innerHTML: "<tbody><tr><td class=reply>" + html + "</td></tr></tbody>"
      });
    }
  };
  quotePreview = {
    init: function() {
      return g.callbacks.push(function(root) {
        var quote, _i, _len, _ref, _results;
        _ref = $$('a.quotelink, a.backlink', root);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          quote = _ref[_i];
          if (!quote.hash) {
            continue;
          }
          $.bind(quote, 'mouseover', quotePreview.mouseover);
          $.bind(quote, 'mousemove', ui.hover);
          _results.push($.bind(quote, 'mouseout', quotePreview.mouseout));
        }
        return _results;
      });
    },
    mouseover: function(e) {
      var el, id, qp, quote, replyID, threadID, _i, _len, _ref, _results;
      qp = ui.el = $.el('div', {
        id: 'qp',
        className: 'reply'
      });
      $.add(d.body, qp);
      id = this.hash.slice(1);
      if (el = $.id(id)) {
        qp.innerHTML = el.innerHTML;
        if (conf['Quote Highlighting']) {
          $.addClass(el, 'qphl');
        }
        if (/backlink/.test(this.className)) {
          replyID = $.x('ancestor::*[@id][1]', this).id.match(/\d+/)[0];
          _ref = $$('a.quotelink', qp);
          _results = [];
          for (_i = 0, _len = _ref.length; _i < _len; _i++) {
            quote = _ref[_i];
            _results.push(quote.hash.slice(1) === replyID ? quote.className = 'forwardlink' : void 0);
          }
          return _results;
        }
      } else {
        qp.innerHTML = "Loading " + id + "...";
        threadID = this.pathname.split('/').pop() || $.x('ancestor::div[@class="thread"]/div', this).id;
        $.cache(this.pathname, (function() {
          return quotePreview.parse(this, id, threadID);
        }));
        return ui.hover(e);
      }
    },
    mouseout: function() {
      var el;
      if (el = $.id(this.hash.slice(1))) {
        $.removeClass(el, 'qphl');
      }
      return ui.hoverend();
    },
    parse: function(req, id, threadID) {
      var body, html, op, qp, reply, _i, _len, _ref;
      if (!((qp = ui.el) && (qp.innerHTML === ("Loading " + id + "...")))) {
        return;
      }
      if (req.status !== 200) {
        qp.innerHTML = "" + req.status + " " + req.statusText;
        return;
      }
      body = $.el('body', {
        innerHTML: req.responseText
      });
      if (id === threadID) {
        op = threading.op($('form[name=delform] > *', body));
        html = op.innerHTML;
      } else {
        _ref = $$('td.reply', body);
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          reply = _ref[_i];
          if (reply.id === id) {
            html = reply.innerHTML;
            break;
          }
        }
      }
      qp.innerHTML = html;
      return Time.node(qp);
    }
  };
  quoteOP = {
    init: function() {
      return g.callbacks.push(function(root) {
        var quote, tid, _i, _len, _ref, _results;
        if (root.className === 'inline') {
          return;
        }
        tid = g.THREAD_ID || $.x('ancestor::div[contains(@class,"thread")]/div', root).id;
        _ref = $$('a.quotelink', root);
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          quote = _ref[_i];
          _results.push(quote.hash.slice(1) === tid ? quote.innerHTML += '&nbsp;(OP)' : void 0);
        }
        return _results;
      });
    }
  };
  reportButton = {
    init: function() {
      return g.callbacks.push(function(root) {
        var a, span;
        if (!(a = $('a.reportbutton', root))) {
          span = $('span[id^=no]', root);
          a = $.el('a', {
            className: 'reportbutton',
            innerHTML: '[&nbsp;!&nbsp;]'
          });
          $.after(span, a);
          $.after(span, $.tn(' '));
        }
        return $.bind(a, 'click', reportButton.report);
      });
    },
    report: function() {
      var id, set, url;
      url = "http://sys.4chan.org/" + g.BOARD + "/imgboard.php?mode=report&no=" + this.previousElementSibling.childNodes[1].textContent;
      id = "" + NAMESPACE + "popup";
      set = "toolbar=0,scrollbars=0,location=0,status=1,menubar=0,resizable=1,width=685,height=200";
      return window.open(url, id, set);
    }
  };
  threadStats = {
    init: function() {
      var dialog, html;
      threadStats.posts = 1;
      threadStats.images = $('.op img[md5]') ? 1 : 0;
      html = "<div class=move><span id=postcount>" + threadStats.posts + "</span> / <span id=imagecount>" + threadStats.images + "</span></div>";
      dialog = ui.dialog('stats', 'bottom: 0; left: 0;', html);
      dialog.className = 'dialog';
      threadStats.postcountEl = $('#postcount', dialog);
      threadStats.imagecountEl = $('#imagecount', dialog);
      $.add(d.body, dialog);
      return g.callbacks.push(threadStats.node);
    },
    node: function(root) {
      if (root.className) {
        return;
      }
      threadStats.postcountEl.textContent = ++threadStats.posts;
      if ($('img[md5]', root)) {
        threadStats.imagecountEl.textContent = ++threadStats.images;
        if (threadStats.images > 150) {
          return threadStats.imagecountEl.className = 'error';
        }
      }
    }
  };
  unread = {
    init: function() {
      unread.replies = [];
      d.title = '(0) ' + d.title;
      $.bind(window, 'scroll', unread.scroll);
      return g.callbacks.push(unread.node);
    },
    node: function(root) {
      if (root.className) {
        return;
      }
      unread.replies.push(root);
      unread.updateTitle();
      return Favicon.update();
    },
    scroll: function(e) {
      var bottom, height, i, reply, _len, _ref;
      updater.focus = true;
      height = d.body.clientHeight;
      _ref = unread.replies;
      for (i = 0, _len = _ref.length; i < _len; i++) {
        reply = _ref[i];
        bottom = reply.getBoundingClientRect().bottom;
        if (bottom > height) {
          break;
        }
      }
      if (i === 0) {
        return;
      }
      unread.replies = unread.replies.slice(i);
      unread.updateTitle();
      if (unread.replies.length === 0) {
        return Favicon.update();
      }
    },
    updateTitle: function() {
      return d.title = d.title.replace(/\d+/, unread.replies.length);
    }
  };
  Favicon = {
    init: function() {
      var favicon, href;
      favicon = $('link[rel="shortcut icon"]', d.head);
      favicon.type = 'image/x-icon';
      href = favicon.href;
      Favicon["default"] = href;
      return Favicon.unread = /ws/.test(href) ? Favicon.unreadSFW : Favicon.unreadNSFW;
    },
    dead: 'data:image/gif;base64,R0lGODlhEAAQAKECAAAAAP8AAP///////yH5BAEKAAIALAAAAAAQABAAAAIvlI+pq+D9DAgUoFkPDlbs7lFZKIJOJJ3MyraoB14jFpOcVMpzrnF3OKlZYsMWowAAOw==',
    empty: 'data:image/gif;base64,R0lGODlhEAAQAJEAAAAAAP///9vb2////yH5BAEAAAMALAAAAAAQABAAAAIvnI+pq+D9DBAUoFkPFnbs7lFZKIJOJJ3MyraoB14jFpOcVMpzrnF3OKlZYsMWowAAOw==',
    unreadDead: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAANhJREFUOMutU0EKwjAQzEPFgyBFei209gOKINh6tL3qO3yAB9OHWPTeMZsmJaRpiNjAkE1mMt1stgwA+wdsFgM1oHE4FXmSpWUcRzWBYtozNfKAYdCHCrQuosX9tlk+CBS7NKMMbMF7vXoJtC7Om8HwhXzbCWCSn6qBJHd74FIBVS1jm7czYFSsq7gvpY0s6+ThJwc4743EHnGkIW2YAW+AphkMPj6DJE1LXW3fFUhD2pHBsTznLKCIFCstC3nGNvQZnQa6kX4yMGfdyi7OZaB7wZy93Cx/4xfgv/s+XYFMrAAAAABJRU5ErkJggg%3D%3D',
    unreadSFW: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAN9JREFUOMtj+P//PwMlmIEqBkDBfxie2NdVVVFaMikzPXsuCIPYIDFkNWANSAb815t+GI5B/Jj8iQfjapafBWEQG5saDBegK0ja8Ok9EH/AJofXBTBFlUf+/wPi/7jkcYYBCLef/v9/9pX//+cAMYiNLo/uAgZQYMVVLzsLcnYF0GaQ5otv/v+/9BpiEEgMJAdSA1JLlAGXgAZcfoNswGfcBpQDowoW2vi8AFIDUothwOQJvVXIgYUrEEFsqFoGYqLxA7HRiNUAWEIiyQBkGpaUsclhMwCWFpBpvHJUyY0AmdYZKFRtAsoAAAAASUVORK5CYII%3D',
    unreadNSFW: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAOBJREFUOMtj+P//PwMlmIEqBkDBfxie2DWxqqykYlJ6dtZcEAaxQWLIasAakAz4n3bGGI5B/JiJ8QfjlsefBWEQG5saDBegKyj5lPQeiD9gk8PrApiinv+V/4D4Py55nGEAwrP+t/9f/X82EM8Bs9Hl0V3AAAqsuGXxZ0HO7vlf8Q+k+eb/i0B8CWwQSAwkB1IDUkuUAbeAmm/9v4ww4DMeA8pKyifBQhufF0BqQGoxDJjcO7kKObBwBSKIDVXLQEw0fiA2GrEaAEtIJBmATMOSMjY5bAbA0gIyjVeOKrkRAMefDK/b7ecEAAAAAElFTkSuQmCC',
    update: function() {
      var clone, favicon, href, l;
      l = unread.replies.length;
      if (g.dead) {
        if (l > 0) {
          href = Favicon.unreadDead;
        } else {
          href = Favicon.dead;
        }
      } else {
        if (l > 0) {
          href = Favicon.unread;
        } else {
          href = Favicon["default"];
        }
      }
      favicon = $('link[rel="shortcut icon"]', d.head);
      clone = favicon.cloneNode(true);
      clone.href = href;
      return $.replace(favicon, clone);
    }
  };
  redirect = function() {
    var url;
    switch (g.BOARD) {
      case 'diy':
      case 'g':
      case 'pol':
      case 'sci':
        url = "http://archive.installgentoo.net/cgi-board.pl/" + g.BOARD + "/thread/" + g.THREAD_ID;
        break;
      case 'lit':
      case 'tv':
        url = "http://archive.gentoomen.org/cgi-board.pl/" + g.BOARD + "/thread/" + g.THREAD_ID;
        break;
      case 'a':
      case 'jp':
      case 'm':
      case 'tg':
        url = "http://archive.easymodo.net/" + g.BOARD + "/thread/" + g.THREAD_ID;
        break;
      case '3':
      case 'adv':
      case 'an':
      case 'ck':
      case 'co':
      case 'fa':
      case 'fit':
      case 'int':
      case 'k':
      case 'mu':
      case 'n':
      case 'o':
      case 'p':
      case 'po':
      case 'soc':
      case 'sp':
      case 'toy':
      case 'trv':
      case 'v':
      case 'vp':
      case 'x':
        url = "http://archive.no-ip.org/" + g.BOARD + "/thread/" + g.THREAD_ID;
        break;
      default:
        url = "http://boards.4chan.org/" + g.BOARD;
    }
    return location.href = url;
  };
  Recaptcha = {
    init: function() {
      var el, _i, _len, _ref;
      _ref = $$('#recaptcha_table a');
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        el = _ref[_i];
        el.tabIndex = 1;
      }
      return $.bind($('#recaptcha_response_field'), 'keydown', Recaptcha.listener);
    },
    listener: function(e) {
      if (e.keyCode === 8 && this.value === '') {
        return Recaptcha.reload();
      }
    },
    reload: function() {
      return window.location = 'javascript:Recaptcha.reload()';
    }
  };
  nodeInserted = function(e) {
    var callback, target, _i, _len, _ref, _results;
    target = e.target;
    if (target.nodeName === 'TABLE') {
      _ref = g.callbacks;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        callback = _ref[_i];
        _results.push(callback(target));
      }
      return _results;
    }
  };
  imgHover = {
    init: function() {
      return g.callbacks.push(function(root) {
        var thumb;
        if (!(thumb = $('img[md5]', root))) {
          return;
        }
        $.bind(thumb, 'mouseover', imgHover.mouseover);
        $.bind(thumb, 'mousemove', ui.hover);
        return $.bind(thumb, 'mouseout', ui.hoverend);
      });
    },
    mouseover: function(e) {
      ui.el = $.el('img', {
        id: 'iHover',
        src: this.parentNode.href
      });
      return $.add(d.body, ui.el);
    }
  };
  imgPreloading = {
    init: function() {
      return g.callbacks.push(function(root) {
        var el, src, thumb;
        if (!(thumb = $('img[md5]', root))) {
          return;
        }
        src = thumb.parentNode.href;
        return el = $.el('img', {
          src: src
        });
      });
    }
  };
  imgGif = {
    init: function() {
      return g.callbacks.push(function(root) {
        var src, thumb;
        if (!(thumb = $('img[md5]', root))) {
          return;
        }
        src = thumb.parentNode.href;
        if (/gif$/.test(src)) {
          return thumb.src = src;
        }
      });
    }
  };
  imgExpand = {
    init: function() {
      g.callbacks.push(imgExpand.node);
      imgExpand.dialog();
      $.bind(window, 'resize', imgExpand.resize);
      imgExpand.style = $.addStyle('');
      return imgExpand.resize();
    },
    node: function(root) {
      var a, thumb;
      if (!(thumb = $('img[md5]', root))) {
        return;
      }
      a = thumb.parentNode;
      $.bind(a, 'click', imgExpand.cb.toggle);
      if (imgExpand.on && root.className !== 'inline') {
        return imgExpand.toggle(a);
      }
    },
    cb: {
      toggle: function(e) {
        if (e.shiftKey || e.altKey || e.ctrlKey || e.button !== 0) {
          return;
        }
        e.preventDefault();
        return imgExpand.toggle(this);
      },
      all: function(e) {
        var thumb, thumbs, _i, _j, _len, _len2, _results, _results2;
        thumbs = $$('img[md5]');
        imgExpand.on = this.checked;
        if (imgExpand.on) {
          _results = [];
          for (_i = 0, _len = thumbs.length; _i < _len; _i++) {
            thumb = thumbs[_i];
            _results.push(!thumb.hidden ? imgExpand.expand(thumb) : void 0);
          }
          return _results;
        } else {
          _results2 = [];
          for (_j = 0, _len2 = thumbs.length; _j < _len2; _j++) {
            thumb = thumbs[_j];
            _results2.push(thumb.hidden ? imgExpand.contract(thumb) : void 0);
          }
          return _results2;
        }
      },
      typeChange: function(e) {
        var klass;
        switch (this.value) {
          case 'full':
            klass = '';
            break;
          case 'fit width':
            klass = 'fitwidth';
            break;
          case 'fit height':
            klass = 'fitheight';
            break;
          case 'fit screen':
            klass = 'fitwidth fitheight';
        }
        return d.body.className = klass;
      }
    },
    toggle: function(a) {
      var thumb;
      thumb = a.firstChild;
      if (thumb.hidden) {
        return imgExpand.contract(thumb);
      } else {
        return imgExpand.expand(thumb);
      }
    },
    contract: function(thumb) {
      thumb.hidden = false;
      return $.rm(thumb.nextSibling);
    },
    expand: function(thumb) {
      var a, filesize, img, max, _, _ref;
      thumb.hidden = true;
      a = thumb.parentNode;
      img = $.el('img', {
        src: a.href
      });
      if (a.parentNode.className !== 'op') {
        filesize = $('span.filesize', a.parentNode);
        _ref = filesize.textContent.match(/(\d+)x/), _ = _ref[0], max = _ref[1];
        img.style.maxWidth = "-moz-calc(" + max + "px)";
      }
      return $.add(a, img);
    },
    dialog: function() {
      var controls, delform, imageType, option, select, _i, _len, _ref;
      controls = $.el('div', {
        id: 'imgControls',
        innerHTML: "<select id=imageType name=imageType><option>full</option><option>fit width</option><option>fit height</option><option>fit screen</option></select>        <label>Expand Images<input type=checkbox id=imageExpand></label>"
      });
      imageType = $.get('imageType', 'full');
      _ref = $$('option', controls);
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        option = _ref[_i];
        if (option.textContent === imageType) {
          option.selected = true;
          break;
        }
      }
      select = $('select', controls);
      imgExpand.cb.typeChange.call(select);
      $.bind(select, 'change', $.cb.value);
      $.bind(select, 'change', imgExpand.cb.typeChange);
      $.bind($('input', controls), 'click', imgExpand.cb.all);
      delform = $('form[name=delform]');
      return $.prepend(delform, controls);
    },
    resize: function(e) {
      return imgExpand.style.innerHTML = "body.fitheight img[md5] + img { max-height: " + d.body.clientHeight + "px }";
    }
  };
  firstRun = {
    init: function() {
      var dialog, style;
      style = $.addStyle("      #navtopr, #navbotr {        position: relative;      }      #navtopr::before {        content: '';        height: 50px;        width: 100px;        background: red;        -webkit-transform: rotate(-45deg);        -moz-transform: rotate(-45deg);        -o-transform: rotate(-45deg);        -webkit-transform-origin: 100% 200%;        -moz-transform-origin: 100% 200%;        -o-transform-origin: 100% 200%;        position: absolute;        top: 100%;        right: 100%;        z-index: 999;      }      #navtopr::after {        content: '';        border-top: 100px solid red;        border-left: 100px solid transparent;        position: absolute;        top: 100%;        right: 100%;        z-index: 999;      }      #navbotr::before {        content: '';        height: 50px;        width: 100px;        background: red;        -webkit-transform: rotate(45deg);        -moz-transform: rotate(45deg);        -o-transform: rotate(45deg);        -webkit-transform-origin: 100% -100%;        -moz-transform-origin: 100% -100%;        -o-transform-origin: 100% -100%;        position: absolute;        bottom: 100%;        right: 100%;        z-index: 999;      }      #navbotr::after {        content: '';        border-bottom: 100px solid red;        border-left: 100px solid transparent;        position: absolute;        bottom: 100%;        right: 100%;        z-index: 999;      }    ");
      style.className = 'firstrun';
      dialog = $.el('div', {
        id: 'overlay',
        className: 'firstrun',
        innerHTML: "        <div id=options>          <div class='reply dialog'>            <p>Click the <strong>4chan X</strong> buttons for options; they are at the top and bottom of the page.</p>            <p>Updater options are in the updater dialog in replies at the bottom-right corner of the window.</p>            <p>If you don't see the buttons, try disabling your userstyles.</p>          </div>        </div>"
      });
      $.add(d.body, dialog);
      return $.bind(window, 'click', firstRun.close);
    },
    close: function() {
      $.set('firstrun', true);
      $.rm($('style.firstrun', d.head));
      $.rm($('#overlay'));
      return $.unbind(window, 'click', firstRun.close);
    }
  };
  Main = {
    init: function() {
      var callback, canPost, cutoff, form, hiddenThreads, id, lastChecked, now, op, pathname, table, temp, timestamp, tzOffset, _i, _j, _k, _l, _len, _len2, _len3, _len4, _ref, _ref2, _ref3, _ref4, _ref5;
      $.unbind(window, 'load', Main.init);
      pathname = location.pathname.substring(1).split('/');
      g.BOARD = pathname[0], temp = pathname[1];
      if (temp === 'res') {
        g.REPLY = temp;
        g.THREAD_ID = pathname[2];
      } else {
        g.PAGENUM = parseInt(temp) || 0;
      }
      if (location.hostname === 'sys.4chan.org') {
        qr.sys();
        return;
      }
      if (conf['404 Redirect'] && d.title === '4chan - 404' && /^\d+$/.test(g.THREAD_ID)) {
        redirect();
        return;
      }
      if (!$('#navtopr')) {
        return;
      }
      $.bind(window, 'message', Main.message);
      Favicon.init();
      g.hiddenReplies = $.get("hiddenReplies/" + g.BOARD + "/", {});
      tzOffset = (new Date()).getTimezoneOffset() / 60;
      g.chanOffset = 5 - tzOffset;
      if ($.isDST()) {
        g.chanOffset -= 1;
      }
      lastChecked = $.get('lastChecked', 0);
      now = Date.now();
      if (lastChecked < now - 1 * DAY) {
        $.set('lastChecked', now);
        if (conf['Check for Updates']) {
          $.add(d.head, $.el('script', {
            src: 'https://raw.github.com/aeosynth/4chan-x/stable/latest.js'
          }));
        }
        cutoff = now - 7 * DAY;
        hiddenThreads = $.get("hiddenThreads/" + g.BOARD + "/", {});
        for (id in hiddenThreads) {
          timestamp = hiddenThreads[id];
          if (timestamp < cutoff) {
            delete hiddenThreads[id];
          }
        }
        _ref = g.hiddenReplies;
        for (id in _ref) {
          timestamp = _ref[id];
          if (timestamp < cutoff) {
            delete g.hiddenReplies[id];
          }
        }
        $.set("hiddenThreads/" + g.BOARD + "/", hiddenThreads);
        $.set("hiddenReplies/" + g.BOARD + "/", g.hiddenReplies);
      }
      $.addStyle(Main.css);
      if ((form = $('form[name=post]')) && (canPost = !!$('#recaptcha_response_field'))) {
        Recaptcha.init();
        if (g.REPLY && conf['Auto Watch Reply'] && conf['Thread Watcher']) {
          $.bind(form, 'submit', function() {
            if ($('img.favicon').src === Favicon.empty) {
              return watcher.watch(null, g.THREAD_ID);
            }
          });
        }
      }
      threading.init();
      if (g.REPLY && (id = location.hash.slice(1)) && /\d/.test(id[0]) && !$.id(id)) {
        scrollTo(0, d.body.scrollHeight);
      }
      if (conf['Auto Noko'] && canPost) {
        form.action += '?noko';
      }
      if (conf['Cooldown'] && canPost) {
        cooldown.init();
      }
      if (conf['Image Expansion']) {
        imgExpand.init();
      }
      if (conf['Image Auto-Gif']) {
        imgGif.init();
      }
      if (conf['Time Formatting']) {
        Time.init();
      }
      if (conf['Sauce']) {
        sauce.init();
      }
      if (conf['Reveal Spoilers'] && $('.postarea label')) {
        revealSpoilers.init();
      }
      if (conf['Anonymize']) {
        anonymize.init();
      }
      if (conf['Image Hover']) {
        imgHover.init();
      }
      if (conf['Reply Hiding']) {
        replyHiding.init();
      }
      if (conf['Quick Reply'] && canPost) {
        qr.init();
      }
      if (conf['Report Button']) {
        reportButton.init();
      }
      if (conf['Quote Backlinks']) {
        quoteBacklink.init();
      }
      if (conf['Quote Inline']) {
        quoteInline.init();
      }
      if (conf['Quote Preview']) {
        quotePreview.init();
      }
      if (conf['Indicate OP quote']) {
        quoteOP.init();
      }
      if (conf['Thread Watcher']) {
        watcher.init();
      }
      if (conf['Keybinds']) {
        keybinds.init();
      }
      if (g.REPLY) {
        if (conf['Thread Updater']) {
          updater.init();
        }
        if (conf['Image Preloading']) {
          imgPreloading.init();
        }
        if (conf['Quick Reply'] && conf['Persistent QR'] && canPost) {
          qr.dialog();
          if (conf['Auto Hide QR']) {
            $('#autohide', qr.el).checked = true;
          }
        }
        if (conf['Post in Title']) {
          titlePost.init();
        }
        if (conf['Thread Stats']) {
          threadStats.init();
        }
        if (conf['Unread Count']) {
          unread.init();
        }
        if (conf['Reply Navigation']) {
          nav.init();
        }
      } else {
        if (conf['Index Navigation']) {
          nav.init();
        }
        if (conf['Thread Hiding']) {
          threadHiding.init();
        }
        if (conf['Thread Expansion']) {
          expandThread.init();
        }
        if (conf['Comment Expansion']) {
          expandComment.init();
        }
      }
      _ref2 = $$('div.op');
      for (_i = 0, _len = _ref2.length; _i < _len; _i++) {
        op = _ref2[_i];
        _ref3 = g.callbacks;
        for (_j = 0, _len2 = _ref3.length; _j < _len2; _j++) {
          callback = _ref3[_j];
          callback(op);
        }
      }
      _ref4 = $$('a + table');
      for (_k = 0, _len3 = _ref4.length; _k < _len3; _k++) {
        table = _ref4[_k];
        _ref5 = g.callbacks;
        for (_l = 0, _len4 = _ref5.length; _l < _len4; _l++) {
          callback = _ref5[_l];
          callback(table);
        }
      }
      $.bind($('form[name=delform]'), 'DOMNodeInserted', nodeInserted);
      options.init();
      if (!$.get('firstrun')) {
        return firstRun.init();
      }
    },
    message: function(e) {
      var data, to;
      data = e.data;
      to = data.to;
      delete data.to;
      switch (to) {
        case 'qr.message':
          return qr.message(data);
        case 'update':
          if ((data.version !== VERSION) && confirm('An updated version of 4chan X is available, would you like to install it now?')) {
            return window.location = 'https://raw.github.com/aeosynth/4chan-x/stable/4chan_x.user.js';
          }
      }
    },
    css: '\
      /* dialog styling */\
      div.dialog {\
        border: 1px solid;\
      }\
      div.dialog > div.move {\
        cursor: move;\
      }\
      label, a, .favicon, #qr img {\
        cursor: pointer;\
      }\
\
      .new {\
        background: lime;\
      }\
      .error {\
        color: red;\
      }\
      #error {\
        cursor: default;\
      }\
      #error[href] {\
        cursor: pointer;\
      }\
      td.replyhider {\
        vertical-align: top;\
      }\
\
      div.thread.stub > *:not(.block) {\
        display: none;\
      }\
\
      .filesize + br + a {\
        float: left;\
        pointer-events: none;\
      }\
      img[md5], img[md5] + img {\
        pointer-events: all;\
      }\
      body.fitwidth img[md5] + img {\
        max-width: 100%;\
        width: -moz-calc(100%); /* hack so only firefox sees this */\
      }\
\
      #qp, #iHover {\
        position: fixed;\
      }\
\
      #iHover {\
        max-height: 100%;\
      }\
\
      #navlinks {\
        font-size: 16px;\
        position: fixed;\
        top: 25px;\
        right: 5px;\
      }\
\
      #overlay {\
        display: table;\
        position: fixed;\
        top: 0;\
        left: 0;\
        height: 100%;\
        width: 100%;\
        background: rgba(0,0,0,.5);\
      }\
      #options {\
        display: table-cell;\
        vertical-align: middle;\
      }\
      #options .dialog {\
        margin: auto;\
        padding: 5px;\
        width: 500px;\
      }\
      #credits {\
        text-align: right;\
      }\
      #options ul {\
        list-style: none;\
        padding: 0;\
      }\
      #options label {\
        text-decoration: underline;\
      }\
      #floaty {\
        float: left;\
      }\
      #options [name=tab]:not(:checked) + * {\
        display: none;\
      }\
      #content > * {\
        height: 450px;\
        overflow: auto;\
      }\
      #content textarea {\
        margin: 0;\
        width: 100%;\
      }\
\
      #qr {\
        position: fixed;\
        max-height: 100%;\
        overflow-x: hidden;\
        overflow-y: auto;\
      }\
      #qr > div.move {\
        text-align: right;\
      }\
      #qr input[name=name] {\
        float: left;\
      }\
      #qr_form {\
        clear: left;\
      }\
      #qr_form, #qr #com_submit, #qr input[name=upfile] {\
        margin: 0;\
      }\
      #qr textarea {\
        width: 100%;\
        height: 125px;\
      }\
      #qr #close, #qr #autohide {\
        float: right;\
      }\
      #qr:not(:hover) > #autohide:checked ~ .autohide {\
        height: 0;\
        overflow: hidden;\
      }\
      /* http://stackoverflow.com/questions/2610497/change-an-inputs-html5-placeholder-color-with-css */\
      #qr input::-webkit-input-placeholder {\
        color: grey;\
      }\
      #qr input:-moz-placeholder {\
        color: grey;\
      }\
      /* qr reCAPTCHA */\
      #qr img {\
        border: 1px solid #AAA;\
      }\
\
      #updater {\
        position: fixed;\
        text-align: right;\
      }\
      #updater input[type=text] {\
        width: 50px;\
      }\
      #updater:not(:hover) {\
        border: none;\
        background: transparent;\
      }\
      #updater:not(:hover) > div:not(.move) {\
        display: none;\
      }\
\
      #stats {\
        border: none;\
        position: fixed;\
      }\
\
      #watcher {\
        position: absolute;\
      }\
      #watcher > div {\
        padding-right: 5px;\
        padding-left: 5px;\
      }\
      #watcher > div.move {\
        text-decoration: underline;\
        padding-top: 5px;\
      }\
      #watcher > div:last-child {\
        padding-bottom: 5px;\
      }\
\
      #qp {\
        border: 1px solid;\
        padding-bottom: 5px;\
      }\
      #qp input, #qp .inline {\
        display: none;\
      }\
      .qphl {\
        outline: 2px solid rgba(216, 94, 49, .7);\
      }\
      .inlined {\
        opacity: .5;\
      }\
      .inline td.reply {\
        background-color: rgba(255, 255, 255, 0.15);\
        border: 1px solid rgba(128, 128, 128, 0.5);\
      }\
      .filetitle, .replytitle, .postername, .commentpostername, .postertrip {\
        background: none;\
      }\
\
      /* Firefox bug: hidden tables are not hidden */\
      [hidden] {\
        display: none;\
      }\
\
      #files > input {\
        display: block;\
      }\
    '
  };
  if (d.body) {
    Main.init();
  } else {
    $.bind(window, 'load', Main.init);
  }
}).call(this);
