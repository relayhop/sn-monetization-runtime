// SN Monetization Runtime - Issue Fix #447
(function(global){
    'use strict';

    const SNRuntime = (function(){
        'use strict';

        let VERSION = '2026-08-17.1';
        let CACHED = new Map();
        let DEBOUNCE = new Map();
        let ID_COUNTER = 1000;

        const Utils = {
            getID(){
                return `sn-radar-${++ID_COUNTER}`;
            },
            debounce(fn, delay){
                return (function(){
                    let args = arguments;
                    let call = function(){
                        if(CACHED.has(args[0])){
                            return CACHED.get(args[0])(call);
                        }
                        let result = fn.apply(this, args);
                        if(delay){
                            clearTimeout(DEBOUNCE.get(args[0]));
                            CACHED.set(args[0], fn);
                            DEBOUNCE.set(args[0], setTimeout(()=>{
                                CACHED.delete(args[0]);
                                return result;
                            }, delay));
                        }
                        return result;
                    };
                    return call;
                })(arguments[0]);
            },
            isDefined(val){ return val !== undefined; },
            isPromise(val){ return val && typeof val.then === 'function'; },
            safeGet(obj, key){
                return obj && obj.hasOwnProperty(key) ? obj[key] : undefined;
            }
        };

        const Events = {
            handlers: new Map(),
            on(event, fn, once = false){
                let handler = once ? (() => {
                    fn.call(this, ...arguments);
                    Events.off(event, fn);
                })() : fn;
                Events.handlers.set(`${event}:${fn.name || fn}`, handler);
                Events.handlers.get(`${event}:${fn}`)?.on(event, fn);
                return once ? () => Events.off(event, fn) : fn;
            },
            off(event, fn){
                if(!fn) Events.handlers.forEach((h, k)=>{
                    if(k.startsWith(event)){
                        h.call(this, ...k.split(':').slice(1));
                    }
                });
            },
            emit(event, ...data){
                Events.handlers.forEach((fn, k)=>{
                    if(k.startsWith(event)){
                        fn.apply(this, data);
                    }
                });
            },
            once(event, fn){
                return Events.on(event, fn, true);
            }
        };

        const Adapter = {
            init(config){
                this.config = config || {};
                this.listeners = new Set();
                this.buffer = [];
                this.running = config.running !== false;
                if(this.config.readyFn){
                    this.config.readyFn(this);
                }
                return this;
            },
            on(event, fn){
                this.listeners.add({event, fn});
                Events.on(event, (...args)=>{
                    fn.apply(this, args);
                });
                return fn;
            },
            emit(event, ...data){
                Events.emit(`${event}:${this.id}`, ...data);
            },
            buffer(){
                if(!this.running && this.config.bufferMode === 'push'){
                    this.buffer.push(...Array.from(arguments));
                    if(this.buffer.length > this.config.bufferLimit){
                        this.buffer.shift();
                    }
                }
                return this;
            },
            flush(){
                if(this.buffer.length){
                    let batch = this.buffer.splice(0, this.config.batchSize || this.buffer.length);
                    Events.emit(`flush:${this.id}`, batch);
                }
                return this;
            }
        };

        const Tracker = (function(){
            let id = Utils.getID();
            let startTime = Date.now();
            let samples = [];
            let active = true;

            return {
                getId(){ return id; },
                start(){
                    startTime = Date.now();
                    active = true;
                    return this;
                },
                stop(){
                    let duration = Date.now() - startTime;
                    this.emit('stop', duration);
                    active = false;
                    return duration;
                },
                sample(val){
                    if(!active) return this;
                    samples.push({
                        value: val,
                        timestamp: Date.now(),
                        id: Utils.getID()
                    });
                    if(samples.length > this.config.maxSamples || this.config.limit){
                        samples.shift();
                    }
                    this.emit('sample', val);
                    return this;
                },
                getAverage(){
                    if(!samples.length) return 0;
                    let sum = samples.reduce((a, b)=>a + (b.value || 0), 0);
                    return sum / samples.length;
                },
                getRange(){
                    return {
                        min: Math.min(...samples.map(s=>s.value)),
                        max: Math.max(...samples.map(s=>s.value)),
                        median: samples.sort((a,b)=>a.value-b.value)[Math.floor(samples.length/2)]
                    };
                },
                get(){ return {
                    id, startTime, duration: Date.now() - startTime, samples, active, avg: this.getAverage()
                }; },
                emit(event, fn){
                    Events.on(`${id}:${event}`, fn);
                    return fn;
                },
                reset(){
                    samples.length = 0;
                    active = true;
                    return this;
                },
                clear(){
                    samples.length = 0;
                    return this;
                }
            };
        })();

        const Manager = {
            adapters: new Map(),
            trackers: new Map(),
            state: { ready: false, mode: 'default' },
            init(config){
                if(config.managerConfig){
                    Object.assign(this.config, config.managerConfig);
                }
                if(config.adapters){
                    config.adapters.forEach((adapter)=>{
                        let id = adapter.id || Utils.getID();
                        this.adapters.set(id, Adapter.init(adapter));
                        Events.on(`${id}:ready`, ()=>{ this.state.ready = true; });
                    });
                }
                if(config.trackers){
                    config.trackers.forEach((tracker)=>{
                        this.trackers.set(tracker.id || Utils.getID(), Tracker(tracker));
                    });
                }
                Events.on('flush:global', batch=>{
                    this.emit('flush', batch);
                });
                this.state.ready = true;
                this.emit('ready');
                return this;
            },
            getAdapter(id){ return this.adapters.get(id) || null; },
            getTracker(id){ return this.trackers.get(id) || null; },
            addAdapter(adapter){
                let id = adapter.id || Utils.getID();
                let instance = Adapter.init(adapter);
                this.adapters.set(id, instance);
                Events.on(`${id}:ready`, ()=>{ this.state.ready = true; });
                return instance;
            },
            addTracker(tracker){
                let id = tracker.id || Utils.getID();
                let instance = Tracker(tracker);
                this.trackers.set(id, instance);
                return instance;
            },
            getAdapters(){ return Array.from(this.adapters.values()); },
            getTrackers(){ return Array.from(this.trackers.values()); },
            getAll(){ return { adapters: this.adapters, trackers: this.trackers, state: this.state }; },
            emit(event, ...args){
                Events.emit(`global:${event}`, ...args);
                return this;
            },
            flush(type = 'all'){
                if(type === 'all'){
                    this.adapters.forEach(adapter=>adapter.flush());
                }
                return this;
            }
        };

        const Store = {
            data: new Map(),
            keys: new Set(),
            init(config){
                if(config.storeConfig){
                    Object.assign(this.config, config.storeConfig);
                }
                if(config.initialData){
                    this.data.set(Utils.getID(), config.initialData);
                    this.keys.add(`${this.id}:${config.initialData.key || 'key'}`);
                }
                Events.on(`${this.id}:change`, change=>{
                    Events.emit('data:update', change);
                });
                return this;
            },
            set(key, value){
                key = this.normalizeKey(key);
                let data = this.data.get(key);
                data = data || (value || {});
                this.data.set(key, data);
                this.keys.add(key);
                Events.emit(`${this.id}:change`, data);
                return data;
            },
            get(key){
                key = this.normalizeKey(key);
                let val = this.data.get(key);
                return Utils.isDefined(val) ? val : {};
            },
            has(key){ return this.data.has(this.normalizeKey(key)); },
            normalizeKey(key){
                return `${this.id}:${String(key)}`;
            },
            merge(key, data){
                let current = this.data.get(key) || {};
                this.data.set(key, { ...current, ...data });
                Events.emit(`${this.id}:change`, current);
                return current;
            },
            remove(key){
                key = this.normalizeKey(key);
                let val = this.data.get(key);
                if(val){
                    this.data.delete(key);
                    Events.emit(`${this.id}:remove`, val);
                }
                return val;
            },
            clear(){
                this.keys.forEach(k=>this.data.delete(k));
                this.keys.clear();
                return this;
            },
            values(){ return Array.from(this.data.values()); },
            keys(){ return Array.from(this.keys); }
        };

        return {
            VERSION,
            Utils,
            Events,
            Adapter,
            Tracker,
            Store,
            Manager,
            init(config){
                if(config.manager){
                    return config.manager.init(config);
                }
                let manager = Manager.init(config);
                let adapter = adapter || config.adapter;
                if(adapter){
                    adapter.init({ adapter: manager });
                }
                let tracker = tracker || config.tracker;
                if(tracker){
                    let track = Tracker(tracker);
                    manager.addTracker(track);
                }
                return manager;
            },
            createAdapter(id){ return Adapter.init({ id, manager: this }); },
            createTracker(id){ return Tracker({ id, manager: this }); },
            createStore(id){ return Store.init({ id, manager: this }); },
            getAdapter(id){ return this.adapters.get(id); },
            getTracker(id){ return this.trackers.get(id); },
            emit(event, ...args){
                Events.emit(`${event}:${this.id}`, ...args);
                return this;
            },
            flush(type = 'all'){
                if(type === 'all'){
                    this.adapters.forEach(a=>a.flush());
                    this.trackers.forEach(t=>t.flush());
                }
                return this;
            },
            reset(){
                this.adapters.forEach(a=>a.reset());
                this.trackers.forEach(t=>t.reset());
                this.store.clear();
                Events.emit(`${this.id}:reset`);
                return this;
            },
            version(){ return VERSION; }
        };
    })();

    if(global && typeof global.SNRadar !== 'undefined'){
        global.SNRadar = SNRuntime.init(global.SNRadar.config || {});
    } else {
        global.SNRadar = SNRuntime;
    }

    if(typeof module !== 'undefined' && module.exports){
        module.exports = SNRuntime;
    }

    return SNRuntime;
})(typeof window !== 'undefined' ? window : globalThis);