const createRuntime = (id) => {
  const runtime = {
    _id: Symbol(`runtime_${id}`),
    listeners: new Map(),
    init: function (initialState) {
      this.listeners.set(this._id, { ...initialState });
      return this;
    },
    on: function (event, listener) {
      const listeners = this.listeners.get(this._id) || {};
      listeners[event] = listeners[event] || [];
      listeners[event].push(listener);
      this.listeners.set(this._id, listeners);
      return this;
    },
    emit: function (event, data) {
      const listeners = this.listeners.get(this._id);
      if (listeners && listeners[event]) {
        listeners[event].forEach(fn => fn(data));
      }
      return this;
    },
    tick: function (data) {
      this.emit('tick', data);
      return this;
    }
  };
  return runtime;
};