/**
 * <p>The <tt>Ojay.Observable</tt> module extends the <tt>JS.Observable</tt> module with an
 * <tt>on()</tt> method that behaves similarly to <tt>DomCollection#on()</tt>, used for
 * monitoring DOM events. It uses <tt>addObserver()</tt> to set up an interface through
 * which an object may publish named events, and other objects can listen to such events,
 * just as for DOM events. Here's an example of a class that uses the module:</p>
 *
 * <pre><code>    var Player = new JS.Class({
 *         include: Ojay.Observable,
 *         
 *         play: function() {
 *             this.startTime = this.getTime();
 *             this.notifyObservers('start');
 *         },
 *         
 *         pause: function() {
 *             var elapsed = this.getTime() - this.startTime;
 *             this.notifyObservers('pause', elapsed);
 *         },
 *         
 *         getTime: function() {
 *             return Number(new Date()) / 1000;
 *         }
 *     });</code></pre>
 *
 * <p>The <tt>getTime()</tt> method simply returns the current timestamp in seconds. The
 * <tt>play()</tt> method records the current time and fires the <tt>start</tt> event by using
 * <tt>notifyObservers()</tt> to send a message to its observers. The <tt>pause()</tt>
 * method simply publishes a <tt>pause</tt> event that sends the elapsed time to any
 * listeners.</p>
 *
 * <p>Some client code to listen to one of these objects might look like this:</p>
 *
 * <pre><code>    var p = new Player();
 *     
 *     p.on('start', function(player) {
 *         alert(player.startTime);
 *     });
 *     
 *     p.on('pause', function(player, timeElapsed) {
 *         alert(timeElapsed);
 *     });</code></pre>
 *
 * <p>All listeners receive the object that fired the event as their first argument, and
 * any data published by said object with the event as the subsequent arguments. An optional
 * third argument to <tt>on()</tt> specifies the execution context of the listener function,
 * so for example:</p>
 *
 * <pre><code>    p.on('start', function() {
 *         // this === someObject
 *     }, someObject);</code></pre>
 *
 * <p>All calls to <tt>on()</tt> return a <tt>MethodChain</tt> object that, by default, will
 * fire on the object publishing the event, so the following:</p>
 *
 * <pre><code>    p.on('start').pause();</code></pre>
 *
 * <p>Will cause <tt>p</tt> to call its <tt>pause()</tt> method whenever its <tt>start</tt>
 * event is fired.</p>
 *
 * <p>For further information on this module, see the <tt>JS.Observable</tt> documentation at
 * http://jsclass.jcoglan.com/observable.html.</p>
 *
 * @module Observable
 */
Ojay.Observable = new JS.Module('Ojay.Observable', {
    include: JS.Observable,
    
    /**
     * <p>Registers an event listener on the object. Takes an event name and an optional
     * callback function, and returns a <tt>MethodChain</tt> that will fire on the source
     * object. The callback receives the source object as the first parameter.</p>
     * @param {String} eventName
     * @param {Function} callback
     * @param {Object} scope
     * @returns {MethodChain}
     */
    on: function(eventName, callback, scope) {
        var chain = new JS.MethodChain;
        if (callback && typeof callback != 'function') scope = callback;
        this.addObserver(function() {
            var args = Array.from(arguments), message = args.shift();
            if (message != eventName) return;
            if (typeof callback == 'function') callback.apply(scope || null, args);
            chain.fire(scope || args[0]);
        }, this);
        return chain;
    },
    
    /**
     * <p>Notifies all observers of an object, sending them the supplied arguments. Use
     * the first argument to specify the event name for handlers registered using
     * <tt>Observable#on()</tt>.</p>
     * @returns {Observable}
     */
    notifyObservers: function() {
        var args = Array.from(arguments),
            receiver = (args[1]||{}).receiver || this;
        
        if (receiver == this) args.splice(1, 0, receiver);
        else args[1] = receiver;
        
        this.callSuper.apply(this, args);
        
        args[1] = {receiver: receiver};
        var classes = this.klass.ancestors(), klass;
        while (klass = classes.pop())
            klass.notifyObservers && klass.notifyObservers.apply(klass, args);
        
        return this;
    },
    
    extend: /** @scope Ojay.Observable */{
        /**
         * <p>Any module that includes <tt>Observable</tt> is also extended
         * using <tt>Observable</tt>.</p>
         * @param {Class|Module} base
         */
        included: function(base) {
            base.extend(this);
        }
    }
});

Ojay.Observable.extend(Ojay.Observable);
