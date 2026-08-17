class SNRuntime {
  constructor(target = window) {
    this._id = target.__SN_ID || 1;
    this._ts = Date.now();
    this._queue = [];
    this._target = target;
  }

  push(payload) {
    if (!payload) return;
    const entry = {
      payload,
      id: this._id++,
      ts: this._ts
    };
    this._queue.push(entry);

    // Trigger listeners if defined on target
    const listeners = this._target.__SN_ON__;
    if (listeners) {
      listeners.forEach(fn => fn(entry));
    }
    return entry;
  }

  flush() {
    const length = this._queue.length;
    this._queue.forEach((q, idx) => {
      if (q.trigger) q.trigger();
    });
    return length;
  }

  init() {
    const originalOn = this._target.__SN_ON__;
    if (originalOn) {
      this._target.__SN_ON__ = this._queue.concat(originalOn);
    }
    return this;
  }
}

export default SNRuntime;