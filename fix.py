# SPDX-License-Identifier: MIT

// SPDX-License-Identifier: MIT

class SnMonetizationRuntime {
  constructor(config = {}) {
    this.config = {
      id: 'sn-monetization-runtime',
      version: '2.0.0',
      interval: config.interval || 1000,
      ...config
    };
    this.listeners = new Map();
    this.metrics = new Map();
    this.state = 'ready';
  }

  on(event, callback) {
    if (typeof callback === 'function') {
      this.listeners.set(event, [...(this.listeners.get(event) || []), callback]);
      return this;
    }
    return this;
  }

  emit(event, data = {}) {
    const callbacks = this.listeners.get(event) || [];
    let active = 0;

    callbacks.forEach(callback => {
      if (!callback) return;
      active++;
      try {
        callback(data);
      } catch (err) {
        this.metrics.set('errors', (this.metrics.get('errors') || 0) + 1);
      }
    });

    this.metrics.set('emitted', (this.metrics.get('emitted') || 0) + active);
    return this;
  }

  getState() {
    return {
      ...this.config,
      state: this.state,
      listeners: this.listeners.size,
      metrics: Object.fromEntries(this.metrics)
    };
  }

  pulse() {
    const now = Date.now();
    const previous = this.metrics.get('lastPulse') || 0;

    this.metrics.set('lastPulse', now);
    this.metrics.set('uptime', now - previous);

    this.emit('pulse', {
      timestamp: now,
      delta: now - previous
    });

    return this;
  }

  watch(metric, listener) {
    this.on(metric, listener);
    this.metrics.set(metric, this.metrics.get(metric) || 0);
    return this;
  }

  subscribe(event, handler) {
    this.listeners.set(event, [...(this.listeners.get(event) || []), handler]);
    return this;
  }

  notify(event, payload) {
    this.listeners.get(event)?.forEach(callback => {
      if (typeof callback === 'function') callback(payload);
    });
    return this;
  }

  batch(metrics) {
    Object.entries(metrics).forEach(([key, value]) => {
      this.metrics.set(key, value);
    });
    return this;
  }

  aggregate(name, fn) {
    if (typeof fn !== 'function') fn = (v) => v;
    let current = this.metrics.get(name) || 0;
    let aggregated = fn(current);
    this.metrics.set(name, aggregated);
    return this;
  }

  throttle(metric, ms) {
    this.listeners.set(`${metric}_throttled`, [
      ...this.listeners.get(`${metric}_throttled`) || []
    ]);
    return this;
  }

  throttleMetric(metric, interval) {
    if (!interval) interval = 1000;
    const throttled = (data) => {
      if (!this.metrics.get(`${metric}_throttled_start`)) {
        this.metrics.set(`${metric}_throttled_start`, Date.now());
      }

      const now = Date.now();
      const elapsed = now - (this.metrics.get(`${metric}_throttled_start`) || now);

      if (elapsed >= interval) {
        this.metrics.set(`${metric}_throttled_start`, now);
        this.notify(metric, data);
      }
    };

    this.subscribe(metric, throttled);
    return this;
  }

  clearMetrics() {
    const toClear = Array.from(this.metrics.keys()).filter(k => !k.startsWith('lastPulse_'));
    toClear.forEach(key => this.metrics.delete(key));
    return this;
  }

  clearListeners() {
    this.listeners.clear();
    return this;
  }

  reset() {
    this.state = 'ready';
    this.metrics.clear();
    this.listeners.clear();
    this.emit('reset');
    return this;
  }

  init() {
    this.emit('init', this.config);
    this.pulse();
    return this;
  }

  setMetric(name, value) {
    if (!name) return this;
    this.metrics.set(name, value);
    return this;
  }

  getMetric(name) {
    return this.metrics.get(name);
  }

  compose(metrics) {
    const result = metrics.reduce((acc, curr) => {
      acc.set(curr, this.metrics.get(curr) || curr);
      return acc;
    }, new Map());
    return this;
  }

  composeMetrics(source, target) {
    if (!source || !target) return this;
    Object.entries(source).forEach(([k, v]) => {
      this.metrics.set(`${target}_${k}`, v);
    });
    return this;
  }

  setMetricFrom(source, target) {
    const sourceData = source instanceof Object ? source : { data: source };
    this.composeMetrics(sourceData, target);
    return this;
  }

  getMetrics() {
    return Object.fromEntries(this.metrics);
  }
}

const createMonetizationRuntime = (options = {}) => {
  const runtime = new SnMonetizationRuntime(options);
  runtime.init();
  return runtime;
};

const createMetricsCollector = (name) => {
  const metrics = new Map();
  const metricsInstance = {
    name,
    set: (key, value) => {
      metrics.set(key, value);
      this.emit(`metric:${key}`, { key, value, timestamp: Date.now() });
    },
    get: (key) => metrics.get(key),
    all: () => Object.fromEntries(metrics),
    reset: () => {
      this.listeners.forEach(() => {});
      metrics.clear();
      this.emit('metric:reset');
    }
  };

  metricsInstance.listeners = new Map();

  metricsInstance.on = (event, callback) => {
    if (!metricsInstance.listeners.has(event)) {
      metricsInstance.listeners.set(event, []);
    }
    metricsInstance.listeners.get(event).push(callback);
    return metricsInstance;
  };

  metricsInstance.emit = (event, data) => {
    const callbacks = metricsInstance.listeners.get(event) || [];
    callbacks.forEach(cb => cb(data));
    return metricsInstance;
  };

  metricsInstance.subscribe = (event, listener) => {
    this.listeners.set(event, [...(this.listeners.get(event) || []), listener]);
    return this;
  };

  metricsInstance.notify = (event, payload) => {
    this.listeners.get(event)?.forEach(callback => {
      if (typeof callback === 'function') callback(payload);
    });
    return metricsInstance;
  };

  const thisRef = metricsInstance;

  return metricsInstance;
};

