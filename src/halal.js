(function() {
  "use strict";
  var __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  define(["eventdispatcher", "scene", "dommanager", "renderer", "mathutil", "vec2", "deferred", "deferredcounter", "domeventmanager", "assetmanager", "imgutils", "entity", "spriteentity", "isometricmap"], function(EventDispatcher, Scene, DOMManager, Renderer, MathUtil, Vec2, Deferred, DeferredCounter, DOMEventManager, AssetManager, ImgUtils) {
    /*
        A shim (sort of) to support RAF execution
    */

    var Halal, cur_fps_time, cur_time, delta, draw_info, fps_cap, fps_counter, fps_trigger_time, fstep, last_frame_id, paused, prev_time, rafLoop;
    window.requestAnimFrame = (function() {
      return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || function(callback) {
        return window.setTimeout(callback, 1);
      };
    })();
    /*
        A shim to support timer. 
        performance.now is an ultra-precise timer and is preferred over Date.now
    */

    if (window.performance == null) {
      window.performance = Date;
    }
    cur_time = performance.now();
    delta = 0;
    fps_trigger_time = 1;
    cur_fps_time = 0;
    fps_counter = 0;
    last_frame_id = 0;
    prev_time = 0;
    fps_cap = 30;
    fstep = 1 / fps_cap;
    draw_info = null;
    paused = true;
    rafLoop = function() {
      var sc, _i, _len, _ref;
      prev_time = cur_time;
      cur_time = performance.now();
      delta = (cur_time - prev_time) * 0.001;
      cur_fps_time += delta;
      delta = Math.min(delta, fstep);
      Hal.trigger("ENTER_FRAME", delta);
      _ref = Hal.scenes;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        sc = _ref[_i];
        sc.update(delta);
        sc.draw(delta);
      }
      if (cur_fps_time >= fps_trigger_time) {
        Hal.fps = fps_counter;
        cur_fps_time = 0;
        fps_counter = 0;
        Hal.trigger("FPS_UPDATE", Hal.fps);
      }
      Hal.trigger("EXIT_FRAME", delta);
      last_frame_id = requestAnimFrame(rafLoop);
      return fps_counter++;
    };
    Halal = (function(_super) {
      __extends(Halal, _super);

      function Halal() {
        Halal.__super__.constructor.call(this);
        this.dom = new DOMManager(this);
        this.math = MathUtil;
        this.id = 0;
        this.debug_mode = false;
        this.pressed_keys = [];
        this.scenes = [];
        this.fps = 0;
        log.debug("Engine constructed");
      }

      return Halal;

    })(EventDispatcher);
    Halal.prototype.addScene = function(scene) {
      if (!(scene instanceof Scene)) {
        log.error("Not a Scene instance");
        return null;
      }
      if (!scene.bounds) {
        log.error("Bounds not set on scene " + scene.name);
        return null;
      }
      if (!scene.name) {
        log.warn("Name for scene wasn't provided");
        scene.name = "#scene" + "_" + scene.id;
      }
      scene.init();
      Hal.trigger("SCENE_ADDED_" + scene.name.toUpperCase(), scene);
      this.scenes.unshift(scene);
      log.debug("Added scene: " + scene.name);
      return scene;
    };
    Halal.prototype.pause = function() {
      cancelAnimationFrame(last_frame_id);
      paused = true;
      return this.trigger("ENGINE_PAUSED");
    };
    Halal.prototype.resume = function() {
      paused = false;
      rafLoop();
      return this.trigger("ENGINE_RESUMED");
    };
    Halal.prototype.viewportBounds = function() {
      return [0, 0, this.dom.area.width, this.dom.area.height];
    };
    Halal.prototype.supports = function(feature) {
      return this.trigger("SUPPORTS_" + feature);
    };
    Halal.prototype.init = function() {
      this.evm = new DOMEventManager();
      this.on("MOUSE_MOVE", function(pos) {
        var sc, _i, _len, _ref, _results;
        _ref = this.scenes;
        _results = [];
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          sc = _ref[_i];
          sc.mpos = pos;
          _results.push(sc.world_pos = sc.worldToLocal(pos));
        }
        return _results;
      });
      this.on("DESTROY_SCENE", function(scene) {
        var ind;
        ind = this.scenes.indexOf(scene);
        if (ind === -1) {
          log.error("No such scene: " + scene.name);
        }
        this.scenes[ind] = null;
        return this.scenes.splice(ind, 1);
      });
      return log.debug("Engine initialized");
    };
    Halal.prototype.start = function() {
      this.init();
      paused = false;
      this.trigger("ENGINE_STARTED");
      log.debug("Engine started");
      return rafLoop();
    };
    Halal.prototype.isPaused = function() {
      return paused;
    };
    Halal.prototype.debug = function(debug_mode) {
      this.debug_mode = debug_mode;
    };
    Halal.prototype.ID = function() {
      return ++this.id;
    };
    Halal.prototype.drawInfo = function() {
      this.glass.ctx.setTransform(1, 0, 0, 1, 0, 0);
      this.glass.ctx.fillStyle = "black";
      return this.glass.ctx.fillText("FPS: " + this.fps, 0, 10);
    };
    Halal.prototype.tween = function(obj, property, t, from, to, repeat) {
      var $, accul, defer, speed, val;
      if (repeat == null) {
        repeat = 1;
      }
      defer = new Deferred();
      t *= 0.001;
      accul = 0;
      speed = (to - from) / t;
      val = from;
      Hal.on("ENTER_FRAME", $ = function(delta) {
        accul += delta;
        val += speed * delta;
        obj.attr(property, val);
        accul = Math.min(accul, t);
        if (t === accul) {
          repeat--;
          obj.attr(property, to);
          if (repeat === 0) {
            defer.resolve(obj);
            Hal.remove("ENTER_FRAME", $);
          } else {
            accul = 0;
            return val = from;
          }
        }
      });
      return defer.promise();
    };
    Halal.prototype.tweenF = function(t, func, from, to, repeat) {
      var $, accul, speed, val;
      if (repeat == null) {
        repeat = 1;
      }
      t *= 0.001;
      accul = 0;
      speed = (to - from) / t;
      val = from;
      Hal.on("ENTER_FRAME", $ = function(delta) {
        accul += delta;
        val += speed * delta;
        func(val, delta);
        accul = Math.min(accul, t);
        if (t === accul) {
          repeat--;
          func(to, delta);
          if (repeat === 0) {
            Hal.remove("ENTER_FRAME", $);
          } else {
            accul = 0;
            return val = from;
          }
        }
      });
    };
    Halal.prototype.fadeInViewport = function(t) {
      return this.tweenF(t, (function(val) {
        return Hal.dom.viewport.style["opacity"] = val;
      }), 0, 1);
    };
    Halal.prototype.fadeOutViewport = function(t) {
      return this.tweenF(t, (function(val) {
        return Hal.dom.viewport.style["opacity"] = val;
      }), 1, 0);
    };
    Halal.prototype.IsometricMap = function(meta) {
      return new IsometricMap(meta);
    };
    Halal.prototype.Keys = {
      SHIFT: 16,
      G: 71,
      D: 68,
      W: 87,
      C: 67,
      I: 73,
      ONE: 49,
      TWO: 50,
      THREE: 51,
      FOUR: 52,
      DELETE: 46,
      LEFT: 37,
      RIGHT: 39,
      UP: 38,
      DOWN: 40,
      F: 70
    };
    /*
        @todo kontekst bi valjalo prosledjivati, mozda window ne bude window
        i undefined ne bude undefined
    */

    window.Hal = new Halal();
    window.Hal.glass = new Renderer(Hal.viewportBounds(), null, 11);
    window.Hal.asm = new AssetManager();
    window.Hal.im = new ImgUtils();
    return window.Hal;
  });

}).call(this);