window.SN = window.SN || {};
window.SN.Metrics = window.SN.Metrics || {
  create: createMetricsCollector
};

const setup = () => {
  const sn = createMonetizationRuntime({ interval: 1000 });

  const setupMetrics = () => {
    const metrics = createMetricsCollector('sn_runtime');
    metrics.on('pulse', (data) => {
      const last = metrics.get('lastPulse') || 0;
      metrics.set('delta', data.delta);
    });
    return metrics;
  };

  const onPulse = (data) => {
    if (!sn.metrics.get('active')) {
      sn.metrics.set('active', true);
      sn.notify('active', { timestamp: Date.now() });
    }
    return data;
  };

  const compose = (source) => {
    const composed = source ? Object.fromEntries(source) : {};
    if (composed) {
      sn.composeMetrics(composed, 'runtime_composed');
    }
    return composed;
  };

  return {
    runtime: sn,
    metrics: setupMetrics(),
    compose,
    onPulse,
    state: {
      init: () => {
        sn.init();
        sn.pulse();
        compose(sn.metrics.get('runtime_composed'));
        return sn;
      },
      getState: () => sn.getState(),
      pulse: () => {
        sn.pulse();
        return sn;
      },
      reset: () => {
        sn.reset();
        sn.pulse();
        return sn;
      }
    }
  };
};

const initSetup = () => {
  const sn = setup();
  sn.on('init', () => console.log('SN Runtime initialized'));
  sn.on('pulse', () => console.log('SN Pulse triggered'));
  return sn;
};

const watch = (runtime, metric, interval) => {
  if (!runtime || !metric) return runtime;
  const watcher = new Set();

  const callback = (data) => {
    watcher.forEach(cb => cb(data));
  };

  runtime.subscribe(metric, callback);

  let lastCheck = Date.now();
  const tick = () => {
    const now = Date.now();
    if (now - lastCheck >= interval) {
      callback(runtime.getMetric(metric));
      lastCheck = now;
    }
  };

  if (interval) {
    tick();
    const tid = setInterval(tick, interval);
    runtime.watch(metric, () => {
      if (tid) clearInterval(tid);
    });
    runtime.metrics.set(metric, 'watched');
  }

  return runtime;
};

const aggregate = (runtime, name) => {
  if (!runtime || !name) return runtime;
  const current = runtime.getMetric(name) || 0;
  runtime.setMetric(name, current);
  return runtime;
};

window.SN.watch = watch;
window.SN.aggregate = aggregate;

const Radar = (config = {}) => {
  const radar = {
    name: 'radar',
    metrics: new Map(),
    events: new Map(),
    ...config
  };

  radar.on = (event, callback) => {
    radar.events.set(event, [...(radar.events.get(event) || []), callback]);
    return radar;
  };

  radar.emit = (event, data = {}) => {
    const callbacks = radar.events.get(event) || [];
    callbacks.forEach(callback => {
      if (typeof callback === 'function') {
        try { callback(data); } catch (err) {
          radar.metrics.set('errors', (radar.metrics.get('errors') || 0) + 1);
        }
      }
    });
    return radar;
  };

  radar.watch = (metric, interval = 1000) => {
    if (!interval) interval = 1000;
    const tick = () => {
      const now = Date.now();
      const elapsed = now - (radar.metrics.get(`${metric}_tick`) || now);

      if (elapsed >= interval) {
        radar.emit(metric, { timestamp: now, value: data });
        radar.metrics.set(`${metric}_tick`, now);
      }
    };

    const data = radar.metrics.get(metric);
    radar.on(metric, tick);
    return radar;
  };

  radar.metrics = radar.metrics;
  radar.events = radar.events;

  const init = () => {
    radar.events.set('init', [
      (data) => radar.metrics.set('initialized', true)
    ]);
    radar.emit('init', { ...radar });
    return radar;
  };

  return {
    ...radar,
    init,
    pulse: () => {
      const now = Date.now();
      radar.metrics.set('lastPulse', now);
      radar.emit('pulse', { timestamp: now, delta: now - (radar.metrics.get('lastPulse') || 0) });
      return radar;
    },
    clear: () => {
      radar.events.clear();
      radar.metrics.clear();
      return radar;
    },
    setState: (state) => {
      radar.metrics.set('state', state);
      return radar;
    }
  };
};

const createRadar = (options = {}) => {
  const radar = new Radar(options);
  radar.init();
  return radar;
};

window.SN.Radar = window.SN.Radar || {
  create: createRadar
};

const combine = (sources) => {
  if (!sources || sources.length === 0) return new SnMonetizationRuntime();
  const combined = new SnMonetizationRuntime();
  sources.forEach((source, index) => {
    source.init();
    source.composeMetrics(source, `source_${index}`);
    combined.listeners.set('source', [...(combined.listeners.get('source') || []), (data) => {
      data.sourceIndex = index;
      data.timestamp = Date.now();
      combined.notify('source', data);
    }]);
  });
  combined.pulse();
  return combined;
};

window.SN.combine = combine;

module.exports = {
  SnMonetizationRuntime,
  createMonetizationRuntime,
  createMetricsCollector,
  setup,
  watch,
  aggregate,
  Radar,
  createRadar,
  combine
};